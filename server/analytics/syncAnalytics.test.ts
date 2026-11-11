import { describe, expect, it } from "vitest";
import { getReportingRange } from "../../shared/analytics";
import {
  buildGa4SyncRequests,
  normalizeGa4SyncReports,
  parseGa4Metric,
} from "./syncAnalytics";

describe("GA4 synchronization normalization", () => {
  it("builds compatible daily, channel, and page report requests", () => {
    const range = getReportingRange("last_7_days", new Date("2026-09-21T16:00:00.000Z"));
    const requests = buildGa4SyncRequests(range);

    expect(requests.daily.dateRanges[0]).toEqual({ startDate: "2026-09-15", endDate: "2026-09-21" });
    expect(requests.daily.dimensions).toEqual([{ name: "date" }]);
    expect(requests.channels.dimensions).toEqual([
      { name: "date" },
      { name: "sessionDefaultChannelGroup" },
      { name: "sessionSource" },
      { name: "sessionMedium" },
      { name: "sessionCampaignName" },
    ]);
    expect(requests.pages.dimensions).toEqual([{ name: "date" }, { name: "pagePath" }]);
  });

  it("maps report rows to stable aggregates and ignores malformed numbers", () => {
    const normalized = normalizeGa4SyncReports({
      summary: {
        dimensions: [],
        metrics: ["users", "sessions", "engagementRate"],
        rows: [{ dimensions: {}, metrics: { users: "12", sessions: "20", engagementRate: "0.45" } }],
      },
      daily: {
        dimensions: ["date"],
        metrics: ["users", "sessions", "engagementRate"],
        rows: [{ dimensions: { date: "20260921" }, metrics: { users: "12", sessions: "20", engagementRate: "0.45" } }],
      },
      channels: {
        dimensions: ["date", "sessionDefaultChannelGroup", "sessionSource", "sessionMedium", "sessionCampaignName"],
        
        metrics: ["users", "sessions", "engagedSessions"],
        rows: [{ dimensions: { date: "20260921", sessionDefaultChannelGroup: "Organic Search", sessionSource: "google", sessionMedium: "organic", sessionCampaignName: "(organic)" }, metrics: { users: "12", sessions: "20", engagedSessions: "9" } }],
      },
      pages: {
        dimensions: ["date", "pagePath"],
        metrics: ["users", "sessions", "engagedSessions", "screenPageViews"],
        rows: [{ dimensions: { date: "20260921", pagePath: "/blog" }, metrics: { users: "12", sessions: "20", engagedSessions: "9", screenPageViews: "32" } }],
      },
    });

    expect(normalized.summary).toMatchObject({ users: 12, sessions: 20, engagementRate: "0.4500" });
    expect(normalized.daily[0]).toMatchObject({ metricDate: "2026-09-21", users: 12, sessions: 20, engagementRate: "0.4500" });
    expect(normalized.channels[0]).toMatchObject({ channel: "Organic Search", source: "google", sessions: 20, engagedSessions: 9 });
    expect(normalized.pages[0]).toMatchObject({ pagePath: "/blog", pageViews: 32 });
    expect(parseGa4Metric("not-a-number")).toBe(0);
  });
});
