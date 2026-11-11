import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("one-time superadmin recovery secret", () => {
  it("validates the configured recovery code through the public recovery endpoint", async () => {
    const recoveryCode = process.env.CRM_BOOTSTRAP_RECOVERY_CODE;
    expect(recoveryCode, "CRM_BOOTSTRAP_RECOVERY_CODE must be configured").toBeTruthy();
    const caller = appRouter.createCaller({} as never);
    const result = await caller.auth.validateRecoveryCode({ recoveryCode: recoveryCode! });
    expect(result.codeMatches).toBe(true);
  }, 20_000);
});
