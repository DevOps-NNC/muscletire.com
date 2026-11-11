import { describe, expect, it } from "vitest";
import { hashBlogApiKey } from "./blogApiSecurity";
import { handleBlogApiRequest } from "./blogApi";

const primarySecret = "nam_blog_primary-test-secret";
const otherSecret = "nam_blog_other-test-secret";
const revokedSecret = "nam_blog_revoked-test-secret";

function createStore() {
  const keys = new Map([
    [hashBlogApiKey(primarySecret), { id: 1, keyHash: hashBlogApiKey(primarySecret), revokedAt: null }],
    [hashBlogApiKey(otherSecret), { id: 2, keyHash: hashBlogApiKey(otherSecret), revokedAt: null }],
    [hashBlogApiKey(revokedSecret), { id: 3, keyHash: hashBlogApiKey(revokedSecret), revokedAt: new Date() }],
  ]);
  const articles = new Map<number, any>();
  const idempotency = new Map<string, { requestHash: string; articleId: number }>();
  let nextId = 1;
  const created: any[] = [];

  return {
    created,
    findActiveBlogApiKey: async (hash: string) => keys.get(hash) ?? null,
    recordBlogApiKeyUse: async () => undefined,
    createArticleWithIdempotency: async ({ apiKeyId, idempotencyKey, requestHash, article: input, now }: any) => {
      const existing = idempotencyKey ? idempotency.get(`${apiKeyId}:${idempotencyKey}`) : undefined;
      if (existing) {
        if (existing.requestHash !== requestHash) throw Object.assign(new Error("idempotency mismatch"), { code: "IDEMPOTENCY_CONFLICT" });
        return { article: articles.get(existing.articleId), replayed: true };
      }
      if (created.some(article => article.slug === input.slug)) throw Object.assign(new Error("database keyHash details must not escape"), { code: "SLUG_CONFLICT" });
      const article = { id: nextId++, slug: input.slug, status: input.status, publishedAt: input.status === "published" ? now : null, scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null, apiKeyId };
      articles.set(article.id, article);
      created.push(article);
      if (idempotencyKey) idempotency.set(`${apiKeyId}:${idempotencyKey}`, { requestHash, articleId: article.id });
      return { article, replayed: false };
    },
    findBlogArticleStatus: async (apiKeyId: number, articleId: number) => {
      const article = articles.get(articleId);
      return article?.apiKeyId === apiKeyId ? article : null;
    },
  };
}

function request(path: string, options: { method?: string; secret?: string; body?: string; idempotencyKey?: string } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (options.secret) headers.set("x-api-key", options.secret);
  if (options.idempotencyKey) headers.set("idempotency-key", options.idempotencyKey);
  return new Request(`__BUSINESS_URL__${path}`, { method: options.method ?? "POST", headers, body: options.body });
}

const body = (value: unknown) => JSON.stringify(value);

describe("blog REST API", () => {
  it("serves the OpenAPI contract without credentials", async () => {
    const response = await handleBlogApiRequest(new Request("__BUSINESS_URL__/api/v1/openapi.json"));
    expect(response.status).toBe(200);
    expect((await response.json()).paths["/api/v1/blogs"].post).toBeDefined();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("requires a valid API key in either supported header form", async () => {
    const store = createStore();
    expect((await handleBlogApiRequest(request("/api/v1/blogs", { body: body({ title: "No key" }) }), store)).status).toBe(401);
    const bearerRequest = new Request("__BUSINESS_URL__/api/v1/blogs", { method: "POST", headers: { authorization: `Bearer ${primarySecret}`, "content-type": "application/json" }, body: body({ title: "Bearer article" }) });
    expect((await handleBlogApiRequest(bearerRequest, store)).status).toBe(201);
  });

  it("rejects revoked API keys", async () => {
    const response = await handleBlogApiRequest(request("/api/v1/blogs", { secret: revokedSecret, body: body({ title: "Revoked key" }) }), createStore());
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("creates scheduled articles and returns sanitized metadata", async () => {
    const store = createStore();
    const response = await handleBlogApiRequest(request("/api/v1/blogs", { secret: primarySecret, body: body({ title: "  Scheduled guide  ", status: "scheduled", scheduledAt: "2099-10-09T13:00:00.000Z" }) }), store);
    expect(response.status).toBe(201);
    const responseBody = await response.text();
    expect(JSON.parse(responseBody)).toMatchObject({ id: 1, slug: "scheduled-guide", status: "scheduled", publishedAt: null, scheduledAt: "2099-10-09T13:00:00.000Z" });
    expect(responseBody).not.toContain("keyHash");
  });

  it("returns stable validation and payload-size errors before writing", async () => {
    const invalidStore = createStore();
    const invalid = await handleBlogApiRequest(request("/api/v1/blogs", { secret: primarySecret, body: body({ status: "scheduled" }) }), invalidStore);
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(invalidStore.created).toHaveLength(0);

    const oversized = await handleBlogApiRequest(request("/api/v1/blogs", { secret: primarySecret, body: body({ title: "Large", content: "x".repeat(1_100_000) }) }), invalidStore);
    expect(oversized.status).toBe(413);
    expect(await oversized.json()).toMatchObject({ error: { code: "PAYLOAD_TOO_LARGE" } });
    expect(invalidStore.created).toHaveLength(0);
  });

  it("replays an idempotent create and rejects a changed retry", async () => {
    const store = createStore();
    const first = await handleBlogApiRequest(request("/api/v1/blogs", { secret: primarySecret, idempotencyKey: "publish-1", body: body({ title: "Retry me" }) }), store);
    const second = await handleBlogApiRequest(request("/api/v1/blogs", { secret: primarySecret, idempotencyKey: "publish-1", body: body({ title: "Retry me" }) }), store);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(store.created).toHaveLength(1);
    expect(await second.json()).toEqual(await first.clone().json());

    const conflict = await handleBlogApiRequest(request("/api/v1/blogs", { secret: primarySecret, idempotencyKey: "publish-1", body: body({ title: "Changed retry" }) }), store);
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ error: { code: "IDEMPOTENCY_CONFLICT" } });
  });

  it("returns slug conflicts and scopes status reads to the creating key", async () => {
    const store = createStore();
    const first = await handleBlogApiRequest(request("/api/v1/blogs", { secret: primarySecret, body: body({ title: "Same slug", slug: "same-slug" }) }), store);
    const conflict = await handleBlogApiRequest(request("/api/v1/blogs", { secret: otherSecret, body: body({ title: "Same slug", slug: "same-slug" }) }), store);
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).error).toEqual({ code: "SLUG_CONFLICT", message: "An article with this slug already exists." });

    const article = await first.json();
    const visible = await handleBlogApiRequest(new Request(`__BUSINESS_URL__/api/v1/blogs/${article.id}`, { headers: { "x-api-key": primarySecret } }), store);
    const hidden = await handleBlogApiRequest(new Request(`__BUSINESS_URL__/api/v1/blogs/${article.id}`, { headers: { "x-api-key": otherSecret } }), store);
    expect(visible.status).toBe(200);
    expect(hidden.status).toBe(404);
  });
});
