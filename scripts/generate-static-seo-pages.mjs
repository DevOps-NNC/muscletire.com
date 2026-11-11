import fs from "node:fs/promises";
import path from "node:path";
import { createAmpDocument } from "./amp-document.mjs";
import { renderAmpImage, renderMarkdownToHtml } from "./amp-renderer.mjs";

const outputRoot = path.resolve("dist/public");
const clientConfig = JSON.parse(await fs.readFile(path.resolve("client.config.json"), "utf8"));
const origin = "__BUSINESS_URL__";
const siteName = "__BUSINESS_NAME__";
// Service areas are read from the new client configuration; do not reuse the source client cities.
const phone = "__BUSINESS_PHONE__";
const phoneRaw = "__BUSINESS_PHONE_RAW__";
const shareImage = `${origin}/images/placeholder.svg`;
const themeCss = await fs.readFile(path.resolve("client/src/index.css"), "utf8");
const themeColor = (name, fallback) => themeCss.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? fallback;

const services = [
  { slug: "diagnostics", name: "Vehicle Diagnostics", description: "Mobile vehicle diagnostics for warning lights, no-start concerns, and difficult-to-describe symptoms at approved __CITY__ and __REGION__ locations.", symptoms: ["Check engine lights", "No-start concerns", "Rough running", "New warning messages"] },
  { slug: "brake-service", name: "Brake Service", description: "Mobile brake inspection and service for approved __REGION__ locations. Start with the symptom, vehicle details, and a safely accessible parking location.", symptoms: ["Squealing or grinding", "Soft brake pedal", "Pulling while braking", "Brake warning light"] },
  { slug: "battery-replacement", name: "Battery & Electrical Service", description: "Mobile battery testing, replacement, and charging-system checks for approved __CITY__ and __REGION__ locations.", symptoms: ["Slow cranking", "Battery warning light", "Dim lights", "Clicking when starting"] },
  { slug: "oil-change", name: "Mobile Oil Changes", description: "Convenient mobile oil change service at approved __CITY__ and __REGION__ home, workplace, or accessible parking locations.", symptoms: ["Maintenance due", "Oil reminder light", "Low oil level", "Overdue oil change"] },
  { slug: "tune-up", name: "Tune-Ups & Maintenance", description: "Mobile maintenance support for eligible tune-up, filter, spark-plug, belt, hose, and scheduled-service needs.", symptoms: ["Rough idle", "Reduced fuel economy", "Maintenance due", "Sluggish acceleration"] },
  { slug: "pre-purchase-inspections", name: "Pre-Purchase Inspections", description: "A mobile pre-purchase inspection can help a buyer better understand a used vehicle before making a decision.", symptoms: ["Buying a used vehicle", "Seller-location inspection", "Visible condition review", "Diagnostic-code review"] },
  { slug: "cooling-system", name: "Cooling System Service", description: "Mobile cooling-system and overheating diagnosis for a safely parked vehicle in __CITY__ and approved __REGION__ areas.", symptoms: ["High temperature gauge", "Coolant leak", "Steam under hood", "Coolant loss"] },
  { slug: "electrical-repair", name: "Electrical System Repair", description: "Mobile electrical troubleshooting for eligible warning lights, battery drain, wiring, and accessory concerns.", symptoms: ["Electrical accessories failing", "Flickering lights", "Blown fuses", "Battery drain"] },
  { slug: "belt-replacement", name: "Belt & Hose Replacement", description: "Mobile belt and hose inspection or replacement support for eligible vehicles and approved locations.", symptoms: ["Squealing belt", "Visible belt wear", "Coolant hose leak", "Accessory issue"] },
  { slug: "ac-repair", name: "A/C Repair & Recharge", description: "Mobile A/C diagnostics and eligible service for Florida drivers dealing with weak, warm, or inconsistent air conditioning.", symptoms: ["Warm air", "Weak airflow", "Unusual A/C noise", "Intermittent cooling"] },
];

const areas = (clientConfig.serviceAreas ?? []).map(area => ({
  name: area.name, slug: area.slug, note: area.description || "Ask about service availability at your location.", places: [],
}));

const faqItems = [
  ["What is a mobile mechanic?", "A mobile mechanic travels to an eligible location to perform diagnostics, maintenance, inspections, and other appropriate automotive work. Service depends on the vehicle, the repair need, and whether the location is safe and accessible."],
  ["Where can a mobile mechanic work on my vehicle?", "Mobile service may be possible at a home, workplace, driveway, parking area, or another safely accessible location. Share any parking, property, or building rules before scheduling."],
  ["Can every repair be completed at my location?", "Not every repair is a fit for mobile service. Work that requires a lift, extensive disassembly, specialized shop equipment, or an unsafe work area may need a different solution."],
  ["How do I request mobile mechanic service?", `Call ${phone}, send a text, or use the guided request form. Include the vehicle, concern, service location, and the best way to reach you.`],
  ["What should I do if the vehicle is unsafe to inspect?", "Personal safety comes first. If the vehicle is in traffic, has smoke or fire, is leaking fuel, or creates an immediate hazard, move to safety and contact emergency services or roadside assistance as appropriate."],
];

