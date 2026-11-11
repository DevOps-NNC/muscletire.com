function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isSafeHref(value) {
  return /^(?:https?:\/\/|\/(?!\/)|tel:|mailto:)/i.test(value);
}

function renderInline(value) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let result = "";
  let cursor = 0;

  for (const match of value.matchAll(linkPattern)) {
    const index = match.index ?? 0;
    result += formatInlineText(value.slice(cursor, index));
    const label = match[1];
    const href = match[2].trim();
    result += isSafeHref(href)
      ? `<a href="${escapeHtml(href)}">${formatInlineText(label)}</a>`
      : formatInlineText(label);
    cursor = index + match[0].length;
  }

  return result + formatInlineText(value.slice(cursor));
}

function formatInlineText(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}

function isBlockStart(line) {
  return /^(?:#{1,6}\s|[-*+]\s|\d+\.\s|>\s|---\s*$)/.test(line);
}

export function renderMarkdownToHtml(markdown = "") {
  const lines = String(markdown).replaceAll("\r\n", "\n").split("\n");
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(6, heading[1].length + 1);
      output.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^---\s*$/.test(line)) {
      output.push("<hr>");
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, "").trim());
        index += 1;
      }
      output.push(`<blockquote><p>${renderInline(quote.join(" "))}</p></blockquote>`);
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index])) {
        items.push(`<li>${renderInline(lines[index].replace(/^[-*+]\s+/, "").trim())}</li>`);
        index += 1;
      }
      output.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(`<li>${renderInline(lines[index].replace(/^\d+\.\s+/, "").trim())}</li>`);
        index += 1;
      }
      output.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return output.join("");
}

export function renderAmpImage(src, alt = "", width = 1200, height = 675) {
  return `<amp-img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="${Math.max(1, Number(width) || 1200)}" height="${Math.max(1, Number(height) || 675)}" layout="responsive"></amp-img>`;
}

export function escapeAmpHtml(value = "") {
  return escapeHtml(value);
}
