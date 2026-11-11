import { describe, expect, it } from "vitest";
import { canProcessLeads, canReadCrm, isAccountSetupEnabled, isOwnerEmail, isQuoteFeatureEnabled } from "./crmAccess";

describe("CRM access helpers", () => {
  it("defaults account setup to visible until explicitly disabled", () => {
    expect(isAccountSetupEnabled(undefined)).toBe(true);
    expect(isAccountSetupEnabled(null)).toBe(true);
    expect(isAccountSetupEnabled("disabled")).toBe(false);
  });

  it("defaults Quotes Beta to disabled until the owner explicitly enables it", () => {
    expect(isQuoteFeatureEnabled(undefined)).toBe(false);
    expect(isQuoteFeatureEnabled(null)).toBe(false);
    expect(isQuoteFeatureEnabled("disabled")).toBe(false);
    expect(isQuoteFeatureEnabled("enabled")).toBe(true);
  });

  it("compares owner emails case-insensitively and ignores surrounding whitespace", () => {
    expect(isOwnerEmail("Owner@Example.com ", " owner@example.com")).toBe(true);
    expect(isOwnerEmail("staff@example.com", "owner@example.com")).toBe(false);
  });

  it("allows viewers to read CRM lead data but not change it", () => {
    expect(canReadCrm("lead_viewer")).toBe(true);
    expect(canProcessLeads("lead_viewer")).toBe(false);
  });

  it("allows processors to manage leads without granting access to ordinary users", () => {
    expect(canReadCrm("lead_processor")).toBe(true);
    expect(canProcessLeads("lead_processor")).toBe(true);
    expect(canProcessLeads("user")).toBe(false);
  });
});
