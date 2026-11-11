import { describe, expect, it } from "vitest";
import { MOBILE_MECHANIC_FAQS } from "@shared/mobileMechanicFaq";

describe("FAQ page schema synchronization", () => {
  it("uses the same visible FAQ content for the dedicated FAQPage schema", async () => {
    const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("./FAQ.tsx", import.meta.url), "utf8"));
    expect(source).toContain("<FAQPageJsonLd faqs={MOBILE_MECHANIC_FAQS.map");
    expect(source).toContain("url=\"/faq\"");
    expect(source).toContain("{category.faqs.map((faq) => (");
    expect(MOBILE_MECHANIC_FAQS.length).toBeGreaterThanOrEqual(20);
  });
});
