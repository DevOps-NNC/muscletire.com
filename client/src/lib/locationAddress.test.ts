import { describe, expect, it } from "vitest";
import { getCurrentLocationErrorMessage, getRequestAddressFields } from "./locationAddress";

describe("getRequestAddressFields", () => {
  it("maps a Google address result into the request-form fields", () => {
    const address = getRequestAddressFields({
      formatted_address: "4301 Urbana Drive, __CITY__, FL 32837, USA",
      address_components: [
        { long_name: "4301", short_name: "4301", types: ["street_number"] },
        { long_name: "Urbana Drive", short_name: "Urbana Dr", types: ["route"] },
        { long_name: "__CITY__", short_name: "__CITY__", types: ["locality", "political"] },
        { long_name: "32837", short_name: "32837", types: ["postal_code"] },
      ],
    });

    expect(address).toEqual({ streetAddress: "4301 Urbana Drive", city: "__CITY__", zipCode: "32837" });
  });

  it("retains a formatted address when route components are unavailable", () => {
    const address = getRequestAddressFields({ formatted_address: "__CITY__, FL, USA" });

    expect(address).toEqual({ streetAddress: "__CITY__", city: "", zipCode: "" });
  });

  it("gives a clear manual-entry fallback when location permission is declined or unavailable", () => {
    expect(getCurrentLocationErrorMessage(1)).toBe("Location permission was not granted. Please enter your address manually.");
    expect(getCurrentLocationErrorMessage(2)).toBe("We could not get your location. Please enter your address manually.");
  });
});
