import { describe, expect, it } from "vitest";
import { cloneDefaultTemplate, DEFAULT_SITE_TEMPLATE, normalizeSiteTemplate } from "./siteTemplate";
import { HOME_FAQ_ITEMS } from "./mobileMechanicFaq";

describe("reusable site template configuration", () => {
  it("clones New Age defaults without sharing mutable page content", () => {
    const first = cloneDefaultTemplate();
    const second = cloneDefaultTemplate();
    first.pages[0].sections[0].title = "A different mobile mechanic";
    expect(second.pages[0].sections[0].title).toBe(DEFAULT_SITE_TEMPLATE.pages[0].sections[0].title);
  });

  it("falls back safely when the stored intake is incomplete", () => {
    expect(normalizeSiteTemplate({ version: 1, pages: [] }).brand.shortName).toBe(DEFAULT_SITE_TEMPLATE.brand.shortName);
  });

  it("keeps newly added defaults such as the public website URL for older saved templates", () => {
    const legacy = cloneDefaultTemplate() as Record<string, unknown>;
    const brand = { ...(legacy.brand as Record<string, unknown>) };
    delete brand.website;
    legacy.brand = brand;
    expect(normalizeSiteTemplate(legacy).brand.website).toBe(DEFAULT_SITE_TEMPLATE.brand.website);
  });

  it("keeps an owner-managed Google Maps browser key while backfilling it for older saved templates", () => {
    const legacy = cloneDefaultTemplate() as Record<string, unknown>;
    const integrations = { ...(legacy.integrations as Record<string, unknown>) };
    delete integrations.googleMapsBrowserKey;
    legacy.integrations = integrations;
    expect(normalizeSiteTemplate(legacy).integrations.googleMapsBrowserKey).toBe("");

    const configured = cloneDefaultTemplate();
    configured.integrations.googleMapsBrowserKey = "AIza-test-browser-key";
    expect(normalizeSiteTemplate(configured).integrations.googleMapsBrowserKey).toBe("AIza-test-browser-key");
  });

  it("ships the owner-managed Google Tag Manager container in the CRM defaults", () => {
    expect(DEFAULT_SITE_TEMPLATE.integrations.googleTagManagerId).toBe("__GTM_ID__");
  });

  it("backfills the default Google Tag Manager container for saved templates with a blank ID", () => {
    const legacy = cloneDefaultTemplate();
    legacy.integrations.googleTagManagerId = "";

    expect(normalizeSiteTemplate(legacy).integrations.googleTagManagerId).toBe("__GTM_ID__");
  });

  it("ships responsive durable hero media and backfills it for templates saved before the media field existed", () => {
    const homePage = DEFAULT_SITE_TEMPLATE.pages.find(page => page.id === "home");
    const hero = homePage?.sections.find(section => section.id === "hero");
    expect(hero?.media?.webpSrcSet).toContain("/images/placeholder.svg");
    expect(hero?.media?.fallbackSrc).toBe("/images/placeholder.svg");
    expect(hero?.media?.width).toBe(1600);
    expect(hero?.media?.height).toBe(900);

    const legacy = cloneDefaultTemplate();
    const legacyHero = legacy.pages.find(page => page.id === "home")?.sections.find(section => section.id === "hero");
    if (!legacyHero) throw new Error("Expected default home hero");
    delete legacyHero.media;
    expect(normalizeSiteTemplate(legacy).pages.find(page => page.id === "home")?.sections.find(section => section.id === "hero")?.media?.fallbackSrc).toBe(hero?.media?.fallbackSrc);
  });

  it("ships the default About hero and social visuals from a deployment-safe CDN", () => {
    const aboutPage = DEFAULT_SITE_TEMPLATE.pages.find(page => page.id === "about");
    const aboutHero = aboutPage?.sections.find(section => section.id === "about-hero");
    const socialSection = aboutPage?.sections.find(section => section.id === "about-social");
    expect(aboutHero?.image).toBe("/images/placeholder.svg");
    expect(socialSection?.image).toBe("/images/placeholder.svg");
    expect(socialSection?.videos).toEqual([]);
  });

  it("migrates the prior Vercel-missing About thumbnail reference to the CDN asset", () => {
    const legacy = cloneDefaultTemplate();
    const aboutPage = legacy.pages.find(page => page.id === "about");
    const socialSection = aboutPage?.sections.find(section => section.id === "about-social");
    if (!socialSection) throw new Error("Expected default social section");
    socialSection.image = "/manus-storage/new-age-tiktok-oil-pan_2b712cd1.jpg";
    expect(normalizeSiteTemplate(legacy).pages.find(page => page.id === "about")?.sections.find(section => section.id === "about-social")?.image).toBe("/images/placeholder.svg");
  });

  it("adds default TikTok embeds when older saved social sections do not contain video configuration", () => {
    const legacy = cloneDefaultTemplate();
    const aboutPage = legacy.pages.find(page => page.id === "about");
    const socialSection = aboutPage?.sections.find(section => section.id === "about-social");
    if (!socialSection) throw new Error("Expected default social section");
    delete socialSection.videos;
    expect(normalizeSiteTemplate(legacy).pages.find(page => page.id === "about")?.sections.find(section => section.id === "about-social")?.videos).toEqual([]);
  });

  it("adds newly introduced editable sections to an older saved page configuration", () => {
    const legacy = cloneDefaultTemplate();
    const servicesPage = legacy.pages.find(page => page.id === "services");
    if (!servicesPage) throw new Error("Expected default services page");
    servicesPage.sections = servicesPage.sections.filter(section => section.id !== "service-catalog");
    const catalog = normalizeSiteTemplate(legacy).pages.find(page => page.id === "services")?.sections.find(section => section.id === "service-catalog");
    expect(catalog?.kind).toBe("serviceGrid");
    expect(catalog?.items?.length).toBeGreaterThan(0);
  });

  it("upgrades a legacy three-question home FAQ selection to the expanded editable set", () => {
    const legacy = cloneDefaultTemplate();
    const homePage = legacy.pages.find(page => page.id === "home");
    const faqSection = homePage?.sections.find(section => section.id === "faq");
    if (!faqSection) throw new Error("Expected default home FAQ section");
    faqSection.items = [
      { title: "What is a mobile mechanic?", description: "A mobile mechanic comes to your location — home, workplace, or roadside — to perform vehicle repairs and maintenance." },
      { title: "What areas do you serve?", description: "We serve __CITY__ and the greater __REGION__ area, including surrounding communities." },
      { title: "How do I schedule service?", description: "Call, text, or complete the guided service request. We will discuss availability and scheduling with you." },
    ];

    const normalizedFaq = normalizeSiteTemplate(legacy).pages.find(page => page.id === "home")?.sections.find(section => section.id === "faq");

    expect(normalizedFaq?.items).toEqual(HOME_FAQ_ITEMS);
  });

  it("does not overwrite a custom owner-managed three-question home FAQ selection", () => {
    const configured = cloneDefaultTemplate();
    const faqSection = configured.pages.find(page => page.id === "home")?.sections.find(section => section.id === "faq");
    if (!faqSection) throw new Error("Expected default home FAQ section");
    faqSection.items = [
      { title: "Can you work at my office?", description: "Ask us about your workplace location." },
      { title: "Do you inspect used cars?", description: "Ask us about pre-purchase inspections." },
      { title: "Do you provide a next step?", description: "We discuss the right next step." },
    ];

    expect(normalizeSiteTemplate(configured).pages.find(page => page.id === "home")?.sections.find(section => section.id === "faq")?.items).toEqual(faqSection.items);
  });

  it("backfills explicit text contrast tokens for older saved palettes", () => {
    const legacy = cloneDefaultTemplate();
    delete (legacy.palette as Partial<typeof legacy.palette>).mutedForeground;
    delete (legacy.palette as Partial<typeof legacy.palette>).darkSurfaceForeground;

    const normalized = normalizeSiteTemplate(legacy);

    expect(normalized.palette.mutedForeground).toBe("#52635d");
    expect(normalized.palette.darkSurfaceForeground).toBe("#fff8e9");
  });

  it("does not preserve blank text contrast tokens from saved palettes", () => {
    const legacy = cloneDefaultTemplate();
    legacy.palette.mutedForeground = " ";
    legacy.palette.darkSurfaceForeground = "";

    const normalized = normalizeSiteTemplate(legacy);

    expect(normalized.palette.mutedForeground).toBe(DEFAULT_SITE_TEMPLATE.palette.mutedForeground);
    expect(normalized.palette.darkSurfaceForeground).toBe(DEFAULT_SITE_TEMPLATE.palette.darkSurfaceForeground);
  });
});
