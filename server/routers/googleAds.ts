import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { leadActivities, leadAttributions, leadConversionEvents, leads } from "../../drizzle/schema.js";
import { buildGoogleAdsDataManagerCsv, hasGoogleAdsMatchKey } from "../../shared/googleAdsAttribution.js";
import { getDb } from "../db.js";
import { ownerProcedure, router } from "../_core/trpc.js";

const conversionEventInput = z.object({
  leadId: z.number().int().positive(),
  conversionName: z.string().trim().min(3).max(240),
  conversionTime: z.coerce.date(),
  conversionValue: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Use a non-negative dollar amount with at most two decimals.").optional().or(z.literal("")),
  conversionCurrency: z.literal("USD").default("USD"),
  includeUserData: z.boolean().default(false),
});

function attributionSummary(attribution: typeof leadAttributions.$inferSelect | null | undefined) {
  return {
    hasAttribution: Boolean(attribution),
    hasGoogleMatchKey: hasGoogleAdsMatchKey(attribution),
    hasGclid: Boolean(attribution?.gclid),
    hasBraid: Boolean(attribution?.gbraid || attribution?.wbraid),
    adsDataConsent: attribution?.adsDataConsent ?? false,
    campaign: attribution?.utmCampaign ?? null,
    source: attribution?.utmSource ?? null,
    medium: attribution?.utmMedium ?? null,
    capturedAt: attribution?.capturedAt ?? null,
  };
}

export const googleAdsRouter = router({
  summary: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { capturedLeads: 0, matchableLeads: 0, pendingEvents: 0, exportedEvents: 0 };
    const [attributions, events] = await Promise.all([
      db.select().from(leadAttributions),
      db.select({ exportedAt: leadConversionEvents.exportedAt }).from(leadConversionEvents),
    ]);
    return {
      capturedLeads: attributions.length,
      matchableLeads: attributions.filter(item => hasGoogleAdsMatchKey(item) || item.adsDataConsent).length,
      pendingEvents: events.filter(item => !item.exportedAt).length,
      exportedEvents: events.filter(item => item.exportedAt).length,
    };
  }),

  leadAttribution: ownerProcedure.input(z.object({ leadId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { attribution: null, events: [], summary: attributionSummary(null) };
    const [attribution, events] = await Promise.all([
      db.select().from(leadAttributions).where(eq(leadAttributions.leadId, input.leadId)).limit(1),
      db.select().from(leadConversionEvents).where(eq(leadConversionEvents.leadId, input.leadId)).orderBy(desc(leadConversionEvents.createdAt)),
    ]);
    return { attribution: attribution[0] ?? null, events, summary: attributionSummary(attribution[0]) };
  }),

  attributedLeads: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select({
      lead: { id: leads.id, referenceNumber: leads.referenceNumber, fullName: leads.fullName, status: leads.status, requestedService: leads.requestedService, createdAt: leads.createdAt },
      attribution: leadAttributions,
    }).from(leadAttributions).innerJoin(leads, eq(leadAttributions.leadId, leads.id)).where(and(isNull(leads.deletedAt), isNull(leads.archivedAt))).orderBy(desc(leads.createdAt)).limit(300);
  }),

  listEvents: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select({
      event: leadConversionEvents,
      lead: { id: leads.id, referenceNumber: leads.referenceNumber, fullName: leads.fullName, email: leads.email, phone: leads.phone, status: leads.status },
      attribution: leadAttributions,
    }).from(leadConversionEvents).innerJoin(leads, eq(leadConversionEvents.leadId, leads.id)).leftJoin(leadAttributions, eq(leadAttributions.leadId, leads.id)).where(isNull(leads.deletedAt)).orderBy(desc(leadConversionEvents.conversionTime)).limit(300);
  }),

  recordConversion: ownerProcedure.input(conversionEventInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [lead] = await db.select().from(leads).where(and(eq(leads.id, input.leadId), isNull(leads.deletedAt))).limit(1);
    if (!lead) throw new Error("Active lead not found.");
    const [attribution] = await db.select().from(leadAttributions).where(eq(leadAttributions.leadId, input.leadId)).limit(1);
    const hasMatchKey = hasGoogleAdsMatchKey(attribution);
    const mayIncludeUserData = Boolean(input.includeUserData && attribution?.adsDataConsent && (lead.email || lead.phone));
    if (!hasMatchKey && !mayIncludeUserData) throw new Error("This lead has no Google click ID or consented first-party matching data. A conversion export would not be matchable.");
    if (input.includeUserData && !attribution?.adsDataConsent) throw new Error("First-party data can only be exported when the customer selected advertising measurement consent.");
    const orderId = `${lead.referenceNumber}-ga-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
    const [event] = await db.insert(leadConversionEvents).values({
      leadId: lead.id,
      attributionId: attribution?.id ?? null,
      conversionName: input.conversionName,
      conversionTime: input.conversionTime,
      conversionValue: input.conversionValue || null,
      conversionCurrency: input.conversionCurrency,
      orderId,
      includeUserData: input.includeUserData && attribution?.adsDataConsent === true,
      createdByUserId: ctx.user.id,
    }).returning();
    await db.insert(leadActivities).values({ leadId: lead.id, actorUserId: ctx.user.id, type: "google_ads_conversion_recorded", summary: `Google Ads conversion prepared: ${input.conversionName}` });
    return event;
  }),

  exportCsv: ownerProcedure.input(z.object({ eventIds: z.array(z.number().int().positive()).min(1).max(300) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const rows = await db.select({ event: leadConversionEvents, lead: leads, attribution: leadAttributions })
      .from(leadConversionEvents)
      .innerJoin(leads, eq(leadConversionEvents.leadId, leads.id))
      .leftJoin(leadAttributions, eq(leadAttributions.leadId, leads.id))
      .where(isNull(leads.deletedAt));
    const selected = rows.filter(row => input.eventIds.includes(row.event.id));
    if (selected.length !== input.eventIds.length) throw new Error("One or more selected conversion events are unavailable.");
    const csv = buildGoogleAdsDataManagerCsv(selected.map(({ event, lead, attribution }) => ({
      conversionName: event.conversionName,
      conversionTime: event.conversionTime,
      conversionValue: event.conversionValue,
      conversionCurrency: event.conversionCurrency,
      orderId: event.orderId,
      includeUserData: event.includeUserData && attribution?.adsDataConsent === true,
      gclid: attribution?.gclid,
      gbraid: attribution?.gbraid,
      wbraid: attribution?.wbraid,
      email: lead.email,
      phone: lead.phone,
    })));
    const exportedAt = new Date();
    for (const event of selected) {
      await db.update(leadConversionEvents).set({ exportedAt }).where(eq(leadConversionEvents.id, event.event.id));
      await db.insert(leadActivities).values({ leadId: event.lead.id, actorUserId: ctx.user.id, type: "google_ads_conversion_exported", summary: `Google Ads conversion exported: ${event.event.conversionName}` });
    }
    return { csv, filename: `new-age-google-ads-conversions-${exportedAt.toISOString().slice(0, 10)}.csv`, eventCount: selected.length };
  }),
});