const escapeHtml = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const safeJson = (data) => JSON.stringify(data).replaceAll("<", "\\u003c");
const fullUrl = (route) => `${origin}${route}`;
const button = (href, label, secondary = false) => `<a class="cta${secondary ? " cta-secondary" : ""}" href="${href}">${escapeHtml(label)}</a>`;
const serviceLinks = () => `<ul class="link-grid">${services.map((service) => `<li><a href="/services/${service.slug}">${escapeHtml(service.name)}</a></li>`).join("")}</ul>`;
const areaLinks = () => `<ul class="link-grid">${areas.map((area) => `<li><a href="/service-areas/${area.slug}">Mobile mechanic in ${escapeHtml(area.name)}, ${escapeHtml(clientConfig.business.stateCode)}</a></li>`).join("")}</ul>`;

function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["AutoRepair", "AutomotiveBusiness"],
    "@id": `${origin}/#automotive-business`,
    name: siteName,
    url: origin,
    telephone: `+1${phoneRaw}`,
    image: shareImage,
    areaServed: areas.map((area) => ({ "@type": "City", name: `${area.name}, ${clientConfig.business.stateCode}` })),
    sameAs: ["__GOOGLE_BUSINESS_PROFILE_URL__"],
  };
}

function breadcrumbSchema(route, crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: fullUrl(crumb.route) })),
  };
}

function faqSchema(items = faqItems) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
  };
}

function articleSchema(route, title, description, publishedAt, image = shareImage) {
  return { "@context": "https://schema.org", "@type": "Article", headline: title, description, url: fullUrl(route), mainEntityOfPage: { "@type": "WebPage", "@id": fullUrl(route) }, author: { "@type": "Organization", name: siteName, url: origin }, publisher: { "@id": `${origin}/#automotive-business` }, image, datePublished: publishedAt, inLanguage: "en-US" };
}

function pageSchema(route, title, description, extras = []) {
  return [
    { "@context": "https://schema.org", "@type": "WebPage", "@id": `${fullUrl(route)}#webpage`, url: fullUrl(route), name: title, description, primaryImageOfPage: shareImage, isPartOf: { "@id": `${origin}/#website` }, about: { "@id": `${origin}/#automotive-business` } },
    ...extras,
  ];
}

function pageShell({ title, description, route, body, schema = [], noindex = false }) {
  const canonical = fullUrl(route);
  const robots = noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  return `
    <main class="seo-page" id="seo-content">
      <header class="seo-header"><a class="brand" href="/">${siteName}</a><nav aria-label="Primary"><a href="/services">Services</a><a href="/service-areas">Service Areas</a><a href="/about">About</a><a href="/reviews">Reviews</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></nav><a class="header-call" href="tel:${phoneRaw}">Call ${phone}</a></header>
      ${body}
      <footer class="seo-footer"><p><strong>${siteName}</strong> — mobile automotive service at approved locations.</p><p><a href="tel:${phoneRaw}">${phone}</a> · <a href="/request-service">Request service</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p></footer>
    </main>
    <script type="application/ld+json">${safeJson(schema)}</script>`;
}

function renderHome() {
  const title = "__BUSINESS_NAME__ | __CITY__ Mobile Auto Repair";
  const description = "Mobile mechanic service for eligible __CITY__ and __REGION__ locations. Request diagnostics, brake service, battery help, maintenance, inspections, and more.";
  const body = `<section class="hero"><p class="eyebrow">Mobile service across __CITY__ & __REGION__</p><h1>Mobile mechanic help where your vehicle is safely parked.</h1><p>Request a practical next step for diagnostics, brake concerns, battery issues, maintenance, inspections, cooling, A/C, and eligible mobile repairs.</p><div class="actions">${button("/request-service", "Request mobile service")}${button(`tel:${phoneRaw}`, `Call ${phone}`, true)}</div></section><section><h2>Mobile mechanic services</h2><p>Choose the closest concern, then share the vehicle and location so the team can discuss availability and the appropriate next step.</p>${serviceLinks()}</section><section><h2>__REGION__ service areas</h2><p>Published areas are reviewed one request at a time for vehicle, access, and location suitability.</p>${areaLinks()}</section><section><h2>How the request process works</h2><ol><li>Share the vehicle, location, and concern.</li><li>The team reviews the details and discusses availability.</li><li>Agree on the appropriate next step before service is confirmed.</li></ol></section><section><h2>Questions before you request service?</h2>${faqItems.slice(0, 3).map(([question, answer]) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join("")}</section>`;
  return { route: "/", title, description, body, schema: pageSchema("/", title, description, [localBusinessSchema(), faqSchema(faqItems.slice(0, 3))]) };
}

