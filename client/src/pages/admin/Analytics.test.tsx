/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminAnalytics from "./Analytics";

const overview = vi.fn();
const connectionStatus = vi.fn();
const sync = vi.fn();

vi.mock("@/components/DashboardLayout", () => ({ DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    analytics: {
      overview: { useQuery: (...args: unknown[]) => overview(...args) },
      connectionStatus: { useQuery: (...args: unknown[]) => connectionStatus(...args) },
      sync: { useMutation: (...args: unknown[]) => sync(...args) },
    },
  },
}));

const emptyOverview = {
  range: { label: "2026-09-15 to 2026-09-21", startDate: "2026-09-15", endDate: "2026-09-22", timeZone: "America/New_York" },
  comparisonRange: { label: "2026-09-08 to 2026-09-14", startDate: "2026-09-08", endDate: "2026-09-15" },
  sourceStatus: { ga4: "not_connected", crm: "available" },
  ga4: { users: null, sessions: null, newUsers: null, activeUsers: null, engagedSessions: null, engagementRate: null, averageEngagementTime: null, pageViews: null, daily: [], channels: [], pages: [] },
  crm: { totalLeads: { value: 0, source: "crm", comparisonPercent: null }, attributedLeads: { value: 0, source: "attributed", comparisonPercent: null }, convertedLeads: { value: 0, source: "crm", comparisonPercent: null }, leadsByStatus: {}, services: [] },
  attribution: { totalLeads: 0, attributedLeads: 0, coveragePercent: null },
  channels: [],
  conversion: { rate: null, organicSessions: null, paidSessions: null },
  pages: [],
};

beforeEach(() => {
  (globalThis as typeof globalThis & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as typeof ResizeObserver;
  connectionStatus.mockReturnValue({ data: { status: "disconnected" } });
  sync.mockReturnValue({ mutate: vi.fn(), isPending: false });
  overview.mockReturnValue({ data: emptyOverview, isLoading: false, isError: false });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Admin analytics workspace", () => {
  it("shows setup guidance when GA4 is disconnected", () => {
    render(<AdminAnalytics />);

    expect(screen.getByRole("heading", { name: "Marketing analytics" })).toBeTruthy();
    expect(screen.getByText(/Connect Google Analytics to unlock website traffic reporting/)).toBeTruthy();
    expect((screen.getByRole("link", { name: "Connect Google Analytics" }) as HTMLAnchorElement).getAttribute("href")).toBe("/api/analytics/google/start");
  });

  it("shows a no-sync state instead of zero website traffic", () => {
    overview.mockReturnValue({ data: { ...emptyOverview, sourceStatus: { ga4: "no_data", crm: "available" } }, isLoading: false, isError: false });
    connectionStatus.mockReturnValue({ data: { status: "connected", propertySelected: true } });

    render(<AdminAnalytics />);

    expect(screen.getByText("Google Analytics is connected, but no report has been synchronized for this period.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sync analytics" })).toBeTruthy();
  });

  it("explains when analytics storage needs a migration", () => {
    overview.mockReturnValue({ data: { ...emptyOverview, sourceStatus: { ga4: "unavailable", crm: "available" } }, isLoading: false, isError: false });
    connectionStatus.mockReturnValue({ data: { status: "unavailable" } });

    render(<AdminAnalytics />);

    expect(screen.getByText("Analytics storage needs setup")).toBeTruthy();
    expect(screen.getByText(/Apply the pending analytics database migration/)).toBeTruthy();
  });

  it("renders source-labeled populated traffic and lead metrics", () => {
    overview.mockReturnValue({
      data: {
        ...emptyOverview,
        sourceStatus: { ga4: "connected", crm: "available" },
        ga4: { ...emptyOverview.ga4, users: { value: 1250, source: "ga4", comparisonPercent: 12.5 }, sessions: { value: 1800, source: "ga4", comparisonPercent: 4 }, daily: [], channels: [], pages: [] },
        crm: { ...emptyOverview.crm, totalLeads: { value: 42, source: "crm", comparisonPercent: 20 }, services: [{ service: "Brake Service", leads: 18 }] },
        channels: [{ channel: "organic_search", sessions: 600, leads: 16, attributedLeads: 16, conversionRate: 2.67 }],
      },
      isLoading: false,
      isError: false,
    });
    connectionStatus.mockReturnValue({ data: { status: "connected", propertySelected: true } });

    render(<AdminAnalytics />);

    expect(screen.getByText("1,250")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText("Organic Search")).toBeTruthy();
    expect(screen.getByText("Brake Service")).toBeTruthy();
  });
});
