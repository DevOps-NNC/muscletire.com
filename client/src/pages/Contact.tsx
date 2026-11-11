import PublicLayout from "@/components/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { ServiceRequestForm } from "@/pages/RequestService";
import { useSiteTemplate } from "@/template/TemplateRuntime";
import { contactLinkTracking } from "@/lib/contactTracking";
import { ArrowUpRight, Phone, Mail, MapPin, MessageCircle, ShieldCheck } from "lucide-react";

export default function Contact() {
  const config = useSiteTemplate();
  const page = config.pages.find(item => item.id === "contact");
  const hero = page?.sections.find(section => section.kind === "hero");
  return <PublicLayout>
    <SEOHead title={page?.seoTitle ?? "Contact"} description={page?.seoDescription ?? "Contact our mobile mechanic team."} canonical="__BUSINESS_URL__/contact" />
    <section className="public-page--ink py-12 md:py-16"><div className="container max-w-7xl">
      <p className="text-sm font-black uppercase tracking-[.18em] text-primary">{hero?.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{hero?.title ?? "Contact us"}</h1>
      <p className="mb-8 mt-3 max-w-2xl text-lg leading-7 text-muted-foreground">{hero?.body ?? "Reach out by phone, text, email, or the guided request form."}</p>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(280px,.72fr)_minmax(0,1.28fr)] xl:gap-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:block xl:space-y-4">
          <ContactCard icon={<Phone />} title="Call us" href={`tel:${config.brand.phoneRaw}`} tracking={contactLinkTracking("call_us")}><span className="block font-bold text-primary">{config.brand.phone}</span><span className="contact-card__action">Call now <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span></ContactCard>
          <ContactCard icon={<MessageCircle />} title="Text us" href={`sms:${config.brand.phoneRaw}`} tracking={contactLinkTracking("text_us")}><span className="block font-bold text-primary">{config.brand.phone}</span><span className="mt-1 block text-sm text-muted-foreground">A good option for non-emergency questions.</span><span className="contact-card__action">Start a text <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span></ContactCard>
          <ContactCard icon={<Mail />} title="Email" href={`mailto:${config.brand.email}`} tracking={contactLinkTracking("email")}><span className="block break-all font-bold text-primary">{config.brand.email}</span><span className="contact-card__action">Send an email <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span></ContactCard>
          <ContactCard icon={<MapPin />} title="Service area"><p className="text-muted-foreground">{config.brand.city} and {config.brand.region}</p><p className="mt-1 text-sm text-muted-foreground">Mobile service comes to an approved, safely accessible location.</p></ContactCard>
          <ContactCard icon={<ShieldCheck />} title="Before you request"><p className="text-sm text-muted-foreground">Share the vehicle, concern, location, and preferred contact method. The team will discuss the next appropriate step.</p></ContactCard>
        </div>
        <div className="public-paper-card rounded-3xl border p-5 shadow-[0_20px_55px_-35px_color-mix(in_srgb,var(--color-hero-bg)_45%,transparent)] sm:p-7 md:p-8"><p className="mb-2 text-xs font-black uppercase tracking-[.14em] text-primary">Start here</p><h2 className="text-2xl font-black tracking-tight">Send the details once</h2><p className="mb-6 mt-2 max-w-2xl text-muted-foreground">Use the guided request when you want us to review your vehicle, location, and timing together.</p><ServiceRequestForm embedded /></div>
      </div>
    </div></section>
  </PublicLayout>;
}

function ContactCard({ icon, title, children, className = "", href, tracking }: { icon: React.ReactNode; title: string; children: React.ReactNode; className?: string; href?: string; tracking?: Record<string, string> }) {
  const content = <div className="flex items-start gap-4"><span className="mt-0.5 h-6 w-6 shrink-0 text-primary">{icon}</span><div className="min-w-0"><h3 className="mb-1 font-semibold">{title}</h3>{children}</div></div>;
  const classes = `public-paper-card block rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 ${className}`;
  return href ? <a href={href} {...tracking} className={classes}>{content}</a> : <div className={classes}>{content}</div>;
}