function renderServices() {
  const title = "Mobile Mechanic Services in __CITY__, FL | __BUSINESS_NAME__";
  const description = "Explore mobile diagnostics, brake service, battery help, maintenance, inspections, cooling-system service, and more at approved __CITY__ and __REGION__ locations.";
  const body = `<section class="hero compact"><p class="eyebrow">Mobile automotive service</p><h1>Mobile mechanic services for __CITY__ and __REGION__.</h1><p>Service is discussed based on the vehicle, the concern, and a safely accessible location.</p><div class="actions">${button("/request-service", "Start a service request")}</div></section><section><h2>Find the service closest to your concern</h2>${services.map((service) => `<article class="service-card"><h3><a href="/services/${service.slug}">${escapeHtml(service.name)}</a></h3><p>${escapeHtml(service.description)}</p><p><strong>Common concerns:</strong> ${service.symptoms.map(escapeHtml).join(", ")}.</p></article>`).join("")}</section><section><h2>Not sure which service fits?</h2><p>A warning light, a no-start condition, a sound, or a change in how the vehicle drives is enough to begin. The guided request form collects the details needed for a useful follow-up.</p></section>`;
  return { route: "/services", title, description, body, schema: pageSchema("/services", title, description, [localBusinessSchema(), breadcrumbSchema("/services", [{ name: "Home", route: "/" }, { name: "Services", route: "/services" }])]) };
}

function renderService(service) {
  const route = `/services/${service.slug}`;
  const title = `${service.name} in __CITY__, FL | __BUSINESS_NAME__`;
  const description = service.description;
  const serviceFaqs = [[`Can ${service.name.toLowerCase()} be completed at my location?`, "Some mobile services can be completed at an approved, safely accessible location. The vehicle, service scope, needed parts, and work area are reviewed before work is confirmed."], ["What should I include in my request?", "Include the vehicle year, make, model, concern, exact location, and the best contact method. A VIN is helpful when available."]];
  const body = `<section class="hero compact"><p class="eyebrow">__CITY__ & __REGION__ mobile service</p><h1>${escapeHtml(service.name)}</h1><p>${escapeHtml(service.description)}</p><div class="actions">${button("/request-service", `Request ${service.name}`)}${button(`tel:${phoneRaw}`, `Call ${phone}`, true)}</div></section><section><h2>Common reasons drivers ask about this service</h2><ul>${service.symptoms.map((symptom) => `<li>${escapeHtml(symptom)}</li>`).join("")}</ul></section><section><h2>What happens next</h2><ol><li>Share the vehicle details, symptom, and service location.</li><li>The team reviews whether the request is appropriate for mobile service.</li><li>Availability and the next step are discussed before work is confirmed.</li></ol></section><section><h2>Related mobile services</h2>${serviceLinks()}</section><section><h2>Questions about ${escapeHtml(service.name)}</h2>${serviceFaqs.map(([question, answer]) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join("")}</section>`;
  const serviceSchema = { "@context": "https://schema.org", "@type": "Service", name: service.name, description: service.description, url: fullUrl(route), provider: { "@id": `${origin}/#automotive-business` }, areaServed: areas.map((area) => ({ "@type": "City", name: `${area.name}, FL` })) };
  return { route, title, description, body, schema: pageSchema(route, title, description, [serviceSchema, faqSchema(serviceFaqs), breadcrumbSchema(route, [{ name: "Home", route: "/" }, { name: "Services", route: "/services" }, { name: service.name, route }])]) };
}

function renderAreas() {
  const title = "Mobile Mechanic Service Areas | __CITY__ and __REGION__";
  const description = "See the published __REGION__ areas where __BUSINESS_NAME__ discusses mobile service for appropriate vehicles and safely accessible locations.";
  const body = `<section class="hero compact"><p class="eyebrow">Published coverage</p><h1>Mobile mechanic service areas in __REGION__.</h1><p>Service availability depends on the vehicle, the work requested, location access, and scheduling. Start with your exact location for a practical next step.</p><div class="actions">${button("/request-service", "Request mobile service")}</div></section><section><h2>Explore a published service area</h2>${areaLinks()}</section><section><h2>What helps with a location request?</h2><ul><li>The exact address or nearby area.</li><li>Whether the vehicle is at a home, workplace, apartment, or managed parking location.</li><li>Parking, gate, building, or property rules that affect access.</li><li>A clear description of the vehicle concern and whether it is safely parked.</li></ul></section>`;
  return { route: "/service-areas", title, description, body, schema: pageSchema("/service-areas", title, description, [localBusinessSchema(), breadcrumbSchema("/service-areas", [{ name: "Home", route: "/" }, { name: "Service Areas", route: "/service-areas" }])]) };
}

function renderArea(area) {
  const route = `/service-areas/${area.slug}`;
  const title = `Mobile Mechanic in ${area.name}, FL | __BUSINESS_NAME__`;
  const description = `Mobile mechanic help for approved ${area.name}, Florida locations. Share the vehicle concern and exact location to discuss the appropriate next step.`;
  const areaFaqs = [[`Do you serve ${area.name}?`, `${area.name} is a published service area. The team reviews the vehicle, exact location, access, and availability before confirming a mobile-service plan.`], ["What location details are useful?", "Share the address or area, parking type, access notes, property rules, and whether the vehicle is safely reachable."]];
  const body = `<section class="hero compact"><p class="eyebrow">Approved __REGION__ coverage</p><h1>Mobile mechanic in ${escapeHtml(area.name)}, FL</h1><p>${escapeHtml(area.note)}</p><div class="actions">${button("/request-service", "Request service in " + area.name)}${button(`tel:${phoneRaw}`, `Call ${phone}`, true)}</div></section><section><h2>Commonly requested areas in ${escapeHtml(area.name)}</h2><ul class="tag-list">${area.places.map((place) => `<li>${escapeHtml(place)}</li>`).join("")}</ul></section><section><h2>How to request mobile service in ${escapeHtml(area.name)}</h2><p>Include the vehicle, the concern, the exact parking location, access details, and preferred contact method. The team can then discuss whether a mobile visit is appropriate and available.</p></section><section><h2>Useful service information</h2>${serviceLinks()}</section><section><h2>Questions about service in ${escapeHtml(area.name)}</h2>${areaFaqs.map(([question, answer]) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join("")}</section>`;
  const areaServiceSchema = { "@context": "https://schema.org", "@type": "Service", name: `Mobile mechanic service in ${area.name}, FL`, description, url: fullUrl(route), provider: { "@id": `${origin}/#automotive-business` }, areaServed: { "@type": "City", name: `${area.name}, FL` } };
  return { route, title, description, body, schema: pageSchema(route, title, description, [areaServiceSchema, faqSchema(areaFaqs), breadcrumbSchema(route, [{ name: "Home", route: "/" }, { name: "Service Areas", route: "/service-areas" }, { name: area.name, route }])]) };
}

