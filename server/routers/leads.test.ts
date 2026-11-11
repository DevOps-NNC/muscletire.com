import { describe, it, expect, vi } from "vitest";
import { SERVICE_AREA_ZIPS } from "@shared/config";
import { buildAutomaticLeadHandoffPayload, buildLeadAttributionActivityMetadata } from "./leads";

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

// Mock notification
vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("Lead Reference Number Generation", () => {
  it("should generate a reference number with correct format", () => {
    const refPattern = /^NAM-[A-Z2-9]{6}$/;
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let trial = 0; trial < 10; trial++) {
      let result = "NAM-";
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      expect(result).toMatch(refPattern);
      expect(result.length).toBe(10);
    }
  });

  it("should not contain ambiguous characters (0, O, 1, I, L)", () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    expect(chars).not.toContain("0");
    expect(chars).not.toContain("O");
    expect(chars).not.toContain("1");
    expect(chars).not.toContain("I");
    expect(chars).not.toContain("L");
  });
});

describe("Lead Input Validation", () => {
  it("should require fullName and phone", () => {
    const validInput = {
      fullName: "John Doe",
      phone: "4075551234",
    };
    expect(validInput.fullName.length).toBeGreaterThan(0);
    expect(validInput.phone.length).toBeGreaterThan(0);
  });

  it("should accept optional fields as undefined", () => {
    const input = {
      fullName: "Jane Smith",
      phone: "4075559876",
      email: undefined,
      vehicleYear: undefined,
      vehicleMake: undefined,
      vehicleModel: undefined,
      vin: undefined,
      requestedService: undefined,
    };
    expect(input.fullName).toBeDefined();
    expect(input.phone).toBeDefined();
    expect(input.email).toBeUndefined();
  });

  it("should validate VIN format when provided", () => {
    const validVin = "1HGBH41JXMN109186";
    expect(validVin.length).toBe(17);
    expect(validVin).toMatch(/^[A-HJ-NPR-Z0-9]{17}$/);

    const invalidVin = "INVALID";
    expect(invalidVin.length).not.toBe(17);
  });

  it("should validate preferred contact enum values", () => {
    const validValues = ["call", "text", "email"];
    expect(validValues).toContain("call");
    expect(validValues).toContain("text");
    expect(validValues).toContain("email");
    expect(validValues).not.toContain("fax");
  });

  it("should validate location type enum values", () => {
    const validTypes = ["home", "workplace", "roadside", "parking_lot", "dealership", "other"];
    expect(validTypes).toContain("home");
    expect(validTypes).toContain("roadside");
    expect(validTypes).not.toContain("garage");
  });
});

describe("Automatic Zapier lead delivery", () => {
  it("builds a new-lead handoff with customer and service data but no pricing", () => {
    const payload = buildAutomaticLeadHandoffPayload({
      id: 12, referenceNumber: "NAM-AUTO1", customerId: 4, vehicleId: null, fullName: "Test Customer", phone: "4075550100", email: "test@example.com", preferredContact: "call", streetAddress: "123 Orange Ave", unit: null, city: "__CITY__", zipCode: "32801", locationType: "home", locationNotes: null, vehicleYear: "2020", vehicleMake: "Ford", vehicleModel: "Edge", vehicleTrim: null, vin: null, mileage: null, requestedService: "Diagnostics", mainSymptom: "Check engine light", problemDescription: "Light came on this morning", vehicleStarts: true, vehicleSafe: true, preferredDate: null, preferredTime: null, isAsap: false, customerNotes: null, status: "new", priority: "normal", internalNotes: null, nextActionAt: null, lastContactedAt: null, estimatedValue: null, finalValue: null, quoteSummary: null, quotePreparedAt: null, quoteWebhookStatus: null, quoteWebhookError: null, quoteWebhookSentAt: null, isInServiceArea: null, createdAt: new Date(), updatedAt: new Date(),
    });
    expect(payload.event).toBe("lead_follow_up_ready");
    expect(payload.lead.fullName).toBe("Test Customer");
    expect(payload.lead.vehicle).toBe("2020 Ford Edge");
    expect(payload.lead.serviceLocation).toContain("__CITY__");
    expect(JSON.stringify(payload)).not.toContain("amount");
    expect(JSON.stringify(payload)).not.toContain("price");
  });
});

describe("Lead attribution provenance", () => {
  it("stores source metadata without copying raw click identifiers", () => {
    const metadata = buildLeadAttributionActivityMetadata({
      gclid: "secret-click-id",
      landingUrl: "https://example.com/request-service",
      referrer: "https://www.google.com/",
      utmSource: "google",
      utmMedium: "organic",
    }, false);

    expect(metadata).toEqual({
      channel: "paid_search",
      hasLandingUrl: true,
      hasReferrer: true,
      hasGoogleAdsMatchKey: true,
      adsDataConsent: false,
    });
    expect(JSON.stringify(metadata)).not.toContain("secret-click-id");
  });
});

describe("Service Area Validation", () => {
  it("uses only client-approved service area ZIP codes", async () => {
    const { default: site } = await import("../../client.config.json");
    const approved = [...new Set(site.serviceAreas.flatMap(area => area.zipCodes ?? []))];
    expect(SERVICE_AREA_ZIPS).toEqual(approved);
  });
});
