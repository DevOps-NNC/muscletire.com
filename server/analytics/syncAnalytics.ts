import { and, eq } from "drizzle-orm";
import {
  analyticsChannelMetrics,
  analyticsDailyMetrics,
  analyticsIntegrations,
  analyticsPageMetrics,
  analyticsPeriodMetrics,
  analyticsSyncRuns,
  type AnalyticsIntegration,
} from "../../drizzle/schema.js";
import { getPreviousReportingRange, type ReportingRange } from "../../shared/analytics.js";
import { decryptAnalyticsSecret } from "./analyticsCrypto.js";
import { refreshGoogleAccessToken, runGa4Report, type Ga4ReportRequest, type NormalizedGa4Report } from "./googleAnalytics.js";

export type Ga4SyncRequests = {
  summary: Ga4ReportRequest;
  daily: Ga4ReportRequest;
  channels: Ga4ReportRequest;
  pages: Ga4ReportRequest;
};

export type NormalizedGa4SyncReports = {
  summary: {
    users: number;
    newUsers: number;
    activeUsers: number;
    sessions: number;
    engagedSessions: number;
    engagementRate: string | null;
    averageEngagementTime: string | null;
    pageViews: number;
  };
  daily: Array<{
    metricDate: string;
    users: number;
    newUsers: number;
    activeUsers: number;
    sessions: number;
    engagedSessions: number;
    engagementRate: string | null;
    averageEngagementTime: string | null;
    pageViews: number;
  }>;
  channels: Array<{
    metricDate: string;
    channel: string;
    source: string;
    medium: string;
    campaign: string;
    users: number;
    sessions: number;
    engagedSessions: number;
  }>;
  pages: Array<{
    metricDate: string;
    pagePath: string;
    users: number;
    sessions: number;
    engagedSessions: number;
    pageViews: number;
  }>;
};

export function parseGa4Metric(value: string | undefined) {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function endDateInclusive(endDate: string) {
  const end = new Date(endDate + "T00:00:00.000Z");
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
}

export function buildGa4SyncRequests(range: ReportingRange): Ga4SyncRequests {
  const dateRanges = [{ startDate: range.startDate, endDate: endDateInclusive(range.endDate) }];
  return {
    summary: {
      dateRanges,
      metrics: [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "engagedSessions" },
        { name: "engagementRate" },
        { name: "averageSessionDuration" },
        { name: "screenPageViews" },
      ],
    },
    daily: {
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "engagedSessions" },
        { name: "engagementRate" },
        { name: "averageSessionDuration" },
        { name: "screenPageViews" },
      ],
    },
    channels: {
      dateRanges,
      dimensions: [
        { name: "date" },
        { name: "sessionDefaultChannelGroup" },
        { name: "sessionSource" },
        { name: "sessionMedium" },
        { name: "sessionCampaignName" },
      ],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "engagedSessions" }],
    },
    pages: {
      dateRanges,
      dimensions: [{ name: "date" }, { name: "pagePath" }],
      metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "engagedSessions" }, { name: "screenPageViews" }],
    },
  };
}

function toDateOnly(value: string | undefined) {
  if (!value || !/^\d{8}$/.test(value)) return null;
  return value.slice(0, 4) + "-" + value.slice(4, 6) + "-" + value.slice(6, 8);
}

function decimalMetric(value: string | undefined) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) ? parsed.toFixed(4) : null;
}

export function normalizeGa4SyncReports(reports: { summary: NormalizedGa4Report; daily: NormalizedGa4Report; channels: NormalizedGa4Report; pages: NormalizedGa4Report }): NormalizedGa4SyncReports {
  const summaryMetrics = reports.summary.rows[0]?.metrics ?? {};
  return {
    summary: {
      users: parseGa4Metric(summaryMetrics.totalUsers ?? summaryMetrics.users),
      newUsers: parseGa4Metric(summaryMetrics.newUsers),
      activeUsers: parseGa4Metric(summaryMetrics.activeUsers),
      sessions: parseGa4Metric(summaryMetrics.sessions),
      engagedSessions: parseGa4Metric(summaryMetrics.engagedSessions),
      engagementRate: decimalMetric(summaryMetrics.engagementRate),
      averageEngagementTime: decimalMetric(summaryMetrics.averageSessionDuration),
      pageViews: parseGa4Metric(summaryMetrics.screenPageViews),
    },
    daily: reports.daily.rows.flatMap(row => {
      const metricDate = toDateOnly(row.dimensions.date);
      return metricDate ? [{
        metricDate,
        users: parseGa4Metric(row.metrics.totalUsers ?? row.metrics.users),
        newUsers: parseGa4Metric(row.metrics.newUsers),
        activeUsers: parseGa4Metric(row.metrics.activeUsers),
        sessions: parseGa4Metric(row.metrics.sessions),
        engagedSessions: parseGa4Metric(row.metrics.engagedSessions),
        engagementRate: decimalMetric(row.metrics.engagementRate),
        averageEngagementTime: decimalMetric(row.metrics.averageSessionDuration),
        pageViews: parseGa4Metric(row.metrics.screenPageViews),
      }] : [];
    }),
    channels: reports.channels.rows.flatMap(row => {
      const metricDate = toDateOnly(row.dimensions.date);
      if (!metricDate) return [];
      return [{
        metricDate,
        channel: row.dimensions.sessionDefaultChannelGroup || "Unassigned",
        source: row.dimensions.sessionSource || "(not set)",
        medium: row.dimensions.sessionMedium || "(not set)",
        campaign: row.dimensions.sessionCampaignName || "",
        users: parseGa4Metric(row.metrics.totalUsers ?? row.metrics.users),
        sessions: parseGa4Metric(row.metrics.sessions),
        engagedSessions: parseGa4Metric(row.metrics.engagedSessions),
      }];
    }),
    pages: reports.pages.rows.flatMap(row => {
      const metricDate = toDateOnly(row.dimensions.date);
      if (!metricDate) return [];
      return [{
        metricDate,
        pagePath: row.dimensions.pagePath || "/",
        users: parseGa4Metric(row.metrics.totalUsers ?? row.metrics.users),
        sessions: parseGa4Metric(row.metrics.sessions),
        engagedSessions: parseGa4Metric(row.metrics.engagedSessions),
        pageViews: parseGa4Metric(row.metrics.screenPageViews),
      }];
    }),
  };
}