function parsePublishedArticleBlocks(raw) {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version === 1 && Array.isArray(parsed.blocks)) {
      return parsed.blocks.filter((block) => block && (block.type === "content" || block.type === "image"));
    }
  } catch {
    // Legacy articles store Markdown directly in the content column.
  }
  return [{ id: "legacy-content", type: "content", body: raw }];
}

function orderPublishedArticleBlocks(blocks) {
  const ordered = [];
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

function publicAssetUrl(value) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `${origin}${value.startsWith("/") ? value : `/${value}`}`;
}

function renderPublishedArticleBlocks(article, amp) {
  return orderPublishedArticleBlocks(parsePublishedArticleBlocks(article.content)).map((block) => {
    if (block.type === "content") {
      return `<div class="${amp ? "amp-prose" : "article-prose"}">${renderMarkdownToHtml(block.body)}</div>`;
    }
    if (!block.src) return "";
    const src = publicAssetUrl(block.src);
    if (!src) return "";
    const image = amp ? renderAmpImage(src, block.alt) : `<img src="${escapeHtml(src)}" alt="${escapeHtml(block.alt)}" width="1200" height="675" loading="lazy" decoding="async">`;
    return `<figure class="${amp ? "amp-figure" : "article-figure"}">${image}${block.alt ? `<figcaption>${escapeHtml(block.alt)}</figcaption>` : ""}</figure>`;
  }).join("");
}

