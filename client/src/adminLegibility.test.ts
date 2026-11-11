import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
const footerSource = readSource("./components/SiteFooter.tsx");
const dashboardSource = readSource("./pages/admin/Dashboard.tsx");
const leadDetailSource = readSource("./pages/admin/LeadDetail.tsx");
const settingsSource = readSource("./pages/admin/Settings.tsx");
const switchSource = readSource("./components/ui/switch.tsx");
const authSource = readSource("./hooks/useCrmAuth.ts");
const requestFormSource = readSource("./pages/RequestService.tsx");
const themeSource = readSource("./index.css");

describe("contrast and interaction regressions", () => {
  it("keeps footer headings and recent-request content readable on dark surfaces", () => {
    expect(footerSource).toContain("theme-site-footer");
    expect(footerSource).toContain("text-[var(--color-text-inverse)]");
    expect(dashboardSource).toContain("text-[color-mix(in_srgb,var(--color-text-inverse)_85%,transparent)]");
    expect(dashboardSource).toContain("text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)]");
  });

  it("keeps lead handoff and preferred-contact values visible in the lead summary", () => {
    expect(leadDetailSource).toContain('className="mt-1 text-lg font-black text-[var(--color-text-inverse)]"');
  });

  it("gives settings switches and request fields clear theme-backed contrast", () => {
    expect(switchSource).toContain("data-[state=unchecked]:bg-secondary");
    expect(switchSource).toContain("border-border");
    expect(requestFormSource).toContain("bg-[var(--color-card-bg)]");
    expect(themeSource).toContain("background: var(--color-card-bg) !important");
    expect(settingsSource).toContain("aria-label=\"Enable automatic Zapier lead delivery\"");
  });

  it("clears the cached CRM profile after Neon sign-out", () => {
    expect(authSource).toContain("const utils = trpc.useUtils()");
    expect(authSource).toContain("utils.auth.me.setData(undefined, null)");
    expect(authSource).toContain("await utils.auth.me.invalidate()");
  });
});
