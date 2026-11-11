import { and, desc, eq, ilike, isNotNull, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { adminInvitations, appointments, leadActivities, leadAttributions, leadConversionEvents, leadFiles, leads, pageEditHistory, quoteDeliveries, quotes, siteSettings, users } from "../../drizzle/schema.js";
import { ACCOUNT_SETUP_SETTING_KEY, isAccountSetupEnabled, isOwnerEmail, isQuoteFeatureEnabled } from "../../shared/crmAccess.js";
import { buildLeadHandoffWebhookPayload, isZapierWebhookUrl } from "../../shared/zapierWebhook.js";
import { cloneDefaultTemplate, normalizeSiteTemplate } from "../../shared/siteTemplate.js";
import { DEFAULT_SALES_TACTICS, SALES_TACTICS_SETTING_KEY, normalizeSalesTactics, parseSalesTacticsSetting } from "../../shared/salesTactics.js";
import { getDb } from "../db.js";
import { adminProcedure, crmReadProcedure, leadWriteProcedure, ownerProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc.js";

const leadStatuses = ["new", "contacted", "quoted", "scheduled", "in_progress", "completed", "declined", "duplicate", "spam"] as const;
const assignableStaffRoles = ["admin", "technician", "lead_processor", "lead_viewer"] as const;
const invitationInput = z.object({ email: z.string().email().transform(value => value.trim().toLowerCase()), name: z.string().trim().min(1).max(200).optional(), role: z.enum(assignableStaffRoles).default("lead_viewer") });
const invitationIsActive = (invitation: { acceptedAt: Date | null; revokedAt: Date | null; expiresAt: Date }) => !invitation.acceptedAt && !invitation.revokedAt && invitation.expiresAt > new Date();
const QUOTE_WEBHOOK_URL_KEY = "zapier_quote_webhook_url";
const QUOTE_WEBHOOK_ENABLED_KEY = "zapier_quote_webhook_enabled";
const QUOTE_FEATURE_BETA_ENABLED_KEY = "quote_feature_beta_enabled";
const SITE_TEMPLATE_CONFIG_KEY = "site_template_config";

async function readSiteTemplateConfig() {
  const db = await getDb();
  if (!db) return { db: null, config: cloneDefaultTemplate() };
  const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, SITE_TEMPLATE_CONFIG_KEY)).limit(1);
  try { return { db, config: normalizeSiteTemplate(setting?.settingValue ? JSON.parse(setting.settingValue) : undefined) }; }
  catch { return { db, config: cloneDefaultTemplate() }; }
}

async function readQuoteWebhookSettings() {
  const db = await getDb();
  if (!db) return { db: null, url: "", enabled: false };
  const values = await db.select().from(siteSettings).where(or(eq(siteSettings.settingKey, QUOTE_WEBHOOK_URL_KEY), eq(siteSettings.settingKey, QUOTE_WEBHOOK_ENABLED_KEY)));
  const getValue = (key: string) => values.find(item => item.settingKey === key)?.settingValue ?? "";
  return { db, url: getValue(QUOTE_WEBHOOK_URL_KEY), enabled: getValue(QUOTE_WEBHOOK_ENABLED_KEY) === "enabled" };
}

async function readSalesTacticsConfig() {
  const db = await getDb();
  if (!db) return DEFAULT_SALES_TACTICS;
  const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, SALES_TACTICS_SETTING_KEY)).limit(1);
  return parseSalesTacticsSetting(setting?.settingValue);
}

async function quoteFeatureIsEnabled() {
  const db = await getDb();
  if (!db) return false;
  const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, QUOTE_FEATURE_BETA_ENABLED_KEY)).limit(1);
  return isQuoteFeatureEnabled(setting?.settingValue);
}

async function requireQuoteFeatureEnabled() {
  if (!await quoteFeatureIsEnabled()) throw new Error("Quotes Beta is disabled by the CRM owner.");
}

