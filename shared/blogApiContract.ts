import { z } from "zod";
import { slugifyBlogTitle } from "./blogTracking";

export const blogArticleStatusSchema = z.enum(["draft", "published", "scheduled"]);

const optionalTrimmedString = (max: number) => z.string().trim().max(max).optional();

const isoTimestampSchema = z.string().refine(value => {
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && /T\d{2}:\d{2}/.test(value);
}, "Expected an ISO-8601 timestamp.");

const rawCreateBlogArticleSchema = z.object({
  title: z.string().trim().min(1).max(500),
  slug: z.string().trim().toLowerCase().max(300).optional(),
  excerpt: optionalTrimmedString(10_000),
  content: optionalTrimmedString(900_000),
  category: optionalTrimmedString(100),
  tags: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  metaTitle: optionalTrimmedString(200),
  metaDescription: optionalTrimmedString(500),
  status: blogArticleStatusSchema.default("draft"),
  scheduledAt: isoTimestampSchema.optional(),
});

export const createBlogArticleSchema = rawCreateBlogArticleSchema
  .superRefine((input, context) => {
    if (input.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
      context.addIssue({ code: "custom", path: ["slug"], message: "Slug must contain only lowercase letters, numbers, and hyphens." });
    }
    if (!input.slug && !slugifyBlogTitle(input.title)) {
      context.addIssue({ code: "custom", path: ["title"], message: "Title must contain letters or numbers so a URL slug can be generated." });
    }
    if (input.status === "scheduled") {
      if (!input.scheduledAt) {
        context.addIssue({ code: "custom", path: ["scheduledAt"], message: "Scheduled articles require a future scheduledAt timestamp." });
      } else if (Date.parse(input.scheduledAt) <= Date.now()) {
        context.addIssue({ code: "custom", path: ["scheduledAt"], message: "scheduledAt must be in the future." });
      }
    }
  })
  .transform(input => ({
    ...input,
    slug: input.slug || slugifyBlogTitle(input.title),
    scheduledAt: input.status === "scheduled" ? input.scheduledAt : undefined,
  }));

export type CreateBlogArticleInput = z.infer<typeof createBlogArticleSchema>;

export const blogArticleResponseSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string(),
  status: blogArticleStatusSchema,
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  scheduledAt: z.string().datetime({ offset: true }).nullable(),
  url: z.string().url(),
});

export const blogArticleStatusResponseSchema = blogArticleResponseSchema;

export const blogApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.string()).optional(),
  }),
});

export const blogApiOpenApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "__BUSINESS_NAME__ Blog API",
    version: "1.0.0",
  },
  servers: [{ url: "__BUSINESS_URL__" }],
  paths: {
    "/api/v1/blogs": {
      post: {
        operationId: "createBlogArticle",
        security: [{ ApiKey: [] }, { BearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateBlogArticleRequest" } } } },
        responses: {
          "201": { description: "Article created.", content: { "application/json": { schema: { $ref: "#/components/schemas/BlogArticleResponse" } } } },
          "400": { description: "Invalid request." },
          "401": { description: "Missing or invalid API key." },
          "409": { description: "Slug or idempotency conflict." },
        },
      },
    },
    "/api/v1/blogs/{id}": {
      get: {
        operationId: "getBlogArticleStatus",
        security: [{ ApiKey: [] }, { BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Article status.", content: { "application/json": { schema: { $ref: "#/components/schemas/BlogArticleResponse" } } } },
          "401": { description: "Missing or invalid API key." },
          "404": { description: "Article not found." },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
      BearerAuth: { type: "http", scheme: "bearer" },
    },
    schemas: {
      CreateBlogArticleRequest: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", minLength: 1, maxLength: 500 },
          slug: { type: "string", maxLength: 300 },
          excerpt: { type: "string" },
          content: { type: "string" },
          category: { type: "string", maxLength: 100 },
          tags: { type: "array", maxItems: 50, items: { type: "string", maxLength: 80 } },
          metaTitle: { type: "string", maxLength: 200 },
          metaDescription: { type: "string", maxLength: 500 },
          status: { type: "string", enum: ["draft", "published", "scheduled"], default: "draft" },
          scheduledAt: { type: "string", format: "date-time" },
        },
      },
      BlogArticleResponse: {
        type: "object",
        required: ["id", "slug", "status", "publishedAt", "scheduledAt", "url"],
        properties: {
          id: { type: "integer" },
          slug: { type: "string" },
          status: { type: "string", enum: ["draft", "published", "scheduled"] },
          publishedAt: { type: "string", format: "date-time", nullable: true },
          scheduledAt: { type: "string", format: "date-time", nullable: true },
          url: { type: "string", format: "uri" },
        },
      },
    },
  },
} as const;
