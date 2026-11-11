export type PublishedArticleRecord = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  featuredImage: string | null;
  authorName: string | null;
  category: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  status: "draft" | "published" | "scheduled";
  publishedAt: Date | string | null;
  noIndex: boolean | null;
  readingTime: number | null;
  relatedServices: string[] | null;
  faqs: Array<{ question: string; answer: string }> | null;
  updatedAt: Date | string;
};

export type PublishedArticle = Omit<PublishedArticleRecord, "status" | "publishedAt" | "updatedAt"> & {
  status: "published";
  publishedAt: string | null;
  updatedAt: string;
};

function toIso(value: Date | string | null): string | null {
  if (value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Published article dates must be valid ISO dates");
  return date.toISOString();
}

export function normalizePublishedArticles(rows: PublishedArticleRecord[]): PublishedArticle[] {
  return rows
    .filter(row => row.status === "published" && !row.noIndex && row.slug.trim() && row.title.trim())
    .map(row => ({
      ...row,
      status: "published" as const,
      slug: row.slug.trim(),
      title: row.title.trim(),
      publishedAt: toIso(row.publishedAt),
      updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
      noIndex: false,
    }))
    .sort((left, right) => (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""));
}

export function serializePublishedArticles(articles: PublishedArticle[]): string {
  return `${JSON.stringify(articles, null, 2)}\n`;
}
