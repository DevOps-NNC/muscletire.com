import { Button } from "@/components/ui/button";
import { useSiteTemplate } from "@/template/TemplateRuntime";
import type { TemplateItem, TemplatePage as TemplatePageModel, TemplateSection, TemplateVideo } from "@shared/siteTemplate";
import { ArrowRight, CalendarDays, ChevronRight, CircleCheck, Instagram, MapPin, MessageCircle, Pencil, Play, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { useEffect, useState, type SyntheticEvent } from "react";
import { Link } from "wouter";

const iconMap = { message: MessageCircle, calendar: CalendarDays, wrench: Wrench, check: CircleCheck, shield: ShieldCheck, map: MapPin };
const templateImageFallback = "/images/placeholder.svg";

function TemplateAction({ label, href, primary = true }: { label?: string; href?: string; primary?: boolean }) {
  if (!label || !href) return null;
  const button = <Button size="lg" variant={primary ? "default" : "outline"} className={`template-action ${primary ? "template-primary-action" : "template-secondary-action"} min-h-12 gap-2 ${primary ? "" : "border-current bg-transparent"}`}>{label}<ArrowRight className="h-4 w-4" /></Button>;
  return href.startsWith("tel:") || href.startsWith("http") ? <a href={href}>{button}</a> : <Link href={href}>{button}</Link>;
}

function SectionHeading({ section, align = "center" }: { section: TemplateSection; align?: "left" | "center" }) {
  return <div className={`mb-9 ${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}`}>
    {section.eyebrow && <p className="text-sm font-black uppercase tracking-[.18em] text-primary">{section.eyebrow}</p>}
    <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{section.title}</h2>
    {section.body && <p className="mt-3 text-lg leading-8 text-muted-foreground">{section.body}</p>}
  </div>;
}

function HeroMedia({ section }: { section: TemplateSection }) {
  const [attempt, setAttempt] = useState<"responsive" | "durable" | "generic">("responsive");
  const [hasFailed, setHasFailed] = useState(false);
  const media = section.media;
  const durableSrc = media?.fallbackSrc || section.image || templateImageFallback;
  const genericFallbackSrc = templateImageFallback !== durableSrc ? templateImageFallback : "";
  const src = attempt === "generic" ? genericFallbackSrc : durableSrc;

  const handleError = (_event: SyntheticEvent<HTMLImageElement>) => {
    if (attempt === "responsive") {
      setAttempt("durable");
      return;
    }
    if (attempt === "durable" && genericFallbackSrc) {
      setAttempt("generic");
      return;
    }
    setHasFailed(true);
  };

  if (hasFailed) {
    return <div role="img" aria-label="__BUSINESS_NAME__ mobile vehicle service" className="theme-template-media-fallback flex aspect-[16/11] w-full items-end rounded-3xl border border-[color-mix(in_srgb,var(--color-text-inverse)_20%,transparent)] p-6 shadow-2xl"><div className="max-w-[17rem]"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Wrench className="h-5 w-5" /></span><p className="mt-4 text-sm font-black uppercase tracking-[.16em] text-primary">Mobile service</p><p className="mt-2 text-xl font-black leading-tight text-[var(--color-text-inverse)]">Vehicle help starts where you are safely parked.</p></div></div>;
  }

  const image = <img src={src} alt={media?.alt || `${section.title} — __BUSINESS_NAME__`} width={media?.width || 1600} height={media?.height || 900} fetchPriority="high" loading="eager" decoding="async" onError={handleError} className="template-media__image h-full w-full rounded-3xl border border-[color-mix(in_srgb,var(--color-text-inverse)_15%,transparent)] object-cover shadow-2xl" />;

  if (attempt === "responsive" && media?.webpSrcSet) {
    return <picture className="template-media block aspect-[16/11] w-full"><source type="image/webp" srcSet={media.webpSrcSet} sizes={media.sizes || "100vw"} />{image}</picture>;
  }

  return <div className="template-media aspect-[16/11] w-full">{image}</div>;
}

function HeroSection({ section }: { section: TemplateSection }) {
  return <section className="template-hero relative isolate overflow-hidden bg-[var(--color-hero-bg)] text-[var(--color-text-inverse)]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,color-mix(in_srgb,var(--color-primary)_35%,transparent),transparent_40%),linear-gradient(110deg,var(--color-hero-bg)_0%,var(--color-hero-bg)_48%,color-mix(in_srgb,var(--color-hero-bg)_70%,transparent)_100%)]" /><div className="template-hero__inner container relative grid gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.85fr)] lg:items-center"><div><p className="template-eyebrow inline-flex rounded-full border border-[color-mix(in_srgb,var(--color-text-inverse)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-text-inverse)_10%,transparent)] px-3 py-1.5 text-sm font-bold text-[var(--color-text-inverse)]">{section.eyebrow}</p><h1 className="template-hero__title mt-5 max-w-3xl !text-[var(--color-text-inverse)] text-5xl font-black leading-[.94] tracking-[-.045em] md:text-6xl">{section.title}</h1>{section.body && <p className="template-hero__body mt-6 max-w-2xl text-lg leading-8 text-[color-mix(in_srgb,var(--color-text-inverse)_80%,transparent)]">{section.body}</p>}<div className="mt-8 flex flex-wrap gap-3"><TemplateAction label={section.primaryCtaLabel} href={section.primaryCtaHref} /><TemplateAction label={section.secondaryCtaLabel} href={section.secondaryCtaHref} primary={false} /></div></div>{(section.image || section.media) && <div className="relative"><HeroMedia section={section} /></div>}</div></section>;
}

function FeatureGridSection({ section }: { section: TemplateSection }) {
  return <section className="template-surface template-surface--paper border-y border-border py-16 md:py-20"><div className="container"><SectionHeading section={section} /> <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">{(section.items ?? []).map((item, index) => { const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Sparkles; return <div key={`${item.title}-${index}`} className="template-card rounded-2xl border border-border bg-background p-6 shadow-sm"><div className="mb-6 flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></span><span className="font-black text-primary/45">0{index + 1}</span></div><h3 className="text-xl font-black">{item.title}</h3>{item.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>}</div>; })}</div></div></section>;
}

