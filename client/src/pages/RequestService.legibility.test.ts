import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(fileURLToPath(new URL("./RequestService.tsx", import.meta.url)), "utf8");
const styles = readFileSync(fileURLToPath(new URL("../index.css", import.meta.url)), "utf8");

describe("service request form legibility", () => {
  it("keeps a clear mobile tap prompt and scoped high-contrast field treatment", () => {
    expect(pageSource).toContain("service-request-form");
    expect(pageSource).toContain("Tap any white field below to enter your details");
    expect(styles).toContain(".public-site .service-request-form");
    expect(styles).toContain("background: var(--public-paper)");
    expect(styles).toContain(".service-request-form :is(input:not([type=\"checkbox\"]):not([type=\"radio\"]), select, textarea)");
    expect(styles).toContain("background: var(--color-card-bg)");
    expect(styles).toContain("border: 2px solid");
    expect(styles).toContain(".service-request-form label:has(> input[type=\"radio\"])");
    expect(pageSource).toContain("request-progress__label");
    expect(styles).toContain(".public-site .service-request-form .request-progress__label.is-completed");
    expect(styles).toContain(".public-site .service-request-form .request-progress-summary__label");
  });
});
