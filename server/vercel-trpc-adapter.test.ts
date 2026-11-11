import { describe, expect, it } from "vitest";
import handler from "../api/trpc";

describe("Vercel tRPC adapter", () => {
  it("serves an unauthenticated auth profile query without booting Express", async () => {
    let statusCode = 200;
    let responseBody = "";
    const headers = new Map<string, string>();
    const req = {
      method: "GET",
      url: "/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D",
      headers: { host: "localhost" },
    } as any;
    const res = {
      setHeader(name: string, value: string) { headers.set(name, value); },
      status(code: number) { statusCode = code; return this; },
      send(body: string) { responseBody = body; return this; },
    } as any;

    await handler(req, res);

    expect(statusCode).toBe(200);
    expect(headers.get("content-type")).toContain("application/json");
    expect(responseBody).toContain("result");
  });
});
