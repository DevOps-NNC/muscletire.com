import { and, eq, isNull } from "drizzle-orm";
import { articles, blogApiIdempotency, type BlogApiKey } from "../drizzle/schema.js";
import { BUSINESS_CONFIG } from "../shared/config.js";
import { blogApiOpenApiDocument, createBlogArticleSchema, type CreateBlogArticleInput } from "../shared/blogApiContract.js";
import { findActiveBlogApiKey, findBlogArticleStatus, findIdempotencyRecord, recordBlogApiKeyUse } from "./blogApiRepository.js";
import { hashBlogApiKey, hashBlogApiRequest, parseBlogApiKey } from "./blogApiSecurity.js";
import { getDb } from "./db.js";

const MAX_BLOG_API_BODY_BYTES = 1_048_576;

type ArticleStatus = "draft" | "published" | "scheduled";

export type BlogApiArticleStatus = {
  id: number;
  slug: string;
  status: ArticleStatus;
  publishedAt: Date | null;
  scheduledAt: Date | null;
};

export type BlogApiStore = {
  findActiveBlogApiKey(hash: string): Promise<Pick<BlogApiKey, "id" | "keyHash" | "revokedAt"> | null>;
  recordBlogApiKeyUse(id: number, now: Date): Promise<void>;
  createArticleWithIdempotency(input: {
    apiKeyId: number;
    idempotencyKey: string | null;
    requestHash: string;
    article: CreateBlogArticleInput;
    now: Date;
  }): Promise<{ article: BlogApiArticleStatus; replayed: boolean }>;
  findBlogArticleStatus(apiKeyId: number, articleId: number): Promise<BlogApiArticleStatus | null>;
};

type Failure = {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
};

function failureResponse(failure: Failure) {
  return jsonResponse({ error: { code: failure.code, message: failure.message, ...(failure.fieldErrors ? { fieldErrors: failure.fieldErrors } : {}) } }, failure.status);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
    },
  });
}

function articleResponse(article: BlogApiArticleStatus) {
  return {
    id: article.id,
    slug: article.slug,
    status: article.status,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    scheduledAt: article.scheduledAt?.toISOString() ?? null,
    url: new URL(`/blog/${encodeURIComponent(article.slug)}`, BUSINESS_CONFIG.website).toString(),
  };
}

function requestCredential(request: Request) {
  const headerKey = parseBlogApiKey(request.headers.get("x-api-key"));
  const authorization = request.headers.get("authorization");
  const bearerKey = authorization?.startsWith("Bearer ") ? parseBlogApiKey(authorization.slice(7)) : authorization ? null : null;
  if (request.headers.has("x-api-key") && !headerKey) return null;
  if (authorization && !bearerKey) return null;
  if (headerKey && bearerKey && headerKey !== bearerKey) return null;
  return headerKey ?? bearerKey;
}

async function authenticate(request: Request, store: BlogApiStore) {
  const secret = requestCredential(request);
  if (!secret) return null;
  const key = await store.findActiveBlogApiKey(hashBlogApiKey(secret));
  if (!key || key.revokedAt) return null;
  await store.recordBlogApiKeyUse(key.id, new Date());
  return key;
}

function validationErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return Object.fromEntries(error.issues.map(issue => [String(issue.path[0] ?? "request"), issue.message]));
}

async function parseCreateBody(request: Request): Promise<{ input?: CreateBlogArticleInput; failure?: Failure; requestBody?: unknown }> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { failure: { status: 415, code: "UNSUPPORTED_MEDIA_TYPE", message: "Blog creation requires application/json." } };
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BLOG_API_BODY_BYTES) {
    return { failure: { status: 413, code: "PAYLOAD_TOO_LARGE", message: "The blog request body is too large." } };
  }
  let requestBody: unknown;
  try {
    requestBody = JSON.parse(raw);
  } catch {
    return { failure: { status: 400, code: "VALIDATION_ERROR", message: "The blog request is invalid.", fieldErrors: { request: "Request body must be valid JSON." } } };
  }
  const parsed = createBlogArticleSchema.safeParse(requestBody);
  if (!parsed.success) return { failure: { status: 400, code: "VALIDATION_ERROR", message: "The blog request is invalid.", fieldErrors: validationErrors(parsed.error) } };
  return { input: parsed.data, requestBody };
}

function storeFailure(error: unknown): Failure {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  if (code === "SLUG_CONFLICT") return { status: 409, code, message: "An article with this slug already exists." };
  if (code === "IDEMPOTENCY_CONFLICT") return { status: 409, code, message: "This Idempotency-Key was already used for a different request." };
  return { status: 502, code: "BLOG_CREATE_FAILED", message: "The blog article could not be created." };
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "23505";
}

function asArticleStatus(row: { id: number; slug: string; status: ArticleStatus; publishedAt: Date | null; scheduledAt: Date | null }): BlogApiArticleStatus {
  return { id: row.id, slug: row.slug, status: row.status, publishedAt: row.publishedAt, scheduledAt: row.scheduledAt };
}