type SyncDatabase = any;

export async function syncAnalyticsIntegration(input: {
  db: SyncDatabase;
  integration: AnalyticsIntegration;
  range: ReportingRange;
  now?: Date;
}) {
  if (input.integration.status !== "connected" || !input.integration.propertyId) {
    throw new Error("Google Analytics is connected without a selected GA4 property.");
  }
  if (!input.integration.refreshTokenCiphertext || !input.integration.refreshTokenIv || !input.integration.refreshTokenAuthTag) {
    throw new Error("Google Analytics refresh credentials are unavailable. Reconnect the integration.");
  }

  const now = input.now ?? new Date();
  const [run] = await input.db.insert(analyticsSyncRuns).values({
    integrationId: input.integration.id,
    requestedStart: input.range.start,
    requestedEnd: input.range.end,
    status: "running",
    startedAt: now,
    createdAt: now,
  }).returning();

  try {
    const refreshToken = decryptAnalyticsSecret({ ciphertext: input.integration.refreshTokenCiphertext, iv: input.integration.refreshTokenIv, authTag: input.integration.refreshTokenAuthTag });
    const accessToken = await refreshGoogleAccessToken(refreshToken);
    const requests = buildGa4SyncRequests(input.range);
    const reports = await Promise.all([
      runGa4Report(accessToken.accessToken, input.integration.propertyId, requests.summary),
      runGa4Report(accessToken.accessToken, input.integration.propertyId, requests.daily),
      runGa4Report(accessToken.accessToken, input.integration.propertyId, requests.channels),
      runGa4Report(accessToken.accessToken, input.integration.propertyId, requests.pages),
    ]);
    const normalized = normalizeGa4SyncReports({ summary: reports[0], daily: reports[1], channels: reports[2], pages: reports[3] });

    await input.db.insert(analyticsPeriodMetrics).values({ integrationId: input.integration.id, periodStart: input.range.startDate, periodEnd: input.range.endDate, ...normalized.summary, updatedAt: now }).onConflictDoUpdate({ target: [analyticsPeriodMetrics.integrationId, analyticsPeriodMetrics.periodStart, analyticsPeriodMetrics.periodEnd], set: { ...normalized.summary, updatedAt: now } });

    for (const row of normalized.daily) {
      await input.db.insert(analyticsDailyMetrics).values({ integrationId: input.integration.id, ...row, updatedAt: now }).onConflictDoUpdate({ target: [analyticsDailyMetrics.integrationId, analyticsDailyMetrics.metricDate], set: { ...row, updatedAt: now } });
    }
    for (const row of normalized.channels) {
      await input.db.insert(analyticsChannelMetrics).values({ integrationId: input.integration.id, ...row }).onConflictDoUpdate({ target: [analyticsChannelMetrics.integrationId, analyticsChannelMetrics.metricDate, analyticsChannelMetrics.channel, analyticsChannelMetrics.source, analyticsChannelMetrics.medium, analyticsChannelMetrics.campaign], set: row });
    }
    for (const row of normalized.pages) {
      await input.db.insert(analyticsPageMetrics).values({ integrationId: input.integration.id, ...row }).onConflictDoUpdate({ target: [analyticsPageMetrics.integrationId, analyticsPageMetrics.metricDate, analyticsPageMetrics.pagePath], set: row });
    }

    const rowsWritten = normalized.daily.length + normalized.channels.length + normalized.pages.length;
    await input.db.update(analyticsSyncRuns).set({ status: "succeeded", rowsWritten, completedAt: new Date() }).where(eq(analyticsSyncRuns.id, run.id));
    await input.db.update(analyticsIntegrations).set({ status: "connected", lastSyncAt: now, nextSyncAt: new Date(now.getTime() + 6 * 60 * 60 * 1000), lastSyncError: null, updatedAt: now }).where(eq(analyticsIntegrations.id, input.integration.id));
    return { runId: run.id, rowsWritten, range: input.range };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analytics synchronization failed.";
    await input.db.update(analyticsSyncRuns).set({ status: "failed", errorMessage: message.slice(0, 1000), completedAt: new Date() }).where(eq(analyticsSyncRuns.id, run.id));
    await input.db.update(analyticsIntegrations).set({ status: "error", lastSyncError: message.slice(0, 1000), updatedAt: new Date() }).where(eq(analyticsIntegrations.id, input.integration.id));
    throw error;
  }
}

export function getSyncBackfillRange(range: ReportingRange) {
  return getPreviousReportingRange(range);
}
