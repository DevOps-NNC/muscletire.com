import { timingSafeEqual } from "node:crypto";
import type { Express, Request as ExpressRequest } from "express";
import { and, eq, lte } from "drizzle-orm";
import { articles } from "../drizzle/schema.js";
import { getDb } from "./db.js";

export type PublishedBlogArticle = { id: number; slug: string };
export type BlogCronStore = { publishDue(now: Date): Promise<PublishedBlogArticle[]> };

function secretsMatch(expected: string, supplied: string) {
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : request.headers.get("x-cron-secret") ?? "";
  return Boolean(expected && supplied && secretsMatch(expected, supplied));
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store" } });
}

async function databaseCronStore(): Promise<BlogCronStore | null> {
  const db = await getDb();
  if (!db) return null;
  return {
    publishDue: async now => db.update(articles).set({ status: "published", publishedAt: now, scheduledAt: null, updatedAt: now }).where(and(eq(articles.status, "scheduled"), lte(articles.scheduledAt, now))).returning({ id: articles.id, slug: articles.slug }),
  };
}

export async function publishDueBlogArticles(now: Date, providedStore?: BlogCronStore) {
  const store = providedStore ?? await databaseCronStore();
  if (!store) throw new Error("Database not available");
  const articles = await store.publishDue(now);
  return { publishedCount: articles.length, articles };
}

export async function handleBlogCronRequest(request: Request, providedStore?: BlogCronStore): Promise<Response> {
  if (!authorized(request)) return jsonResponse({ error: "Unauthorized cron request." }, 401);
  if (request.method !== "GET" && request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
  try {
    return jsonResponse({ status: "succeeded", ...(await publishDueBlogArticles(new Date(), providedStore)) });
  } catch {
    return jsonResponse({ status: "unavailable" }, 503);
  }
}

function expressRequestToFetchRequest(request: ExpressRequest) {
  const protocol = request.headers["x-forwarded-proto"]?.toString().split(",")[0] || request.protocol;
  const host = request.headers["x-forwarded-host"]?.toString() || request.get("host");
  const headers = new Headers();
  Object.entries(request.headers).forEach(([name, value]) => { if (typeof value === "string") headers.set(name, value); else if (Array.isArray(value)) headers.set(name, value.join(", ")); });
  return new Request(`${protocol}://${host}${request.originalUrl}`, { method: request.method, headers });
}

export function registerBlogCronRoute(app: Express) {
  app.post("/api/blog/cron", async (req, res) => {
    const response = await handleBlogCronRequest(expressRequestToFetchRequest(req));
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(await response.text());
  });
}
