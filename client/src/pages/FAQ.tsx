import PublicLayout from "@/components/PublicLayout";
import { ChevronRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_CONFIG } from "@shared/config";
import { Link } from "wouter";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbJsonLd, FAQPageJsonLd } from "@/components/JsonLd";
import { MOBILE_MECHANIC_FAQ_CATEGORIES, MOBILE_MECHANIC_FAQS } from "@shared/mobileMechanicFaq";

export default function FAQ() {
  return (
    <PublicLayout>
      <SEOHead
        title="FAQ — Mobile Mechanic Questions | __BUSINESS_NAME__"
        description="Frequently asked questions about mobile mechanic service in __CITY__. Learn about scheduling, pricing, service areas, and what to expect."
        canonical="__BUSINESS_URL__/faq"
      />
      <FAQPageJsonLd faqs={MOBILE_MECHANIC_FAQS.map((faq) => ({ question: faq.question, answer: faq.answer }))} url="/faq" />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "FAQ", url: "/faq" }]} />
      <section className="border-b border-primary/15 bg-secondary/30 py-12 md:py-16">
        <div className="container max-w-4xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-primary">__CITY__ &amp; __REGION__ mobile service</p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-[var(--color-text-main)] md:text-5xl">Mobile Mechanic FAQs</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">Clear answers about mobile repairs, location access, scheduling, vehicle concerns, pricing discussions, and what happens next.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/request-service"><Button size="lg" className="min-h-12 px-6 font-bold">Request Mobile Service</Button></Link>
            <a href={`tel:${BUSINESS_CONFIG.phoneRaw}`}><Button variant="outline" size="lg" className="min-h-12 border-primary/40 bg-[var(--color-card-bg)] px-6 font-bold text-[var(--color-text-main)]">Call {BUSINESS_CONFIG.phone}</Button></a>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container max-w-4xl">
          <div className="mb-9 flex flex-col gap-3 border-l-4 border-primary pl-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-main)] md:text-3xl">Get the details before you book</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">Open any question for a straightforward answer. If your vehicle concern is different, call, text, or start a request and the team can discuss the right next step.</p>
            </div>
            <span className="whitespace-nowrap text-sm font-bold text-primary">{MOBILE_MECHANIC_FAQS.length} helpful answers</span>
          </div>

          {MOBILE_MECHANIC_FAQ_CATEGORIES.map((category) => (
            <section key={category.title} className="mb-10 last:mb-0" aria-labelledby={`faq-${category.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
              <div className="mb-4">
                <h3 id={`faq-${category.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="text-xl font-bold text-[var(--color-text-main)] md:text-2xl">{category.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
              </div>
              <div className="space-y-3">
                {category.faqs.map((faq) => (
                  <details key={faq.question} className="group border-2 border-primary/15 bg-[var(--color-card-bg)] open:border-primary/50">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-bold leading-snug text-[var(--color-text-main)] outline-none active:bg-primary/5 focus-visible:ring-4 focus-visible:ring-primary/25 md:text-lg">
                      {faq.question}
                      <ChevronRight className="h-5 w-5 shrink-0 text-primary motion-reduce:transition-none transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
                    </summary>
                    <div className="border-t border-primary/15 px-5 py-4 text-base leading-relaxed text-muted-foreground">{faq.answer}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-12 border-y-4 border-primary bg-[var(--color-hero-bg)] px-6 py-9 text-center md:px-10">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Still not sure what service you need?</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text-inverse)] md:text-3xl">Tell us what your vehicle is doing.</h2>
            <p className="mx-auto mt-3 max-w-xl text-[color-mix(in_srgb,var(--color-text-inverse)_80%,transparent)]">Start a request with the symptom, warning light, or noise you noticed. The team can discuss the appropriate next step.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/request-service"><Button size="lg" className="min-h-12 px-6 font-bold">Start My Request</Button></Link>
            <a href={`tel:${BUSINESS_CONFIG.phoneRaw}`}>
                <Button variant="outline" size="lg" className="min-h-12 border-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)] bg-transparent px-6 font-bold text-[var(--color-text-inverse)] hover:bg-[var(--color-text-inverse)] hover:text-[var(--color-hero-bg)]"><Phone className="h-5 w-5" />Call {BUSINESS_CONFIG.phone}</Button>
            </a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
