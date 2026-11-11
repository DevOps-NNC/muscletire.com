import { describe, expect, it } from "vitest";
import {
  blogApiErrorSchema,
  blogApiOpenApiDocument,
  createBlogArticleSchema,
} from "./blogApiContract";

describe("blog API contract", () => {
  it("normalizes a draft and generates a slug when one is omitted", () => {
    const result = createBlogArticleSchema.parse({
      title: "  Battery warning lights explained  ",
      content: "# Content",
    });

    expect(result).toMatchObject({
      title: "Battery warning lights explained",
      slug: "battery-warning-lights-explained",
      status: "draft",
      tags: [],
    });
  });

  it("accepts a future scheduled article", () => {
    const result = createBlogArticleSchema.parse({
      title: "Scheduled guide",
      status: "scheduled",
      scheduledAt: "2099-10-09T13:00:00.000Z",
    });

    expect(result.scheduledAt).toBe("2099-10-09T13:00:00.000Z");
  });

  it("rejects a scheduled article without a future timestamp", () => {
    expect(() => createBlogArticleSchema.parse({ title: "Missing time", status: "scheduled" })).toThrow();
    expect(() => createBlogArticleSchema.parse({ title: "Past time", status: "scheduled", scheduledAt: "2020-01-01T00:00:00.000Z" })).toThrow();
  });

  it("rejects titles that cannot produce a usable generated slug", () => {
    expect(() => createBlogArticleSchema.parse({ title: "!!!" })).toThrow();
  });

  it("keeps error responses stable and the OpenAPI paths discoverable", () => {
    expect(blogApiErrorSchema.parse({ error: { code: "VALIDATION_ERROR", message: "Invalid request." } })).toEqual({
      error: { code: "VALIDATION_ERROR", message: "Invalid request." },
    });
    expect(blogApiOpenApiDocument.paths["/api/v1/blogs"].post).toBeDefined();
    expect(blogApiOpenApiDocument.paths["/api/v1/blogs/{id}"].get).toBeDefined();
    expect(blogApiOpenApiDocument.components.securitySchemes.ApiKey).toBeDefined();
  });
});
