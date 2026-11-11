/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trpc } from "@/lib/trpc";
import BlogEngagementSection, { shouldShowGlobalBlogEngagement } from "./BlogEngagementSection";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    blog: {
      list: { useQuery: vi.fn() },
    },
  },
}));

const articles = [
  { id: 1, slug: "battery-warning-signs", title: "5 Battery Warning Signs", excerpt: "Know what your car is telling you.", category: "Battery", readingTime: 4 },
  { id: 2, slug: "brake-noises", title: "What Brake Noises Mean", excerpt: "A quick guide to common brake sounds.", category: "Brakes", readingTime: 5 },
  { id: 3, slug: "mobile-mechanic-vs-shop", title: "Mobile Mechanic vs. Shop", excerpt: "Choose the right kind of help.", category: "Mobile Mechanic", readingTime: 3 },
];

afterEach(() => cleanup());

describe("BlogEngagementSection", () => {
  beforeEach(() => {
    vi.mocked(trpc.blog.list.useQuery).mockReturnValue({ data: articles } as never);
  });

  it("shows three latest guides with clear article links", () => {
    render(<BlogEngagementSection />);

    expect(screen.getByRole("heading", { name: "Learn before you book" })).toBeTruthy();
    expect(screen.getByText("5 Battery Warning Signs")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /Read guide/ })).toHaveLength(3);
    expect((screen.getByRole("link", { name: /5 Battery Warning Signs/ }) as HTMLAnchorElement).getAttribute("href")).toBe("/blog/battery-warning-signs?utm_source=website&utm_medium=internal&utm_campaign=blog_engagement");
  });

  it("does not add an empty section when no published guides exist", () => {
    vi.mocked(trpc.blog.list.useQuery).mockReturnValue({ data: [] } as never);

    render(<BlogEngagementSection />);

    expect(screen.queryByRole("heading", { name: "Learn before you book" })).toBeNull();
  });

  it("keeps blog and service-request routes focused", () => {
    expect(shouldShowGlobalBlogEngagement("/services")).toBe(true);
    expect(shouldShowGlobalBlogEngagement("/blog")).toBe(false);
    expect(shouldShowGlobalBlogEngagement("/blog/battery-warning-signs")).toBe(false);
    expect(shouldShowGlobalBlogEngagement("/request-service")).toBe(false);
    expect(shouldShowGlobalBlogEngagement("/services/diagnostics")).toBe(false);
    expect(shouldShowGlobalBlogEngagement("/service-areas/__CITY_SLUG__")).toBe(false);
  });
});
