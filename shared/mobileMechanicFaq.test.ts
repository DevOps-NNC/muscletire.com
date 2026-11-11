import { describe, expect, it } from "vitest";
import { HOME_FAQ_ITEMS, MOBILE_MECHANIC_FAQ_CATEGORIES, MOBILE_MECHANIC_FAQS } from "./mobileMechanicFaq";

describe("mobile mechanic FAQ content", () => {
  it("provides a comprehensive, unique, customer-facing FAQ set", () => {
    expect(MOBILE_MECHANIC_FAQ_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    expect(MOBILE_MECHANIC_FAQS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(MOBILE_MECHANIC_FAQS.map((faq) => faq.question)).size).toBe(MOBILE_MECHANIC_FAQS.length);
    expect(MOBILE_MECHANIC_FAQS.every((faq) => faq.answer.length > 80)).toBe(true);
  });

  it("keeps the editable home FAQ selection grounded in the comprehensive content", () => {
    expect(HOME_FAQ_ITEMS).toHaveLength(8);
    expect(HOME_FAQ_ITEMS.every((item) => MOBILE_MECHANIC_FAQS.some((faq) => faq.question === item.title && faq.answer === item.description))).toBe(true);
  });
});
