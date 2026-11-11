import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

describe("Neon production configuration", () => {
  it("connects to the configured pooled database", async () => {
    const connectionString = process.env.NEON_DATABASE_URL;
    expect(connectionString, "NEON_DATABASE_URL must be configured").toMatch(/^postgres(ql)?:\/\//);

    const sql = neon(connectionString!);
    const result = await sql<{ connected: number }[]>`SELECT 1 AS connected`;
    expect(result[0]?.connected).toBe(1);
  }, 15_000);
});
