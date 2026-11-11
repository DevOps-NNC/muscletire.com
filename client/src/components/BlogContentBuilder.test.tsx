/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createContentBlock, createImageBlock, type BlogBlock } from "@shared/blogContent";
import { BlogContentBuilder } from "./BlogContentBuilder";

function lastBlocks(onChange: ReturnType<typeof vi.fn>) {
  return onChange.mock.calls.at(-1)?.[0] as BlogBlock[];
}

function openAddBlockMenu() {
  fireEvent.pointerDown(screen.getByRole("button", { name: "Add block" }), { button: 0 });
}

const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;

describe("BlogContentBuilder", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => cleanup());

  afterAll(() => {
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  it("offers content and image choices from the add block menu", async () => {
    render(<BlogContentBuilder blocks={[]} onChange={vi.fn()} uploadImage={vi.fn()} />);

    openAddBlockMenu();

    expect(await screen.findByRole("menuitem", { name: "Content Box" })).toBeTruthy();
    expect(await screen.findByRole("menuitem", { name: "Image Drop Zone" })).toBeTruthy();
  });

  it("appends a content block", async () => {
    const onChange = vi.fn();
    render(<BlogContentBuilder blocks={[]} onChange={onChange} uploadImage={vi.fn()} />);

    openAddBlockMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "Content Box" }));

    expect(lastBlocks(onChange)).toHaveLength(1);
    expect(lastBlocks(onChange)[0]).toMatchObject({ type: "content", body: "" });
  });

  it("moves and removes blocks through controlled callbacks", () => {
    const first = createContentBlock("First");
    const second = createContentBlock("Second");
    const onChange = vi.fn();
    render(<BlogContentBuilder blocks={[first, second]} onChange={onChange} uploadImage={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Move block 2 up" }));
    expect(lastBlocks(onChange).map(block => block.id)).toEqual([second.id, first.id]);

    fireEvent.click(screen.getByRole("button", { name: "Remove block 1" }));
    expect(lastBlocks(onChange).map(block => block.id)).toEqual([second.id]);
  });

  it("updates image placement from the labeled select", async () => {
    const image = createImageBlock("/guide.png");
    const onChange = vi.fn();
    render(<BlogContentBuilder blocks={[image]} onChange={onChange} uploadImage={vi.fn()} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Image placement" }));
    fireEvent.click(await screen.findByRole("option", { name: "Display below Content Box" }));

    await waitFor(() => expect(lastBlocks(onChange)[0]).toMatchObject({ type: "image", placement: "below" }));
  });
});
