import PublicLayout from "@/components/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { FAQPageJsonLd } from "@/components/JsonLd";
import { GoogleReviewsStrip } from "@/components/GoogleReviewsStrip";
import { TemplateSectionRenderer } from "@/components/template/TemplatePage";
import { useSiteTemplate } from "@/template/TemplateRuntime";

export default function Home() {
  const config = useSiteTemplate();
  const page = config.pages.find(item => item.id === "home") ?? config.pages[0];
  const faq = page?.sections.find(section => section.kind === "faq")?.items ?? [];
  if (!page) return null;
  const hero = page.sections.find(section => section.kind === "hero");
  const remaining = page.sections.filter(section => section.id !== hero?.id);
  return <PublicLayout><SEOHead title={page.seoTitle} description={page.seoDescription} canonical={`${config.brand.website}/`} /><TemplateBusinessJsonLd /><FAQPageJsonLd faqs={faq.map(item => ({ question: item.title, answer: item.description ?? "" }))} />{hero && <TemplateSectionRenderer section={hero} />}<GoogleReviewsStrip />{remaining.map(section => <TemplateSectionRenderer key={section.id} section={section} />)}</PublicLayout>;
}

function TemplateBusinessJsonLd() { const config = useSiteTemplate(); const data = { "@context": "https://schema.org", "@type": "AutomotiveBusiness", name: config.brand.businessName, url: config.brand.website, telephone: config.brand.phone, email: config.brand.email, areaServed: [config.brand.city, config.brand.region], sameAs: Object.values(config.brand.social) }; return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />; }
