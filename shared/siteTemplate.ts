import { HOME_FAQ_ITEMS } from "./mobileMechanicFaq";

export type TemplateSectionKind = "hero" | "featureGrid" | "serviceGrid" | "faq" | "cta" | "story" | "social" | "areaList";

export type TemplateItem = {
  title: string;
  description?: string;
  icon?: string;
  image?: string;
  href?: string;
  tag?: string;
};

export type TemplateVideo = {
  id: string;
  title: string;
  embedUrl: string;
  originalUrl: string;
  thumbnailUrl?: string;
};

export type TemplateResponsiveMedia = {
  fallbackSrc: string;
  webpSrcSet?: string;
  sizes?: string;
  width: number;
  height: number;
  alt: string;
};

export type TemplateSection = {
  id: string;
  label: string;
  kind: TemplateSectionKind;
  enabled: boolean;
  eyebrow?: string;
  title: string;
  body?: string;
  image?: string;
  media?: TemplateResponsiveMedia;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  items?: TemplateItem[];
  videos?: TemplateVideo[];
};

export type TemplatePage = {
  id: "home" | "about" | "services" | "areas" | "contact";
  label: string;
  seoTitle: string;
  seoDescription: string;
  sections: TemplateSection[];
};

export type TemplatePalette = {
  name: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  background: string;
  foreground: string;
  mutedForeground: string;
  accent: string;
  surface: string;
  darkSurface: string;
  darkSurfaceForeground: string;
};

export type SiteTemplateConfig = {
  version: 1;
  brand: {
    businessName: string;
    shortName: string;
    ownerName: string;
    logoUrl: string;
    phone: string;
    phoneRaw: string;
    email: string;
    website: string;
    city: string;
    region: string;
    social: { instagram: string; tiktok: string; facebook: string };
  };
  palette: TemplatePalette;
  integrations: {
    googleAnalyticsId: string;
    googleTagManagerId: string;
    metaPixelId: string;
    googleMapsBrowserKey: string;
    headHtml: string;
    bodyHtml: string;
  };
  webhooks: {
    leadCaptureUrl: string;
    crmWebhookUrl: string;
  };
  pages: TemplatePage[];
};

export const TEMPLATE_SECTION_KINDS: Array<{ value: TemplateSectionKind; label: string }> = [
  { value: "hero", label: "Hero" },
  { value: "featureGrid", label: "Feature grid" },
  { value: "serviceGrid", label: "Service grid" },
  { value: "faq", label: "FAQ" },
  { value: "cta", label: "Call to action" },
  { value: "story", label: "Story / split content" },
  { value: "social", label: "Social proof" },
  { value: "areaList", label: "Service areas" },
];

const LEGACY_HOME_FAQ_ITEMS: TemplateItem[] = [
  { title: "What is a mobile mechanic?", description: "A mobile mechanic comes to your location — home, workplace, or roadside — to perform vehicle repairs and maintenance." },
  { title: "What areas do you serve?", description: "We serve __CITY__ and the greater __REGION__ area, including surrounding communities." },
  { title: "How do I schedule service?", description: "Call, text, or complete the guided service request. We will discuss availability and scheduling with you." },
];
const LEGACY_HOME_HERO_IMAGE = "/images/placeholder.svg";

