import { useRoute, Link } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, Clock3 } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import BlogContentRenderer from "@/components/BlogContentRenderer";
import { trpc } from "@/lib/trpc";
import { SEOHead } from "@/components/SEOHead";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { BUSINESS_CONFIG } from "@shared/config";
import { parseBlogContent } from "@shared/blogContent";

function getReadingTime(content: string | null, value: number | null) {
  if (value) return value;
  const words = content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return Math.max(2, Math.ceil(words / 220));
}

function formatDate(value: string | Date | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recently published";
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  const { data: article, isLoading } = trpc.blog.getBySlug.useQuery({ slug });
  const { data: articles } = trpc.blog.list.useQuery(undefined, { enabled: Boolean(article) });

  if (isLoading) {
    return <PublicLayout><div className="container max-w-4xl py-16"><div className="animate-pulse space-y-5"><div className="h-5 w-28 rounded bg-muted" /><div className="h-12 w-4/5 rounded bg-muted" /><div className="h-5 w-3/5 rounded bg-muted" /><div className="h-80 rounded-2xl bg-muted" /></div></div></PublicLayout>;
  }

  if (!article) {
    return <PublicLayout><div className="container py-20 text-center"><BookOpen className="mx-auto h-12 w-12 text-primary/70" /><h1 className="mt-5 text-3xl font-bold">Article not found</h1><p className="mx-auto mt-3 max-w-md text-muted-foreground">That guide may have moved. Browse the latest articles or request help with your vehicle.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/blog"><Button variant="outline">Back to blog</Button></Link><Link href="/request-service"><Button>Request service</Button></Link></div></div></PublicLayout>;
  }

  const description = article.metaDescription || article.excerpt || "Practical mobile mechanic guidance for drivers in __CITY__ and __REGION__.";
  const canonical = `${BUSINESS_CONFIG.website}/blog/${article.slug}`;
  const readingTime = getReadingTime(article.content, article.readingTime);
  const relatedArticles = (articles ?? []).filter(item => item.slug !== article.slug).slice(0, 2);

  return (
    <PublicLayout>
      <SEOHead title={article.metaTitle || `${article.title} | __BUSINESS_NAME__`} description={description} canonical={canonical} ogType="article" image={article.ogImage || article.featuredImage || undefined} noIndex={Boolean(article.noIndex)} />
      <ArticleJsonLd title={article.title} description={description} url={canonical} author={article.authorName || BUSINESS_CONFIG.name} publishedAt={article.publishedAt} updatedAt={article.updatedAt} image={article.ogImage || article.featuredImage || undefined} />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }, { name: article.title, url: `/blog/${article.slug}` }]} />

      <div className="border-b border-border bg-muted/45"><div className="container py-3"><nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground"><Link href="/" className="hover:text-foreground">Home</Link><ChevronRight className="h-3.5 w-3.5" /><Link href="/blog" className="hover:text-foreground">Blog</Link><ChevronRight className="h-3.5 w-3.5" /><span className="line-clamp-1 text-foreground">{article.title}</span></nav></div></div>

      <article className="container max-w-6xl py-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="public-article-main min-w-0">
            <header className="max-w-3xl">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to all guides</Link>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"><span className="rounded-full bg-primary/10 px-3 py-1.5 text-primary">{article.category || "Vehicle care"}</span><span>{formatDate(article.publishedAt)}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {readingTime} min read</span></div>
              <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">{article.title}</h1>
              <p className="mt-5 text-lg leading-8 text-muted-foreground md:text-xl">{article.excerpt || description}</p>
              <div className="mt-6 flex items-center gap-3 border-y border-border py-4 text-sm text-muted-foreground"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-black text-secondary-foreground">NA</div><span>By <strong className="text-foreground">{article.authorName || BUSINESS_CONFIG.name}</strong><br /><span className="text-xs">Practical guidance for __CITY__-area drivers</span></span></div>
            </header>

            <BlogContentRenderer document={parseBlogContent(article.content)} className="mt-10 max-w-3xl" />

            {article.faqs && article.faqs.length > 0 && <section className="mt-12 max-w-3xl border-t border-border pt-8"><h2 className="text-2xl font-bold">Frequently asked questions</h2><div className="mt-5 space-y-3">{article.faqs.map((faq: { question: string; answer: string }, index: number) => <details key={index} className="group rounded-xl border border-border bg-card px-5 py-4"><summary className="cursor-pointer list-none pr-8 font-semibold marker:hidden">{faq.question}<span className="float-right text-primary transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p></details>)}</div></section>}

            <section className="mt-12 max-w-3xl overflow-hidden rounded-2xl bg-secondary p-7 text-secondary-foreground md:p-9"><div className="flex gap-4"><CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-accent" /><div><h2 className="text-2xl font-bold text-secondary-foreground">Still not sure what’s wrong?</h2><p className="mt-2 text-secondary-foreground/80">Share the symptoms, vehicle details, and your location. __BUSINESS_NAME__ can review the request and discuss the next step.</p><Link href="/request-service" className="mt-6 inline-block"><Button className="bg-primary text-primary-foreground hover:bg-primary/90">Request mobile service <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div></div></section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Need a mechanic?</p><h2 className="mt-2 text-xl font-bold">Get help at your location</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Request mobile diagnostics, brake service, battery help, maintenance, or an inspection in approved __REGION__ areas.</p><Link href="/request-service" className="mt-5 block"><Button className="w-full">Start a service request</Button></Link><a href={`tel:${BUSINESS_CONFIG.phoneRaw}`} className="mt-3 flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-bold text-foreground hover:border-primary hover:text-primary">Call {BUSINESS_CONFIG.phone}</a></div>
            {relatedArticles.length > 0 && <div className="mt-5 rounded-2xl border border-border bg-card p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Keep reading</p><div className="mt-4 space-y-4">{relatedArticles.map(item => <Link key={item.id} href={`/blog/${item.slug}`} className="group block border-b border-border pb-4 last:border-0 last:pb-0"><p className="text-xs font-semibold text-muted-foreground">{item.category || "Vehicle care"}</p><h3 className="mt-1 text-sm font-bold leading-5 group-hover:text-primary">{item.title}</h3><span className="mt-2 inline-flex items-center text-xs font-bold text-primary">Read guide <ArrowRight className="ml-1 h-3.5 w-3.5" /></span></Link>)}</div></div>}
          </aside>
        </div>
      </article>
    </PublicLayout>
  );
}
