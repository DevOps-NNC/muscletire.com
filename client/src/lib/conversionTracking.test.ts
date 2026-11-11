/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { trackConversion } from "./conversionTracking";

describe("conversion tracking", () => {
  it("emits a data-layer event without customer information", () => {
    const dataLayer: unknown[] = [];
    window.dataLayer = dataLayer;
    window.gtag = vi.fn();
    trackConversion("request_submit", { preferred_contact: "text", requested_service: "diagnostics" });
    expect(window.gtag).toHaveBeenCalledWith("event", "request_submit", { preferred_contact: "text", requested_service: "diagnostics" });
    expect(dataLayer).toContainEqual({ event: "request_submit", preferred_contact: "text", requested_service: "diagnostics" });
  });

  it("queues a conversion event before a deferred marketing script defines gtag", () => {
    delete window.gtag;
    delete window.dataLayer;

    trackConversion("call_click", { source: "mobile_cta" });

    expect(window.dataLayer).toContainEqual({ event: "call_click", source: "mobile_cta" });
  });
});
