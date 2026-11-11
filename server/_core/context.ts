import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { users } from "../../drizzle/schema.js";
import { siteSettings } from "../../drizzle/schema.js";
import { ACCOUNT_SETUP_SETTING_KEY } from "../../shared/crmAccess.js";
import { getDb } from "../db.js";
import { verifyNeonAuthJwt } from "./neonAuth.js";
import { sdk } from "./sdk.js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Neon Managed Better Auth is optional. When configured, JWTs are verified
  // against Neon’s JWKS before creating a local staff profile for RBAC.
  const neonAuthUrl = process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;
  if (!user && neonAuthUrl) {
    const headers = opts.req.headers as unknown as { authorization?: string | string[]; get?: (name: string) => string | null };
    const headerValue = typeof headers.get === "function" ? headers.get("authorization") : headers.authorization;
    const authorization = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (token) {
      try {
        const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
        let authUserId: string | null = null;
        let email: string | null = null;
        let name: string | null = null;
        // Neon Auth's browser client supplies an opaque session token. Resolve
        // it against the managed schema first; attempting JWT verification on
        // this token produces an expected JOSE algorithm error.
        if (connectionString) {
          const authDb = neon(connectionString);
          const sessionProfiles = await authDb`
            SELECT s."userId" AS "userId", u.email, u.name
            FROM neon_auth.session s
            JOIN neon_auth."user" u ON u.id = s."userId"
            WHERE s.token = ${token} AND s."expiresAt" > NOW()
            LIMIT 1
          ` as Array<{ userId: string; email: string | null; name: string | null }>;
          authUserId = sessionProfiles[0]?.userId ?? null;
          email = sessionProfiles[0]?.email ?? null;
          name = sessionProfiles[0]?.name ?? email;
        }

        // Retain JWT support for integrations that explicitly issue JWTs.
        if (!authUserId) {
          const identity = await verifyNeonAuthJwt(token, neonAuthUrl);
          authUserId = identity.userId;
          email = identity.email;
          name = identity.name ?? email;
        }
        if (authUserId) {
          const db = await getDb();
          if (db) {
            if (!email) {
              if (connectionString) {
                const authDb = neon(connectionString);
                const authProfiles = await authDb`
                  SELECT email, name FROM neon_auth."user" WHERE id = ${authUserId} LIMIT 1
                ` as Array<{ email: string | null; name: string | null }>;
                email = authProfiles[0]?.email ?? null;
                name = authProfiles[0]?.name ?? email;
              }
            }
            const isAdmin = Boolean(email && process.env.NEON_ADMIN_EMAIL?.toLowerCase() === email.toLowerCase());
            const existing = await db.select().from(users).where(eq(users.neonAuthUserId, authUserId)).limit(1);
            if (existing[0]) {
              if (isAdmin && existing[0].role !== "admin") {
                const upgraded = await db.update(users).set({
                  email: email ?? existing[0].email,
                  name: name ?? existing[0].name,
                  role: "admin",
                  mustChangePassword: true,
                  updatedAt: new Date(),
                }).where(eq(users.id, existing[0].id)).returning();
                const setupSetting = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, ACCOUNT_SETUP_SETTING_KEY)).limit(1);
                if (setupSetting[0]) await db.update(siteSettings).set({ settingValue: "disabled", updatedAt: new Date() }).where(eq(siteSettings.id, setupSetting[0].id));
                else await db.insert(siteSettings).values({ settingKey: ACCOUNT_SETUP_SETTING_KEY, settingValue: "disabled" });
                user = upgraded[0] ?? existing[0];
              } else {
                user = existing[0];
              }
            } else {
              const created = await db.insert(users).values({
                openId: `neon:${authUserId}`,
                neonAuthUserId: authUserId,
                email,
                name,
                loginMethod: "neon",
                role: isAdmin ? "admin" : "user",
                mustChangePassword: isAdmin,
              }).returning();
              if (isAdmin) {
                const setupSetting = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, ACCOUNT_SETUP_SETTING_KEY)).limit(1);
                if (setupSetting[0]) await db.update(siteSettings).set({ settingValue: "disabled", updatedAt: new Date() }).where(eq(siteSettings.id, setupSetting[0].id));
                else await db.insert(siteSettings).values({ settingKey: ACCOUNT_SETUP_SETTING_KEY, settingValue: "disabled" });
              }
              user = created[0] ?? null;
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        console.warn("[Neon Auth] Session verification failed", message);
      }
    }
  }

  // A suspended profile must not retain an authenticated CRM context, even
  // when its upstream session is still valid.
  if (user?.suspendedAt) user = null;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
