import { describe, expect, it } from "vitest";
import { extractVinVehicle, normalizeVehicleOptions } from "./vehicles";

describe("NHTSA vehicle option normalization", () => {
  it("removes duplicates, blank values, and sorts the returned vehicle choices", () => {
    expect(normalizeVehicleOptions([{ Make_Name: "Toyota" }, { Make_Name: "" }, { Make_Name: "Honda" }, { Make_Name: "Toyota" }], "Make_Name")).toEqual(["Honda", "Toyota"]);
  });

  it("returns only usable VIN details when the catalog identifies the vehicle", () => {
    expect(extractVinVehicle({ ModelYear: "2020", Make: "Toyota", Model: "Camry", Trim: "SE" })).toEqual({ year: "2020", make: "Toyota", model: "Camry", trim: "SE", decoded: true });
    expect(extractVinVehicle({ Make: "Toyota" }).decoded).toBe(false);
  });
});
