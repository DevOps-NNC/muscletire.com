import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const viewerContext = {
  user: { id: 7, openId: "viewer", neonAuthUserId: null, name: "Lead Viewer", email: "viewer@example.com", loginMethod: "neon", role: "lead_viewer", mustChangePassword: false, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {},
  res: {},
} as never;

describe("lead viewer permissions", () => {
  it("cannot resend a lead to Zapier", async () => {
    const caller = appRouter.createCaller(viewerContext);
    await expect(caller.crm.resendLeadToZapier({ leadId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cannot archive or soft-delete a service summary", async () => {
    const caller = appRouter.createCaller(viewerContext);
    await expect(caller.crm.setQuoteLifecycle({ id: 1, action: "soft_delete" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cannot soft-delete a lead", async () => {
    const caller = appRouter.createCaller(viewerContext);
    await expect(caller.crm.softDeleteLead({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cannot archive or restore a lead", async () => {
    const caller = appRouter.createCaller(viewerContext);
    await expect(caller.crm.archiveLead({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.crm.restoreLead({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cannot permanently delete a recovery record", async () => {
    const caller = appRouter.createCaller(viewerContext);
    await expect(caller.crm.permanentlyDeleteLead({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
