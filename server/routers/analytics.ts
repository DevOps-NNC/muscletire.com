import { and, desc, eq, gte, isNull, lt, lte } from "drizzle-orm";
import { z } from "zod";
import {
  analyticsChannelMetrics,
  analyticsDailyMetrics,
  analyticsIntegrations,
  analyticsPageMetrics,
  analyticsPeriodMetrics,
  analyticsSyncRuns,
  generatedMarketingReports,
  leadAttributions,
  leads,
  marketingReportConfigs,
  marketingReportDeliveries,
} from "../../drizzle/schema.js";
import {
  calculateLeadConversionRate,
  calculatePercentChange,
  classifyLeadChannel,
  getPreviousReportingRange,
  getReportingRange,
  reportingPeriods,
  REPORTING_TIME_ZONE,
  type AnalyticsSource,
  type LeadChannel,
  type ReportingRange,
} from "../../shared/analytics.js";
import { hasLeadAttributionSignal } from "../../shared/googleAdsAttribution.js";
import { adminProcedure, crmReadProcedure, ownerProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { decryptAnalyticsSecret } from "../analytics/analyticsCrypto.js";
import { listAccessibleGa4Properties, refreshGoogleAccessToken, revokeGoogleToken } from "../analytics/googleAnalytics.js";
import { syncAnalyticsIntegration } from "../analytics/syncAnalytics.js";
import { buildMarketingReportCsv, buildMarketingReportSnapshot } from "../analytics/reporting.js";

const reportingInput = z.object({
  period: z.enum(reportingPeriods).default("last_7_days"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const channelValues: LeadChannel[] = ["organic_search", "paid_search", "organic_social", "paid_social", "email", "referral", "direct", "other"];

function resolveRange(input: z.infer<typeof reportingInput>) {
  return getReportingRange(input.period, new Date(), REPORTING_TIME_ZONE, input.startDate && input.endDate ? { startDate: input.startDate, endDate: input.endDate } : undefined);
}

function sourceMetric(value: number | null, source: AnalyticsSource, previous: number | null = null) {
  return { value, source, comparisonPercent: calculatePercentChange(value, previous) };
}

function emptyOverview(range: ReportingRange, comparisonRange: ReportingRange, ga4Status: "not_connected" | "unavailable" = "not_connected") {
  return {
    range,
    comparisonRange,
    sourceStatus: { ga4: ga4Status, crm: "available" as const },
    ga4: { users: null, sessions: null, newUsers: null, activeUsers: null, engagedSessions: null, engagementRate: null, averageEngagementTime: null, pageViews: null, daily: [], channels: [], pages: [] },
    crm: { totalLeads: sourceMetric(0, "crm"), attributedLeads: sourceMetric(0, "attributed"), convertedLeads: sourceMetric(0, "crm"), leadsByStatus: {}, services: [] },
    attribution: { totalLeads: 0, attributedLeads: 0, coveragePercent: null },
    channels: [],
    conversion: { rate: null, organicSessions: null, paidSessions: null },
    pages: [],
  };
}

function dateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: REPORTING_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getLeadChannel(attribution: typeof leadAttributions.$inferSelect | null) {
  return classifyLeadChannel(toAttributionInput(attribution));
}

function toAttributionInput(attribution: typeof leadAttributions.$inferSelect | null | undefined) {
  if (!attribution) return undefined;
  return {
    gclid: attribution.gclid ?? undefined,
    gbraid: attribution.gbraid ?? undefined,
    wbraid: attribution.wbraid ?? undefined,
    dclid: attribution.dclid ?? undefined,
    gclsrc: attribution.gclsrc ?? undefined,
    utmSource: attribution.utmSource ?? undefined,
    utmMedium: attribution.utmMedium ?? undefined,
    utmCampaign: attribution.utmCampaign ?? undefined,
    utmTerm: attribution.utmTerm ?? undefined,
    utmContent: attribution.utmContent ?? undefined,
    gadSource: attribution.gadSource ?? undefined,
    gadCampaignId: attribution.gadCampaignId ?? undefined,
    googleAnalyticsClientId: attribution.googleAnalyticsClientId ?? undefined,
    googleAnalyticsSessionId: attribution.googleAnalyticsSessionId ?? undefined,
    landingUrl: attribution.landingUrl ?? undefined,
    referrer: attribution.referrer ?? undefined,
  };
}

function getLandingPath(attribution: typeof leadAttributions.$inferSelect | null) {
  if (!attribution?.landingUrl) return null;
  try { return new URL(attribution.landingUrl).pathname || "/"; } catch { return null; }
}

function channelFromGa4Row(channel: string, source: string, medium: string, campaign: string | null): LeadChannel {
  const normalized = channel.trim().toLowerCase().replace(/[^a-z]+/g, "_");
  const known: Record<string, LeadChannel> = {
    organic_search: "organic_search",
    paid_search: "paid_search",
    organic_social: "organic_social",
    paid_social: "paid_social",
    email: "email",
    referral: "referral",
    direct: "direct",
  };
  return known[normalized] ?? classifyLeadChannel({ utmSource: source, utmMedium: medium, utmCampaign: campaign ?? undefined });
}

function aggregateLeads(rows: Array<{ lead: typeof leads.$inferSelect; attribution: typeof leadAttributions.$inferSelect | null }>) {
  const leadsByStatus: Record<string, number> = {};
  const services = new Map<string, number>();
  const channelLeads = new Map<LeadChannel, number>();
  const dates = new Map<string, { leads: number; attributedLeads: number }>();
  const pages = new Map<string, number>();
  let attributedLeads = 0;
  let convertedLeads = 0;

  for (const row of rows) {
    const leadDate = dateKey(new Date(row.lead.createdAt));
    const currentDate = dates.get(leadDate) ?? { leads: 0, attributedLeads: 0 };
    currentDate.leads += 1;
    const hasAttribution = hasLeadAttributionSignal(toAttributionInput(row.attribution));
    if (hasAttribution) {
      attributedLeads += 1;
      currentDate.attributedLeads += 1;
    }
    dates.set(leadDate, currentDate);
    leadsByStatus[row.lead.status] = (leadsByStatus[row.lead.status] ?? 0) + 1;
    const service = row.lead.requestedService?.trim() || "Other";
    services.set(service, (services.get(service) ?? 0) + 1);
    const channel = getLeadChannel(row.attribution);
    channelLeads.set(channel, (channelLeads.get(channel) ?? 0) + 1);
    const pagePath = getLandingPath(row.attribution);
    if (pagePath) pages.set(pagePath, (pages.get(pagePath) ?? 0) + 1);
    if (row.lead.status === "completed") convertedLeads += 1;
  }

  return { totalLeads: rows.length, attributedLeads, convertedLeads, leadsByStatus, services, channelLeads, dates, pages };
}

async function readIntegration() {
  const db = await getDb();
  if (!db) return { db: null, integration: null, unavailable: false as const };
  try {
    const [integration] = await db.select().from(analyticsIntegrations).where(eq(analyticsIntegrations.provider, "ga4")).limit(1);
    return { db, integration: integration ?? null, unavailable: false as const };
  } catch (error) {
    console.warn("[Analytics] Integration storage is unavailable; returning CRM-only analytics.", error instanceof Error ? error.message : "unknown error");
    return { db, integration: null, unavailable: true as const };
  }
}

function redactIntegration(integration: typeof analyticsIntegrations.$inferSelect | null) {
  if (!integration) return { status: "disconnected" as const, provider: "ga4" as const, propertySelected: false, propertyId: null, propertyName: null, googleAccountId: null, googleAccountEmail: null, connectedAt: null, lastSyncAt: null, nextSyncAt: null, lastSyncError: null };
  return {
    status: integration.status,
    provider: integration.provider,
    propertySelected: Boolean(integration.propertyId),
    propertyId: integration.propertyId,
    propertyName: integration.propertyName,
    googleAccountId: integration.googleAccountId,
    googleAccountEmail: integration.googleAccountEmail,
    connectedAt: integration.connectedAt,
    lastSyncAt: integration.lastSyncAt,
    nextSyncAt: integration.nextSyncAt,
    lastSyncError: integration.lastSyncError,
  };
}

export async function buildAnalyticsOverview(input: z.infer<typeof reportingInput>) {
  const range = resolveRange(input);
  const comparisonRange = getPreviousReportingRange(range);
  const { db, integration, unavailable } = await readIntegration();
  if (!db) return emptyOverview(range, comparisonRange, unavailable ? "unavailable" : "not_connected");

  const [periodMetric] = integration?.propertyId ? await db.select().from(analyticsPeriodMetrics).where(and(eq(analyticsPeriodMetrics.integrationId, integration.id), eq(analyticsPeriodMetrics.periodStart, range.startDate), eq(analyticsPeriodMetrics.periodEnd, range.endDate))).limit(1) : [];
  const [previousPeriodMetric] = integration?.propertyId ? await db.select().from(analyticsPeriodMetrics).where(and(eq(analyticsPeriodMetrics.integrationId, integration.id), eq(analyticsPeriodMetrics.periodStart, comparisonRange.startDate), eq(analyticsPeriodMetrics.periodEnd, comparisonRange.endDate))).limit(1) : [];
  const daily = integration?.propertyId ? await db.select().from(analyticsDailyMetrics).where(and(eq(analyticsDailyMetrics.integrationId, integration.id), gte(analyticsDailyMetrics.metricDate, range.startDate), lt(analyticsDailyMetrics.metricDate, range.endDate))).orderBy(analyticsDailyMetrics.metricDate) : [];
  const channels = integration?.propertyId ? await db.select().from(analyticsChannelMetrics).where(and(eq(analyticsChannelMetrics.integrationId, integration.id), gte(analyticsChannelMetrics.metricDate, range.startDate), lt(analyticsChannelMetrics.metricDate, range.endDate))) : [];
  const pages = integration?.propertyId ? await db.select().from(analyticsPageMetrics).where(and(eq(analyticsPageMetrics.integrationId, integration.id), gte(analyticsPageMetrics.metricDate, range.startDate), lt(analyticsPageMetrics.metricDate, range.endDate))) : [];
  const leadRows = await db.select({ lead: leads, attribution: leadAttributions }).from(leads).leftJoin(leadAttributions, eq(leadAttributions.leadId, leads.id)).where(and(gte(leads.createdAt, range.start), lt(leads.createdAt, range.end), isNull(leads.deletedAt), isNull(leads.archivedAt))).orderBy(leads.createdAt);
  const previousLeadRows = await db.select({ lead: leads, attribution: leadAttributions }).from(leads).leftJoin(leadAttributions, eq(leadAttributions.leadId, leads.id)).where(and(gte(leads.createdAt, comparisonRange.start), lt(leads.createdAt, comparisonRange.end), isNull(leads.deletedAt), isNull(leads.archivedAt)));
  const leadSummary = aggregateLeads(leadRows);
  const previousLeadSummary = aggregateLeads(previousLeadRows);
  const ga4Available = integration?.status === "connected" && Boolean(periodMetric);
  const ga4Status: "connected" | "not_connected" | "no_data" | "partial" | "unavailable" = unavailable ? "unavailable" : !integration || integration.status === "disconnected" ? "not_connected" : integration.status === "connected" && !periodMetric ? "no_data" : integration.status === "connected" ? "connected" : "partial";
  const sessionTotal = periodMetric ? periodMetric.sessions : null;
  const organicSessions = channels.filter(row => channelFromGa4Row(row.channel, row.source, row.medium, row.campaign) === "organic_search").reduce((total, row) => total + row.sessions, 0);
  const paidSessions = channels.filter(row => channelFromGa4Row(row.channel, row.source, row.medium, row.campaign) === "paid_search").reduce((total, row) => total + row.sessions, 0);
  const channelMap = new Map<LeadChannel, { sessions: number; leads: number }>();
  for (const row of channels) {
    const channel = channelFromGa4Row(row.channel, row.source, row.medium, row.campaign);
    const current = channelMap.get(channel) ?? { sessions: 0, leads: 0 };
    current.sessions += row.sessions;
    channelMap.set(channel, current);
  }
  for (const [channel, leadsCount] of Array.from(leadSummary.channelLeads.entries())) {
    const current = channelMap.get(channel) ?? { sessions: 0, leads: 0 };
    current.leads = leadsCount;
    channelMap.set(channel, current);
  }
  const channelRows = channelValues.filter(channel => channelMap.has(channel)).map(channel => {
    const current = channelMap.get(channel)!;
    return { channel, sessions: ga4Available ? current.sessions : null, leads: current.leads, attributedLeads: current.leads, conversionRate: calculateLeadConversionRate(current.leads, ga4Available ? current.sessions : null) };
  });
  const allDates = new Set([...daily.map(row => row.metricDate), ...Array.from(leadSummary.dates.keys())]);
  const dailyRows = Array.from(allDates).sort().map(date => {
    const ga4 = daily.find(row => row.metricDate === date);
    const leadDate = leadSummary.dates.get(date) ?? { leads: 0, attributedLeads: 0 };
    return { date, users: ga4Available && ga4 ? ga4.users : null, sessions: ga4Available && ga4 ? ga4.sessions : null, leads: leadDate.leads, attributedLeads: leadDate.attributedLeads };
  });
  const pageMap = new Map<string, { sessions: number; users: number; leads: number }>();
  for (const row of pages) {
    const current = pageMap.get(row.pagePath) ?? { sessions: 0, users: 0, leads: 0 };
    current.sessions += row.sessions;
    current.users += row.users;
    pageMap.set(row.pagePath, current);
  }
  for (const [path, leadsCount] of Array.from(leadSummary.pages.entries())) {
    const current = pageMap.get(path) ?? { sessions: 0, users: 0, leads: 0 };
    current.leads = leadsCount;
    pageMap.set(path, current);
  }

  return {
    range,
    comparisonRange,
    sourceStatus: { ga4: ga4Status, crm: "available" as const },
    ga4: {
      users: sourceMetric(ga4Available && periodMetric ? periodMetric.users : null, "ga4", previousPeriodMetric?.users ?? null),
      sessions: sourceMetric(ga4Available && periodMetric ? periodMetric.sessions : null, "ga4", previousPeriodMetric?.sessions ?? null),
      newUsers: sourceMetric(ga4Available && periodMetric ? periodMetric.newUsers : null, "ga4", previousPeriodMetric?.newUsers ?? null),
      activeUsers: sourceMetric(ga4Available && periodMetric ? periodMetric.activeUsers : null, "ga4", previousPeriodMetric?.activeUsers ?? null),
      engagedSessions: sourceMetric(ga4Available && periodMetric ? periodMetric.engagedSessions : null, "ga4", previousPeriodMetric?.engagedSessions ?? null),
      engagementRate: sourceMetric(ga4Available && periodMetric?.engagementRate ? Number(periodMetric.engagementRate) : null, "ga4", previousPeriodMetric?.engagementRate ? Number(previousPeriodMetric.engagementRate) : null),
      averageEngagementTime: sourceMetric(ga4Available && periodMetric?.averageEngagementTime ? Number(periodMetric.averageEngagementTime) : null, "ga4", previousPeriodMetric?.averageEngagementTime ? Number(previousPeriodMetric.averageEngagementTime) : null),
      pageViews: sourceMetric(ga4Available && periodMetric ? periodMetric.pageViews : null, "ga4", previousPeriodMetric?.pageViews ?? null),
      daily: dailyRows,
      channels,
      pages,
    },
    crm: {
      totalLeads: sourceMetric(leadSummary.totalLeads, "crm", previousLeadSummary.totalLeads),
      attributedLeads: sourceMetric(leadSummary.attributedLeads, "attributed", previousLeadSummary.attributedLeads),
      convertedLeads: sourceMetric(leadSummary.convertedLeads, "crm", previousLeadSummary.convertedLeads),
      leadsByStatus: leadSummary.leadsByStatus,
      services: Array.from(leadSummary.services.entries()).sort((a, b) => b[1] - a[1]).map(([service, count]) => ({ service, leads: count })),
    },
    attribution: { totalLeads: leadSummary.totalLeads, attributedLeads: leadSummary.attributedLeads, coveragePercent: leadSummary.totalLeads ? Number(((leadSummary.attributedLeads / leadSummary.totalLeads) * 100).toFixed(2)) : null },
    channels: channelRows,
    conversion: { rate: calculateLeadConversionRate(leadSummary.attributedLeads, sessionTotal), organicSessions: ga4Available ? organicSessions : null, paidSessions: ga4Available ? paidSessions : null },
    pages: Array.from(pageMap.entries()).sort((a, b) => b[1].leads - a[1].leads || b[1].sessions - a[1].sessions).map(([path, values]) => ({ path, sessions: ga4Available ? values.sessions : null, users: ga4Available ? values.users : null, leads: values.leads, conversionRate: calculateLeadConversionRate(values.leads, ga4Available ? values.sessions : null) })),
  };
}

export function buildAnalyticsReportSnapshot(overview: Awaited<ReturnType<typeof buildAnalyticsOverview>>, generatedAt = new Date()) {
  const metric = (value: unknown, source: "ga4" | "crm" | "attributed" | "combined") => {
    if (value && typeof value === "object" && "value" in value) return value as { value: number | null; source: "ga4" | "crm" | "attributed" | "combined"; comparisonPercent: number | null };
    return { value: typeof value === "number" ? value : null, source, comparisonPercent: null };
  };
  return buildMarketingReportSnapshot({
    range: overview.range,
    comparisonRange: overview.comparisonRange,
    sourceStatus: overview.sourceStatus,
    ga4: {
      users: metric(overview.ga4.users, "ga4"),
      sessions: metric(overview.ga4.sessions, "ga4"),
      newUsers: metric(overview.ga4.newUsers, "ga4"),
      activeUsers: metric(overview.ga4.activeUsers, "ga4"),
      engagedSessions: metric(overview.ga4.engagedSessions, "ga4"),
      engagementRate: metric(overview.ga4.engagementRate, "ga4"),
      averageEngagementTime: metric(overview.ga4.averageEngagementTime, "ga4"),
      pageViews: metric(overview.ga4.pageViews, "ga4"),
      daily: overview.ga4.daily,
    },
    crm: {
      totalLeads: metric(overview.crm.totalLeads, "crm"),
      attributedLeads: metric(overview.crm.attributedLeads, "attributed"),
      convertedLeads: metric(overview.crm.convertedLeads, "crm"),
      services: overview.crm.services,
    },
    conversion: overview.conversion,
    channels: overview.channels,
    pages: overview.pages,
    attribution: overview.attribution,
  }, generatedAt);
}

export const analyticsRouter = router({
  connectionStatus: adminProcedure.query(async () => {
    const result = await readIntegration();
    return result.unavailable ? { ...redactIntegration(null), status: "unavailable" as const } : redactIntegration(result.integration);
  }),

  beginGoogleConnection: ownerProcedure.mutation(async () => ({ authorizationUrl: "/api/analytics/google/start" })),

  listGoogleProperties: ownerProcedure.query(async () => {
    const { integration } = await readIntegration();
    if (!integration?.refreshTokenCiphertext || !integration.refreshTokenIv || !integration.refreshTokenAuthTag) return { properties: [], unavailable: true };
    const refreshToken = decryptAnalyticsSecret({ ciphertext: integration.refreshTokenCiphertext, iv: integration.refreshTokenIv, authTag: integration.refreshTokenAuthTag });
    const accessToken = await refreshGoogleAccessToken(refreshToken);
    return { properties: await listAccessibleGa4Properties(accessToken.accessToken), unavailable: false };
  }),

  selectProperty: ownerProcedure.input(z.object({ propertyId: z.string().trim().min(1).max(120), propertyName: z.string().trim().min(1).max(300), accountId: z.string().trim().max(200).optional() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(analyticsIntegrations).set({ propertyId: input.propertyId, propertyName: input.propertyName, googleAccountId: input.accountId ?? undefined, status: "connected", lastSyncError: null, updatedAt: new Date() }).where(eq(analyticsIntegrations.provider, "ga4"));
    return redactIntegration((await readIntegration()).integration);
  }),

  disconnectGoogle: ownerProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [existing] = await db.select().from(analyticsIntegrations).where(eq(analyticsIntegrations.provider, "ga4")).limit(1);
    if (existing?.refreshTokenCiphertext && existing.refreshTokenIv && existing.refreshTokenAuthTag) {
      try {
        await revokeGoogleToken(decryptAnalyticsSecret({ ciphertext: existing.refreshTokenCiphertext, iv: existing.refreshTokenIv, authTag: existing.refreshTokenAuthTag }));
      } catch {
        // Local cleanup remains authoritative if the provider revoke request fails.
      }
    }
    await db.update(analyticsIntegrations).set({ status: "disconnected", refreshTokenCiphertext: null, refreshTokenIv: null, refreshTokenAuthTag: null, propertyId: null, propertyName: null, updatedAt: new Date() }).where(eq(analyticsIntegrations.provider, "ga4"));
    return { success: true };
  }),

  sync: adminProcedure.input(reportingInput).mutation(async ({ input }) => {
    const { db, integration } = await readIntegration();
    if (!db || !integration) throw new Error("Connect Google Analytics before synchronizing.");
    return syncAnalyticsIntegration({ db, integration, range: resolveRange(input) });
  }),

  syncRuns: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select({ id: analyticsSyncRuns.id, requestedStart: analyticsSyncRuns.requestedStart, requestedEnd: analyticsSyncRuns.requestedEnd, status: analyticsSyncRuns.status, rowsWritten: analyticsSyncRuns.rowsWritten, errorMessage: analyticsSyncRuns.errorMessage, startedAt: analyticsSyncRuns.startedAt, completedAt: analyticsSyncRuns.completedAt }).from(analyticsSyncRuns).orderBy(desc(analyticsSyncRuns.createdAt)).limit(50);
  }),

  reportingConfig: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { timeZone: REPORTING_TIME_ZONE, weeklyEnabled: false, monthlyEnabled: false, recipients: [], requireReview: true, emailDeliveryEnabled: false, emailTransportAvailable: false };
    const [config] = await db.select().from(marketingReportConfigs).limit(1);
    return { timeZone: config?.timeZone ?? REPORTING_TIME_ZONE, weeklyEnabled: config?.weeklyEnabled ?? false, monthlyEnabled: config?.monthlyEnabled ?? false, recipients: config?.recipients ?? [], requireReview: config?.requireReview ?? true, emailDeliveryEnabled: config?.emailDeliveryEnabled ?? false, emailTransportAvailable: false };
  }),

  setReportingConfig: ownerProcedure.input(z.object({ timeZone: z.string().trim().min(1).max(80).refine(value => { try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true; } catch { return false; } }, "Use a valid IANA timezone."), weeklyEnabled: z.boolean(), monthlyEnabled: z.boolean(), recipients: z.array(z.string().email()).max(20), requireReview: z.boolean(), emailDeliveryEnabled: z.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const values = { ...input, emailDeliveryEnabled: false, updatedAt: new Date() };
    const [existing] = await db.select().from(marketingReportConfigs).limit(1);
    if (existing) await db.update(marketingReportConfigs).set(values).where(eq(marketingReportConfigs.id, existing.id));
    else await db.insert(marketingReportConfigs).values(values);
    return { ...values, emailTransportAvailable: false };
  }),

  overview: crmReadProcedure.input(reportingInput).query(async ({ input }) => buildAnalyticsOverview(input)),

  generateReport: crmReadProcedure.input(reportingInput.extend({ reportType: z.enum(["weekly", "monthly", "quarterly", "custom"]).default("custom") })).mutation(async ({ ctx, input }) => {
    const overview = await buildAnalyticsOverview(input);
    const snapshot = buildAnalyticsReportSnapshot(overview);
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [report] = await db.insert(generatedMarketingReports).values({ reportType: input.reportType, periodStart: overview.range.start, periodEnd: overview.range.end, comparisonStart: overview.comparisonRange.start, comparisonEnd: overview.comparisonRange.end, snapshot: snapshot as unknown as Record<string, unknown>, generatedByUserId: ctx.user.id }).returning();
    return report;
  }),

  getReport: crmReadProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [report] = await db.select().from(generatedMarketingReports).where(eq(generatedMarketingReports.id, input.id)).limit(1);
    return report ?? null;
  }),

  exportCsv: crmReadProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [report] = await db.select().from(generatedMarketingReports).where(eq(generatedMarketingReports.id, input.id)).limit(1);
    if (!report) throw new Error("Report not found.");
    const csv = buildMarketingReportCsv(report.snapshot as unknown as Parameters<typeof buildMarketingReportCsv>[0]);
    return { csv, filename: "new-age-marketing-report-" + report.id + ".csv" };
  }),

  prepareDelivery: ownerProcedure.input(z.object({ reportId: z.number().int().positive(), recipient: z.string().email(), format: z.enum(["csv", "print"]).default("csv") })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [report] = await db.select({ id: generatedMarketingReports.id }).from(generatedMarketingReports).where(eq(generatedMarketingReports.id, input.reportId)).limit(1);
    if (!report) throw new Error("Report not found.");
    const [delivery] = await db.insert(marketingReportDeliveries).values({ reportId: input.reportId, recipient: input.recipient, format: input.format, status: "prepared" }).returning();
    return delivery;
  }),

  deliveryHistory: adminProcedure.input(z.object({ reportId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(marketingReportDeliveries).where(eq(marketingReportDeliveries.reportId, input.reportId)).orderBy(desc(marketingReportDeliveries.createdAt));
  }),

  reports: crmReadProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select({ id: generatedMarketingReports.id, reportType: generatedMarketingReports.reportType, periodStart: generatedMarketingReports.periodStart, periodEnd: generatedMarketingReports.periodEnd, createdAt: generatedMarketingReports.createdAt }).from(generatedMarketingReports).orderBy(desc(generatedMarketingReports.createdAt)).limit(50);
  }),
});

export { aggregateLeads };
