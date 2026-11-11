import { z } from "zod";
import { and } from "drizzle-orm";
import { publicProcedure, adminProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { articles } from "../../drizzle/schema.js";
import { eq, desc } from "drizzle-orm";
import { storagePut } from "../storage.js";
import { decodeBlogImageUpload } from "./blogUpload.js";
import { createBlogArticleSchema, type CreateBlogArticleInput } from "../../shared/blogApiContract.js";

const articleInput = createBlogArticleSchema;

export function buildArticleWriteValues(input: CreateBlogArticleInput, now: Date) {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt || null,
    content: input.content || null,
    category: input.category || null,
    tags: input.tags,
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
    status: input.status,
    publishedAt: input.status === "published" ? now : null,
    scheduledAt: input.status === "scheduled" && input.scheduledAt ? new Date(input.scheduledAt) : null,
  };
}

export const blogRouter = router({
  // Public: list published articles
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(articles).where(eq(articles.status, "published")).orderBy(desc(articles.publishedAt));
  }),

  // Public: get article by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(articles).where(and(eq(articles.slug, input.slug), eq(articles.status, "published"))).limit(1);
      return result[0] || null;
    }),

  // Admin: list all articles (including drafts)
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(articles).orderBy(desc(articles.createdAt));
  }),

  // Admin: get by id
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(articles).where(eq(articles.id, input.id)).limit(1);
      return result[0] || null;
    }),

  // Admin: create article
  create: adminProcedure
    .input(articleInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(articles).values(buildArticleWriteValues(input, new Date()));
      return { success: true };
    }),

  // Admin: update article
  update: adminProcedure
    .input(z.object({ id: z.number().int().positive() }).and(articleInput))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...data } = input;
      await db.update(articles).set(buildArticleWriteValues(data, new Date())).where(eq(articles.id, id));
      return { success: true };
    }),

  // Admin: upload an image for a content block
  uploadImage: adminProcedure
    .input(z.object({
      fileName: z.string().min(1).max(200),
      contentType: z.string(),
      data: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { bytes, contentType } = decodeBlogImageUpload(input.data, input.contentType);
      const requestedName = input.fileName.split(/[\\/]/).pop() ?? "image";
      const safeFileName = requestedName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^\.+/, "") || "image";
      const uploaded = await storagePut(`blog/${crypto.randomUUID()}-${safeFileName}`, bytes, contentType);
      return { ...uploaded, fileName: safeFileName };
    }),
});
