import { describe, expect, it } from "vitest";
import { canAdvanceRequestStep, getServiceLocationGuidance, hasUsableServiceLocation } from "./serviceRequestValidation";

describe("service request location validation", () => {
  it("allows a request to continue when the customer provides a street address", () => {
    const location = { streetAddress: "4301 Urbana Drive", city: "", zipCode: "" };

    expect(hasUsableServiceLocation(location)).toBe(true);
    expect(getServiceLocationGuidance(location)).toBeNull();
  });

  it("allows a city or ZIP code when a full street address is not yet available", () => {
    expect(hasUsableServiceLocation({ streetAddress: "", city: "__CITY__", zipCode: "" })).toBe(true);
    expect(hasUsableServiceLocation({ streetAddress: "", city: "", zipCode: "32837" })).toBe(true);
  });

  it("blocks progression and provides clear guidance when no location detail is entered", () => {
    const location = { streetAddress: "  ", city: "", zipCode: "  " };

    expect(hasUsableServiceLocation(location)).toBe(false);
    expect(getServiceLocationGuidance(location)).toBe("Enter a street address, city, or ZIP code to continue.");
  });

  it("enables the rendered form's Location-step navigation after a usable location is entered", () => {
    expect(canAdvanceRequestStep(1, { streetAddress: "", city: "", zipCode: "" })).toBe(false);
    expect(canAdvanceRequestStep(1, { streetAddress: "4301 Urbana Drive", city: "", zipCode: "" })).toBe(true);
  });
});
