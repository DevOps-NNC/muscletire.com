/**
 * @vitest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LeadLifecycleConfirmDialog } from "./LeadLifecycleConfirmDialog";

describe("LeadLifecycleConfirmDialog", () => {
  it("requires an explicit DELETE confirmation before allowing permanent removal", () => {
    render(<LeadLifecycleConfirmDialog open action="permanent_delete" onOpenChange={vi.fn()} onConfirm={vi.fn()} />);
    const confirmButton = screen.getByRole("button", { name: "Permanently delete" }) as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText("DELETE"), { target: { value: "delete" } });
    expect(confirmButton.disabled).toBe(false);
  });

  it("allows a recoverable archive to be confirmed without typed input", () => {
    render(<LeadLifecycleConfirmDialog open action="archive" onOpenChange={vi.fn()} onConfirm={vi.fn()} />);
    expect((screen.getByRole("button", { name: "Archive lead" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
