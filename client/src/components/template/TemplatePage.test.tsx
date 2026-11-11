/** @vitest-environment jsdom */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TemplateSectionRenderer } from "./TemplatePage";

const styles = fs.readFileSync(path.resolve(import.meta.dirname, "../../index.css"), "utf8");

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

afterEach(() => cleanup());

const hero = {
  id: "hero",
  label: "Hero",
  kind: "hero" as const,
  enabled: true,
  eyebrow: "__CITY__ mobile service",
  title: "Vehicle help where you are parked.",
  body: "A practical next step for your vehicle.",
  primaryCtaLabel: "Request service",
  primaryCtaHref: "/request-service",
};

describe("TemplateSectionRenderer editorial hooks", () => {
  it("marks the hero and preserves its primary conversion link", () => {
    render(<TemplateSectionRenderer section={hero} />);

    expect(screen.getByRole("heading", { name: hero.title }).closest("section")?.className).toContain("template-hero");
    expect(screen.getByRole("link", { name: /Request service/i }).getAttribute("href")).toBe("/request-service");
  });

  it("does not render disabled sections", () => {
    render(<TemplateSectionRenderer section={{ ...hero, enabled: false }} />);
    expect(screen.queryByRole("heading", { name: hero.title })).toBeNull();
  });

  it("keeps editorial template styles inside the public shell", () => {
    expect(styles).toContain(".public-site .template-hero");
    expect(styles).toContain(".public-site .template-surface--paper");
    expect(styles).toContain(".public-site .public-page--ink");
    expect(styles).toContain("--public-paper-copy-muted");
    expect(styles).toContain(".public-site .public-page--ink .bg-secondary");
    expect(styles).toContain("-webkit-text-fill-color");
    expect(styles).toContain(".public-site .template-surface--ink {");
    expect(styles).toContain("background: var(--public-paper);");
    expect(styles).toContain(
      ".public-site .template-surface--ink .template-story-card .template-eyebrow",
    );
    expect(styles).toContain(
      ".public-site .template-surface--ink .template-story-card > p:not(.template-eyebrow)",
    );
  });
});