export const DEFAULT_SITE_TEMPLATE: SiteTemplateConfig = {
  version: 1,
  brand: {
    businessName: "__BUSINESS_LEGAL_NAME__",
    shortName: "__BUSINESS_NAME__",
    ownerName: "__OWNER_NAME__",
    logoUrl: "/images/placeholder.svg",
    phone: "__BUSINESS_PHONE__",
    phoneRaw: "__BUSINESS_PHONE_RAW__",
    email: "__BUSINESS_EMAIL__",
    website: "__BUSINESS_URL__",
    city: "__CITY__",
    region: "__REGION__",
    social: { instagram: "__INSTAGRAM_URL__", tiktok: "__TIKTOK_URL__", facebook: "__FACEBOOK_URL__" },
  },
  palette: {
    name: "Garage green & orange",
    primary: "#f4511e",
    primaryForeground: "#ffffff",
    secondary: "#f7e8ce",
    background: "#fff8e9",
    foreground: "#073b32",
    mutedForeground: "#52635d",
    accent: "#f6b741",
    surface: "#fffdf7",
    darkSurface: "#063b32",
    darkSurfaceForeground: "#fff8e9",
  },
  integrations: { googleAnalyticsId: "", googleTagManagerId: "__GTM_ID__", metaPixelId: "", googleMapsBrowserKey: "", headHtml: "", bodyHtml: "" },
  webhooks: { leadCaptureUrl: "", crmWebhookUrl: "" },
  pages: [
    {
      id: "home", label: "Home", seoTitle: "__CITY__ Mobile Mechanic — We Come to You", seoDescription: "Mobile auto repair, diagnostics, brakes, battery service, and maintenance at your __CITY__ or __REGION__ location.", sections: [
        { id: "hero", label: "Hero H1 title", kind: "hero", enabled: true, eyebrow: "__CITY__ & __REGION__ mobile service", title: "Your car problem doesn’t need a tow truck.", body: "Get an experienced mobile mechanic at your home, workplace, or roadside location. Start with a quick request — then we’ll help you choose the right next step.", image: "/images/placeholder.svg", media: { fallbackSrc: "/images/placeholder.svg", webpSrcSet: "/images/placeholder.svg 768w, /images/placeholder.svg 1280w, /images/placeholder.svg 1600w", sizes: "(max-width: 1023px) 100vw, 44vw", width: 1600, height: 900, alt: "Mobile mechanic performing vehicle service at a customer location in __CITY__, Florida" }, primaryCtaLabel: "Start My Service Request", primaryCtaHref: "/request-service", secondaryCtaLabel: "Call Now", secondaryCtaHref: "tel:__BUSINESS_PHONE_RAW__" },
        { id: "process", label: "How it works", kind: "featureGrid", enabled: true, eyebrow: "A simple, clear process", title: "From car trouble to a clear plan in three steps.", body: "We keep the first decision easy, then collect only the details needed to help you.", items: [{ title: "Tell us the symptom", description: "Call, text, or start the guided request. Begin with what is happening now.", icon: "message" }, { title: "Confirm a plan", description: "We review the request with you and discuss the best available next step.", icon: "calendar" }, { title: "Service at your location", description: "A mobile mechanic meets your vehicle where it is parked or safely accessible.", icon: "wrench" }] },
        { id: "services", label: "Featured services", kind: "serviceGrid", enabled: true, eyebrow: "Choose what feels closest", title: "Mobile service for the issues that interrupt your day.", body: "Six familiar starting points. If yours is different, choose other in the request form.", items: [{ title: "Diagnostics", description: "Warning light, no-start, or hard-to-pin-down issue? Get an on-site diagnosis.", href: "/services/diagnostics", image: "/images/placeholder.svg" }, { title: "Brake Service", description: "Responsive, reliable brake repairs and inspections where your vehicle is parked.", href: "/services/brake-service", image: "/images/placeholder.svg" }, { title: "Battery & Electrical", description: "Battery, alternator, starter, and electrical diagnosis without the tow.", href: "/services/battery-replacement", image: "/images/placeholder.svg" }] },
        { id: "areas", label: "Service areas", kind: "areaList", enabled: true, eyebrow: "We come to you", title: "Serving __CITY__ and __REGION__.", body: "Mobile service is available at homes, workplaces, and safely accessible locations.", items: ["__CITY__"].map(title => ({ title })) },
        { id: "faq", label: "Frequently asked questions", kind: "faq", enabled: true, eyebrow: "Before you request service", title: "A few helpful answers.", items: HOME_FAQ_ITEMS },
        { id: "cta", label: "Final call to action", kind: "cta", enabled: true, eyebrow: "Clear next steps", title: "Ready to get a clear next step for your vehicle?", body: "Start a guided request in a few minutes, or call if you would rather explain the issue directly.", primaryCtaLabel: "Start My Request", primaryCtaHref: "/request-service", secondaryCtaLabel: "Call Now", secondaryCtaHref: "tel:__BUSINESS_PHONE_RAW__" },
      ],
    },
    { id: "about", label: "About", seoTitle: "Meet __OWNER_NAME__ | __CITY__ Mobile Mechanic", seoDescription: "Meet the mobile mechanic behind __BUSINESS_NAME__ and learn how on-location repair works.", sections: [{ id: "about-hero", label: "About hero", kind: "hero", enabled: true, eyebrow: "__CITY__ mobile mechanic", title: "The shop that comes to you.", body: "__BUSINESS_NAME__ brings diagnostics, repair, and maintenance to homes, workplaces, and roadside locations across __CITY__ and __REGION__.", image: "/images/placeholder.svg", primaryCtaLabel: "Request service", primaryCtaHref: "/request-service" }, { id: "about-story", label: "Owner story", kind: "story", enabled: true, eyebrow: "Meet __OWNER_NAME__", title: "Experience you can see in the work.", body: "The goal is simple: understand the concern, explain the next step clearly, and help drivers move forward with confidence." }, { id: "about-social", label: "Social section", kind: "social", enabled: true, eyebrow: "From the field", title: "See the work beyond the website.", body: "Watch repair work and behind-the-scenes mobile mechanic content from the field.", image: "/images/placeholder.svg", videos: [] }] },
    { id: "services", label: "Services", seoTitle: "Mobile Mechanic Services", seoDescription: "Diagnostics, maintenance, repair, and inspections at your location.", sections: [{ id: "services-hero", label: "Services page title", kind: "hero", enabled: true, eyebrow: "Mobile mechanic services", title: "Vehicle care that comes to you.", body: "Choose a service category or tell us what your vehicle is doing." }, { id: "service-catalog", label: "Service catalog", kind: "serviceGrid", enabled: true, eyebrow: "Available mobile services", title: "Care where your vehicle is parked.", body: "Choose a service category, or send a request if you are not sure which service fits.", items: [{ title: "Vehicle Diagnostics", description: "Complete computer diagnostics, check engine light diagnosis, and no-start troubleshooting.", icon: "gauge", href: "/services/diagnostics" }, { title: "Brake Service", description: "Brake pad and rotor replacement, brake fluid flush, and complete brake system inspection.", icon: "shield", href: "/services/brake-service" }, { title: "Battery & Electrical", description: "Battery testing and replacement, alternator testing, starter diagnosis, and electrical system repair.", icon: "battery", href: "/services/battery-replacement" }, { title: "Oil Changes", description: "Conventional and synthetic oil changes with filter replacement at your location.", icon: "car", href: "/services/oil-change" }, { title: "Tune-Ups & Maintenance", description: "Spark plugs, air filters, fuel filters, belts, and scheduled maintenance services.", icon: "wrench", href: "/services/tune-up" }, { title: "Pre-Purchase Inspections", description: "Comprehensive vehicle inspection before buying a used car.", icon: "check", href: "/services/pre-purchase-inspections" }, { title: "Cooling System & Radiator", description: "Radiator repair, coolant flush, thermostat replacement, and overheating diagnosis.", icon: "thermometer", href: "/services/cooling-system" }, { title: "Electrical System Repair", description: "Wiring repair, fuse diagnosis, lighting issues, and electrical component replacement.", icon: "zap", href: "/services/electrical-repair" }, { title: "Belt & Hose Replacement", description: "Serpentine belt, timing belt, and coolant hose replacement.", icon: "wrench", href: "/services/belt-replacement" }, { title: "AC Repair & Recharge", description: "Air conditioning diagnosis, refrigerant recharge, and AC component repair.", icon: "thermometer", href: "/services/ac-repair" }] }] },
    { id: "areas", label: "Service Areas", seoTitle: "Mobile Mechanic Service Areas", seoDescription: "Mobile automotive service across __CITY__ and __REGION__.", sections: [{ id: "areas-hero", label: "Service areas title", kind: "hero", enabled: true, eyebrow: "__REGION__ coverage", title: "Mobile service where your vehicle is parked.", body: "Explore the cities and communities we serve." }] },
    { id: "contact", label: "Contact", seoTitle: "Contact an __CITY__ Mobile Mechanic", seoDescription: "Call, text, or send a service request to __BUSINESS_NAME__.", sections: [{ id: "contact-hero", label: "Contact page title", kind: "hero", enabled: true, eyebrow: "Talk to a mechanic", title: "Request mobile service your way.", body: "Call, text, email, or send the guided request. We will contact you to discuss the next step." }] },
  ],
};

