import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleAuthorizationCode,
  listAccessibleGa4Properties,
  runGa4Report,
  GoogleAnalyticsProviderError,
} from "./googleAnalytics";

beforeEach(() => {
  process.env.GOOGLE_ANALYTICS_CLIENT_ID = "analytics-client-id";
  process.env.GOOGLE_ANALYTICS_CLIENT_SECRET = "analytics-client-secret";
  process.env.GOOGLE_ANALYTICS_REDIRECT_URI = "http://localhost:3000/api/analytics/google/callback";
});

describe("Google Analytics provider", () => {
  it("builds a read-only offline authorization URL", () => {
    const url = new URL(buildGoogleAuthorizationUrl({ state: "state-value", redirectUri: process.env.GOOGLE_ANALYTICS_REDIRECT_URI!, codeChallenge: "challenge-value" }));

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("analytics-client-id");
    expect(url.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/analytics.readonly");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.searchParams.get("code_challenge")).toBe("challenge-value");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("exchanges an authorization code and redacts provider failures", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: "access", refresh_token: "refresh", expires_in: 3600, token_type: "Bearer" }), { status: 200 }));
    const token = await exchangeGoogleAuthorizationCode("auth-code", { fetchImpl, codeVerifier: "verifier-value" });

    expect(token).toMatchObject({ accessToken: "access", refreshToken: "refresh", expiresIn: 3600 });
    expect(fetchImpl).toHaveBeenCalledWith("https://oauth2.googleapis.com/token", expect.objectContaining({ method: "POST", body: expect.stringContaining("code_verifier=verifier-value") }));

    const failingFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "invalid_grant", error_description: "refresh-token-value" }), { status: 400 }));
    await expect(exchangeGoogleAuthorizationCode("bad-code", { fetchImpl: failingFetch })).rejects.toMatchObject({ code: "authorization" });
    await expect(exchangeGoogleAuthorizationCode("bad-code", { fetchImpl: failingFetch })).rejects.not.toThrow("refresh-token-value");
  });

  it("normalizes accessible GA4 properties from account summaries", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ accountSummaries: [{ account: "accounts/123", displayName: "New Age", propertySummaries: [{ property: "properties/456", displayName: "Website" }] }] }), { status: 200 }));

    await expect(listAccessibleGa4Properties("access", { fetchImpl })).resolves.toEqual([{
      accountId: "123",
      accountName: "New Age",
      propertyId: "456",
      propertyName: "Website",
    }]);
  });

  it("normalizes report rows and classifies quota failures", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ dimensionHeaders: [{ name: "date" }], metricHeaders: [{ name: "sessions", type: "TYPE_INTEGER" }], rows: [{ dimensionValues: [{ value: "20260921" }], metricValues: [{ value: "12" }] }] }), { status: 200 }));
    const report = await runGa4Report("access", "456", { dateRanges: [{ startDate: "2026-09-01", endDate: "2026-09-21" }], dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }] }, { fetchImpl });

    expect(report).toEqual({
      dimensions: ["date"],
      metrics: ["sessions"],
      rows: [{ dimensions: { date: "20260921" }, metrics: { sessions: "12" } }],
    });

    const quotaFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Quota exceeded" } }), { status: 429 }));
    await expect(runGa4Report("access", "456", { dateRanges: [] }, { fetchImpl: quotaFetch })).rejects.toBeInstanceOf(GoogleAnalyticsProviderError);
    expect(quotaFetch).toHaveBeenCalledTimes(1);
    const quotaError = await runGa4Report("access", "456", { dateRanges: [] }, { fetchImpl: vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Quota exceeded" } }), { status: 429 })) }).catch(error => error);
    expect(quotaError).toMatchObject({ code: "rate_limit" });
  });
});
