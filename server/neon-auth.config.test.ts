import { describe, expect, it } from "vitest";

describe("Neon Auth production configuration", () => {
  it("provides a valid Auth URL, public Auth URL, and CRM owner email", async () => {
    const authUrl = process.env.NEON_AUTH_URL;
    const publicAuthUrl = process.env.VITE_NEON_AUTH_URL;
    const ownerEmail = process.env.NEON_ADMIN_EMAIL;

    expect(authUrl, "NEON_AUTH_URL must be configured").toMatch(/^https:\/\//);
    expect(publicAuthUrl, "VITE_NEON_AUTH_URL must be configured").toBe(authUrl);
    expect(ownerEmail, "NEON_ADMIN_EMAIL must be configured").toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    const response = await fetch(`${authUrl}/.well-known/jwks.json`);
    expect(response.ok, "Neon Auth JWKS endpoint must be reachable").toBe(true);
    const body = await response.json() as { keys?: unknown[] };
    expect(Array.isArray(body.keys)).toBe(true);
  }, 15_000);

  it("recognizes the configured superadmin through the lightweight CRM eligibility endpoint", async () => {
    const ownerEmail = process.env.NEON_ADMIN_EMAIL!;
    const input = encodeURIComponent(JSON.stringify({ 0: { json: { email: ownerEmail } } }));
    const response = await fetch(`http://127.0.0.1:3000/api/trpc/auth.superadminEligibility?batch=1&input=${input}`);
    expect(response.ok, "The CRM owner eligibility endpoint must be reachable").toBe(true);
    const payload = await response.json() as Array<{ result?: { data?: { json?: { allowed?: boolean } } } }>;
    expect(payload[0]?.result?.data?.json?.allowed).toBe(true);
  }, 15_000);
});
