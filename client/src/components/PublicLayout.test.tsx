/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicLayout from "./PublicLayout";

vi.mock("wouter", () => ({ useLocation: () => ["/"] as const }));
vi.mock("./SiteHeader", () => ({ default: () => <header data-testid="site-header" /> }));
vi.mock("./SiteFooter", () => ({ default: () => <footer data-testid="site-footer" /> }));
vi.mock("./MobileCTA", () => ({ default: () => <div data-testid="mobile-cta" /> }));
vi.mock("./BlogEngagementSection", () => ({
  default: () => null,
  shouldShowGlobalBlogEngagement: () => false,
}));
vi.mock("./GoogleReviewsStrip", () => ({ GoogleReviewsStrip: () => null }));
vi.mock("./JsonLd", () => ({ WebSiteJsonLd: () => null }));
vi.mock("./ConversionTracking", () => ({ ConversionTracking: () => null }));
vi.mock("./SalesTacticsCta", () => ({ default: () => null }));
vi.mock("@/lib/leadAttribution", () => ({ captureLeadAttributionFromCurrentPage: vi.fn() }));

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PublicLayout", () => {
  it("returns to the top when client-side navigation changes the public route", () => {
    render(<PublicLayout><p>Public content</p></PublicLayout>);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
  });

  it("marks the customer-facing shell without changing its content boundaries", () => {
    render(<PublicLayout><p>Public content</p></PublicLayout>);

    expect(screen.getByTestId("site-header")).toBeTruthy();
    expect(screen.getByText("Public content").closest("main")?.className).toContain("public-site__main");
    expect(screen.getByTestId("site-footer").parentElement?.className).toContain("public-site");
  });
});
