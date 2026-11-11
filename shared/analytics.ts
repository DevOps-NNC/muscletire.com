import type { GoogleAdsAttributionInput } from "./googleAdsAttribution";

export const REPORTING_TIME_ZONE = "America/New_York";

export const reportingPeriods = [
  "today",
  "yesterday",
  "last_7_days",
  "last_28_days",
  "last_30_days",
  "this_month",
  "previous_month",
  "last_90_days",
  "year_to_date",
  "last_12_months",
  "custom",
] as const;

export type ReportingPeriod = (typeof reportingPeriods)[number];
export type DateOnlyRange = { startDate: string; endDate: string };

export type ReportingRange = {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  label: string;
  timeZone: string;
  isComplete: boolean;
};

export type LeadChannel = "organic_search" | "paid_search" | "organic_social" | "paid_social" | "email" | "referral" | "direct" | "other";
export type AnalyticsSource = "ga4" | "crm" | "attributed" | "combined";
export type AnalyticsSummaryMetric = { value: number | null; source: AnalyticsSource; comparisonPercent: number | null };

export type MarketingReportSnapshot = {
  version: 1;
  generatedAt: string;
  range: Pick<ReportingRange, "startDate" | "endDate" | "label" | "timeZone">;
  comparisonRange: Pick<ReportingRange, "startDate" | "endDate" | "label">;
  sourceStatus: { ga4: "connected" | "not_connected" | "no_data" | "partial" | "unavailable"; crm: "available" };
  summary: {
    users: AnalyticsSummaryMetric;
    sessions: AnalyticsSummaryMetric;
    totalLeads: AnalyticsSummaryMetric;
    attributedLeads: AnalyticsSummaryMetric;
    leadConversionRate: AnalyticsSummaryMetric;
    organicSearchTraffic: AnalyticsSummaryMetric;
    organicSearchLeads: AnalyticsSummaryMetric;
    paidCampaignLeads: AnalyticsSummaryMetric;
    convertedLeads: AnalyticsSummaryMetric;
  };
  daily: Array<{ date: string; users: number | null; sessions: number | null; leads: number; attributedLeads: number }>;
  channels: Array<{ channel: LeadChannel; sessions: number | null; leads: number; attributedLeads: number; conversionRate: number | null }>;
  pages: Array<{ path: string; sessions: number | null; users: number | null; leads: number; conversionRate: number | null }>;
  services: Array<{ service: string; leads: number }>;
  attribution: { totalLeads: number; attributedLeads: number; coveragePercent: number | null };
  recommendations: string[];
};

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second) };
}

function getDateOnly(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return [parts.year.toString().padStart(4, "0"), parts.month.toString().padStart(2, "0"), parts.day.toString().padStart(2, "0")].join("-");
}

function shiftDateOnly(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function differenceInCalendarDays(startDate: string, endDate: string) {
  const start = new Date(startDate + "T00:00:00Z").getTime();
  const end = new Date(endDate + "T00:00:00Z").getTime();
  return Math.round((end - start) / 86_400_000);
}

function startOfNextMonth(dateOnly: string) {
  const [year, month] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}

function startOfMonth(dateOnly: string) {
  return dateOnly.slice(0, 7) + "-01";
}

function localBoundaryToUtc(dateOnly: string, timeZone: string) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day);
  const zoned = getZonedParts(new Date(utcGuess), timeZone);
  const zonedAsUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
  const offsetMinutes = Math.round((zonedAsUtc - utcGuess) / 60_000);
  return new Date(utcGuess - offsetMinutes * 60_000);
}

function resolveDateOnlyRange(period: ReportingPeriod, now: Date, customRange?: DateOnlyRange, timeZone = REPORTING_TIME_ZONE): DateOnlyRange {
  const today = getDateOnly(now, timeZone);
  if (period === "custom") {
    if (!customRange?.startDate || !customRange.endDate || customRange.startDate > customRange.endDate) throw new Error("A valid custom reporting range is required.");
    return { startDate: customRange.startDate, endDate: shiftDateOnly(customRange.endDate, 1) };
  }
  if (period === "today") return { startDate: today, endDate: shiftDateOnly(today, 1) };
  if (period === "yesterday") return { startDate: shiftDateOnly(today, -1), endDate: today };
  if (period === "last_7_days") return { startDate: shiftDateOnly(today, -6), endDate: shiftDateOnly(today, 1) };
  if (period === "last_28_days") return { startDate: shiftDateOnly(today, -27), endDate: shiftDateOnly(today, 1) };
  if (period === "last_30_days") return { startDate: shiftDateOnly(today, -29), endDate: shiftDateOnly(today, 1) };
  if (period === "last_90_days") return { startDate: shiftDateOnly(today, -89), endDate: shiftDateOnly(today, 1) };
  if (period === "this_month") return { startDate: startOfMonth(today), endDate: startOfNextMonth(today) };
  if (period === "previous_month") {
    const currentMonthStart = startOfMonth(today);
    const previousMonthStart = shiftDateOnly(currentMonthStart, -1);
    return { startDate: startOfMonth(previousMonthStart), endDate: currentMonthStart };
  }
  if (period === "year_to_date") return { startDate: today.slice(0, 4) + "-01-01", endDate: shiftDateOnly(today, 1) };
  const currentMonthStart = startOfMonth(today);
  return { startDate: shiftDateOnly(currentMonthStart, -334), endDate: startOfNextMonth(today) };
}

