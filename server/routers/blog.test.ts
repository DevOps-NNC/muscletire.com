import { describe, expect, it } from "vitest";
import { buildArticleWriteValues } from "./blog";

describe("admin blog scheduling", () => {
  const now = new Date("2026-10-08T12:00:00.000Z");

  it("stores a scheduled article without publishing it", () => {
    const values = buildArticleWriteValues({ title: "Scheduled guide", slug: "scheduled-guide", status: "scheduled", scheduledAt: "2099-10-09T13:00:00.000Z", tags: [] }, now);
    expect(values).toMatchObject({ status: "scheduled", publishedAt: null, scheduledAt: new Date("2099-10-09T13:00:00.000Z") });
  });

  it("publishes immediately and clears an old schedule", () => {
    const values = buildArticleWriteValues({ title: "Published guide", slug: "published-guide", status: "published", tags: [] }, now);
    expect(values).toMatchObject({ status: "published", publishedAt: now, scheduledAt: null });
  });

  it("returns a draft with no publication or schedule timestamps", () => {
    const values = buildArticleWriteValues({ title: "Draft guide", slug: "draft-guide", status: "draft", scheduledAt: "2099-10-09T13:00:00.000Z", tags: [] }, now);
    expect(values).toMatchObject({ status: "draft", publishedAt: null, scheduledAt: null });
  });
});
