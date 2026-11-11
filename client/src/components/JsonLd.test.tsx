/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LocalBusinessJsonLd, FAQPageJsonLd, ServiceJsonLd, BreadcrumbJsonLd, WebSiteJsonLd } from "./JsonLd";

describe("LocalBusinessJsonLd", () => {
  it("renders valid JSON-LD script tag", () => {
    const { container } = render(<LocalBusinessJsonLd />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent || "");
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toContain("AutoRepair");
    expect(data["@type"]).toContain("AutomotiveBusiness");
    expect(data.name).toBe("__BUSINESS_LEGAL_NAME__");
    expect(data.telephone).toBe("__BUSINESS_PHONE__");
    expect(data.hasOfferCatalog.itemListElement.length).toBeGreaterThan(3);
    expect(data.address).toBeUndefined();
    expect(data.priceRange).toBeUndefined();
    expect(data.areaServed).toHaveLength(1);
    expect(data.areaServed[0].name).toBe("Test City");
  });
});

describe("WebSiteJsonLd", () => {
  it("renders a crawlable website identity linked to the business", () => {
    const { container } = render(<WebSiteJsonLd />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent || "");
    expect(data["@type"]).toBe("WebSite");
    expect(data.publisher["@id"]).toContain("#automotive-business");
  });
});

describe("FAQPageJsonLd", () => {
  it("renders FAQ structured data", () => {
    const faqs = [
      { question: "What is a mobile mechanic?", answer: "A mechanic who comes to you." },
      { question: "What areas do you serve?", answer: "__CITY__ and __REGION__." },
    ];
    const { container } = render(<FAQPageJsonLd faqs={faqs} url="/faq" />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent || "");
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(2);
    expect(data.mainEntity[0].name).toBe("What is a mobile mechanic?");
    expect(data.mainEntity[0].acceptedAnswer.text).toBe("A mechanic who comes to you.");
    expect(data["@id"]).toBe("__BUSINESS_URL__/faq#faqpage");
    expect(data.url).toBe("__BUSINESS_URL__/faq");
  });
});

describe("ServiceJsonLd", () => {
  it("renders service structured data", () => {
    const { container } = render(
      <ServiceJsonLd name="Brake Service" description="Full brake repair" url="/services/brake-service" />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent || "");
    expect(data["@type"]).toBe("Service");
    expect(data.name).toBe("Brake Service");
    expect(data.provider.name).toBe("__BUSINESS_LEGAL_NAME__");
  });
});

describe("BreadcrumbJsonLd", () => {
  it("renders breadcrumb structured data", () => {
    const items = [
      { name: "Home", url: "/" },
      { name: "Services", url: "/services" },
      { name: "Brakes", url: "/services/brake-service" },
    ];
    const { container } = render(<BreadcrumbJsonLd items={items} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent || "");
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toHaveLength(3);
    expect(data.itemListElement[0].position).toBe(1);
  });
});