function ServiceGridSection({ section }: { section: TemplateSection }) {
  return <section className="template-surface template-surface--ink py-16 md:py-20"><div className="container"><SectionHeading section={section} align="left" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(section.items ?? []).map((item, index) => <TemplateServiceCard key={`${item.title}-${index}`} item={item} />)}</div></div></section>;
}
function TemplateServiceCard({ item }: { item: TemplateItem }) { const card = <div className="template-card group h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">{item.image && <div className="template-card__media h-48"><img src={item.image} alt={`${item.title} mobile mechanic service`} width={720} height={480} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>}<div className="p-6"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black">{item.title}</h3>{item.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>}</div><ChevronRight className="h-5 w-5 shrink-0 text-primary" /></div></div></div>; return item.href ? <Link href={item.href}>{card}</Link> : card; }

function FAQSection({ section }: { section: TemplateSection }) { return <section className="template-surface template-surface--paper bg-card py-16 md:py-20"><div className="container max-w-4xl"><SectionHeading section={section} /> <div className="space-y-3">{(section.items ?? []).map((item, index) => <details key={`${item.title}-${index}`} className="template-card group rounded-2xl border border-border bg-background px-6 py-5 shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black"><span>{item.title}</span><span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary group-open:rotate-45">+</span></summary>{item.description && <p className="mt-4 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">{item.description}</p>}</details>)}</div></div></section>; }

function AreaListSection({ section }: { section: TemplateSection }) { return <section className="template-surface template-surface--ink py-16 md:py-20"><div className="container"><SectionHeading section={section} /><div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2.5">{(section.items ?? []).map((item, index) => <span key={`${item.title}-${index}`} className="template-chip rounded-full border border-border bg-card px-4 py-2 text-sm font-bold">{item.title}</span>)}</div></div></section>; }

function CTASection({ section }: { section: TemplateSection }) { return <section className="template-cta bg-[var(--color-hero-bg)] py-16 text-[var(--color-text-inverse)] md:py-20"><div className="container"><div className="template-cta-panel text-center"><p className="template-eyebrow text-sm font-black uppercase tracking-[.18em] text-primary">{section.eyebrow}</p><h2 className="template-cta__title mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">{section.title}</h2>{section.body && <p className="template-cta__body mx-auto mt-4 max-w-2xl text-lg">{section.body}</p>}<div className="mt-8 flex flex-wrap justify-center gap-3"><TemplateAction label={section.primaryCtaLabel} href={section.primaryCtaHref} /><TemplateAction label={section.secondaryCtaLabel} href={section.secondaryCtaHref} primary={false} /></div></div></div></section>; }

function StorySection({ section }: { section: TemplateSection }) { return <section className="template-surface template-surface--ink py-16 md:py-20"><div className="container grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center"><div><SectionHeading section={section} align="left" /></div><div className="template-story-card rounded-3xl bg-[var(--color-hero-bg)] p-7 text-[var(--color-text-inverse)]"><p className="template-eyebrow text-sm font-black uppercase tracking-[.18em] text-primary">The mobile-service difference</p><p className="mt-5 text-lg leading-8 text-[color-mix(in_srgb,var(--color-text-inverse)_80%,transparent)]">{section.body}</p></div></div></section>; }

function TikTokVideoEmbed({ video }: { video: TemplateVideo }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | undefined>(video.thumbnailUrl);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setPreviewSrc(video.thumbnailUrl);
    setPreviewFailed(false);
    void fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(video.originalUrl)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() as Promise<{ thumbnail_url?: string }> : null)
      .then(data => {
        if (data?.thumbnail_url) setPreviewSrc(data.thumbnail_url);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [video.originalUrl]);

  return <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"><div className="relative mx-auto aspect-[9/16] max-h-[620px] w-full max-w-[360px] bg-[var(--color-hero-bg)]">{isLoaded ? <iframe src={video.embedUrl} title={video.title} className="absolute inset-0 h-full w-full border-0" loading="lazy" allow="encrypted-media; fullscreen" referrerPolicy="strict-origin-when-cross-origin" /> : <button type="button" onClick={() => setIsLoaded(true)} className="absolute inset-0 overflow-hidden text-center text-[var(--color-text-inverse)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary" aria-label={`Play TikTok video: ${video.title}`}>{previewSrc && !previewFailed ? <img src={previewSrc} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setPreviewFailed(true)} /> : <div className="absolute inset-0 grid place-items-center bg-[var(--color-hero-bg)] p-8"><div><Play className="mx-auto h-12 w-12 text-primary" aria-hidden="true" /><p className="mt-4 text-sm font-black">TikTok video preview</p><p className="mt-2 text-xs text-[color-mix(in_srgb,var(--color-text-inverse)_72%,transparent)]">{video.title}</p></div></div>}<span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25" /><span className="relative z-10 grid h-full place-items-center p-6"><span><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"><Play className="h-5 w-5 fill-current" /></span><span className="mt-4 block text-sm font-black">Play repair video</span><span className="mt-1 block text-xs text-white/80">Preview from TikTok</span></span></span></button>}</div><div className="flex items-center justify-between gap-3 border-t border-border p-4"><p className="font-bold leading-5">{video.title}</p><a href={video.originalUrl} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-black text-primary hover:underline">Open in TikTok</a></div></article>;
}

function SocialSection({ section }: { section: TemplateSection }) {
  const config = useSiteTemplate();
  const videos = section.videos ?? [];
  return <section className="template-surface template-surface--paper border-y border-border bg-primary/5 py-16 md:py-20"><div className="container"><SectionHeading section={section} />{videos.length > 0 ? <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">{videos.map(video => <TikTokVideoEmbed key={video.id} video={video} />)}</div> : <div className="template-card mx-auto max-w-[370px] rounded-3xl border border-border bg-card p-5 text-center shadow-sm"><p className="font-bold">TikTok videos can be added from Template Studio.</p></div>}<div className="mx-auto mt-6 flex max-w-4xl flex-col gap-3 sm:flex-row"><a href={config.brand.social.tiktok} target="_blank" rel="noreferrer" className="template-card flex min-h-16 flex-1 items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-hero-bg)] text-[var(--color-text-inverse)]"><Play className="h-4 w-4 fill-current" /></span><span className="font-black">Watch more on TikTok</span><ArrowRight className="ml-auto h-4 w-4 text-primary" /></a><a href={config.brand.social.instagram} target="_blank" rel="noreferrer" className="template-card flex min-h-16 flex-1 items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Instagram className="h-5 w-5" /></span><span className="font-black">Follow on Instagram</span><ArrowRight className="ml-auto h-4 w-4 text-primary" /></a></div></div></section>;
}

export function TemplateSectionRenderer({ section, editMode = false, onEdit }: { section: TemplateSection; editMode?: boolean; onEdit?: (section: TemplateSection) => void }) {
  if (!section.enabled) return null;
  const rendered = section.kind === "hero" ? <HeroSection section={section} />
    : section.kind === "featureGrid" ? <FeatureGridSection section={section} />
    : section.kind === "serviceGrid" ? <ServiceGridSection section={section} />
    : section.kind === "faq" ? <FAQSection section={section} />
    : section.kind === "areaList" ? <AreaListSection section={section} />
    : section.kind === "cta" ? <CTASection section={section} />
    : section.kind === "social" ? <SocialSection section={section} />
    : <StorySection section={section} />;
  if (!editMode || !onEdit) return rendered;
  return <div className="group/editor relative cursor-pointer outline-none transition focus-within:ring-4 focus-within:ring-primary/30" onDoubleClick={() => onEdit(section)} tabIndex={0} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onEdit(section); } }} aria-label={`Edit ${section.label}`}><button type="button" onClick={() => onEdit(section)} className="absolute right-4 top-4 z-20 inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-3 text-sm font-black text-primary opacity-0 shadow-lg transition group-hover/editor:opacity-100 group-focus-within/editor:opacity-100"><Pencil className="h-4 w-4" /> Edit section</button>{rendered}</div>;
}

export function TemplatePageRenderer({ page, editMode = false, onEditSection }: { page: TemplatePageModel; editMode?: boolean; onEditSection?: (section: TemplateSection) => void }) { return <>{page.sections.map(section => <TemplateSectionRenderer key={section.id} section={section} editMode={editMode} onEdit={onEditSection} />)}</>; }
