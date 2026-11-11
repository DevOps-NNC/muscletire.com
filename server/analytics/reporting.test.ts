import { describe, expect, it } from "vitest";
import { getReportingRange } from "../../shared/analytics";
import { buildMarketingReportCsv, buildMarketingReportSnapshot } from "./reporting";

const range = getReportingRange("last_7_days", new Date("2026-09-21T16:00:00.000Z"));
const comparisonRange = getReportingRange("last_7_days", new Date("2026-09-14T16:00:00.000Z"));

function input(overrides: Record<string, unknown> = {}) {
  return {
    range,
    comparisonRange,
    sourceStatus: { ga4: "connected" as const, crm: "available" as const },
    ga4: {
      users: { value: 100, source: "ga4" as const, comparisonPercent: 10 },
      sessions: { value: 200, source: "ga4" as const, comparisonPercent: 5 },
      newUsers: { value: 80, source: "ga4" as const, comparisonPercent: null },
      activeUsers: { value: 100, source: "ga4" as const, comparisonPercent: null },
      engagedSessions: { value: 120, source: "ga4" as const, comparisonPercent: null },
      engagementRate: { value: 0.6, source: "ga4" as const, comparisonPercent: null },
      averageEngagementTime: { value: 32, source: "ga4" as const, comparisonPercent: null },
      pageViews: { value: 400, source: "ga4" as const, comparisonPercent: null },
      daily: [{ date: "2026-09-21", users: 100, sessions: 200, leads: 4, attributedLeads: 3 }],
    },
    crm: {
      totalLeads: { value: 4, source: "crm" as const, comparisonPercent: 25 },
      attributedLeads: { value: 3, source: "attributed" as const, comparisonPercent: null },
      convertedLeads: { value: 1, source: "crm" as const, comparisonPercent: null },
      services: [{ service: "Brake Service", leads: 4 }],
    },
    conversion: { rate: 1.5, organicSessions: 100, paidSessions: 50 },
    channels: [{ channel: "organic_search" as const, sessions: 100, leads: 2, attributedLeads: 2, conversionRate: 2 }],
    pages: [{ path: "/blog", sessions: 80, users: 60, leads: 2, conversionRate: 2.5 }],
    attribution: { totalLeads: 4, attributedLeads: 3, coveragePercent: 75 },
    ...overrides,
  };
}

describe("marketing report snapshots", () => {
  it("builds deterministic source-labeled snapshots with neutral recommendations", () => {
    const first = buildMarketingReportSnapshot(input(), new Date("2026-09-21T20:00:00.000Z"));
    const second = buildMarketingReportSnapshot(input(), new Date("2026-09-21T20:00:00.000Z"));

    expect(first).toEqual(second);
    expect(first.summary.leadConversionRate).toMatchObject({ value: 1.5, source: "combined" });
    expect(first.recommendations).toContain("Attribution coverage is 75%; interpret channel conversion rates with that coverage in mind.");
    expect(first.recommendations.join(" ")).not.toContain("because");
  });

  it("does not invent traffic findings when GA4 is unavailable", () => {
    const snapshot = buildMarketingReportSnapshot(input({ sourceStatus: { ga4: "not_connected", crm: "available" }, ga4: { ...input().ga4, users: { value: null, source: "ga4", comparisonPercent: null }, sessions: { value: null, source: "ga4", comparisonPercent: null } } }), new Date("2026-09-21T20:00:00.000Z"));

    expect(snapshot.summary.sessions.value).toBeNull();
    expect(snapshot.recommendations).toContain("Connect GA4 before interpreting website traffic performance.");
  });

  it("exports stable CSV with escaped labels and values", () => {
    const csv = buildMarketingReportCsv(buildMarketingReportSnapshot(input({ crm: { ...input().crm, services: [{ service: 'Brakes, "front"', leads: 1 }] } }), new Date("2026-09-21T20:00:00.000Z")));

    expect(csv.split("\n")[0].replace("\r", "")).toBe("Section,Metric,Value,Source,Comparison");
    expect(csv).toContain('"Service demand","Brakes, ""front""","1","CRM",""');
  });
});
