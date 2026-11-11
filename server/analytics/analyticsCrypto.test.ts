import { beforeEach, describe, expect, it } from "vitest";
import { decryptAnalyticsSecret, encryptAnalyticsSecret } from "./analyticsCrypto";

describe("analytics secret encryption", () => {
  beforeEach(() => {
    process.env.GOOGLE_ANALYTICS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("round-trips a refresh token without returning plaintext fields", () => {
    const encrypted = encryptAnalyticsSecret("refresh-token-value");

    expect(encrypted.ciphertext).not.toContain("refresh-token-value");
    expect(decryptAnalyticsSecret(encrypted)).toBe("refresh-token-value");
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptAnalyticsSecret("refresh-token-value");
    encrypted.ciphertext = Buffer.from("tampered").toString("base64");

    expect(() => decryptAnalyticsSecret(encrypted)).toThrow();
  });

  it("fails closed when the configured key is invalid", () => {
    process.env.GOOGLE_ANALYTICS_ENCRYPTION_KEY = "too-short";

    expect(() => encryptAnalyticsSecret("refresh-token-value")).toThrow(/32-byte/);
  });
});
