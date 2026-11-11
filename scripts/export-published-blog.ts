import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { articles } from "../drizzle/schema.js";
import { getDb } from "../server/db.js";
import { normalizePublishedArticles, serializePublishedArticles, type PublishedArticleRecord } from "../shared/publishedBlog.js";

const outputPath = path.resolve(process.env.PUBLIC_PUBLISHED_BLOG_EXPORT ?? "dist/.generated/published-blog.json");
const fixturePath = process.env.PUBLISHED_BLOG_EXPORT_FIXTURE;

async function readSourceRows(): Promise<PublishedArticleRecord[]> {
  if (fixturePath) {
    const fixture = await fs.readFile(path.resolve(fixturePath), "utf8");
    return JSON.parse(fixture) as PublishedArticleRecord[];
  }

  const db = await getDb();
  if (!db) {
    if (process.env.CI === "true" || process.env.TEMPLATE_BUILD_ALLOW_EMPTY_BLOG === "true") return [];
    throw new Error("Published blog export requires a configured database. Set NEON_DATABASE_URL before production deployment.");
  }

  return db.select().from(articles).where(eq(articles.status, "published")).orderBy(desc(articles.publishedAt));
}

const exported = normalizePublishedArticles(await readSourceRows());
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, serializePublishedArticles(exported), "utf8");
console.log(`Exported ${exported.length} published blog articles to ${path.relative(process.cwd(), outputPath)}.`);
