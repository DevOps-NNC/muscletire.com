import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { BLOG_INDEX_HREF } from "@shared/blogTracking";

const BLOG_ENGAGEMENT_QUERY = "utm_source=website&utm_medium=internal&utm_campaign=blog_engagement";

type BlogEngagementSectionProps = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export function shouldShowGlobalBlogEngagement(location: string) {
  return !location.startsWith("/blog") && !location.startsWith("/request") && !location.startsWith("/services/") && !location.startsWith("/service-areas/");
}

function articleHref(slug: string) {
  return `/blog/${encodeURIComponent(slug)}?${BLOG_ENGAGEMENT_QUERY}`;
}

function readingTime(article: { readingTime: number | null; content: string | null }) {
  if (article.readingTime) return article.readingTime;
  const words = article.content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return Math.max(2, Math.ceil(words / 220));
}

export default function BlogEngagementSection({
  title = "Learn before you book",
  description = "Clear answers for warning lights, no-starts, maintenance, and the next step for your vehicle.",
  compact = false,
}: BlogEngagementSectionProps) {
  const { data: articles } = trpc.blog.list.useQuery();
  const latestArticles = (articles ?? []).slice(0, 3);

  if (latestArticles.length === 0) return null;

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-page-bg)]" aria-labelledby="blog-engagement-heading">
      <div className={`container ${compact ? "py-10 md:py-12" : "py-14 md:py-16"}`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary"><BookOpen className="h-4 w-4" /> From the garage</p>
            <h2 id="blog-engagement-heading" className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl">{title}</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
          </div>
          <Link href={BLOG_INDEX_HREF} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Browse all guides <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {latestArticles.map(article => (
            <Link key={article.id} href={articleHref(article.slug)} className="group flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-muted-foreground">
                <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-primary">{article.category || "Vehicle care"}</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {readingTime(article)} min</span>
              </div>
              <h3 className="mt-5 text-xl font-black leading-tight text-foreground group-hover:text-primary">{article.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt || "Practical guidance for your next vehicle decision."}</p>
              <span className="mt-auto pt-5 text-sm font-bold text-primary">Read guide <ArrowRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
