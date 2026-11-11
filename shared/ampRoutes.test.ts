import { describe, expect, it } from "vitest";
import { ampRouteFor, canonicalRouteForAmp, isAmpEligibleRoute } from "./ampRoutes";

describe("AMP route mapping", () => {
  it("maps the homepage and nested public routes to stable AMP URLs", () => {
    expect(ampRouteFor("/")).toBe("/amp");
    expect(ampRouteFor("/services")).toBe("/services/amp");
    expect(ampRouteFor("/blog/example-guide")).toBe("/blog/example-guide/amp");
  });

  it("recovers the canonical route from an AMP URL", () => {
    expect(canonicalRouteForAmp("/amp")).toBe("/");
    expect(canonicalRouteForAmp("/services/amp")).toBe("/services");
    expect(canonicalRouteForAmp("/blog/example-guide/amp")).toBe("/blog/example-guide");
  });

  it("excludes private and noindex application routes", () => {
    expect(isAmpEligibleRoute("/")).toBe(true);
    expect(isAmpEligibleRoute("/request-service")).toBe(true);
    expect(isAmpEligibleRoute("/admin")).toBe(false);
    expect(isAmpEligibleRoute("/request-confirmation")).toBe(false);
  });
});
