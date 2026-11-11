import { describe, expect, it } from "vitest";
import {
  createBlogApiKey,
  hashBlogApiKey,
  hashBlogApiRequest,
  parseBlogApiKey,
} from "./blogApiSecurity";

describe("blog API key security helpers", () => {
  it("creates a prefixed secret and a matching SHA-256 hash", () => {
    const generated = createBlogApiKey();

    expect(generated.secret).toMatch(/^nam_blog_[A-Za-z0-9_-]+$/);
    expect(generated.prefix).toBe(generated.secret.slice(0, 16));
    expect(generated.hash).toBe(hashBlogApiKey(generated.secret));
    expect(generated.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects malformed credentials without normalizing them into valid keys", () => {
    expect(parseBlogApiKey(null)).toBeNull();
    expect(parseBlogApiKey("Bearer nam_blog_test")).toBeNull();
    expect(parseBlogApiKey("nam_key_test")).toBeNull();
    expect(parseBlogApiKey("nam_blog_test")).toBe("nam_blog_test");
  });

  it("hashes equivalent JSON objects identically for idempotency", () => {
    expect(hashBlogApiRequest({ b: 2, a: 1 })).toBe(hashBlogApiRequest({ a: 1, b: 2 }));
    expect(hashBlogApiRequest({ title: "one" })).not.toBe(hashBlogApiRequest({ title: "two" }));
  });
});
