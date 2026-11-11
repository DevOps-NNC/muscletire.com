import { describe, expect, it } from "vitest";
import { blogApiKeysRouter } from "./blogApiKeys";

const context = (email: string, role: "admin" | "user" = "admin") => ({
  user: { id: 7, email, role },
  req: new Request("http://localhost/api/trpc"),
  res: {} as any,
});

describe("blog API key router", () => {
  it("exposes only the owner-managed key procedures", () => {
    expect(Object.keys(blogApiKeysRouter._def.procedures).sort()).toEqual(["create", "list", "revoke"]);
  });

  it("rejects key reads for an administrator who is not the configured owner", async () => {
    const caller = blogApiKeysRouter.createCaller(context("other-admin@example.com"));
    await expect(caller.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects key creation for a non-administrator", async () => {
    const caller = blogApiKeysRouter.createCaller(context("staff@example.com", "user"));
    await expect(caller.create({ name: "Publishing app" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
