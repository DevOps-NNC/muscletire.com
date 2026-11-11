/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlogShareLinks } from "./BlogShareLinks";

afterEach(() => cleanup());

describe("BlogShareLinks", () => {
  it("generates exact Twitter and Newsletter UTM links from the slug", () => {
    render(<BlogShareLinks baseUrl="__BUSINESS_URL__" slug="battery-check" />);

    fireEvent.click(screen.getByRole("button", { name: "Generate Share Links" }));

    expect((screen.getByLabelText("Twitter share link") as HTMLInputElement).value).toBe(
      "__BUSINESS_URL__/blog/battery-check?utm_source=twitter&utm_medium=social&utm_campaign=battery-check",
    );
    expect((screen.getByLabelText("Newsletter share link") as HTMLInputElement).value).toBe(
      "__BUSINESS_URL__/blog/battery-check?utm_source=newsletter&utm_medium=email&utm_campaign=battery-check",
    );
  });

  it("confirms a copied share link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<BlogShareLinks baseUrl="__BUSINESS_URL__" slug="battery-check" />);

    fireEvent.click(screen.getByRole("button", { name: "Generate Share Links" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy Twitter share link" }));

    await waitFor(() => expect(screen.getByText("Copied")).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith(
      "__BUSINESS_URL__/blog/battery-check?utm_source=twitter&utm_medium=social&utm_campaign=battery-check",
    );
  });
});
