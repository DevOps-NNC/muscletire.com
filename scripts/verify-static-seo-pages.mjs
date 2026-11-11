import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/public");
const origin = "__BUSINESS_URL__";
const cases = [
  { route: "/", needle: "Mobile mechanic help where your vehicle is safely parked.", schema: "AutoRepair" },
  { route: "/services", needle: "Find the service closest to your concern", schema: "BreadcrumbList" },
  { route: "/services/brake-service", needle: "Common reasons drivers ask about this service", schema: "Service" },
  { route: "/service-areas/__CITY_SLUG__", needle: "How to request mobile service in __CITY__", schema: "FAQPage" },
  { route: "/faq", needle: "Mobile mechanic questions, answered.", schema: "FAQPage" },
  { route: "/request-service", needle: "Before you send a request", schema: "AutomotiveBusiness" },
];

const failures = [];
for (const entry of cases) {
  const filename = entry.route === "/" ? path.join(root, "index.html") : path.join(root, entry.route.slice(1), "index.html");
  const html = await fs.readFile(filename, "utf8");
  if (html.includes('id="manus-runtime"')) failures.push(`${entry.route}: legacy Manus runtime must not be emitted`);
  if (entry.route !== "/") {
    const flatHtml = await fs.readFile(path.join(root, `${entry.route.slice(1)}.html`), "utf8");
    if (flatHtml !== html) failures.push(`${entry.route}: flat Vercel artifact differs from directory-index document`);
  }
  const canonical = `${origin}${entry.route}`;
  if (!html.includes(`<link rel="canonical" href="${canonical}"`)) failures.push(`${entry.route}: missing route-specific canonical`);
  if (!html.includes(entry.needle)) failures.push(`${entry.route}: crawler-visible body is missing its content needle`);
  const headMatch = html.match(/<head[^>]*>/i);
  const bodyMatch = html.match(/<body[^>]*>/i);
  if (!headMatch || !bodyMatch) {
    failures.push(`${entry.route}: missing document head/body boundary`);
  } else {
    const headStart = headMatch.index + headMatch[0].length;
    const bodyStart = bodyMatch.index + bodyMatch[0].length;
    const headPrefix = html.slice(headStart, html.indexOf("</head>", headStart));
    const bodyPrefix = html.slice(bodyStart, html.indexOf("</body>", bodyStart));
    if (!/^\s*<!-- Google Tag Manager -->\s*<script\b[^>]*data-template-gtm="__GTM_ID__"/.test(headPrefix)) {
      failures.push(`${entry.route}: GTM head snippet is not the first head content`);
    }
    if (!/^\s*<!-- Google Tag Manager \(noscript\) -->\s*<noscript\b[^>]*data-template-gtm-noscript="__GTM_ID__"/.test(bodyPrefix)) {
      failures.push(`${entry.route}: GTM noscript is not immediately after the body opening`);
    }
  }
  const expectedSchemaToken = entry.schema === "AutoRepair" || entry.schema === "AutomotiveBusiness"
    ? `\"${entry.schema}\"`
    : `\"@type\":\"${entry.schema}\"`;
  if (!html.includes(expectedSchemaToken)) failures.push(`${entry.route}: missing expected ${entry.schema} JSON-LD`);
  if ((html.match(/<title>/g) ?? []).length !== 1) failures.push(`${entry.route}: expected exactly one title tag`);
  if ((html.match(/rel="canonical"/g) ?? []).length !== 1) failures.push(`${entry.route}: expected exactly one canonical tag`);
}

const noindexHtml = await fs.readFile(path.join(root, "noindex.html"), "utf8");
if (!noindexHtml.includes('name="robots" content="noindex, follow"')) failures.push("noindex shell: missing noindex policy");
if (noindexHtml.includes("<main class=\"seo-page\"")) failures.push("noindex shell: must not include public crawl content");

const generatedFiles = await fs.readdir(root, { recursive: true });
const ampFiles = generatedFiles.filter(file => file.endsWith("/amp.html") || file === "amp.html");
const decodeHtml = (value) => value.replace(/<[^>]+>/g, "").replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").trim();
const metaValue = (html, name) => html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1] ?? null;
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));

for (const relativeFile of ampFiles) {
  const ampHtml = await fs.readFile(path.join(root, relativeFile), "utf8");
  const directory = relativeFile === "amp.html" ? "" : relativeFile.slice(0, -"/amp.html".length);
  const route = directory ? `/${directory}` : "/";
  const canonicalFile = route === "/" ? "index.html" : `${route.slice(1)}.html`;
  const canonicalHtml = await fs.readFile(path.join(root, canonicalFile), "utf8");
  const canonicalUrl = `${origin}${route}`;
  if (!ampHtml.startsWith("<!doctype html><html amp")) failures.push(`${route}: AMP document is missing the AMP root declaration`);
  if (!ampHtml.includes(`<link rel="canonical" href="${canonicalUrl}">`)) failures.push(`${route}: AMP document is missing its canonical URL`);
  if ((ampHtml.match(/rel="canonical"/g) ?? []).length !== 1) failures.push(`${route}: AMP document must contain exactly one canonical tag`);
  if ((canonicalHtml.match(/rel="amphtml"/g) ?? []).length !== 1 || !canonicalHtml.includes(`<link rel="amphtml" href="${origin}${route === "/" ? "/amp" : `${route}/amp`}"`)) failures.push(`${route}: canonical document is missing its matching amphtml URL`);
  if (metaValue(ampHtml, "description") !== metaValue(canonicalHtml, "description")) failures.push(`${route}: AMP and canonical descriptions differ`);
  const ampTitle = decodeHtml(ampHtml.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
  const canonicalTitle = decodeHtml(canonicalHtml.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
  if (ampTitle !== canonicalTitle) failures.push(`${route}: AMP and canonical titles differ`);
  const ampH1 = decodeHtml(ampHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "");
  const canonicalH1 = decodeHtml(canonicalHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "");
  if (ampH1 !== canonicalH1) failures.push(`${route}: AMP and canonical primary headings differ`);
  if (JSON.stringify(jsonLd(ampHtml).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))) !== JSON.stringify(jsonLd(canonicalHtml).flat().sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))))) failures.push(`${route}: AMP and canonical structured data differ`);
  if (ampHtml.includes("GTM-") || ampHtml.includes("type=\"module\"") || ampHtml.includes("data-template-gtm")) failures.push(`${route}: AMP document must not include marketing or React scripts`);
}

const sitemap = await fs.readFile(path.join(root, "sitemap.xml"), "utf8");
if (/\/amp(?:\/|<)/.test(sitemap)) failures.push("sitemap: AMP URLs must not be submitted as canonical URLs");
if (ampFiles.some(file => /(^|\/)(admin|login|request-confirmation)(\/|$)/.test(file))) failures.push("AMP artifacts: noindex routes must not produce AMP documents");

if (failures.length) {
  console.error("Static SEO verification failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Verified ${cases.length} crawler-visible static route documents, ${ampFiles.length} paired AMP documents, canonical-only sitemap output, and the noindex application shell.`);
