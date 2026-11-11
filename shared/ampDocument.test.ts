import { describe, expect, it } from "vitest";
import { createAmpDocument } from "../scripts/amp-document.mjs";

describe("AMP document shell", () => {
  it("emits a canonical, structured, validator-shaped document", () => {
    const html = createAmpDocument({
      title: "Service guide",
      description: "A useful service guide.",
      canonical: "__BUSINESS_URL__/services/diagnostics",
      body: "<main><h1>Service guide</h1></main>",
      schema: [{ "@context": "https://schema.org", "@type": "WebPage", name: "Service guide" }],
    });

    expect(html).toMatch(/^<!doctype html><html amp lang="en"><head>/);
    expect(html).toContain('<script async src="https://cdn.ampproject.org/v0.js"></script>');
    expect(html).toContain('<link rel="canonical" href="__BUSINESS_URL__/services/diagnostics">');
    expect(html).toContain('<style amp-custom>');
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain("<h1>Service guide</h1>");
    expect(html).not.toContain("<script type=\"module\"");
  });

  it("loads amp-form only for the form page", () => {
    const html = createAmpDocument({
      title: "Request service",
      description: "Request service.",
      canonical: "__BUSINESS_URL__/request-service",
      body: "<main><form method=\"post\"></form></main>",
      useAmpForm: true,
    });

    expect(html).toContain('<script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>');
    expect(html).toContain('<script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>');
  });
});
