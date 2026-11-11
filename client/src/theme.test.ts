import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("central site color theme", () => {
  it("defines every public semantic color token with a replaceable hex value", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    const tokens = [
      "primary",
      "secondary",
      "hero-bg",
      "page-bg",
      "card-bg",
      "footer-bg",
      "text-main",
      "text-muted",
      "text-inverse",
      "border",
    ];

    for (const token of tokens) {
      expect(source).toMatch(new RegExp(`--color-${token}:\\s*#[0-9a-f]{6}`, "i"));
    }
  });
});
