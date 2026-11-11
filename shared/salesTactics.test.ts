import { describe, expect, it } from "vitest";
import {
  DEFAULT_SALES_TACTICS,
  FOMO_CTA_HREF,
  normalizeSalesTactics,
  parseSalesTacticsSetting,
} from "./salesTactics";

describe("sales tactics configuration", () => {
  it("defaults the FOMO tactic to enabled with conversion-focused copy", () => {
    expect(DEFAULT_SALES_TACTICS.fomoCta.enabled).toBe(true);
    expect(DEFAULT_SALES_TACTICS.fomoCta.headline).toContain("booking");
    expect(DEFAULT_SALES_TACTICS.fomoCta.ctaLabel).toBeTruthy();
    expect(FOMO_CTA_HREF).toBe(
      "/request-service?utm_source=website&utm_medium=internal&utm_campaign=fomo_cta"
    );
  });

  it("normalizes partial persisted values without disabling the default", () => {
    const config = normalizeSalesTactics({
      fomoCta: { headline: "Book your preferred time" },
    });

    expect(config.fomoCta.enabled).toBe(true);
    expect(config.fomoCta.headline).toBe("Book your preferred time");
    expect(config.fomoCta.body).toBe(DEFAULT_SALES_TACTICS.fomoCta.body);
  });

  it("falls back safely when the persisted setting is invalid", () => {
    expect(parseSalesTacticsSetting("not-json")).toEqual(DEFAULT_SALES_TACTICS);
    expect(parseSalesTacticsSetting(null)).toEqual(DEFAULT_SALES_TACTICS);
  });
});