export function cloneDefaultTemplate(): SiteTemplateConfig { return JSON.parse(JSON.stringify(DEFAULT_SITE_TEMPLATE)) as SiteTemplateConfig; }

export function normalizeSiteTemplate(input: unknown): SiteTemplateConfig {
  if (!input || typeof input !== "object") return cloneDefaultTemplate();
  const candidate = input as Partial<SiteTemplateConfig>;
  if (candidate.version !== 1 || !Array.isArray(candidate.pages) || !candidate.brand || !candidate.palette || !candidate.integrations || !candidate.webhooks) return cloneDefaultTemplate();
  const fallback = cloneDefaultTemplate();
  const pages = candidate.pages.map(page => {
    const fallbackPage = fallback.pages.find(item => item.id === page.id);
    const configuredSections = page.sections.map(section => {
      const fallbackSection = fallbackPage?.sections.find(item => item.id === section.id);
      const image = section.image === "/manus-storage/new-age-tiktok-oil-pan_2b712cd1.jpg" || (section.id === "hero" && section.image === LEGACY_HOME_HERO_IMAGE) ? fallbackSection?.image : section.image;
      const isOriginalLegacyHomeFaq = section.id === "faq" && JSON.stringify(section.items) === JSON.stringify(LEGACY_HOME_FAQ_ITEMS);
      const faqItems = isOriginalLegacyHomeFaq ? fallbackSection?.items : section.items;
      return { ...section, image, items: faqItems, media: section.media ?? fallbackSection?.media, videos: section.videos ?? fallbackSection?.videos };
    });
    const inheritedSections = fallbackPage?.sections.filter(section => !configuredSections.some(configured => configured.id === section.id)) ?? [];
    return {
      ...page,
      sections: [...configuredSections, ...inheritedSections],
    };
  });
  const integrations = { ...fallback.integrations, ...candidate.integrations };
  if (!integrations.googleTagManagerId.trim()) integrations.googleTagManagerId = fallback.integrations.googleTagManagerId;
  return {
    ...fallback,
    ...candidate,
    brand: { ...fallback.brand, ...candidate.brand, social: { ...fallback.brand.social, ...candidate.brand.social } },
    palette: {
      ...fallback.palette,
      ...candidate.palette,
      mutedForeground: typeof candidate.palette.mutedForeground === "string" && candidate.palette.mutedForeground.trim() ? candidate.palette.mutedForeground : fallback.palette.mutedForeground,
      darkSurfaceForeground: typeof candidate.palette.darkSurfaceForeground === "string" && candidate.palette.darkSurfaceForeground.trim() ? candidate.palette.darkSurfaceForeground : fallback.palette.darkSurfaceForeground,
    },
    integrations,
    webhooks: { ...fallback.webhooks, ...candidate.webhooks },
    pages: pages as TemplatePage[],
  };
}
