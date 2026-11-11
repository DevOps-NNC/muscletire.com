import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { blogApiIdempotency, blogApiKeys } from "../drizzle/schema";
import { toPublicBlogApiKey } from "./blogApiRepository";

describe("blog API persistence contract", () => {
  it("defines the key and idempotency columns without storing plaintext secrets", () => {
    expect(Object.keys(getTableColumns(blogApiKeys))).toEqual([
      "id",
      "name",
      "keyPrefix",
      "keyHash",
      "createdByUserId",
      "lastUsedAt",
      "revokedAt",
      "createdAt",
    ]);
    expect(Object.keys(getTableColumns(blogApiIdempotency))).toEqual([
      "id",
      "apiKeyId",
      "idempotencyKey",
      "requestHash",
      "articleId",
      "createdAt",
    ]);
  });

  it("projects API key metadata without the hash", () => {
    const projected = toPublicBlogApiKey({
      id: 1,
      name: "Publishing app",
      keyPrefix: "nam_blog_abc123",
      keyHash: "should-never-leave-the-repository",
      createdByUserId: 7,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: new Date("2026-10-08T00:00:00.000Z"),
    });

    expect(projected).toEqual({
      id: 1,
      name: "Publishing app",
      keyPrefix: "nam_blog_abc123",
      lastUsedAt: null,
      revokedAt: null,
      createdAt: new Date("2026-10-08T00:00:00.000Z"),
    });
    expect(projected).not.toHaveProperty("keyHash");
  });

  it("keeps the composite idempotency uniqueness constraint additive", () => {
    const migration = readFileSync(new URL("../drizzle/0014_blog_api_keys.sql", import.meta.url), "utf8");
    expect(migration).toContain("blog_api_idempotency_api_key_id_idempotency_key");
    expect(migration).toContain("UNIQUE (\"api_key_id\", \"idempotency_key\")");
  });
});
