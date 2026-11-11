import { z } from "zod";
import { crmReadProcedure, leadWriteProcedure, publicProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { customers, leadActivities, leadAttributions, leads, quoteDeliveries, siteSettings, vehicles } from "../../drizzle/schema.js";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "../_core/notification.js";
import { ENV } from "../_core/env.js";
import { buildLeadHandoffWebhookPayload, isZapierWebhookUrl } from "../../shared/zapierWebhook.js";
import { classifyLeadChannel } from "../../shared/analytics.js";
import { hasGoogleAdsMatchKey, hasLeadAttributionSignal } from "../../shared/googleAdsAttribution.js";
import { leadCreateInput, type LeadCreateInput } from "../leadInput.js";

const ZAPIER_WEBHOOK_URL_KEY = "zapier_quote_webhook_url";
const ZAPIER_WEBHOOK_ENABLED_KEY = "zapier_quote_webhook_enabled";

function generateRefNumber(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let result = "NAM-";
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export function buildAutomaticLeadHandoffPayload(lead: typeof leads.$inferSelect) {
  const vehicle = [lead.vehicleYear, lead.vehicleMake, lead.vehicleModel, lead.vehicleTrim].filter(Boolean).join(" ") || null;
  const serviceLocation = [lead.streetAddress, lead.unit, lead.city, lead.zipCode].filter(Boolean).join(", ") || null;
  return buildLeadHandoffWebhookPayload({
    followUp: { notes: "Automatically delivered from the website. __OWNER_NAME__ will contact the customer to discuss the requested service." },
    lead: { id: lead.id, referenceNumber: lead.referenceNumber, fullName: lead.fullName, phone: lead.phone, email: lead.email, preferredContact: lead.preferredContact, requestedService: lead.requestedService, mainSymptom: lead.mainSymptom, problemDescription: lead.problemDescription, vehicle, serviceLocation },
  });
}

export function buildLeadAttributionActivityMetadata(attribution: NonNullable<Parameters<typeof classifyLeadChannel>[0]>, adsDataConsent: boolean) {
  return {
    channel: classifyLeadChannel(attribution),
    hasLandingUrl: Boolean(attribution.landingUrl),
    hasReferrer: Boolean(attribution.referrer),
    hasGoogleAdsMatchKey: hasGoogleAdsMatchKey(attribution),
    adsDataConsent,
  };
}

async function deliverNewLeadToZapier(db: any, lead: typeof leads.$inferSelect) {
  const [urlSetting, enabledSetting] = await Promise.all([
    db.select().from(siteSettings).where(eq(siteSettings.settingKey, ZAPIER_WEBHOOK_URL_KEY)).limit(1),
    db.select().from(siteSettings).where(eq(siteSettings.settingKey, ZAPIER_WEBHOOK_ENABLED_KEY)).limit(1),
  ]);
  const webhookUrl = urlSetting[0]?.settingValue ?? "";
  const isEnabled = enabledSetting[0]?.settingValue === "enabled";
  if (!isEnabled || !isZapierWebhookUrl(webhookUrl)) return { attempted: false };

  const payload = buildAutomaticLeadHandoffPayload(lead);
  const [delivery] = await db.insert(quoteDeliveries).values({ leadId: lead.id, quoteAmount: "No price provided", quoteSummary: "Automatic website lead handoff", deliveryStatus: "sending", payload }).returning();
  try {
    const response = await fetch(webhookUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Zapier returned HTTP ${response.status}`);
    await db.update(quoteDeliveries).set({ deliveryStatus: "sent", responseCode: response.status, deliveredAt: new Date() }).where(eq(quoteDeliveries.id, delivery.id));
    await db.update(leads).set({ quoteWebhookStatus: "sent", quoteWebhookError: null, quoteWebhookSentAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, lead.id));
    await db.insert(leadActivities).values({ leadId: lead.id, customerId: lead.customerId, type: "lead_handoff_sent", summary: "New website lead automatically sent to Zapier" });
    return { attempted: true, sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zapier handoff failed";
    await db.update(quoteDeliveries).set({ deliveryStatus: "failed", errorMessage: message }).where(eq(quoteDeliveries.id, delivery.id));
    await db.update(leads).set({ quoteWebhookStatus: "failed", quoteWebhookError: message, updatedAt: new Date() }).where(eq(leads.id, lead.id));
    await db.insert(leadActivities).values({ leadId: lead.id, customerId: lead.customerId, type: "lead_handoff_failed", summary: `Automatic Zapier delivery failed: ${message}` });
    console.error("[Zapier] Automatic lead delivery failed:", message);
    return { attempted: true, sent: false };
  }
}

export async function createLeadWithSideEffects(input: LeadCreateInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const referenceNumber = generateRefNumber();
  const existingCustomer = await db.select().from(customers).where(eq(customers.phone, input.phone)).limit(1);
  const customer = existingCustomer[0] ?? (await db.insert(customers).values({ fullName: input.fullName, phone: input.phone, email: input.email || null, city: input.city || null, preferredContact: input.preferredContact || "call" }).returning())[0];
  if (!customer) throw new Error("Unable to create customer record");
  const vehicle = (input.vehicleYear || input.vehicleMake || input.vehicleModel || input.vin) ? (await db.insert(vehicles).values({ customerId: customer.id, year: input.vehicleYear || null, make: input.vehicleMake || null, model: input.vehicleModel || null, trim: input.vehicleTrim || null, vin: input.vin || null, mileage: input.mileage || null }).returning())[0] : undefined;
  const [lead] = await db.insert(leads).values({ referenceNumber, customerId: customer.id, vehicleId: vehicle?.id ?? null, fullName: input.fullName, phone: input.phone, email: input.email || null, preferredContact: input.preferredContact || "call", streetAddress: input.streetAddress || null, unit: input.unit || null, city: input.city || null, zipCode: input.zipCode || null, locationType: input.locationType || null, locationNotes: input.locationNotes || null, vehicleYear: input.vehicleYear || null, vehicleMake: input.vehicleMake || null, vehicleModel: input.vehicleModel || null, vehicleTrim: input.vehicleTrim || null, vin: input.vin || null, mileage: input.mileage || null, requestedService: input.requestedService || null, mainSymptom: input.mainSymptom || null, problemDescription: input.problemDescription || null, vehicleStarts: input.vehicleStarts ?? null, vehicleSafe: input.vehicleSafe ?? null, preferredDate: input.preferredDate || null, preferredTime: input.preferredTime || null, isAsap: input.isAsap ?? false, customerNotes: input.customerNotes || null }).returning();
  if (!lead) throw new Error("Unable to create lead");
  if (input.attribution && (hasLeadAttributionSignal(input.attribution) || input.adsDataConsent)) {
    await db.insert(leadAttributions).values({ leadId: lead.id, ...input.attribution, adsDataConsent: input.adsDataConsent ?? false });
    const clickIdentifiers = [input.attribution.gclid && "GCLID", input.attribution.gbraid && "GBRAID", input.attribution.wbraid && "WBRAID"].filter(Boolean).join(", ");
    await db.insert(leadActivities).values({ leadId: lead.id, customerId: customer.id, type: "attribution_captured", summary: clickIdentifiers ? `Google Ads attribution captured (${clickIdentifiers})` : "First-party attribution context captured", metadata: buildLeadAttributionActivityMetadata(input.attribution, input.adsDataConsent ?? false) });
  }
  await db.insert(leadActivities).values({ leadId: lead.id, customerId: customer.id, type: "lead_created", summary: "Service request received from website" });
  await deliverNewLeadToZapier(db, lead);
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    try {
      await notifyOwner({ title: `New Service Request: ${input.fullName}`, content: `Phone: ${input.phone}\nVehicle: ${input.vehicleYear || ""} ${input.vehicleMake || ""} ${input.vehicleModel || ""}\nService: ${input.requestedService || "Not specified"}\nCity: ${input.city || "Not specified"}\nRef: ${referenceNumber}` });
    } catch (error) { console.error("[Notification] Failed to notify owner:", error); }
  }
  return { referenceNumber };
}

export const leadsRouter = router({
  create: publicProcedure
    .input(leadCreateInput)
    .mutation(async ({ input }) => { if (input.website) throw new Error("Invalid submission."); return createLeadWithSideEffects(input); }),
  list: crmReadProcedure.query(async () => { const db = await getDb(); if (!db) return []; return db.select().from(leads).orderBy(desc(leads.createdAt)); }),
  getById: crmReadProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => { const db = await getDb(); if (!db) return null; const result = await db.select().from(leads).where(eq(leads.id, input.id)).limit(1); return result[0] || null; }),
  markViewed: crmReadProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("Database not available"); await db.update(leads).set({ firstViewedAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, input.id)); return { success: true }; }),
  updateStatus: leadWriteProcedure.input(z.object({ id: z.number(), status: z.enum(["new", "contacted", "quoted", "scheduled", "in_progress", "completed", "declined", "duplicate", "spam"]) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error("Database not available"); await db.update(leads).set({ status: input.status }).where(eq(leads.id, input.id)); return { success: true }; }),
});
