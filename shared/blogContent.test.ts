import { describe, expect, it } from "vitest";
import {
  createContentBlock,
  createImageBlock,
  orderBlogBlocksForRender,
  parseBlogContent,
  serializeBlogContent,
} from "./blogContent";

describe("blog content documents", () => {
  it("loads legacy Markdown as a single content block", () => {
    expect(parseBlogContent("A legacy paragraph").blocks).toEqual([
      expect.objectContaining({ type: "content", body: "A legacy paragraph" }),
    ]);
  });

  it("returns no blocks for empty content", () => {
    expect(parseBlogContent("   ").blocks).toEqual([]);
    expect(parseBlogContent(null).blocks).toEqual([]);
  });

  it("orders an image relative to its following content box", () => {
    const image = createImageBlock("/manus-storage/blog/guide.png");
    const content = createContentBlock("Check the battery terminals.");

    expect(orderBlogBlocksForRender([{ ...image, placement: "below" }, content ])
      .map(block => block.type)).toEqual(["content", "image"]);
    expect(orderBlogBlocksForRender([{ ...image, placement: "above" }, content ])
      .map(block => block.type)).toEqual(["image", "content"]);
  });

  it("respects placement when content is added before the image", () => {
    const content = createContentBlock("First block");
    const image = createImageBlock("/manus-storage/blog/guide.png");

    expect(orderBlogBlocksForRender([content, { ...image, placement: "above" }]).map(block => block.id))
      .toEqual([image.id, content.id]);
    expect(orderBlogBlocksForRender([content, { ...image, placement: "below" }]).map(block => block.id))
      .toEqual([content.id, image.id]);
  });

  it("round-trips versioned JSON documents without changing block IDs", () => {
    const document = {
      version: 1 as const,
      blocks: [
        createContentBlock("A paragraph"),
        { ...createImageBlock("/guide.png"), alt: "A diagnostic guide" },
      ],
    };

    const parsed = parseBlogContent(serializeBlogContent(document));

    expect(parsed).toEqual(document);
    expect(serializeBlogContent(document)).toContain('"version":1');
  });
});