function renderPublishedArticle(article) {
  const route = `/blog/${article.slug}`;
  const title = article.metaTitle || `${article.title} | ${siteName}`;
  const description = article.metaDescription || article.excerpt || `Read ${article.title} from ${siteName}.`;
  const image = publicAssetUrl(article.ogImage || article.featuredImage) || shareImage;
  const faqs = Array.isArray(article.faqs) ? article.faqs.filter((faq) => faq?.question && faq?.answer).map((faq) => [faq.question, faq.answer]) : [];
  const canonicalContent = renderPublishedArticleBlocks(article, false);
  const ampContent = renderPublishedArticleBlocks(article, true);
  const actions = `${button("/request-service", "Request mobile service")}${button("/blog", "Browse all guides", true)}`;
  const body = `<section class="hero compact"><p class="eyebrow">${escapeHtml(article.category || "Vehicle-care guide")}</p><h1>${escapeHtml(article.title)}</h1>${article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : ""}<div class="actions">${actions}</div></section><section><article class="article-content">${canonicalContent}</article></section>${faqs.length ? `<section><h2>Frequently asked questions</h2>${faqs.map(([question, answer]) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join("")}</section>` : ""}`;
  const ampBody = `<section class="amp-hero"><p class="amp-eyebrow">${escapeHtml(article.category || "Vehicle-care guide")}</p><h1>${escapeHtml(article.title)}</h1>${article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : ""}<div class="amp-actions">${actions.replaceAll('class="cta cta-secondary"', 'class="amp-button amp-button-secondary"').replaceAll('class="cta-secondary"', 'class="amp-button amp-button-secondary"').replaceAll('class="cta"', 'class="amp-button"')}</div></section><section class="amp-section"><article class="amp-card">${ampContent}</article></section>${faqs.length ? `<section class="amp-section"><h2>Frequently asked questions</h2>${faqs.map(([question, answer]) => `<article class="amp-card"><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join("")}</section>` : ""}`;
  const extras = [articleSchema(route, article.title, description, article.publishedAt, image), breadcrumbSchema(route, [{ name: "Home", route: "/" }, { name: "Blog", route: "/blog" }, { name: article.title, route }])];
  if (faqs.length) extras.push(faqSchema(faqs));
  return { route, title, description, body, ampBody, schema: pageSchema(route, title, description, extras), publishedAt: article.publishedAt };
}

function ampRequestForm() {
  return `<section class="amp-section"><h2>Send a service request</h2><p>Share the details below. The team will review the request and contact you about availability; submitting this form does not confirm an appointment.</p><form class="amp-form" method="post" action-xhr="/api/amp/leads" enctype="application/x-www-form-urlencoded" target="_top"><fieldset><legend>Contact</legend><label for="amp-full-name">Full name *</label><input id="amp-full-name" name="fullName" type="text" autocomplete="name" required><label for="amp-phone">Phone *</label><input id="amp-phone" name="phone" type="tel" autocomplete="tel" required><label for="amp-email">Email</label><input id="amp-email" name="email" type="email" autocomplete="email"><label>Preferred contact</label><label><input name="preferredContact" type="radio" value="call" checked> Call</label><label><input name="preferredContact" type="radio" value="text"> Text</label><label><input name="preferredContact" type="radio" value="email"> Email</label></fieldset><fieldset><legend>Location</legend><label for="amp-street">Street address</label><input id="amp-street" name="streetAddress" type="text" autocomplete="street-address"><label for="amp-unit">Unit</label><input id="amp-unit" name="unit" type="text"><label for="amp-city">City</label><input id="amp-city" name="city" type="text" autocomplete="address-level2"><label for="amp-zip">ZIP code</label><input id="amp-zip" name="zipCode" type="text" autocomplete="postal-code"><label for="amp-location-type">Location type</label><select id="amp-location-type" name="locationType"><option value="home">Home</option><option value="workplace">Workplace</option><option value="roadside">Roadside</option><option value="parking_lot">Parking lot</option><option value="dealership">Dealership</option><option value="other">Other</option></select><label for="amp-location-notes">Location notes</label><textarea id="amp-location-notes" name="locationNotes"></textarea></fieldset><fieldset><legend>Vehicle</legend><label for="amp-year">Year</label><input id="amp-year" name="vehicleYear" type="text" inputmode="numeric"><label for="amp-make">Make</label><input id="amp-make" name="vehicleMake" type="text"><label for="amp-model">Model</label><input id="amp-model" name="vehicleModel" type="text"><label for="amp-trim">Trim</label><input id="amp-trim" name="vehicleTrim" type="text"><label for="amp-vin">VIN</label><input id="amp-vin" name="vin" type="text" autocomplete="off"><label for="amp-mileage">Mileage</label><input id="amp-mileage" name="mileage" type="text" inputmode="numeric"></fieldset><fieldset><legend>Concern and scheduling</legend><label for="amp-service">Requested service</label><select id="amp-service" name="requestedService"><option value="">Select a service</option>${services.map((service) => `<option value="${service.slug}">${escapeHtml(service.name)}</option>`).join("")}<option value="other">Other</option></select><label for="amp-symptom">Main symptom</label><input id="amp-symptom" name="mainSymptom" type="text"><label for="amp-problem">Describe the problem</label><textarea id="amp-problem" name="problemDescription"></textarea><label><input name="vehicleStarts" type="checkbox" value="true"> Vehicle starts</label><label><input name="vehicleSafe" type="checkbox" value="true"> Vehicle is safely accessible</label><label><input name="isAsap" type="checkbox" value="true"> As soon as possible</label><label for="amp-date">Preferred date</label><input id="amp-date" name="preferredDate" type="date"><label for="amp-time">Preferred time</label><select id="amp-time" name="preferredTime"><option value="">Any time</option><option value="morning">Morning (9 AM–12 PM)</option><option value="afternoon">Afternoon (12 PM–3 PM)</option><option value="late-afternoon">Late afternoon (3 PM–5 PM)</option></select><label for="amp-notes">Additional notes</label><textarea id="amp-notes" name="customerNotes"></textarea></fieldset><fieldset><legend>Consent</legend><label><input name="consent" type="checkbox" value="on" required> I agree to the <a href="/privacy">Privacy Policy</a> and understand this is a service request, not a confirmed appointment.</label><label><input name="adsDataConsent" type="checkbox" value="true"> Optional advertising measurement consent</label><input class="hidden" name="website" type="text" tabindex="-1" autocomplete="off"><button type="submit">Send service request</button></fieldset><div submit-success><template type="amp-mustache"><p>{{message}}</p><p>Reference: {{referenceNumber}}</p></template></div><div submit-error><template type="amp-mustache"><p>{{message}}</p></template></div></form></section>`;
}

function simplePage(route, title, description, body, extraSchema = []) {
  return { route, title, description, body, schema: pageSchema(route, title, description, extraSchema) };
}

const simplePages = [
  simplePage("/about", "About __BUSINESS_NAME__ | __CITY__, FL", "Meet __BUSINESS_NAME__ and learn how the team approaches mobile vehicle service for approved __CITY__ and __REGION__ locations.", `<section class="hero compact"><p class="eyebrow">About the business</p><h1>A practical mobile-service option for __REGION__ drivers.</h1><p>__BUSINESS_NAME__ focuses on helping customers describe their vehicle concern, location, and next step clearly before service is scheduled.</p></section><section><h2>What customers can expect</h2><ul><li>A guided service-request process that captures the vehicle concern and location context.</li><li>Direct call and text options when a conversation is more useful.</li><li>Clear scope boundaries for safe, appropriate mobile service.</li><li>Review and social links for current public business proof.</li></ul></section><section><h2>Start with the details</h2><p>Share your vehicle, concern, and location so the team can discuss availability and the appropriate next step.</p>${button("/request-service", "Request mobile service")}</section>`, [localBusinessSchema()]),
  simplePage("/reviews", "Customer reviews | " + siteName, "Verified customer reviews and feedback.", `<section class="hero compact"><h1>Customer reviews</h1><p>Verified reviews will be displayed when approved by the client.</p></section>`),
  simplePage("/faq", "Mobile Mechanic FAQ | __BUSINESS_NAME__", "Answers to common questions about mobile mechanic service in __CITY__ and __REGION__.", `<section class="hero compact"><p class="eyebrow">Before you request service</p><h1>Mobile mechanic questions, answered.</h1><p>Clear, practical answers about mobile service, location access, vehicle concerns, scheduling, and safety.</p></section><section><h2>Frequently asked questions</h2>${faqItems.map(([question, answer]) => `<article><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`).join("")}<p><a href="/faq">Open the full mobile mechanic FAQ</a> for additional scheduling, preparation, maintenance, and pricing-discussion questions.</p></section>`, [faqSchema(faqItems), breadcrumbSchema("/faq", [{ name: "Home", route: "/" }, { name: "FAQ", route: "/faq" }])]),
  simplePage("/contact", "Contact __BUSINESS_NAME__ | __CITY__, FL", "Call, text, email, or send a service request to __BUSINESS_NAME__ in __CITY__ and __REGION__.", `<section class="hero compact"><p class="eyebrow">Contact __BUSINESS_NAME__</p><h1>Tell us what your vehicle is doing.</h1><p>Call, text, or use the service request form to share the vehicle concern, location, and best contact method.</p><div class="actions">${button(`tel:${phoneRaw}`, `Call ${phone}`)}${button("/request-service", "Request service", true)}</div></section><section><h2>What helps with the first conversation</h2><ul><li>Vehicle year, make, model, and VIN when available.</li><li>The main symptom, dashboard warning, noise, or maintenance need.</li><li>The exact location and whether the vehicle is safely accessible.</li><li>Your preferred way to be contacted.</li></ul></section>`, [localBusinessSchema()]),
  simplePage("/request-service", "Request Mobile Mechanic Service in __CITY__, FL | __BUSINESS_NAME__", "Request mobile auto repair, diagnostics, brake service, battery help, maintenance, or an inspection at your __CITY__ or __REGION__ location.", `<section class="hero compact"><p class="eyebrow">Guided service request</p><h1>Request mobile mechanic service.</h1><p>Share the vehicle, location, concern, and preferred timing. The interactive request form loads when JavaScript is available; this page also provides the key contact information crawlers and non-JavaScript visitors need.</p><div class="actions">${button(`tel:${phoneRaw}`, `Call ${phone}`)}${button("/contact", "Contact options", true)}</div></section><section><h2>Before you send a request</h2><ol><li>Make sure the vehicle is parked in a safe, accessible location.</li><li>Gather the vehicle details and the clearest description of the concern.</li><li>Include access notes, building rules, or parking details when relevant.</li></ol></section><section><h2>Available request topics</h2>${serviceLinks()}</section>`, [localBusinessSchema()]),
  simplePage("/blog", "Mobile Mechanic Guides | __BUSINESS_NAME__", "Practical vehicle-care and mobile mechanic guidance for __CITY__ and __REGION__ drivers.", `<section class="hero compact"><p class="eyebrow">Vehicle-care guidance</p><h1>Practical mobile mechanic guides for __REGION__ drivers.</h1><p>Guides are intended to help drivers understand common vehicle concerns, prepare a useful service request, and know when a safety-first next step is needed.</p></section><section><h2>Useful topics before you book</h2><ul><li><a href="/services/diagnostics">What to note when a check-engine light or warning message appears</a></li><li><a href="/services/battery-replacement">What a no-start or battery symptom can mean</a></li><li><a href="/services/cooling-system">Why overheating requires a safe, prompt decision</a></li><li><a href="/services/pre-purchase-inspections">Questions to consider before purchasing a used vehicle</a></li></ul></section>`, []),



  simplePage("/privacy", "Privacy Policy | __BUSINESS_NAME__", "Privacy information for visitors and service-request customers of __BUSINESS_NAME__.", `<section class="hero compact"><p class="eyebrow">Privacy</p><h1>Privacy information.</h1><p>__BUSINESS_NAME__ uses service-request information to review the request and contact the customer about the next step. Read the full interactive policy after JavaScript loads, or contact the business with a privacy question.</p></section><section><h2>Service-request information</h2><p>Customer contact, vehicle, location, and concern details are collected to evaluate a service request and manage the customer conversation. Optional advertising-measurement data is handled only in accordance with the choices shown on the request form.</p></section>`, []),
  simplePage("/terms", "Terms | __BUSINESS_NAME__", "Terms and site-use information for __BUSINESS_NAME__ visitors.", `<section class="hero compact"><p class="eyebrow">Terms</p><h1>Site-use and service-request terms.</h1><p>Submitting a request does not guarantee service, a specific price, a repair outcome, or appointment availability. The vehicle, work scope, location access, and timing are reviewed before a service plan is confirmed.</p></section><section><h2>Safety and scope</h2><p>Do not attempt to inspect or repair a vehicle in traffic, near fire or fuel leaks, or in another hazardous situation. Contact emergency services or roadside assistance when appropriate.</p></section>`, []),
];

function replaceTag(html, pattern, replacement) {
  return html.replace(pattern, () => replacement);
}

function staticHead(title, description, canonical, noindex = false, ampUrl = null) {
  const robots = noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const ampLink = ampUrl ? `<link rel="amphtml" href="${escapeHtml(ampUrl)}" />` : "";
  return `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}" /><meta name="robots" content="${robots}" /><meta name="theme-color" content="${themeColor("hero-bg", "transparent")}" /><link rel="canonical" href="${canonical}" />${ampLink}<meta property="og:site_name" content="${siteName}" /><meta property="og:type" content="website" /><meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(description)}" /><meta property="og:url" content="${canonical}" /><meta property="og:image" content="${shareImage}" /><meta property="og:image:width" content="2560" /><meta property="og:image:height" content="1440" /><meta property="og:image:alt" content="Mobile automotive service in __CITY__, Florida" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escapeHtml(title)}" /><meta name="twitter:description" content="${escapeHtml(description)}" /><meta name="twitter:image" content="${shareImage}" />`;
}

