export const BLOG_INDEX_HREF =
  "/blog?utm_source=website&utm_medium=internal&utm_campaign=blog_navigation";

export function slugifyBlogTitle(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseBlogTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean),
    ),
  );
}

function buildShareUrl(
  baseUrl: string,
  postSlug: string,
  campaign: string,
  source: string,
  medium: string,
) {
  const url = new URL(`/blog/${encodeURIComponent(postSlug)}`, baseUrl);
  url.search = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  }).toString();
  return url.toString();
}

export function buildBlogShareLinks(baseUrl: string, slug: string) {
  const postSlug = slug.trim() || "article";
  const campaign = slugifyBlogTitle(postSlug) || "article";

  return {
    twitter: buildShareUrl(baseUrl, postSlug, campaign, "twitter", "social"),
    newsletter: buildShareUrl(baseUrl, postSlug, campaign, "newsletter", "email"),
  };
}
