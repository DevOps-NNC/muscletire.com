import { timingSafeEqual } from "node:crypto";
import type { Express, Request as ExpressRequest, Response as ExpressResponse } from "express";
import { and, eq } from "drizzle-orm";
import { analyticsIntegrations, generatedMarketingReports, marketingReportConfigs } from "../../drizzle/schema.js";
import { getReportingRange, REPORTING_TIME_ZONE } from "../../shared/analytics.js";
import { getDb } from "../db.js";
import { buildAnalyticsOverview, buildAnalyticsReportSnapshot } from "../routers/analytics.js";
import { syncAnalyticsIntegration } from "./syncAnalytics.js";

function secretsMatch(expected: string, supplied: string) {
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : request.headers.get("x-cron-secret") ?? "";
  return Boolean(expected && supplied && secretsMatch(expected, supplied));
}

function localDateOnly(date: Date, timeZone: string) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDateOnly(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function previousCompletedWeek(now: Date, timeZone: string) {
  const today = localDateOnly(now, timeZone);
  const day = new Date(today + "T12:00:00Z").getUTCDay();
  const currentMonday = shiftDateOnly(today, -(day === 0 ? 6 : day - 1));
  const startDate = shiftDateOnly(currentMonday, -7);
  const endDate = shiftDateOnly(currentMonday, -1);
  return getReportingRange("custom", now, timeZone, { startDate, endDate });
}

async function generateScheduledReport(db: any, reportType: "weekly" | "monthly", range: ReturnType<typeof getReportingRange>, now: Date) {
  const [existing] = await db.select({ id: generatedMarketingReports.id }).from(generatedMarketingReports).where(and(eq(generatedMarketingReports.reportType, reportType), eq(generatedMarketingReports.periodStart, range.start), eq(generatedMarketingReports.periodEnd, range.end))).limit(1);
  if (existing) return { reportType, status: "already_exists", id: existing.id };
  const overview = await buildAnalyticsOverview({ period: "custom", startDate: range.startDate, endDate: shiftDateOnly(range.endDate, -1) });
  const snapshot = buildAnalyticsReportSnapshot(overview, now);
  const [report] = await db.insert(generatedMarketingReports).values({ reportType, periodStart: range.start, periodEnd: range.end, comparisonStart: overview.comparisonRange.start, comparisonEnd: overview.comparisonRange.end, snapshot: snapshot as unknown as Record<string, unknown>, generatedByUserId: null, createdAt: now }).returning({ id: generatedMarketingReports.id });
  return { reportType, status: "generated", id: report.id };
}

export async function handleAnalyticsCronRequest(request: Request): Promise<Response> {
  if (!authorized(request)) return new Response(JSON.stringify({ error: "Unauthorized cron request." }), { status: 401, headers: { "content-type": "application/json" } });
  const db = await getDb();
  if (!db) return new Response(JSON.stringify({ status: "unavailable" }), { status: 503, headers: { "content-type": "application/json" } });
  const [integration] = await db.select().from(analyticsIntegrations).where(eq(analyticsIntegrations.provider, "ga4")).limit(1);
  if (!integration || integration.status !== "connected" || !integration.propertyId) {
    return new Response(JSON.stringify({ status: "skipped", reason: "Google Analytics is not connected to a property." }), { status: 200, headers: { "content-type": "application/json" } });
  }
  const now = new Date();
  const range = getReportingRange("last_30_days", now);
  try {
    const result = await syncAnalyticsIntegration({ db, integration, range });
    const [config] = await db.select().from(marketingReportConfigs).limit(1);
    const timeZone = config?.timeZone || REPORTING_TIME_ZONE;
    const localToday = localDateOnly(now, timeZone);
    const localDay = new Date(localToday + "T12:00:00Z").getUTCDay();
    const scheduledReports = [];
    if (config?.weeklyEnabled && localDay === 1) scheduledReports.push(await generateScheduledReport(db, "weekly", previousCompletedWeek(now, timeZone), now));
    if (config?.monthlyEnabled && localToday.endsWith("-01")) scheduledReports.push(await generateScheduledReport(db, "monthly", getReportingRange("previous_month", now, timeZone), now));
    return new Response(JSON.stringify({ status: "succeeded", ...result, scheduledReports }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ status: "failed", error: error instanceof Error ? error.message : "Analytics synchronization failed." }), { status: 502, headers: { "content-type": "application/json" } });
  }
}

function expressRequestToFetchRequest(request: ExpressRequest) {
  const protocol = request.headers["x-forwarded-proto"]?.toString().split(",")[0] || request.protocol;
  const host = request.headers["x-forwarded-host"]?.toString() || request.get("host");
  const headers = new Headers();
  Object.entries(request.headers).forEach(([name, value]) => {
    if (typeof value === "string") headers.set(name, value);
    else if (Array.isArray(value)) headers.set(name, value.join(", "));
  });
  return new Request(protocol + "://" + host + request.originalUrl, { method: request.method, headers });
}

export function registerAnalyticsCronRoute(app: Express) {
  app.post("/api/analytics/cron", async (req, res) => {
    const response = await handleAnalyticsCronRequest(expressRequestToFetchRequest(req));
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(await response.text());
  });
}