const staticCss = `<style id="static-seo-style">.seo-page{color:var(--color-text-main);background:var(--color-page-bg);font:16px/1.6 Inter,Arial,sans-serif}.seo-page *{box-sizing:border-box}.seo-page a{color:var(--color-primary);text-decoration-thickness:1.5px;text-underline-offset:3px}.seo-header,.seo-page>section,.seo-footer{max-width:1100px;margin:auto;padding-left:24px;padding-right:24px}.seo-header{min-height:76px;display:flex;gap:18px;align-items:center;justify-content:space-between}.seo-header nav{display:flex;flex-wrap:wrap;gap:14px}.seo-header a{font-weight:700}.brand{font-size:1.1rem;color:var(--color-hero-bg)!important;text-decoration:none}.header-call{white-space:nowrap}.hero{background:var(--color-hero-bg);color:var(--color-text-inverse);padding-top:70px!important;padding-bottom:70px!important}.hero h1{font-size:clamp(2.3rem,5vw,4.6rem);line-height:.98;max-width:820px;margin:.2rem 0 1.25rem}.hero p{max-width:700px;font-size:1.15rem;color:color-mix(in srgb,var(--color-text-inverse) 85%,transparent)}.compact{padding-top:50px!important;padding-bottom:50px!important}.eyebrow{font-size:.75rem!important;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--color-primary)!important}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.cta{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:10px 18px;border-radius:5px;background:var(--color-primary);color:var(--color-text-inverse)!important;font-weight:800;text-decoration:none!important}.cta-secondary{background:var(--color-card-bg);color:var(--color-hero-bg)!important}.seo-page>section{padding-top:42px;padding-bottom:12px}.seo-page h2{font-size:1.65rem;line-height:1.2}.seo-page h3{font-size:1.08rem;margin-bottom:.2rem}.seo-page article,.service-card{background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:6px;padding:18px;margin:12px 0}.link-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;padding:0;list-style:none}.link-grid a{display:block;background:var(--color-card-bg);border:1px solid var(--color-border);border-radius:5px;padding:14px;font-weight:700}.tag-list{display:flex;gap:10px;flex-wrap:wrap;list-style:none;padding:0}.tag-list li{background:var(--color-secondary);padding:7px 12px;border-radius:999px}.seo-footer{margin-top:52px;padding-top:32px;padding-bottom:38px;border-top:4px solid var(--color-primary);background:var(--color-footer-bg);color:var(--color-text-inverse)}.seo-footer a{color:var(--color-text-inverse)}@media(max-width:760px){.seo-header{align-items:flex-start;flex-direction:column;padding-top:18px;padding-bottom:18px;gap:8px}.header-call{background:var(--color-primary);color:var(--color-text-inverse)!important;padding:8px 12px;text-decoration:none!important}.hero{padding-top:46px!important;padding-bottom:46px!important}.seo-page>section{padding-left:18px;padding-right:18px}}</style>`;

