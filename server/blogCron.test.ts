import { describe, expect, it, vi } from "vitest";
import { handleBlogCronRequest, publishDueBlogArticles } from "./blogCron";

describe("blog scheduler", () => {
  it("rejects cron requests without the configured secret", async () => {
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    const response = await handleBlogCronRequest(new Request("__BUSINESS_URL__/api/blog/cron"), { publishDue: async () => [] });
    expect(response.status).toBe(401);
    vi.unstubAllEnvs();
  });

  it("publishes only rows due at the supplied time and leaves future rows scheduled", async () => {
    const future = new Date("2099-10-10T00:00:00.000Z");
    let published = false;
    const store = {
      publishDue: async (now: Date) => {
        if (new Date("2099-10-09T00:00:00.000Z") <= now) {
          published = true;
          return [{ id: 4, slug: "due-guide" }];
        }
        return [];
      },
    };

    expect(await publishDueBlogArticles(new Date("2099-10-09T12:00:00.000Z"), store)).toEqual({ publishedCount: 1, articles: [{ id: 4, slug: "due-guide" }] });
    expect(published).toBe(true);
    expect(await publishDueBlogArticles(future, { publishDue: async () => [] })).toEqual({ publishedCount: 0, articles: [] });
  });

  it("accepts the existing Bearer cron convention and returns sanitized results", async () => {
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    const response = await handleBlogCronRequest(new Request("__BUSINESS_URL__/api/blog/cron", { method: "POST", headers: { authorization: "Bearer cron-test-secret" } }), { publishDue: async () => [{ id: 9, slug: "published-guide" }] });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "succeeded", publishedCount: 1, articles: [{ id: 9, slug: "published-guide" }] });
    vi.unstubAllEnvs();
  });
});