function createDatabaseStore(db: NonNullable<Awaited<ReturnType<typeof getDb>>>): BlogApiStore {
  return {
    findActiveBlogApiKey: hash => findActiveBlogApiKey(db, hash),
    recordBlogApiKeyUse: (id, now) => recordBlogApiKeyUse(db, id, now),
    findBlogArticleStatus: async (apiKeyId, articleId) => {
      const row = await findBlogArticleStatus(db, apiKeyId, articleId);
      return row ? asArticleStatus(row) : null;
    },
    createArticleWithIdempotency: async ({ apiKeyId, idempotencyKey, requestHash, article, now }) => {
      const create = async (transactionDb: any) => {
        if (idempotencyKey) {
          const existing = await findIdempotencyRecord(transactionDb, apiKeyId, idempotencyKey);
          if (existing) {
            if (existing.requestHash !== requestHash) throw Object.assign(new Error("Idempotency conflict"), { code: "IDEMPOTENCY_CONFLICT" });
            const existingArticle = await findBlogArticleStatus(transactionDb, apiKeyId, existing.articleId);
            if (existingArticle) return { article: asArticleStatus(existingArticle), replayed: true };
          }
        }
        const publishedAt = article.status === "published" ? now : null;
        const scheduledAt = article.status === "scheduled" && article.scheduledAt ? new Date(article.scheduledAt) : null;
        const [created] = await transactionDb.insert(articles).values({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt || null,
          content: article.content || null,
          category: article.category || null,
          tags: article.tags,
          metaTitle: article.metaTitle || null,
          metaDescription: article.metaDescription || null,
          status: article.status,
          publishedAt,
          scheduledAt,
          createdByBlogApiKeyId: apiKeyId,
        }).returning({ id: articles.id, slug: articles.slug, status: articles.status, publishedAt: articles.publishedAt, scheduledAt: articles.scheduledAt });
        if (!created) throw new Error("Article insert returned no row");
        if (idempotencyKey) await transactionDb.insert(blogApiIdempotency).values({ apiKeyId, idempotencyKey, requestHash, articleId: created.id });
        return { article: asArticleStatus(created), replayed: false };
      };
      try {
        return await db.transaction(create);
      } catch (error) {
        if (idempotencyKey && isUniqueViolation(error)) {
          const existing = await findIdempotencyRecord(db, apiKeyId, idempotencyKey);
          if (existing) {
            if (existing.requestHash !== requestHash) throw Object.assign(new Error("Idempotency conflict"), { code: "IDEMPOTENCY_CONFLICT" });
            const existingArticle = await findBlogArticleStatus(db, apiKeyId, existing.articleId);
            if (existingArticle) return { article: asArticleStatus(existingArticle), replayed: true };
          }
        }
        if (isUniqueViolation(error)) throw Object.assign(new Error("Slug conflict"), { code: "SLUG_CONFLICT" });
        throw error;
      }
    },
  };
}

export async function handleBlogApiRequest(request: Request, providedStore?: BlogApiStore): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/api/v1/openapi.json") {
    if (request.method !== "GET") return failureResponse({ status: 405, code: "METHOD_NOT_ALLOWED", message: "Method not allowed." });
    return jsonResponse(blogApiOpenApiDocument);
  }

  const createRoute = url.pathname === "/api/v1/blogs";
  const statusMatch = url.pathname.match(/^\/api\/v1\/blogs\/(\d+)$/);
  if (!createRoute && !statusMatch) return failureResponse({ status: 404, code: "NOT_FOUND", message: "Blog API route not found." });
  if (createRoute && request.method !== "POST") return failureResponse({ status: 405, code: "METHOD_NOT_ALLOWED", message: "Method not allowed." });
  if (statusMatch && request.method !== "GET") return failureResponse({ status: 405, code: "METHOD_NOT_ALLOWED", message: "Method not allowed." });

  const database = await getDb();
  const store = providedStore ?? (database ? createDatabaseStore(database) : null);
  if (!store) return failureResponse({ status: 503, code: "SERVICE_UNAVAILABLE", message: "The blog API is temporarily unavailable." });
  const key = await authenticate(request, store);
  if (!key) return failureResponse({ status: 401, code: "UNAUTHORIZED", message: "A valid blog API key is required." });

  if (statusMatch) {
    const article = await store.findBlogArticleStatus(key.id, Number(statusMatch[1]));
    return article ? jsonResponse(articleResponse(article)) : failureResponse({ status: 404, code: "NOT_FOUND", message: "Blog article not found." });
  }

  const parsed = await parseCreateBody(request);
  if (parsed.failure) return failureResponse(parsed.failure);
  const idempotencyHeader = request.headers.get("idempotency-key")?.trim() || null;
  if (idempotencyHeader && idempotencyHeader.length > 200) return failureResponse({ status: 400, code: "VALIDATION_ERROR", message: "The blog request is invalid.", fieldErrors: { "Idempotency-Key": "Idempotency-Key must be 200 characters or fewer." } });
  try {
    const result = await store.createArticleWithIdempotency({ apiKeyId: key.id, idempotencyKey: idempotencyHeader, requestHash: hashBlogApiRequest(parsed.requestBody), article: parsed.input!, now: new Date() });
    return jsonResponse(articleResponse(result.article), result.replayed ? 200 : 201);
  } catch (error) {
    return failureResponse(storeFailure(error));
  }
}

export function registerBlogApiRoutes(app: { all: (path: string, handler: (request: any, response: any) => void) => void }) {
  app.all("/api/v1/openapi.json", async (req, res) => {
    const response = await handleBlogApiRequest(new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`, { method: req.method, headers: req.headers as HeadersInit }));
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(await response.text());
  });
  app.all("/api/v1/blogs*", async (req, res) => {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([name, value]) => { if (typeof value === "string") headers.set(name, value); else if (Array.isArray(value)) headers.set(name, value.join(", ")); });
    const method = req.method;
    const body = method === "GET" || method === "HEAD" ? undefined : typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const response = await handleBlogApiRequest(new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`, { method, headers, body }));
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(await response.text());
  });
}