export const crmRouter = router({
  publicTemplateConfig: publicProcedure.query(async () => {
    const { config } = await readSiteTemplateConfig();
    return { ...config, webhooks: { leadCaptureUrl: "", crmWebhookUrl: "" } };
  }),

  publicSalesTacticsConfig: publicProcedure.query(async () => readSalesTacticsConfig()),

  ownerStatus: protectedProcedure.query(async ({ ctx }) => ({ isOwner: isOwnerEmail(ctx.user.email, process.env.NEON_ADMIN_EMAIL) })),

  templateConfig: ownerProcedure.query(async () => (await readSiteTemplateConfig()).config),

  salesTacticsConfig: ownerProcedure.query(async () => readSalesTacticsConfig()),

  setSalesTacticsConfig: ownerProcedure
    .input(z.object({ config: z.unknown() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const config = normalizeSalesTactics(input.config);
      await db.insert(siteSettings).values({ settingKey: SALES_TACTICS_SETTING_KEY, settingValue: JSON.stringify(config) }).onConflictDoUpdate({ target: siteSettings.settingKey, set: { settingValue: JSON.stringify(config), updatedAt: new Date() } });
      return config;
    }),

  setTemplateConfig: ownerProcedure
    .input(z.object({ config: z.unknown(), pageId: z.string().trim().min(1).max(80).optional(), summary: z.string().trim().min(1).max(400).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const config = normalizeSiteTemplate(input.config);
      await db.insert(siteSettings).values({ settingKey: SITE_TEMPLATE_CONFIG_KEY, settingValue: JSON.stringify(config) }).onConflictDoUpdate({ target: siteSettings.settingKey, set: { settingValue: JSON.stringify(config), updatedAt: new Date() } });
      await db.insert(pageEditHistory).values({ pageId: input.pageId ?? "site", summary: input.summary ?? "Updated site template configuration", config: config as unknown as Record<string, unknown>, actorUserId: ctx.user.id });
      return config;
    }),

  templateConfigHistory: ownerProcedure
    .input(z.object({ pageId: z.string().trim().min(1).max(80).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const query = db.select({ id: pageEditHistory.id, pageId: pageEditHistory.pageId, summary: pageEditHistory.summary, actorUserId: pageEditHistory.actorUserId, createdAt: pageEditHistory.createdAt }).from(pageEditHistory);
      return input?.pageId ? query.where(eq(pageEditHistory.pageId, input.pageId)).orderBy(desc(pageEditHistory.createdAt)).limit(60) : query.orderBy(desc(pageEditHistory.createdAt)).limit(60);
    }),

  rollbackTemplateConfig: ownerProcedure
    .input(z.object({ historyId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [snapshot] = await db.select().from(pageEditHistory).where(eq(pageEditHistory.id, input.historyId)).limit(1);
      if (!snapshot) throw new Error("The selected page version is no longer available.");
      const config = normalizeSiteTemplate(snapshot.config);
      await db.insert(siteSettings).values({ settingKey: SITE_TEMPLATE_CONFIG_KEY, settingValue: JSON.stringify(config) }).onConflictDoUpdate({ target: siteSettings.settingKey, set: { settingValue: JSON.stringify(config), updatedAt: new Date() } });
      await db.insert(pageEditHistory).values({ pageId: snapshot.pageId, summary: `Restored version #${snapshot.id}: ${snapshot.summary}`, config: config as unknown as Record<string, unknown>, actorUserId: ctx.user.id });
      return config;
    }),

  publicInvitation: publicProcedure
    .input(z.object({ token: z.string().min(20).max(96) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false, email: null, name: null };
      const invitation = await db.select().from(adminInvitations).where(eq(adminInvitations.token, input.token)).limit(1);
      const item = invitation[0];
      return item && invitationIsActive(item) ? { valid: true, email: item.email, name: item.name } : { valid: false, email: null, name: null };
    }),

  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string().min(20).max(96) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.email) throw new Error("Database or authenticated email unavailable");
      const invitation = await db.select().from(adminInvitations).where(eq(adminInvitations.token, input.token)).limit(1);
      const item = invitation[0];
      if (!item || !invitationIsActive(item) || item.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
        throw new Error("This administrator invitation is not valid for the signed-in account.");
      }
      await db.update(users).set({ role: item.role, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
      await db.update(adminInvitations).set({ acceptedAt: new Date() }).where(eq(adminInvitations.id, item.id));
      return { success: true };
    }),

  ownerAccess: ownerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [setupSetting, staff, invitations] = await Promise.all([
      db.select().from(siteSettings).where(eq(siteSettings.settingKey, ACCOUNT_SETUP_SETTING_KEY)).limit(1),
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(adminInvitations).orderBy(desc(adminInvitations.createdAt)),
    ]);
    return {
      accountSetupEnabled: isAccountSetupEnabled(setupSetting[0]?.settingValue),
      ownerEmail: ctx.user.email,
      staff,
      invitations,
    };
  }),

  setAccountSetupEnabled: ownerProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, ACCOUNT_SETUP_SETTING_KEY)).limit(1);
      const settingValue = input.enabled ? "enabled" : "disabled";
      if (existing[0]) await db.update(siteSettings).set({ settingValue, updatedAt: new Date() }).where(eq(siteSettings.id, existing[0].id));
      else await db.insert(siteSettings).values({ settingKey: ACCOUNT_SETUP_SETTING_KEY, settingValue });
      return { success: true, enabled: input.enabled };
    }),

  quoteWebhookSettings: ownerProcedure.query(async () => {
    const settings = await readQuoteWebhookSettings();
    return { url: settings.url, enabled: settings.enabled, configured: Boolean(settings.url) };
  }),

  setQuoteWebhookSettings: ownerProcedure
    .input(z.object({ url: z.string().trim().max(1000), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (input.url && !isZapierWebhookUrl(input.url)) throw new Error("Use the HTTPS Catch Hook URL from Zapier.");
      if (input.enabled && !input.url) throw new Error("Add a Zapier Catch Hook URL before enabling automatic lead handoff.");
      const rows = [
        { settingKey: QUOTE_WEBHOOK_URL_KEY, settingValue: input.url },
        { settingKey: QUOTE_WEBHOOK_ENABLED_KEY, settingValue: input.enabled ? "enabled" : "disabled" },
      ];
      for (const row of rows) await db.insert(siteSettings).values(row).onConflictDoUpdate({ target: siteSettings.settingKey, set: { settingValue: row.settingValue, updatedAt: new Date() } });
      return { success: true, configured: Boolean(input.url), enabled: input.enabled };
    }),

  quoteFeatureStatus: crmReadProcedure.query(async () => ({ enabled: await quoteFeatureIsEnabled(), beta: true })),

  setQuoteFeatureEnabled: ownerProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const settingValue = input.enabled ? "enabled" : "disabled";
      await db.insert(siteSettings).values({ settingKey: QUOTE_FEATURE_BETA_ENABLED_KEY, settingValue }).onConflictDoUpdate({ target: siteSettings.settingKey, set: { settingValue, updatedAt: new Date() } });
      return { success: true, enabled: input.enabled, beta: true };
    }),

  createAdminInvitation: ownerProcedure
    .input(invitationInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (isOwnerEmail(input.email, process.env.NEON_ADMIN_EMAIL)) throw new Error("The owner email already has administrator access.");
      const existingAdmin = await db.select().from(users).where(and(eq(users.email, input.email), eq(users.role, "admin"))).limit(1);
      if (existingAdmin[0]) throw new Error("This email already has CRM administrator access.");
      await db.update(adminInvitations).set({ revokedAt: new Date() }).where(and(eq(adminInvitations.email, input.email), isNull(adminInvitations.acceptedAt), isNull(adminInvitations.revokedAt)));
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const created = await db.insert(adminInvitations).values({
        email: input.email,
        name: input.name ?? null,
        role: input.role,
        token,
        invitedByUserId: ctx.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }).returning();
      return { invitation: created[0] };
    }),

  revokeAdminInvitation: ownerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(adminInvitations).set({ revokedAt: new Date() }).where(eq(adminInvitations.id, input.id));
      return { success: true };
    }),

  setStaffRole: ownerProcedure
    .input(z.object({ userId: z.number(), role: z.enum(assignableStaffRoles) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const target = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!target[0]) throw new Error("User not found");
      if (isOwnerEmail(target[0].email, process.env.NEON_ADMIN_EMAIL)) throw new Error("The CRM owner's role cannot be changed.");
      if (target[0].id === ctx.user.id) throw new Error("You cannot change your own role.");
      await db.update(users).set({ role: input.role, updatedAt: new Date() }).where(eq(users.id, input.userId));
      return { success: true };
    }),
  updateStaffAccess: ownerProcedure
    .input(z.object({ userId: z.number(), action: z.enum(["suspend", "restore", "remove"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const target = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!target[0]) throw new Error("User not found");
      if (isOwnerEmail(target[0].email, process.env.NEON_ADMIN_EMAIL)) throw new Error("The CRM owner cannot be suspended or removed.");
      if (target[0].id === ctx.user.id) throw new Error("You cannot change your own access.");
      const access = input.action === "suspend" ? { suspendedAt: new Date() } : { suspendedAt: null };
      await db.update(users).set({
        role: input.action === "remove" ? "user" : target[0].role,
        ...access,
        updatedAt: new Date(),
      }).where(eq(users.id, input.userId));
      return { success: true, action: input.action };
    }),
  completeFirstPasswordChange: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user) throw new Error("Database or authenticated user unavailable");
    await db.update(users).set({ mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
  overview: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { pipeline: [], dueActions: 0, newThisWeek: 0, upcomingAppointments: 0 };

    const [allLeads, upcoming] = await Promise.all([
      db.select({ status: leads.status, createdAt: leads.createdAt, nextActionAt: leads.nextActionAt }).from(leads).where(and(isNull(leads.deletedAt), isNull(leads.archivedAt))),
      db.select({ id: appointments.id }).from(appointments).where(eq(appointments.status, "confirmed")),
    ]);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const statusCounts = new Map<string, number>();
    allLeads.forEach((lead) => statusCounts.set(lead.status, (statusCounts.get(lead.status) ?? 0) + 1));

    return {
      pipeline: leadStatuses.filter((status) => !["duplicate", "spam"].includes(status)).map((status) => ({ status, count: statusCounts.get(status) ?? 0 })),
      dueActions: allLeads.filter((lead) => lead.nextActionAt && lead.nextActionAt <= today).length,
      newThisWeek: allLeads.filter((lead) => lead.createdAt >= weekAgo).length,
      upcomingAppointments: upcoming.length,
    };
  }),

  pipeline: crmReadProcedure
    .input(z.object({ query: z.string().trim().optional(), status: z.enum(leadStatuses).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const filters = [isNull(leads.deletedAt), isNull(leads.archivedAt)];
      if (input?.status) filters.push(eq(leads.status, input.status));
      if (input?.query) {
        const search = `%${input.query}%`;
        filters.push(or(ilike(leads.fullName, search), ilike(leads.phone, search), ilike(leads.referenceNumber, search))!);
      }
      return db.select().from(leads).where(filters.length ? and(...filters) : undefined).orderBy(desc(leads.createdAt));
    }),

  updateLead: leadWriteProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(leadStatuses).optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      internalNotes: z.string().max(5000).nullable().optional(),
      nextActionAt: z.coerce.date().nullable().optional(),
      estimatedValue: z.string().max(20).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      await db.update(leads).set({ ...updates, updatedAt: new Date() }).where(eq(leads.id, id));
      const summary = input.status ? `Lead moved to ${input.status.replace(/_/g, " ")}` : "Lead details updated";
      await db.insert(leadActivities).values({ leadId: id, actorUserId: ctx.user.id, type: "lead_updated", summary });
      return { success: true };
    }),

  softDeleteLead: leadWriteProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [lead] = await db.select().from(leads).where(and(eq(leads.id, input.id), isNull(leads.deletedAt))).limit(1);
      if (!lead) throw new Error("Lead not found or already deleted");
      await db.update(leads).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, input.id));
      await db.insert(leadActivities).values({ leadId: input.id, actorUserId: ctx.user.id, type: "lead_soft_deleted", summary: "Lead moved to the deleted records archive" });
      return { success: true };
    }),

  archiveLead: leadWriteProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [lead] = await db.select().from(leads).where(and(eq(leads.id, input.id), isNull(leads.deletedAt), isNull(leads.archivedAt))).limit(1);
      if (!lead) throw new Error("Lead not found or already archived");
      await db.update(leads).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, input.id));
      await db.insert(leadActivities).values({ leadId: input.id, actorUserId: ctx.user.id, type: "lead_archived", summary: "Lead moved to the archived records recovery queue" });
      return { success: true };
    }),

  recoveryLeads: crmReadProcedure
    .input(z.object({ query: z.string().trim().max(200).optional(), type: z.enum(["all", "archived", "deleted"]).default("all") }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const lifecycle = input?.type === "archived" ? and(isNotNull(leads.archivedAt), isNull(leads.deletedAt)) : input?.type === "deleted" ? isNotNull(leads.deletedAt) : or(isNotNull(leads.archivedAt), isNotNull(leads.deletedAt));
      const filters = [lifecycle!];
      if (input?.query) {
        const search = `%${input.query}%`;
        filters.push(or(ilike(leads.fullName, search), ilike(leads.phone, search), ilike(leads.referenceNumber, search))!);
      }
      return db.select().from(leads).where(and(...filters)).orderBy(desc(leads.updatedAt));
    }),

  restoreLead: leadWriteProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [lead] = await db.select().from(leads).where(and(eq(leads.id, input.id), or(isNotNull(leads.archivedAt), isNotNull(leads.deletedAt))!)).limit(1);
      if (!lead) throw new Error("Lead is not in the recovery queue");
      await db.update(leads).set({ archivedAt: null, deletedAt: null, updatedAt: new Date() }).where(eq(leads.id, input.id));
      await db.insert(leadActivities).values({ leadId: input.id, actorUserId: ctx.user.id, type: "lead_restored", summary: "Lead restored to the active pipeline" });
      return { success: true };
    }),

  permanentlyDeleteLead: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [lead] = await db.select().from(leads).where(and(eq(leads.id, input.id), or(isNotNull(leads.archivedAt), isNotNull(leads.deletedAt))!)).limit(1);
      if (!lead) throw new Error("Only archived or soft-deleted leads can be permanently deleted");
      await db.transaction(async tx => {
        await tx.delete(leadFiles).where(eq(leadFiles.leadId, input.id));
        await tx.delete(leadConversionEvents).where(eq(leadConversionEvents.leadId, input.id));
        await tx.delete(leadAttributions).where(eq(leadAttributions.leadId, input.id));
        await tx.delete(quoteDeliveries).where(eq(quoteDeliveries.leadId, input.id));
        await tx.delete(quotes).where(eq(quotes.leadId, input.id));
        await tx.delete(appointments).where(eq(appointments.leadId, input.id));
        await tx.delete(leadActivities).where(eq(leadActivities.leadId, input.id));
        await tx.delete(leads).where(eq(leads.id, input.id));
      });
      return { success: true };
    }),

  activities: crmReadProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(leadActivities).where(eq(leadActivities.leadId, input.leadId)).orderBy(desc(leadActivities.createdAt));
    }),

  addNote: leadWriteProcedure
    .input(z.object({ leadId: z.number(), note: z.string().trim().min(1).max(5000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(leadActivities).values({ leadId: input.leadId, actorUserId: ctx.user.id, type: "note", summary: input.note });
      return { success: true };
    }),

  quoteDeliveries: crmReadProcedure.input(z.object({ leadId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(quoteDeliveries).where(eq(quoteDeliveries.leadId, input.leadId)).orderBy(desc(quoteDeliveries.createdAt));
  }),

  resendLeadToZapier: leadWriteProcedure
    .input(z.object({ leadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const settings = await readQuoteWebhookSettings();
      if (!settings.db) throw new Error("Database not available");
      if (!settings.enabled || !isZapierWebhookUrl(settings.url)) throw new Error("Automatic Zapier delivery is not enabled in CRM settings.");
      const [lead] = await settings.db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
      if (!lead) throw new Error("Lead not found");
      const vehicle = [lead.vehicleYear, lead.vehicleMake, lead.vehicleModel, lead.vehicleTrim].filter(Boolean).join(" ") || null;
      const serviceLocation = [lead.streetAddress, lead.unit, lead.city, lead.zipCode].filter(Boolean).join(", ") || null;
      const payload = buildLeadHandoffWebhookPayload({
        followUp: { notes: "Manually resent from the CRM. __OWNER_NAME__ will contact the customer to discuss the requested service." },
        lead: { id: lead.id, referenceNumber: lead.referenceNumber, fullName: lead.fullName, phone: lead.phone, email: lead.email, preferredContact: lead.preferredContact, requestedService: lead.requestedService, mainSymptom: lead.mainSymptom, problemDescription: lead.problemDescription, vehicle, serviceLocation },
      });
      const [delivery] = await settings.db.insert(quoteDeliveries).values({ leadId: lead.id, actorUserId: ctx.user.id, quoteAmount: "No price provided", quoteSummary: "Manual CRM resend", deliveryStatus: "resending", payload }).returning();
      try {
        const response = await fetch(settings.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(12_000) });
        if (!response.ok) throw new Error(`Zapier returned HTTP ${response.status}`);
        await settings.db.update(quoteDeliveries).set({ deliveryStatus: "resent", responseCode: response.status, deliveredAt: new Date() }).where(eq(quoteDeliveries.id, delivery.id));
        await settings.db.update(leads).set({ quoteWebhookStatus: "resent", quoteWebhookError: null, quoteWebhookSentAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, lead.id));
        await settings.db.insert(leadActivities).values({ leadId: lead.id, actorUserId: ctx.user.id, type: "lead_handoff_resent", summary: "Existing lead resent to Zapier from the CRM" });
        return { success: true, deliveryId: delivery.id };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Zapier resend failed";
        await settings.db.update(quoteDeliveries).set({ deliveryStatus: "failed", errorMessage: message }).where(eq(quoteDeliveries.id, delivery.id));
        await settings.db.update(leads).set({ quoteWebhookStatus: "failed", quoteWebhookError: message, updatedAt: new Date() }).where(eq(leads.id, lead.id));
        await settings.db.insert(leadActivities).values({ leadId: lead.id, actorUserId: ctx.user.id, type: "lead_handoff_failed", summary: `Existing lead resend failed: ${message}` });
        throw new Error(message);
      }
    }),

  quotes: crmReadProcedure
    .input(z.object({ query: z.string().trim().max(200).optional(), status: z.enum(["active", "archived", "deleted"]).optional() }).optional())
    .query(async ({ input }) => {
      await requireQuoteFeatureEnabled();
      const db = await getDb();
      if (!db) return [];
      const filters = [eq(quotes.status, input?.status ?? "active")];
      if (input?.query) {
        const search = `%${input.query}%`;
        filters.push(or(ilike(quotes.title, search), ilike(quotes.summary, search), ilike(leads.fullName, search), ilike(leads.referenceNumber, search))!);
      }
      return db.select({ quote: quotes, lead: { id: leads.id, referenceNumber: leads.referenceNumber, fullName: leads.fullName, phone: leads.phone, email: leads.email, requestedService: leads.requestedService, vehicleYear: leads.vehicleYear, vehicleMake: leads.vehicleMake, vehicleModel: leads.vehicleModel } }).from(quotes).innerJoin(leads, eq(quotes.leadId, leads.id)).where(and(...filters)).orderBy(desc(quotes.updatedAt));
    }),

  createQuote: leadWriteProcedure
    .input(z.object({ leadId: z.number(), title: z.string().trim().min(3).max(240), summary: z.string().trim().min(10).max(10_000) }))
    .mutation(async ({ ctx, input }) => {
      await requireQuoteFeatureEnabled();
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [lead] = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
      if (!lead) throw new Error("Lead not found");
      const [quote] = await db.insert(quotes).values({ leadId: input.leadId, createdByUserId: ctx.user.id, title: input.title, summary: input.summary }).returning();
      await db.insert(leadActivities).values({ leadId: input.leadId, actorUserId: ctx.user.id, type: "quote_created", summary: `Service summary created: ${input.title}` });
      return quote;
    }),

  setQuoteLifecycle: leadWriteProcedure
    .input(z.object({ id: z.number(), action: z.enum(["archive", "restore", "soft_delete"]) }))
    .mutation(async ({ ctx, input }) => {
      await requireQuoteFeatureEnabled();
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [quote] = await db.select().from(quotes).where(eq(quotes.id, input.id)).limit(1);
      if (!quote) throw new Error("Quote record not found");
      const update = input.action === "archive" ? { status: "archived" as const, archivedAt: new Date(), deletedAt: null, updatedAt: new Date() } : input.action === "soft_delete" ? { status: "deleted" as const, deletedAt: new Date(), updatedAt: new Date() } : { status: "active" as const, archivedAt: null, deletedAt: null, updatedAt: new Date() };
      await db.update(quotes).set(update).where(eq(quotes.id, input.id));
      const label = input.action === "soft_delete" ? "soft-deleted" : input.action === "archive" ? "archived" : "restored";
      await db.insert(leadActivities).values({ leadId: quote.leadId, actorUserId: ctx.user.id, type: "quote_lifecycle", summary: `Service summary ${label}: ${quote.title}` });
      return { success: true, status: update.status };
    }),

  appointments: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(appointments).orderBy(desc(appointments.scheduledStart));
  }),

  createAppointment: adminProcedure
    .input(z.object({ leadId: z.number(), customerId: z.number().nullable().optional(), scheduledStart: z.coerce.date(), durationMinutes: z.number().min(30).max(480).default(90), serviceAddress: z.string().max(1000).nullable().optional(), notes: z.string().max(5000).nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(appointments).values({ ...input, customerId: input.customerId ?? null, serviceAddress: input.serviceAddress ?? null, notes: input.notes ?? null });
      await db.update(leads).set({ status: "scheduled", updatedAt: new Date() }).where(eq(leads.id, input.leadId));
      await db.insert(leadActivities).values({ leadId: input.leadId, actorUserId: ctx.user.id, type: "appointment_created", summary: `Appointment scheduled for ${input.scheduledStart.toLocaleString()}` });
      return { success: true };
    }),
});
