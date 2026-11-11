import { describe, expect, it, vi } from "vitest";
import { handleAmpLeadRequest, resetAmpLeadRateLimit } from "./ampLead.js";

const validFields = {
  fullName: "AMP Test Lead",
  phone: "4075550100",
  email: "amp@example.com",
  preferredContact: "call",
  streetAddress: "123 Test Street",
  city: "__CITY__",
  zipCode: "32801",
  locationType: "home",
  vehicleYear: "2020",
  vehicleMake: "Honda",
  vehicleModel: "Civic",
  requestedService: "diagnostics",
  mainSymptom: "Warning light",
  problemDescription: "The check engine light is on.",
  vehicleStarts: "true",
  vehicleSafe: "true",
  isAsap: "true",
  consent: "on",
};

function request(fields: Record<string, string> = validFields, headers: Record<string, string> = {}) {
  return new Request("__BUSINESS_URL__/api/amp/leads", {
    method: "POST",
    headers: { origin: "__BUSINESS_URL__", "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": "amp-test", ...headers },
    body: new URLSearchParams(fields),
  });
}

describe("native AMP lead endpoint", () => {
  it("accepts a valid form and delegates to the shared lead workflow", async () => {
    resetAmpLeadRateLimit();
    const createLead = vi.fn().mockResolvedValue({ referenceNumber: "NAM-AMP123" });

    const response = await handleAmpLeadRequest(request(), { createLead });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ referenceNumber: "NAM-AMP123", message: expect.any(String) });
    expect(createLead).toHaveBeenCalledWith(expect.objectContaining({ fullName: "AMP Test Lead", vehicleSafe: true }));
    expect(response.headers.get("access-control-allow-origin")).toBe("__BUSINESS_URL__");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("returns field errors for invalid input and rejects the honeypot", async () => {
    resetAmpLeadRateLimit();
    const createLead = vi.fn();
    const invalid = await handleAmpLeadRequest(request({ ...validFields, fullName: "", consent: "" }), { createLead });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).fieldErrors).toEqual(expect.objectContaining({ fullName: expect.anything(), consent: expect.anything() }));
    expect(createLead).not.toHaveBeenCalled();

    resetAmpLeadRateLimit();
    const honeypot = await handleAmpLeadRequest(request({ ...validFields, website: "https://spam.invalid" }), { createLead });
    expect(honeypot.status).toBe(400);
    expect((await honeypot.json()).message).toMatch(/invalid/i);
    expect(createLead).not.toHaveBeenCalled();
  });

  it("allows same-origin AMP requests, rejects unknown origins, and rate limits bursts", async () => {
    resetAmpLeadRateLimit();
    const createLead = vi.fn().mockResolvedValue({ referenceNumber: "NAM-AMP123" });
    const sameOrigin = await handleAmpLeadRequest(request(validFields, { origin: "", "amp-same-origin": "true" }), { createLead });
    expect(sameOrigin.status).toBe(200);

    const unconfiguredCache = await handleAmpLeadRequest(request(validFields, { origin: "https://unconfigured.cdn.ampproject.org", "x-forwarded-for": "cache-test" }), { createLead });
    expect(unconfiguredCache.status).toBe(403);

    resetAmpLeadRateLimit();
    const rejected = await handleAmpLeadRequest(request(validFields, { origin: "https://evil.example" }), { createLead });
    expect(rejected.status).toBe(403);
    expect(createLead).toHaveBeenCalledTimes(1);

    resetAmpLeadRateLimit();
    for (let index = 0; index < 5; index += 1) await handleAmpLeadRequest(request(validFields, { "x-forwarded-for": "rate-test" }), { createLead });
    const limited = await handleAmpLeadRequest(request(validFields, { "x-forwarded-for": "rate-test" }), { createLead });
    expect(limited.status).toBe(429);
  });
});