export function getReportingRange(period: ReportingPeriod, now = new Date(), timeZone = REPORTING_TIME_ZONE, customRange?: DateOnlyRange): ReportingRange {
  const dateRange = resolveDateOnlyRange(period, now, customRange, timeZone);
  const start = localBoundaryToUtc(dateRange.startDate, timeZone);
  const end = localBoundaryToUtc(dateRange.endDate, timeZone);
  const todayStart = localBoundaryToUtc(getDateOnly(now, timeZone), timeZone);
  return { start, end, startDate: dateRange.startDate, endDate: dateRange.endDate, label: dateRange.startDate + " to " + shiftDateOnly(dateRange.endDate, -1), timeZone, isComplete: end <= todayStart };
}

export function getPreviousReportingRange(range: ReportingRange, timeZone = range.timeZone): ReportingRange {
  const isCalendarMonth = range.startDate.endsWith("-01") && range.endDate.endsWith("-01");
  const days = differenceInCalendarDays(range.startDate, range.endDate);
  const startDate = isCalendarMonth
    ? startOfMonth(shiftDateOnly(range.startDate, -1))
    : shiftDateOnly(range.startDate, -days);
  const endDate = isCalendarMonth ? range.startDate : shiftDateOnly(range.endDate, -days);
  return { start: localBoundaryToUtc(startDate, timeZone), end: localBoundaryToUtc(endDate, timeZone), startDate, endDate, label: startDate + " to " + shiftDateOnly(endDate, -1), timeZone, isComplete: true };
}

export function calculatePercentChange(current: number | null | undefined, previous: number | null | undefined) {
  if (current === null || current === undefined || previous === null || previous === undefined) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(2));
}

export function calculateLeadConversionRate(leads: number | null | undefined, sessions: number | null | undefined) {
  if (leads === null || leads === undefined || sessions === null || sessions === undefined || sessions <= 0) return null;
  return Number(((leads / sessions) * 100).toFixed(2));
}

const searchHosts = ["google.", "bing.com", "search.yahoo.", "duckduckgo.com", "search.brave.com"];
const socialHosts = ["facebook.com", "instagram.com", "tiktok.com", "linkedin.com", "youtube.com", "twitter.com", "x.com"];

function hostnameMatches(hostname: string, candidates: string[]) {
  return candidates.some(candidate => hostname === candidate || hostname.endsWith("." + candidate) || hostname.includes(candidate));
}

function getHostname(value: string | undefined) {
  if (!value) return "";
  try { return new URL(value).hostname.toLowerCase(); } catch { return ""; }
}

export function classifyLeadChannel(attribution: GoogleAdsAttributionInput | null | undefined): LeadChannel {
  if (!attribution) return "direct";
  const source = attribution.utmSource?.trim().toLowerCase() ?? "";
  const medium = attribution.utmMedium?.trim().toLowerCase().replace(/[-\s]/g, "_") ?? "";
  const referrerHost = getHostname(attribution.referrer);
  if (attribution.gclid || attribution.gbraid || attribution.wbraid || ["cpc", "ppc", "paidsearch", "paid_search", "sem"].includes(medium)) return "paid_search";
  if (medium === "email" || source === "newsletter") return "email";
  if (["paidsocial", "paid_social", "social_paid"].includes(medium)) return "paid_social";
  if (["social", "organic_social", "social_network", "social_media"].includes(medium) || hostnameMatches(source, socialHosts)) return "organic_social";
  if (medium === "organic" || medium === "seo" || hostnameMatches(source, searchHosts) || hostnameMatches(referrerHost, searchHosts)) return "organic_search";
  if (medium === "referral" || referrerHost) return referrerHost ? "referral" : "other";
  if (source || medium) return "other";
  return "direct";
}
