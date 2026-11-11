import { describe, expect, it } from "vitest";
import { attributionFromSearchParams, buildGoogleAdsDataManagerCsv, hasGoogleAdsMatchKey, hasLeadAttributionSignal } from "./googleAdsAttribution";

describe("Google Ads attribution helpers", () => {
  it("captures Google click identifiers and campaign context from an incoming URL", () => {
    const attribution = attributionFromSearchParams(new URLSearchParams("gclid=test-click&gbraid=app-braid&utm_source=google&utm_campaign=__CITY_SLUG__-brakes&gad_campaignid=12345"));
    expect(attribution).toMatchObject({
      gclid: "test-click",
      gbraid: "app-braid",
      utmSource: "google",
      utmCampaign: "__CITY_SLUG__-brakes",
      gadCampaignId: "12345",
    });
    expect(hasGoogleAdsMatchKey(attribution)).toBe(true);
  });

  it("creates a Data Manager CSV with ISO conversion time, match keys, and consent-aware first-party fields", () => {
    const csv = buildGoogleAdsDataManagerCsv([{
      conversionName: "Qualified lead",
      conversionTime: new Date("2026-08-21T20:30:00.000Z"),
      conversionValue: "150.00",
      conversionCurrency: "USD",
      orderId: "NAM-ABC123-ga-test",
      includeUserData: true,
      gclid: "click-123",
      wbraid: "web-braid",
      email: " Customer@Example.com ",
      phone: "(407) 555-0100",
    }]);
    expect(csv).toContain('"Conversion action","GCLID","GBRAID","WBRAID"');
    expect(csv).toContain('"Qualified lead","click-123","","web-braid","customer@example.com","+14075550100","2026-08-21T20:30:00.000Z","150.00","USD","NAM-ABC123-ga-test"');
  });

  it("does not include email or phone fields when first-party measurement consent is unavailable", () => {
    const csv = buildGoogleAdsDataManagerCsv([{
      conversionName: "Converted lead",
      conversionTime: "2026-08-21T20:30:00.000Z",
      orderId: "NAM-ABC123-ga-no-consent",
      includeUserData: false,
      gclid: "click-456",
      email: "customer@example.com",
      phone: "4075550100",
    }]);
    expect(csv).toContain('"Converted lead","click-456","","","","","2026-08-21T20:30:00.000Z","","USD","NAM-ABC123-ga-no-consent"');
  });

  it("recognizes landing and referrer context without treating it as campaign context", () => {
    expect(hasLeadAttributionSignal({ landingUrl: "https://example.com/request-service" })).toBe(true);
    expect(hasLeadAttributionSignal({ referrer: "https://www.google.com/" })).toBe(true);
    expect(hasLeadAttributionSignal({})).toBe(false);
  });
});
