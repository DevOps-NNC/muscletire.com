import { COOKIE_NAME } from "@shared/const";
import { ACCOUNT_SETUP_SETTING_KEY, isAccountSetupEnabled, isOwnerEmail } from "../shared/crmAccess.js";
import { eq } from "drizzle-orm";
import { siteSettings } from "../drizzle/schema.js";
import { getDb } from "./db.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "@better-auth/utils/password";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { leadsRouter } from "./routers/leads.js";
import { blogRouter } from "./routers/blog.js";
import { crmRouter } from "./routers/crm.js";
import { vehiclesRouter } from "./routers/vehicles.js";
import { googleAdsRouter } from "./routers/googleAds.js";
import { analyticsRouter } from "./routers/analytics.js";
import { blogApiKeysRouter } from "./routers/blogApiKeys.js";

const RECOVERY_USED_SETTING_KEY = "crm_superadmin_recovery_used";

function recoveryCodeMatches(candidate: string) {
  const configured = process.env.CRM_BOOTSTRAP_RECOVERY_CODE;
  if (!configured || configured.length < 16) return false;
  const candidateBytes = Buffer.from(candidate);
  const configuredBytes = Buffer.from(configured);
  return candidateBytes.length === configuredBytes.length && timingSafeEqual(candidateBytes, configuredBytes);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    setupStatus: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { accountSetupEnabled: false };
      const setting = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, ACCOUNT_SETUP_SETTING_KEY)).limit(1);
      return { accountSetupEnabled: isAccountSetupEnabled(setting[0]?.settingValue) };
    }),
    superadminEligibility: publicProcedure.input(z.object({ email: z.string().email() })).query(({ input }) => ({
      allowed: isOwnerEmail(input.email, process.env.NEON_ADMIN_EMAIL),
    })),
    canClaimOwner: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { allowed: false };
      const setting = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, ACCOUNT_SETUP_SETTING_KEY)).limit(1);
      return {
        allowed: isAccountSetupEnabled(setting[0]?.settingValue) && isOwnerEmail(input.email, process.env.NEON_ADMIN_EMAIL),
      };
    }),
    recoveryStatus: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { available: false };
      const used = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, RECOVERY_USED_SETTING_KEY)).limit(1);
      return { available: Boolean(process.env.CRM_BOOTSTRAP_RECOVERY_CODE && process.env.CRM_BOOTSTRAP_RECOVERY_CODE.length >= 16) && used[0]?.settingValue !== "used" };
    }),
    validateRecoveryCode: publicProcedure.input(z.object({ recoveryCode: z.string().min(16) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { authorized: false, codeMatches: false };
      const used = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, RECOVERY_USED_SETTING_KEY)).limit(1);
      const codeMatches = recoveryCodeMatches(input.recoveryCode);
      return { authorized: codeMatches && used[0]?.settingValue !== "used", codeMatches };
    }),
    recoverSuperadmin: publicProcedure.input(z.object({
      email: z.string().email(),
      recoveryCode: z.string().min(16),
      password: z.string().min(12),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "CRM database is unavailable." });
      const used = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, RECOVERY_USED_SETTING_KEY)).limit(1);
      if (used[0]?.settingValue === "used") throw new TRPCError({ code: "FORBIDDEN", message: "The one-time owner recovery code has already been used." });
      if (!isOwnerEmail(input.email, process.env.NEON_ADMIN_EMAIL) || !recoveryCodeMatches(input.recoveryCode)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "The recovery credentials are not valid for this CRM." });
      }
      const connectionString = process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
      if (!connectionString) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Managed authentication is unavailable." });
      const authDb = neon(connectionString);
      const authUsers = await authDb`
        SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${input.email}) LIMIT 1
      ` as Array<{ id: string }>;
      const authUserId = authUsers[0]?.id;
      if (!authUserId) throw new TRPCError({ code: "NOT_FOUND", message: "No managed administrator account exists for this email." });
      const passwordHash = await hashPassword(input.password);
      await authDb`
        UPDATE neon_auth.account
        SET password = ${passwordHash}, "updatedAt" = NOW()
        WHERE "userId" = ${authUserId} AND "providerId" = 'credential'
      `;
      await authDb`DELETE FROM neon_auth.session WHERE "userId" = ${authUserId}`;
      await db.insert(siteSettings).values({ settingKey: RECOVERY_USED_SETTING_KEY, settingValue: "used" }).onConflictDoUpdate({
        target: siteSettings.settingKey,
        set: { settingValue: "used", updatedAt: new Date() },
      });
      return { success: true };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  leads: leadsRouter,
  blog: blogRouter,
  blogApiKeys: blogApiKeysRouter,
  crm: crmRouter,
  vehicles: vehiclesRouter,
  googleAds: googleAdsRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
