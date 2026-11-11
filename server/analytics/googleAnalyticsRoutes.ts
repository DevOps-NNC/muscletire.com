import { parse as parseCookie } from "cookie";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Express, Request as ExpressRequest, Response as ExpressResponse } from "express";
import { eq } from "drizzle-orm";
import { analyticsIntegrations } from "../../drizzle/schema.js";
import { getDb } from "../db.js";
import { createContext } from "../_core/context.js";
import { decryptAnalyticsSecret, encryptAnalyticsSecret } from "./analyticsCrypto.js";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleAuthorizationCode,
  listAccessibleGa4Properties,
  revokeGoogleToken,
  type Ga4Property,
} from "./googleAnalytics.js";

export const GOOGLE_ANALYTICS_STATE_COOKIE = "namm_google_analytics_oauth_state";
const STATE_MAX_AGE_SECONDS = 10 * 60;

function isSecureRequest(request: Request) {
  return new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

function redirectUri(request: Request) {
  const configured = process.env.GOOGLE_ANALYTICS_REDIRECT_URI?.trim();
  if (configured) return configured;
  return new URL("/api/analytics/google/callback", request.url).toString();
}

function setStateCookie(state: string, codeVerifier: string, request: Request) {
  return buildStateCookie(state + "." + codeVerifier, STATE_MAX_AGE_SECONDS, request);
}

function clearStateCookie(request: Request) {
  return buildStateCookie("", 0, request);
}

function buildStateCookie(value: string, maxAge: number, request: Request) {
  return GOOGLE_ANALYTICS_STATE_COOKIE + "=" + encodeURIComponent(value) + "; Max-Age=" + maxAge + "; Path=/; HttpOnly; SameSite=Lax" + (isSecureRequest(request) ? "; Secure" : "");
}

function getRequestPath(request: Request) {
  return new URL(request.url).pathname.replace(/\/$/, "");
}

async function authenticateAdmin(request: Request) {
  try {
    const user = (await createContext({
      req: { headers: Object.fromEntries(request.headers.entries()), protocol: new URL(request.url).protocol.replace(":", ""), get: (name: string) => request.headers.get(name) } as any,
      res: {} as any,
    } as Parameters<typeof createContext>[0])).user;
    return user && user.role === "admin" && !user.suspendedAt ? user : null;
  } catch {
    return null;
  }
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "Administrator authentication is required." }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function redirectResponse(location: string, cookie: string) {
  return new Response(null, { status: 302, headers: { location, "set-cookie": cookie } });
}

async function persistConnectedIntegration(userId: number, token: { accessToken: string; refreshToken?: string }, properties: Ga4Property[]) {
  const db = await getDb();
  if (!db) throw new Error("Analytics database is unavailable.");
  const [existing] = await db.select().from(analyticsIntegrations).where(eq(analyticsIntegrations.provider, "ga4")).limit(1);
  const encrypted = token.refreshToken
    ? encryptAnalyticsSecret(token.refreshToken)
    : existing?.refreshTokenCiphertext && existing.refreshTokenIv && existing.refreshTokenAuthTag
      ? { ciphertext: existing.refreshTokenCiphertext, iv: existing.refreshTokenIv, authTag: existing.refreshTokenAuthTag }
      : null;
  if (!encrypted) throw new Error("Google did not return a refresh token. Reconnect with offline access enabled.");
  const firstProperty = properties[0];
  const values = {
    provider: "ga4" as const,
    ownerUserId: userId,
    googleAccountId: firstProperty?.accountId ?? existing?.googleAccountId ?? null,
    refreshTokenCiphertext: encrypted.ciphertext,
    refreshTokenIv: encrypted.iv,
    refreshTokenAuthTag: encrypted.authTag,
    status: "connected" as const,
    connectedAt: existing?.connectedAt ?? new Date(),
    lastSyncError: null,
    updatedAt: new Date(),
  };
  if (existing) {
    await db.update(analyticsIntegrations).set(values).where(eq(analyticsIntegrations.id, existing.id));
  } else {
    await db.insert(analyticsIntegrations).values(values);
  }
}

export async function handleGoogleAnalyticsRequest(request: Request): Promise<Response> {
  const path = getRequestPath(request);
  if (!path.startsWith("/api/analytics/google/")) return badRequest("Unknown analytics route.", 404);

  const user = await authenticateAdmin(request);
  if (!user) return unauthorized();

  if (path.endsWith("/start")) {
    const state = randomUUID();
    const codeVerifier = randomBytes(32).toString("base64url");
    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
    const authorizationUrl = buildGoogleAuthorizationUrl({ state, redirectUri: redirectUri(request), codeChallenge });
    return redirectResponse(authorizationUrl, setStateCookie(state, codeVerifier, request));
  }

  if (path.endsWith("/callback")) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = parseCookie(request.headers.get("cookie") ?? "")[GOOGLE_ANALYTICS_STATE_COOKIE] ?? "";
    const [expectedState, codeVerifier] = storedState.split(".");
    const clearedCookie = clearStateCookie(request);
    if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) return new Response("Invalid Google Analytics authorization state.", { status: 403, headers: { "set-cookie": clearedCookie } });

    try {
      const token = await exchangeGoogleAuthorizationCode(code, { codeVerifier, redirectUri: redirectUri(request) });
      const properties = await listAccessibleGa4Properties(token.accessToken);
      await persistConnectedIntegration(user.id, token, properties);
      const destination = new URL("/admin/settings", request.url);
      destination.searchParams.set("googleAnalytics", "connected");
      destination.searchParams.set("propertyCount", String(properties.length));
      const response = redirectResponse(destination.toString(), clearedCookie);
      return response;
    } catch (error) {
      const destination = new URL("/admin/settings", request.url);
      destination.searchParams.set("googleAnalytics", "error");
      const response = redirectResponse(destination.toString(), clearedCookie);
      console.error("[Google Analytics] OAuth callback failed", error instanceof Error ? error.message : "unknown error");
      return response;
    }
  }

  if (path.endsWith("/disconnect")) {
    const db = await getDb();
    if (!db) return badRequest("Analytics database is unavailable.", 503);
    const [existing] = await db.select().from(analyticsIntegrations).where(eq(analyticsIntegrations.provider, "ga4")).limit(1);
    if (existing?.refreshTokenCiphertext && existing.refreshTokenIv && existing.refreshTokenAuthTag) {
      try {
        await revokeGoogleToken(decryptAnalyticsSecret({ ciphertext: existing.refreshTokenCiphertext, iv: existing.refreshTokenIv, authTag: existing.refreshTokenAuthTag }));
      } catch {
        // Local credential cleanup still proceeds if Google's revoke endpoint is unavailable.
      }
    }
    await db.update(analyticsIntegrations).set({ status: "disconnected", refreshTokenCiphertext: null, refreshTokenIv: null, refreshTokenAuthTag: null, propertyId: null, propertyName: null, updatedAt: new Date() }).where(eq(analyticsIntegrations.provider, "ga4"));
    const destination = new URL("/admin/settings", request.url);
    destination.searchParams.set("googleAnalytics", "disconnected");
    return Response.redirect(destination.toString(), 302);
  }

  return badRequest("Unknown analytics route.", 404);
}

function expressRequestToFetchRequest(request: ExpressRequest) {
  const protocol = request.headers["x-forwarded-proto"]?.toString().split(",")[0] || request.protocol;
  const host = request.headers["x-forwarded-host"]?.toString() || request.get("host");
  const headers = new Headers();
  Object.entries(request.headers).forEach(([name, value]) => {
    if (typeof value === "string") headers.set(name, value);
    else if (Array.isArray(value)) headers.set(name, value.join(", "));
  });
  return new Request(protocol + "://" + host + request.originalUrl, { method: request.method, headers });
}

async function sendFetchResponse(response: Response, res: ExpressResponse) {
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(response.status).send(await response.text());
}

export function registerGoogleAnalyticsRoutes(app: Express) {
  app.get("/api/analytics/google/start", async (req, res) => sendFetchResponse(await handleGoogleAnalyticsRequest(expressRequestToFetchRequest(req)), res));
  app.get("/api/analytics/google/callback", async (req, res) => sendFetchResponse(await handleGoogleAnalyticsRequest(expressRequestToFetchRequest(req)), res));
  app.get("/api/analytics/google/disconnect", async (req, res) => sendFetchResponse(await handleGoogleAnalyticsRequest(expressRequestToFetchRequest(req)), res));
}
