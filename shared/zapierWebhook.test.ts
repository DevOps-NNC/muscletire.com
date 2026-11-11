import { describe, expect, it } from "vitest";
import { buildLeadHandoffWebhookPayload, isZapierWebhookUrl } from "./zapierWebhook";

describe("Zapier lead handoff webhook helpers", () => {
  it("accepts a secure Zapier catch-hook URL and rejects unrelated hosts", () => {
    expect(isZapierWebhookUrl("https://hooks.zapier.com/hooks/catch/123/abc/")).toBe(true);
    expect(isZapierWebhookUrl("https://example.com/hooks/catch/123")).toBe(false);
    expect(isZapierWebhookUrl("http://hooks.zapier.com/hooks/catch/123")).toBe(false);
  });

  it("builds a stable no-price lead follow-up payload", () => {
    const payload = buildLeadHandoffWebhookPayload({ followUp: { notes: "__OWNER_NAME__ should call about the requested battery service." }, lead: { id: 9, referenceNumber: "NAMM-TEST", fullName: "QA Test", phone: "4070000000", email: null, preferredContact: "text", requestedService: "Battery", mainSymptom: null, problemDescription: null, vehicle: "2020 Ford Edge", serviceLocation: "__CITY__, FL" } });
    expect(payload.event).toBe("lead_follow_up_ready");
    expect(payload.followUp.notes).toContain("__OWNER_NAME__ should call");
    expect(JSON.stringify(payload)).not.toContain("amount");
    expect(JSON.stringify(payload)).not.toContain("price");
    expect(payload.lead.referenceNumber).toBe("NAMM-TEST");
  });
});
