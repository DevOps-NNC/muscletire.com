export const BLOG_CONTENT_VERSION = 1 as const;

export type BlogContentBlock = {
  id: string;
  type: "content";
  body: string;
};

export type BlogImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  fileName?: string;
  placement: "above" | "below";
};

export type BlogBlock = BlogContentBlock | BlogImageBlock;

export type BlogContentDocument = {
  version: typeof BLOG_CONTENT_VERSION;
  blocks: BlogBlock[];
};

function createBlockId() {
  return globalThis.crypto?.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createContentBlock(body = ""): BlogContentBlock {
  return { id: createBlockId(), type: "content", body };
}

export function createImageBlock(
  src = "",
  options: Partial<Pick<BlogImageBlock, "alt" | "fileName" | "placement">> = {},
): BlogImageBlock {
  return {
    id: createBlockId(),
    type: "image",
    src,
    alt: options.alt ?? "",
    ...(options.fileName ? { fileName: options.fileName } : {}),
    placement: options.placement ?? "above",
  };
}

function isBlogBlock(value: unknown): value is BlogBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Record<string, unknown>;

  if (typeof block.id !== "string" || !block.id) return false;
  if (block.type === "content") return typeof block.body === "string";

  return (
    block.type === "image" &&
    typeof block.src === "string" &&
    typeof block.alt === "string" &&
    (block.placement === "above" || block.placement === "below") &&
    (block.fileName === undefined || typeof block.fileName === "string")
  );
}

function isBlogContentDocument(value: unknown): value is BlogContentDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Record<string, unknown>;
  return (
    document.version === BLOG_CONTENT_VERSION &&
    Array.isArray(document.blocks) &&
    document.blocks.every(isBlogBlock)
  );
}

export function parseBlogContent(raw: string | null | undefined): BlogContentDocument {
  if (!raw?.trim()) return { version: BLOG_CONTENT_VERSION, blocks: [] };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isBlogContentDocument(parsed)) return parsed;
  } catch {
    // Existing articles use Markdown. Treat any non-document value as legacy content.
  }

  return {
    version: BLOG_CONTENT_VERSION,
    blocks: [createContentBlock(raw)],
  };
}

export function serializeBlogContent(document: BlogContentDocument): string {
  return JSON.stringify({ version: BLOG_CONTENT_VERSION, blocks: document.blocks });
}

export function orderBlogBlocksForRender(blocks: BlogBlock[]): BlogBlock[] {
  const ordered: BlogBlock[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const next = blocks[index + 1];

    if (block.type === "image" && next?.type === "content") {
      ordered.push(block.placement === "above" ? block : next, block.placement === "above" ? next : block);
      index += 1;
      continue;
    }

    if (block.type === "content" && next?.type === "image") {
      ordered.push(next.placement === "above" ? next : block, next.placement === "above" ? block : next);
      index += 1;
      continue;
    }

    ordered.push(block);
  }

  return ordered;
}
