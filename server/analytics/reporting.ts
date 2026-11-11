import type {
  AnalyticsSummaryMetric,
  LeadChannel,
  MarketingReportSnapshot,
  ReportingRange,
} from "../../shared/analytics.js";

export type ReportBuilderInput = {
  range: ReportingRange;
  comparisonRange: ReportingRange;
  sourceStatus: MarketingReportSnapshot["sourceStatus"];
  ga4: {
    users: AnalyticsSummaryMetric;
    sessions: AnalyticsSummaryMetric;
    newUsers: AnalyticsSummaryMetric;
    activeUsers: AnalyticsSummaryMetric;
    engagedSessions: AnalyticsSummaryMetric;
    engagementRate: AnalyticsSummaryMetric;
    averageEngagementTime: AnalyticsSummaryMetric;
    pageViews: AnalyticsSummaryMetric;
    daily: MarketingReportSnapshot["daily"];
  };
  crm: {
    totalLeads: AnalyticsSummaryMetric;
    attributedLeads: AnalyticsSummaryMetric;
    convertedLeads: AnalyticsSummaryMetric;
    services: MarketingReportSnapshot["services"];
  };
  conversion: { rate: number | null; organicSessions: number | null; paidSessions: number | null };
  channels: MarketingReportSnapshot["channels"];
  pages: MarketingReportSnapshot["pages"];
  attribution: MarketingReportSnapshot["attribution"];
};

function rangePart(range: ReportingRange) {
  return { startDate: range.startDate, endDate: range.endDate, label: range.label, timeZone: range.timeZone };
}

function comparisonPart(range: ReportingRange) {
  return { startDate: range.startDate, endDate: range.endDate, label: range.label };
}

function displayPercent(value: number) {
  return (value > 0 ? "+" : "") + value + "%";
}

export function buildMarketingReportSnapshot(input: ReportBuilderInput, generatedAt = new Date()): MarketingReportSnapshot {
  const recommendations: string[] = [];
  if (input.sourceStatus.ga4 === "not_connected") recommendations.push("Connect GA4 before interpreting website traffic performance.");
  if (input.sourceStatus.ga4 === "unavailable") recommendations.push("GA4 storage is unavailable in this environment. Apply the analytics database migration before interpreting website traffic performance.");
  if (input.sourceStatus.ga4 === "no_data") recommendations.push("Synchronize GA4 data before interpreting website traffic performance.");
  if (input.ga4.sessions.comparisonPercent !== null && input.ga4.sessions.comparisonPercent !== undefined) recommendations.push("Sessions changed by " + displayPercent(input.ga4.sessions.comparisonPercent) + " compared with the previous period.");
  if (input.attribution.coveragePercent === null) recommendations.push("Attribution coverage is unavailable for this period; channel lead performance should be treated as incomplete.");
  else if (input.attribution.coveragePercent < 100) recommendations.push("Attribution coverage is " + input.attribution.coveragePercent + "%; interpret channel conversion rates with that coverage in mind.");
  if (input.crm.totalLeads.value === 0) recommendations.push("No CRM leads were recorded during this reporting period.");
  const topService = input.crm.services.slice().sort((a, b) => b.leads - a.leads)[0];
  if (topService) recommendations.push(topService.service + " generated the most CRM requests with " + topService.leads + " leads.");

  const organicChannel = input.channels.find(row => row.channel === "organic_search");
  const paidChannel = input.channels.find(row => row.channel === "paid_search");
  const metric = (value: number | null, source: AnalyticsSummaryMetric["source"]): AnalyticsSummaryMetric => ({ value, source, comparisonPercent: null });

  return {
    version: 1,
    generatedAt: generatedAt.toISOString(),
    range: rangePart(input.range),
    comparisonRange: comparisonPart(input.comparisonRange),
    sourceStatus: input.sourceStatus,
    summary: {
      users: input.ga4.users,
      sessions: input.ga4.sessions,
      totalLeads: input.crm.totalLeads,
      attributedLeads: input.crm.attributedLeads,
      leadConversionRate: metric(input.conversion.rate, "combined"),
      organicSearchTraffic: metric(input.conversion.organicSessions, "ga4"),
      organicSearchLeads: metric(organicChannel?.leads ?? 0, "attributed"),
      paidCampaignLeads: metric(paidChannel?.leads ?? 0, "attributed"),
      convertedLeads: input.crm.convertedLeads,
    },
    daily: input.ga4.daily,
    channels: input.channels,
    pages: input.pages,
    services: input.crm.services,
    attribution: input.attribution,
    recommendations,
  };
}

function escapeCsv(value: unknown) {
  return '"' + String(value === null || value === undefined ? "" : value).replace(/"/g, '""') + '"';
}

function metricRow(name: string, value: number | null, source: string, comparisonPercent: number | null) {
  return ["Summary", name, value === null ? "Not available" : value, source, comparisonPercent === null ? "" : displayPercent(comparisonPercent)];
}

export function buildMarketingReportCsv(snapshot: MarketingReportSnapshot) {
  const rows: Array<Array<string | number>> = [
    metricRow("Website visitors", snapshot.summary.users.value, snapshot.summary.users.source, snapshot.summary.users.comparisonPercent),
    metricRow("Sessions", snapshot.summary.sessions.value, snapshot.summary.sessions.source, snapshot.summary.sessions.comparisonPercent),
    metricRow("Total leads", snapshot.summary.totalLeads.value, snapshot.summary.totalLeads.source, snapshot.summary.totalLeads.comparisonPercent),
    metricRow("Attributed leads", snapshot.summary.attributedLeads.value, snapshot.summary.attributedLeads.source, snapshot.summary.attributedLeads.comparisonPercent),
    metricRow("Website lead conversion rate", snapshot.summary.leadConversionRate.value, snapshot.summary.leadConversionRate.source, snapshot.summary.leadConversionRate.comparisonPercent),
    ...snapshot.channels.map(channel => ["Channel", channel.channel, channel.leads, "CRM/GA4", channel.conversionRate === null ? "" : channel.conversionRate + "%"]),
    ...snapshot.pages.map(page => ["Landing page", page.path, page.leads, "CRM/GA4", page.conversionRate === null ? "" : page.conversionRate + "%"]),
    ...snapshot.services.map(service => ["Service demand", service.service, service.leads, "CRM", ""]),
  ];
  return ["Section,Metric,Value,Source,Comparison", ...rows.map(row => row.map(escapeCsv).join(","))].join("\r\n");
}

export function reportChannelLabel(channel: LeadChannel) {
  return channel.replace(/_/g, " ").replace(/\b\w/g, character => character.toUpperCase());
}
