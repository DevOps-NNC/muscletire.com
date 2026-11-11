import { describe, expect, it } from "vitest";
import { parseManualAddress } from "./addressLocation";

describe("manual service-address fallback", () => {
  it("extracts street, city, and ZIP details from a complete US address", () => {
    expect(parseManualAddress("4301 Urbana Drive, __CITY__, FL 32837")).toEqual({ streetAddress: "4301 Urbana Drive", city: "__CITY__", zipCode: "32837" });
  });

  it("does not invent address components when an incomplete manual entry is supplied", () => {
    expect(parseManualAddress("4301 Urbana Drive")).toBeNull();
  });
});
