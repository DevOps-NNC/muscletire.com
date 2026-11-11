/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SALES_TACTICS, FOMO_CTA_HREF } from "@shared/salesTactics";
import { trpc } from "@/lib/trpc";
import SalesTacticsCta from "./SalesTacticsCta";

vi.mock("wouter", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    crm: {
      publicSalesTacticsConfig: { useQuery: vi.fn() },
    },
  },
}));

afterEach(() => cleanup());

describe("SalesTacticsCta", () => {
  beforeEach(() => {
    vi.mocked(trpc.crm.publicSalesTacticsConfig.useQuery).mockReturnValue({
      data: DEFAULT_SALES_TACTICS,
    } as never);
  });

  it("renders enabled FOMO copy with the tracked request link", () => {
    render(<SalesTacticsCta />);

    expect(
      screen.getByRole("heading", {
        name: DEFAULT_SALES_TACTICS.fomoCta.headline,
      })
    ).toBeTruthy();
    expect(screen.getByText(DEFAULT_SALES_TACTICS.fomoCta.body)).toBeTruthy();
    expect(
      (
        screen.getByRole("link", {
          name: DEFAULT_SALES_TACTICS.fomoCta.ctaLabel,
        }) as HTMLAnchorElement
      ).getAttribute("href")
    ).toBe(FOMO_CTA_HREF);
  });

  it("exposes the styled CTA hooks for the light panel treatment", () => {
    render(<SalesTacticsCta />);

    const heading = screen.getByRole("heading", {
      name: DEFAULT_SALES_TACTICS.fomoCta.headline,
    });
    const action = screen.getByRole("link", {
      name: DEFAULT_SALES_TACTICS.fomoCta.ctaLabel,
    });

    expect(heading.className).toContain("fomo-cta-headline");
    expect(action.className).toContain("fomo-cta-action");
  });

  it("uses the light-panel CTA treatment on the dark public shell", () => {
    render(<SalesTacticsCta />);

    const region = screen.getByRole("region");
    expect(region.className).toContain("fomo-cta");
    expect(region.querySelector(".fomo-cta-panel")).toBeTruthy();
  });

  it("does not render when the tactic is disabled", () => {
    vi.mocked(trpc.crm.publicSalesTacticsConfig.useQuery).mockReturnValue({
      data: {
        ...DEFAULT_SALES_TACTICS,
        fomoCta: { ...DEFAULT_SALES_TACTICS.fomoCta, enabled: false },
      },
    } as never);

    render(<SalesTacticsCta />);

    expect(
      screen.queryByRole("heading", {
        name: DEFAULT_SALES_TACTICS.fomoCta.headline,
      })
    ).toBeNull();
  });
});
