import { describe, expect, it } from "vitest";
import { renderMarkdownToHtml, renderAmpImage } from "../scripts/amp-renderer.mjs";

describe("AMP-safe content renderer", () => {
  it("renders supported Markdown and escapes raw HTML", () => {
    const html = renderMarkdownToHtml("# Heading\n\nA **useful** guide with [services](/services).\n\n- One\n- Two\n\n<script>alert('x')</script>");

    expect(html).toContain("<h2>Heading</h2>");
    expect(html).toContain("<strong>useful</strong>");
    expect(html).toContain('<a href="/services">services</a>');
    expect(html).toContain("<ul><li>One</li><li>Two</li></ul>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("allows only safe link protocols", () => {
    const html = renderMarkdownToHtml("[safe](https://example.com) [bad](javascript:alert(1))");

    expect(html).toContain('<a href="https://example.com">safe</a>');
    expect(html).not.toContain("javascript:");
    expect(html).toContain("bad");
  });

  it("renders images with stable AMP dimensions and escaped alt text", () => {
    expect(renderAmpImage("https://example.com/image.jpg", 'A "battery"', 1600, 900)).toBe(
      '<amp-img src="https://example.com/image.jpg" alt="A &quot;battery&quot;" width="1600" height="900" layout="responsive"></amp-img>',
    );
  });
});
