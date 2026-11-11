import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const nonOwnerAdminContext = {
  user: { id: 12, openId: "admin", neonAuthUserId: null, name: "CRM Admin", email: "staff@example.com", loginMethod: "neon", role: "admin", mustChangePassword: false, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {},
  res: {},
} as never;

const viewerContext = {
  user: { id: 13, openId: "viewer", neonAuthUserId: null, name: "Lead Viewer", email: "viewer@example.com", loginMethod: "neon", role: "lead_viewer", mustChangePassword: false, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {},
  res: {},
} as never;

describe("Google Ads export permissions", () => {
  it("does not allow a non-owner administrator to inspect attribution summaries", async () => {
    const caller = appRouter.createCaller(nonOwnerAdminContext);
    await expect(caller.googleAds.summary()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not allow a lead viewer to export conversion events", async () => {
    const caller = appRouter.createCaller(viewerContext);
    await expect(caller.googleAds.exportCsv({ eventIds: [1] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
