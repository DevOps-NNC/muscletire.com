import { describe, expect, it } from "vitest";
import { CONTACT_LINK_UTM, contactLinkTracking } from "./contactTracking";

describe("contact link tracking", () => {
  it("keeps contact protocol links measurable without changing their valid hrefs", () => {
    expect(CONTACT_LINK_UTM).toEqual({ source: "website", medium: "contact", campaign: "contact_methods" });
    expect(contactLinkTracking("call_us")).toMatchObject({
      "data-tracking-placement": "contact-call_us",
      "data-utm-source": "website",
      "data-utm-medium": "contact",
      "data-utm-campaign": "contact_methods",
      "data-utm-content": "call_us",
    });
  });
});
