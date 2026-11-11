import { describe, expect, it } from "vitest";
import {
  calculateLeadConversionRate,
  calculatePercentChange,
  classifyLeadChannel,
  getPreviousReportingRange,
  getReportingRange,
} from "./analytics";

const now = new Date("2026-09-21T15:30:00.000Z");

describe("reporting periods", () => {
  it("uses the configured timezone for daily boundaries", () => {
    const range = getReportingRange("today", now, "America/New_York");

    expect(range.start.toISOString()).toBe("2026-09-21T04:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-09-22T04:00:00.000Z");
    expect(range.isComplete).toBe(false);
  });

  it("defines weekly reporting as Monday through Sunday", () => {
    const range = getReportingRange("last_7_days", now, "America/New_York");

    expect(range.start.toISOString()).toBe("2026-09-15T04:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-09-22T04:00:00.000Z");
  });

  it("returns an equivalent previous period", () => {
    const current = getReportingRange("this_month", now, "America/New_York");
    const previous = getPreviousReportingRange(current, "America/New_York");

    expect(previous.start.toISOString()).toBe("2026-08-01T04:00:00.000Z");
    expect(previous.end.toISOString()).toBe("2026-09-01T04:00:00.000Z");
  });
});

describe("reporting math", () => {
  it("does not manufacture a rate for a zero session baseline", () => {
    expect(calculateLeadConversionRate(3, 0)).toBeNull();
    expect(calculatePercentChange(3, 0)).toBeNull();
    expect(calculatePercentChange(0, 0)).toBe(0);
    expect(calculatePercentChange(12, 10)).toBe(20);
  });
});

describe("lead channel classification", () => {
  it("separates paid search, organic search, email, and direct traffic", () => {
    expect(classifyLeadChannel({ gclid: "abc" })).toBe("paid_search");
    expect(classifyLeadChannel({ utmMedium: "organic", utmSource: "google" })).toBe("organic_search");
    expect(classifyLeadChannel({ utmSource: "newsletter", utmMedium: "email" })).toBe("email");
    expect(classifyLeadChannel({ landingUrl: "__BUSINESS_URL__/request-service" })).toBe("direct");
  });
});