function ampBodyFromCanonical(body) {
  return body
    .replaceAll('class="hero compact"', 'class="amp-hero"')
    .replaceAll('class="hero"', 'class="amp-hero"')
    .replaceAll('class="eyebrow"', 'class="amp-eyebrow"')
    .replaceAll('class="actions"', 'class="amp-actions"')
    .replaceAll('class="cta cta-secondary"', 'class="amp-button amp-button-secondary"')
    .replaceAll('class="cta-secondary"', 'class="amp-button amp-button-secondary"')
    .replaceAll('class="cta"', 'class="amp-button"')
    .replaceAll('class="service-card"', 'class="amp-card"')
    .replaceAll('class="link-grid"', 'class="amp-link-grid"')
    .replace(/<section(?! class)/g, '<section class="amp-section"')
    .replace(/<article(?! class)/g, '<article class="amp-card"');
}

function ampShell({ title, body }) {
  return `<div class="amp-shell"><header class="amp-header"><a class="amp-brand" href="/">${siteName}</a><nav class="amp-nav" aria-label="Primary"><a href="/services">Services</a><a href="/service-areas">Service Areas</a><a href="/about">About</a><a href="/reviews">Reviews</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></nav><a class="amp-call" href="tel:${phoneRaw}">Call ${phone}</a></header><main class="amp-main" aria-label="${escapeHtml(title)}">${body}</main><footer class="amp-footer"><p><strong>${siteName}</strong> — mobile automotive service for approved __CITY__ and __REGION__ locations.</p><p><a href="tel:${phoneRaw}">${phone}</a> · <a href="/request-service">Request service</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p></footer></div>`;
}

