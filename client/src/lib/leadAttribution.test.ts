/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import {
  captureLeadAttributionFromCurrentPage,
  getLeadAttributionForSubmission,
  getStoredLeadAttribution,
} from "./leadAttribution";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/request-service");
  Object.defineProperty(document, "referrer", { configurable: true, value: "" });
  document.cookie = "_gcl_aw=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
});

describe("first-party lead attribution capture", () => {
  it("keeps a direct visit landing URL even without campaign metadata", () => {
    const attribution = captureLeadAttributionFromCurrentPage();

    expect(attribution).toMatchObject({
      landingUrl: "http://localhost:3000/request-service",
      referrer: undefined,
    });
    expect(getStoredLeadAttribution()).toMatchObject({
      landingUrl: "http://localhost:3000/request-service",
    });
  });

  it("preserves search and referral referrers without labeling them as campaigns", () => {
    window.history.replaceState({}, "", "/request-service?utm_source=google&utm_medium=organic");
    Object.defineProperty(document, "referrer", { configurable: true, value: "https://www.google.com/search?q=mobile+mechanic" });

    const attribution = captureLeadAttributionFromCurrentPage();

    expect(attribution).toMatchObject({
      utmSource: "google",
      utmMedium: "organic",
      referrer: "https://www.google.com/search?q=mobile+mechanic",
    });
  });

  it("captures a consented Google click identifier from the browser cookie", () => {
    document.cookie = "_gcl_aw=GCL.123.consent-click; path=/";

    const attribution = getLeadAttributionForSubmission(true);

    expect(attribution).toMatchObject({
      gclid: "consent-click",
      landingUrl: "http://localhost:3000/request-service",
    });
  });
});
