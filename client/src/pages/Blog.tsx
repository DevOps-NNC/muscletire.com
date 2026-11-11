import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Clock3, Search, Sparkles, Wrench } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { trpc } from "@/lib/trpc";
import { BUSINESS_CONFIG } from "@shared/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BlogArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  authorName: string | null;
  publishedAt: string | Date | null;
  readingTime: number | null;
  content: string | null;
}

function getReadingTime(article: BlogArticle) {
  if (article.readingTime) return article.readingTime;
  const words = article.content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return Math.max(2, Math.ceil(words / 220));
}

function formatDate(value: BlogArticle["publishedAt"]) {
  if (!value) return "New guide";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Blog() {
  const { data: articles, isLoading } = trpc.blog.list.useQuery();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All guides");

  const categories = useMemo(() => {
    const values = (articles ?? []).map(article => article.category).filter((category): category is string => Boolean(category));
    return ["All guides", ...Array.from(new Set(values))];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ((articles ?? []) as BlogArticle[]).filter(article => {
      const matchesCategory = activeCategory === "All guides" || article.category === activeCategory;
      const searchable = `${article.title} ${article.excerpt ?? ""} ${article.category ?? ""}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeCategory, articles, query]);

  const featuredArticle = filteredArticles[0];
  const remainingArticles = filteredArticles.slice(1);

  return (
    <PublicLayout>
      <SEOHead
        title="Mobile Mechanic Guides for __CITY__ Drivers | __BUSINESS_NAME__"
        description="Technician-reviewed mobile mechanic guides for __CITY__ and __REGION__ drivers. Learn what symptoms mean and what to do next."
        canonical={`${BUSINESS_CONFIG.website}/blog`}
        noIndex={!isLoading && !articles?.length}
      />

      <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-hero-bg)] text-[var(--color-text-inverse)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-primary)_28%,transparent),transparent_45%)]" />
        <div className="container relative py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary-soft-foreground)]">
              <BookOpen className="h-3.5 w-3.5" /> Driver's knowledge center
            </div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-[var(--color-text-inverse)] md:text-6xl">Know what your car is telling you.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[color-mix(in_srgb,var(--color-text-inverse)_80%,transparent)] md:text-lg">Clear, practical guidance for __CITY__ drivers—from warning lights and no-start symptoms to choosing the right kind of repair help.</p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-[color-mix(in_srgb,var(--color-text-inverse)_80%,transparent)]">
              <span className="inline-flex items-center gap-2"><Wrench className="h-4 w-4 text-accent" /> Technician-reviewed topics</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Written for __REGION__ drivers</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-page-bg)]">
        <div className="container py-10 md:py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Latest guides</p>
              <h2 className="mt-1 text-2xl font-bold md:text-3xl">Start with the problem you’re facing</h2>
            </div>
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search guides" aria-label="Search guides" className="h-11 border-[var(--color-border)] bg-[var(--color-card-bg)] pl-9" />
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Filter articles by category">
            {categories.map(category => (
              <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${activeCategory === category ? "border-primary bg-primary text-primary-foreground" : "border-[var(--color-border)] bg-[var(--color-card-bg)] text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                {category}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
              <div className="h-72 animate-pulse rounded-2xl bg-muted" />
              <div className="space-y-4"><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-32 animate-pulse rounded-2xl bg-muted" /></div>
            </div>
          ) : featuredArticle ? (
            <>
              <Link href={`/blog/${featuredArticle.slug}`} className="group mt-8 block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
                <div className="grid lg:grid-cols-[1.1fr_1fr]">
                  <div className="theme-blog-featured relative flex min-h-72 flex-col justify-end overflow-hidden p-7 text-[var(--color-text-inverse)] md:p-10">
                    <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[28px] border-[color-mix(in_srgb,var(--color-text-inverse)_10%,transparent)]" />
                    <div className="absolute bottom-8 right-10 h-20 w-20 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] blur-2xl" />
                    <div className="relative z-10 text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary-soft-foreground)]">Featured guide</div>
                    <h3 className="relative z-10 mt-3 max-w-xl text-3xl font-black leading-tight text-[var(--color-text-inverse)] md:text-4xl">{featuredArticle.title}</h3>
                    <div className="relative z-10 mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary-soft-foreground)]">Read the guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
                  </div>
                  <div className="flex flex-col justify-center p-7 md:p-10">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground"><span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-primary">{featuredArticle.category ?? "Vehicle care"}</span><span>{formatDate(featuredArticle.publishedAt)}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {getReadingTime(featuredArticle)} min read</span></div>
                    <p className="mt-5 text-base leading-7 text-muted-foreground">{featuredArticle.excerpt ?? "A practical guide from __BUSINESS_NAME__ to help you understand the next step."}</p>
                    <p className="mt-6 text-sm font-semibold text-foreground">By {featuredArticle.authorName ?? "__BUSINESS_NAME__"}</p>
                  </div>
                </div>
              </Link>

              {remainingArticles.length > 0 && <div className="mt-8 grid gap-5 md:grid-cols-2">
                {remainingArticles.map(article => <Link key={article.id} href={`/blog/${article.slug}`} className="group flex min-h-52 flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground"><span className="rounded-full bg-[var(--color-secondary-soft)] px-3 py-1 text-foreground">{article.category ?? "Vehicle care"}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {getReadingTime(article)} min</span></div>
                  <h3 className="mt-5 text-xl font-bold leading-snug text-foreground group-hover:text-primary">{article.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt ?? "Practical vehicle guidance for drivers in __CITY__ and __REGION__."}</p>
                  <div className="mt-auto pt-5 text-sm font-bold text-primary">Read article <ArrowRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
                </Link>)}
              </div>}
            </>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card-bg)] px-6 py-14 text-center"><BookOpen className="mx-auto h-10 w-10 text-primary/70" /><h2 className="mt-4 text-xl font-bold">No guides match that search.</h2><p className="mx-auto mt-2 max-w-md text-muted-foreground">Try another phrase or browse all guides. If your vehicle needs attention now, we can help you start a service request.</p><Link href="/request-service"><Button className="mt-6">Request service</Button></Link></div>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-muted/40"><div className="container flex flex-col gap-5 py-10 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Need help now?</p><h2 className="mt-1 text-2xl font-bold">Bring the details. We’ll discuss the next step.</h2><p className="mt-2 max-w-2xl text-muted-foreground">Share your vehicle, symptoms, and location so __BUSINESS_NAME__ can review the request.</p></div><Link href="/request-service" className="shrink-0"><Button size="lg" className="w-full md:w-auto">Request mobile service <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div></section>
    </PublicLayout>
  );
}
