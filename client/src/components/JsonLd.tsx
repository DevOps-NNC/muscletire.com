import clientConfig from "../../../client.config.json";
import { BUSINESS_CONFIG } from "@shared/config";

const businessId = `${BUSINESS_CONFIG.website}/#automotive-business`;
const shareImage = `${BUSINESS_CONFIG.website}/images/placeholder.svg`;
const areaNames = clientConfig.serviceAreas.map(area => area.name);
const siteState = clientConfig.business.state;

function JsonLdScript({ data }: { data: Record<string, unknown> }) { return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />; }

export function LocalBusinessJsonLd() {
  const data = { "@context": "https://schema.org", "@type": ["AutomotiveBusiness", "AutoRepair"], "@id": businessId, name: BUSINESS_CONFIG.name, alternateName: BUSINESS_CONFIG.shortName, description: "Mobile auto repair, maintenance, diagnostics, and inspections delivered to homes and workplaces throughout __CITY__ and __REGION__.", url: BUSINESS_CONFIG.website, image: shareImage, logo: shareImage, telephone: BUSINESS_CONFIG.phone, email: BUSINESS_CONFIG.email, areaServed: areaNames.map(name => ({ "@type": "City", name, containedInPlace: { "@type": "State", name: siteState } })), sameAs: [BUSINESS_CONFIG.googleBusinessProfile, BUSINESS_CONFIG.social.facebook, BUSINESS_CONFIG.social.instagram, BUSINESS_CONFIG.social.tiktok].filter(Boolean), contactPoint: { "@type": "ContactPoint", telephone: `+1${BUSINESS_CONFIG.phoneRaw}`, contactType: "customer service", areaServed: "US-" + clientConfig.business.stateCode, availableLanguage: "English" }, hasOfferCatalog: { "@type": "OfferCatalog", name: "Mobile mechanic services", itemListElement: ["Diagnostics", "Brake service", "Battery and electrical service", "Oil changes", "Tune-ups", "Cooling system repairs", "Pre-purchase inspections"].map(name => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })) } };
  return <JsonLdScript data={data} />;
}

export function WebSiteJsonLd() { return <JsonLdScript data={{ "@context": "https://schema.org", "@type": "WebSite", "@id": `${BUSINESS_CONFIG.website}/#website`, name: BUSINESS_CONFIG.shortName, url: BUSINESS_CONFIG.website, inLanguage: "en-US", publisher: { "@id": businessId } }} />; }

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) { return <JsonLdScript data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: `${BUSINESS_CONFIG.website}${item.url}` })) }} />; }

export function ServiceJsonLd({ name, description, url }: { name: string; description: string; url: string }) { return <JsonLdScript data={{ "@context": "https://schema.org", "@type": "Service", name, description, url: `${BUSINESS_CONFIG.website}${url}`, provider: { "@id": businessId, "@type": "AutomotiveBusiness", name: BUSINESS_CONFIG.name, telephone: BUSINESS_CONFIG.phone }, areaServed: areaNames.map(name => ({ "@type": "City", name, containedInPlace: { "@type": "State", name: siteState } })), serviceType: name, availableChannel: { "@type": "ServiceChannel", servicePhone: { "@type": "ContactPoint", telephone: `+1${BUSINESS_CONFIG.phoneRaw}`, contactType: "customer service" } } }} />; }

export function FAQPageJsonLd({ faqs, url }: { faqs: Array<{ question: string; answer: string }>; url?: string }) {
  return <JsonLdScript data={{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(url ? { "@id": `${BUSINESS_CONFIG.website}${url}#faqpage`, url: `${BUSINESS_CONFIG.website}${url}` } : {}),
    mainEntity: faqs.map(faq => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  }} />;
}

export function ArticleJsonLd({ title, description, url, author, publishedAt, updatedAt, image }: { title: string; description: string; url: string; author: string; publishedAt?: string | Date | null; updatedAt?: string | Date | null; image?: string }) {
  return <JsonLdScript data={{ "@context": "https://schema.org", "@type": "Article", headline: title, description, url, mainEntityOfPage: { "@type": "WebPage", "@id": url }, author: { "@type": "Organization", name: author, url: BUSINESS_CONFIG.website }, publisher: { "@id": businessId }, image: image || shareImage, datePublished: publishedAt ? new Date(publishedAt).toISOString() : undefined, dateModified: updatedAt ? new Date(updatedAt).toISOString() : undefined, inLanguage: "en-US" }} />;
}
