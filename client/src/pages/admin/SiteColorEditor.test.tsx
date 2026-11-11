/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SiteColorEditor from "./SiteColorEditor";
import { DEFAULT_SITE_TEMPLATE } from "@shared/siteTemplate";

describe("Page Editor site color controls", () => {
  it("exposes the text and UI color controls and updates the palette", () => {
    const onChange = vi.fn();

    render(<SiteColorEditor palette={DEFAULT_SITE_TEMPLATE.palette} onChange={onChange} />);

    expect(screen.getByText("Site colors")).toBeTruthy();
    expect(screen.getByLabelText("Light surface text")).toBeTruthy();
    expect(screen.getByLabelText("Muted body text")).toBeTruthy();
    expect(screen.getByLabelText("Dark surface text")).toBeTruthy();
    expect(screen.getByLabelText("Primary button text")).toBeTruthy();
    expect(screen.getByLabelText("Dark surface")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Dark surface text"), { target: { value: "#fffaf0" } });

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_SITE_TEMPLATE.palette, darkSurfaceForeground: "#fffaf0" });
  });
});
