/** @vitest-environment jsdom */
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ConversionTracking } from "./ConversionTracking";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("ConversionTracking", () => {
  it("carries contact UTM metadata into protocol-link conversion events", () => {
    render(<ConversionTracking />);
    const anchor = document.createElement("a");
    anchor.href = "tel:__BUSINESS_PHONE_RAW__";
    anchor.dataset.trackingPlacement = "contact-call_us";
    anchor.dataset.utmSource = "website";
    anchor.dataset.utmMedium = "contact";
    anchor.dataset.utmCampaign = "contact_methods";
    anchor.dataset.utmContent = "call_us";
    anchor.addEventListener("click", event => event.preventDefault());
    document.body.append(anchor);

    let detail: unknown;
    const onConversion = (event: Event) => { detail = (event as CustomEvent).detail; };
    window.addEventListener("namm:conversion", onConversion, { once: true });
    fireEvent.click(anchor);
    window.removeEventListener("namm:conversion", onConversion);

    expect(detail).toEqual({
      event: "call_click",
      parameters: {
        placement: "contact-call_us",
        utm_source: "website",
        utm_medium: "contact",
        utm_campaign: "contact_methods",
        utm_content: "call_us",
      },
    });
  });
});
