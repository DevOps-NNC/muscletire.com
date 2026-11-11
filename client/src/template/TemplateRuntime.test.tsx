/** @vitest-environment jsdom */
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getTemplateThemeValues, installGoogleTagManager } from "./TemplateRuntime";

const indexHtml = fs.readFileSync(path.resolve(import.meta.dirname, "../../index.html"), "utf8");

describe("Google Tag Manager runtime installation", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("installs the editable container in the head and body", () => {
    const cleanup = installGoogleTagManager("__GTM_ID__");

    const headScript = document.head.querySelector('script[data-template-gtm="__GTM_ID__"]');
    const bodyNoscript = document.body.querySelector('noscript[data-template-gtm-noscript="__GTM_ID__"]');
    const iframe = bodyNoscript?.querySelector("iframe");

    expect(headScript?.textContent).toContain("https://www.googletagmanager.com/gtm.js?id=");
    expect(headScript?.textContent).toContain("__GTM_ID__");
    expect(iframe?.getAttribute("src")).toBe("https://www.googletagmanager.com/ns.html?id=__GTM_ID__");
    expect(bodyNoscript?.nextElementSibling?.id).toBe("root");

    cleanup();

    expect(document.head.querySelector('script[data-template-gtm="__GTM_ID__"]')).toBeNull();
    expect(document.body.querySelector('noscript[data-template-gtm-noscript="__GTM_ID__"]')).toBeNull();
  });

  it("does not embed inherited third-party analytics in the shared HTML shell", () => {
    expect(indexHtml).not.toContain("data-template-gtm-source");
    expect(indexHtml).toContain('<div id="root"></div>');
  });

  it("reuses static shell tags instead of installing duplicate containers", () => {
    document.head.innerHTML = '<script data-template-gtm="__GTM_ID__"></script>';
    document.body.innerHTML = '<noscript data-template-gtm-noscript="__GTM_ID__"></noscript><div id="root"></div>';

    installGoogleTagManager("__GTM_ID__");

    expect(document.head.querySelectorAll('script[data-template-gtm="__GTM_ID__"]')).toHaveLength(1);
    expect(document.body.querySelectorAll('noscript[data-template-gtm-noscript="__GTM_ID__"]')).toHaveLength(1);
  });

  it("ignores invalid container IDs", () => {
    const cleanup = installGoogleTagManager("<script>alert(1)</script>");

    expect(cleanup).toBeTypeOf("function");
    expect(document.head.querySelector("script[data-template-gtm]")).toBeNull();
    expect(document.body.querySelector("noscript[data-template-gtm-noscript]")).toBeNull();
  });
});

describe("public editorial theme propagation", () => {
  it("derives public tokens from the CRM-managed palette", () => {
    const values = getTemplateThemeValues({
      name: "test-palette",
      primary: "#123456",
      primaryForeground: "#fefefe",
      secondary: "#abcdef",
      darkSurface: "#101820",
      darkSurfaceForeground: "#fffaf0",
      background: "#fffaf0",
      surface: "#ffffff",
      foreground: "#111111",
      mutedForeground: "#52635d",
      accent: "#fedcba",
    });

    expect(values["--public-ink"]).toBe("#101820");
    expect(values["--public-orange"]).toBe("#123456");
    expect(values["--public-paper"]).toBe("#fffaf0");
    expect(values["--public-ink-soft"]).toContain("#ffffff");
    expect(values["--color-primary-foreground"]).toBe("#fefefe");
    expect(values["--color-text-inverse"]).toBe("#fffaf0");
    expect(values["--color-text-muted"]).toBe("#52635d");
    expect(values["--public-dark-copy"]).toBe("#fffaf0");
    expect(values["--public-copy-muted"]).toContain("82%");
  });
});