async function writePage(baseHtml, page) {
  const canonical = fullUrl(page.route);
  const ampUrl = fullUrl(`${page.route === "/" ? "" : page.route}/amp`);
  let html = baseHtml;
  html = replaceTag(html, /<title>[\s\S]*?<\/title>[\s\S]*?<link rel="canonical"[^>]*\/?>/, staticHead(page.title, page.description, canonical, Boolean(page.noindex), page.noindex ? null : ampUrl));
  html = replaceTag(html, /<div id="root"><\/div>/, `<div id="root">${pageShell(page)}</div>`);
  html = html.replace("</head>", `${staticCss}</head>`);
  const target = page.route === "/" ? path.join(outputRoot, "index.html") : path.join(outputRoot, page.route.replace(/^\//, ""), "index.html");
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, html);
  // Vercel rewrites clean public URLs to these flat artifacts. The directory
  // index remains available for local static-server checks and direct file use.
  if (page.route !== "/") {
    const flatTarget = path.join(outputRoot, `${page.route.replace(/^\//, "")}.html`);
    await fs.mkdir(path.dirname(flatTarget), { recursive: true });
    await fs.writeFile(flatTarget, html);
  }

  if (!page.noindex) {
    const ampHtml = createAmpDocument({
      title: page.title,
      description: page.description,
      canonical,
      body: ampShell({ title: page.title, body: page.ampBody || ampBodyFromCanonical(page.body) }),
      schema: page.schema,
      useAmpForm: Boolean(page.useAmpForm),
    });
    const ampTarget = page.route === "/" ? path.join(outputRoot, "amp.html") : path.join(outputRoot, `${page.route.replace(/^\//, "")}/amp.html`);
    await fs.mkdir(path.dirname(ampTarget), { recursive: true });
    await fs.writeFile(ampTarget, ampHtml);
  }
}

async function writeNoIndexShell(baseHtml) {
  const page = { route: "/app", title: `${siteName} | Customer Portal`, description: "Secure customer and team application area.", body: "", schema: [], noindex: true };
  let html = baseHtml;
  html = replaceTag(html, /<title>[\s\S]*?<\/title>[\s\S]*?<link rel="canonical"[^>]*\/?>/, staticHead(page.title, page.description, fullUrl(page.route), true));
  html = replaceTag(html, /<div id="root"><\/div>/, `<div id="root"></div>`);
  await fs.writeFile(path.join(outputRoot, "noindex.html"), html);
}

const baseHtml = await fs.readFile(path.join(outputRoot, "index.html"), "utf8");
const publishedBlogExportPath = path.resolve(process.env.PUBLIC_PUBLISHED_BLOG_EXPORT || "dist/.generated/published-blog.json");
let publishedArticles;
try {
  publishedArticles = JSON.parse(await fs.readFile(publishedBlogExportPath, "utf8"));
} catch (error) {
  throw new Error(`Published blog export is unavailable at ${publishedBlogExportPath}. Run the build-time published article export first. ${error instanceof Error ? error.message : ""}`);
}
if (!Array.isArray(publishedArticles)) throw new Error(`Published blog export at ${publishedBlogExportPath} must contain an array.`);

const publishedArticlePages = publishedArticles.map(renderPublishedArticle);
const basePages = [renderHome(), renderServices(), ...services.map(renderService), renderAreas(), ...areas.map(renderArea), ...simplePages];
const pageMap = new Map([...basePages, ...publishedArticlePages].map((page) => [page.route, page]));
const requestServicePage = pageMap.get("/request-service");
if (requestServicePage) pageMap.set("/request-service", { ...requestServicePage, ampBody: `${ampBodyFromCanonical(requestServicePage.body)}${ampRequestForm()}`, useAmpForm: true });
const blogPage = pageMap.get("/blog");
if (blogPage) {
  const publishedLinks = publishedArticlePages.length
    ? `<section><h2>Published guides</h2><ul class="link-grid">${publishedArticlePages.map((page) => `<li><a href="${page.route}">${escapeHtml(page.title)}</a>${page.description ? `<p>${escapeHtml(page.description)}</p>` : ""}</li>`).join("")}</ul></section>`
    : `<section><h2>Published guides</h2><p>New vehicle-care guides will appear here as they are published.</p></section>`;
  pageMap.set("/blog", { ...blogPage, body: `${blogPage.body}${publishedLinks}` });
}
const pages = [...pageMap.values()];
for (const page of pages) await writePage(baseHtml, page);
await writeNoIndexShell(baseHtml);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${fullUrl(page.route)}</loc><changefreq>${page.route.startsWith("/service") ? "monthly" : "weekly"}</changefreq><priority>${page.route === "/" ? "1.0" : page.route.startsWith("/service") ? "0.8" : "0.6"}</priority></url>`).join("\n")}\n</urlset>\n`;
await fs.writeFile(path.join(outputRoot, "sitemap.xml"), sitemap);
console.log(`Generated ${pages.length} crawler-visible static route documents, a noindex application shell, and sitemap.xml.`);
