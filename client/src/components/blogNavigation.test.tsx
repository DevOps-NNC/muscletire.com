/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BLOG_INDEX_HREF } from "@shared/blogTracking";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => ["/"] as const,
}));

vi.mock("@/template/TemplateRuntime", () => ({
  useSiteTemplate: () => ({
    brand: {
      city: "__CITY__",
      region: "__REGION__",
      phoneRaw: "__BUSINESS_PHONE_RAW__",
      phone: "__BUSINESS_PHONE__",
      shortName: "__BUSINESS_NAME__",
      logoUrl: "/logo.png",
    },
    pages: [],
  }),
}));

afterEach(() => cleanup());

describe("public navigation and footer", () => {
  it("exposes the exact tracked blog index link in header and footer", () => {
    render(<><SiteHeader /><SiteFooter /></>);

    const blogLinks = screen.getAllByRole("link", { name: "Blog" }) as HTMLAnchorElement[];
    expect(blogLinks).toHaveLength(2);
    expect(blogLinks.map(link => link.getAttribute("href"))).toEqual([BLOG_INDEX_HREF, BLOG_INDEX_HREF]);
  });

  it("exposes the designer credit with its tracked inquiry link", () => {
    render(<SiteFooter />);

    const inquiryLink = screen.getByRole("link", { name: "Inquire here" });
    expect(inquiryLink.getAttribute("href")).toBe(
      "https://www.innovate360marketing.com/",
    );
    expect(inquiryLink.getAttribute("target")).toBe("_blank");
    expect(inquiryLink.getAttribute("rel")).toBe("noopener noreferrer");
    expect(inquiryLink.className).toContain("footer-inquiry-link");
    expect(inquiryLink.querySelector("svg")).toBeTruthy();
  });

  it("uses the editorial header hooks and keeps the request CTA prominent", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("banner").className).toContain("site-header");
    expect(screen.getByRole("navigation").className).toContain("site-header__nav");
    expect(screen.getByRole("link", { name: /Get an Estimate/i }).className).toContain("site-header__cta");
    expect(screen.getByRole("link", { name: "Services" }).className).not.toContain("text-foreground/80");
    expect(screen.getByRole("button", { name: "Toggle menu" }).getAttribute("aria-controls")).toBe("mobile-navigation-menu");
  });

  it("keeps the footer in the dark editorial treatment", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("contentinfo").className).toContain("theme-site-footer");
    expect(screen.getByRole("contentinfo").querySelector(".footer-cta-panel")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Inquire here" }).getAttribute("href")).toBe("https://www.innovate360marketing.com/");
  });
});
