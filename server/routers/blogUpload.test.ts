import { describe, expect, it } from "vitest";
import { decodeBlogImageUpload, MAX_BLOG_IMAGE_BYTES } from "./blogUpload";

const ONE_PIXEL_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

describe("blog image upload validation", () => {
  it("decodes a valid PNG data URL", () => {
    const result = decodeBlogImageUpload(`data:image/png;base64,${ONE_PIXEL_PNG}`, "image/png");

    expect(result.contentType).toBe("image/png");
    expect(result.bytes.length).toBeGreaterThan(0);
  });

  it("rejects non-image content types", () => {
    expect(() =>
      decodeBlogImageUpload("data:text/plain;base64,SGVsbG8=", "text/plain"),
    ).toThrow(/image/i);
  });

  it("rejects malformed data URLs and invalid image bytes", () => {
    expect(() => decodeBlogImageUpload("not-a-data-url", "image/png")).toThrow(/data URL/i);
    expect(() =>
      decodeBlogImageUpload("data:image/png;base64,SGVsbG8=", "image/png"),
    ).toThrow(/image data/i);
  });

  it("rejects payloads larger than 8 MiB", () => {
    const oversized = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      Buffer.alloc(MAX_BLOG_IMAGE_BYTES),
    ]).toString("base64");

    expect(() => decodeBlogImageUpload(`data:image/png;base64,${oversized}`, "image/png"))
      .toThrow(/8 MiB/i);
  });
});
