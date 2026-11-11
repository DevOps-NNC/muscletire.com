import { createHash, randomBytes } from "node:crypto";

const BLOG_API_PREFIX = "nam_blog_";

export function parseBlogApiKey(value: string | null): string | null {
  if (!value || !value.startsWith(BLOG_API_PREFIX) || value.length <= BLOG_API_PREFIX.length) return null;
  return value;
}

export function hashBlogApiKey(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function createBlogApiKey() {
  const secret = `${BLOG_API_PREFIX}${randomBytes(32).toString("base64url")}`;
  return {
    secret,
    prefix: secret.slice(0, 16),
    hash: hashBlogApiKey(secret),
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, canonicalize(nested)]));
  }
  return value;
}

export function hashBlogApiRequest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}
