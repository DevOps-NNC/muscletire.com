import { describe, expect, it } from "vitest";
import {
  BLOG_INDEX_HREF,
  buildBlogShareLinks,
  parseBlogTags,
  slugifyBlogTitle,
} from "./blogTracking";

describe("blog tracking helpers", () => {
  it("uses the exact internal campaign for the blog index", () => {
    expect(BLOG_INDEX_HREF).toBe(
      "/blog?utm_source=website&utm_medium=internal&utm_campaign=blog_navigation",
    );
  });

  it("builds clean channel-specific share links", () => {
    expect(buildBlogShareLinks("__BUSINESS_URL__", "battery-check")).toEqual({
      twitter:
        "__BUSINESS_URL__/blog/battery-check?utm_source=twitter&utm_medium=social&utm_campaign=battery-check",
      newsletter:
        "__BUSINESS_URL__/blog/battery-check?utm_source=newsletter&utm_medium=email&utm_campaign=battery-check",
    });
  });

  it("keeps an explicitly entered post slug in the share URL", () => {
    expect(buildBlogShareLinks("__BUSINESS_URL__", "battery_check").twitter).toBe(
      "__BUSINESS_URL__/blog/battery_check?utm_source=twitter&utm_medium=social&utm_campaign=battery-check",
    );
  });

  it("normalizes titles into stable blog slugs", () => {
    expect(slugifyBlogTitle("Battery warning: what now?")).toBe("battery-warning-what-now");
  });

  it("trims and deduplicates comma-separated tags", () => {
    expect(parseBlogTags("battery, safety, battery")).toEqual(["battery", "safety"]);
  });
});
