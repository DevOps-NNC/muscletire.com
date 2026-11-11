import { and, eq, isNull } from "drizzle-orm";
import { blogApiIdempotency, blogApiKeys, articles, type BlogApiKey } from "../drizzle/schema.js";
import { getDb } from "./db.js";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export function toPublicBlogApiKey(key: BlogApiKey) {
  return {
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    lastUsedAt: key.lastUsedAt,
    revokedAt: key.revokedAt,
    createdAt: key.createdAt,
  };
}

export async function findActiveBlogApiKey(db: Database, hash: string) {
  const [key] = await db.select().from(blogApiKeys).where(and(eq(blogApiKeys.keyHash, hash), isNull(blogApiKeys.revokedAt))).limit(1);
  return key ?? null;
}

export async function recordBlogApiKeyUse(db: Database, id: number, now: Date) {
  await db.update(blogApiKeys).set({ lastUsedAt: now }).where(eq(blogApiKeys.id, id));
}

export async function findIdempotencyRecord(db: Database, apiKeyId: number, idempotencyKey: string) {
  const [record] = await db.select().from(blogApiIdempotency).where(and(eq(blogApiIdempotency.apiKeyId, apiKeyId), eq(blogApiIdempotency.idempotencyKey, idempotencyKey))).limit(1);
  return record ?? null;
}

export async function insertIdempotencyRecord(db: Database, values: typeof blogApiIdempotency.$inferInsert) {
  const [record] = await db.insert(blogApiIdempotency).values(values).returning();
  return record;
}

export async function findBlogArticleStatus(db: Database, apiKeyId: number, id: number) {
  const [article] = await db.select({ id: articles.id, slug: articles.slug, status: articles.status, publishedAt: articles.publishedAt, scheduledAt: articles.scheduledAt }).from(articles).where(and(eq(articles.id, id), eq(articles.createdByBlogApiKeyId, apiKeyId))).limit(1);
  return article ?? null;
}
