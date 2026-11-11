import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const root = process.cwd();
const configFile = path.join(root, "client.config.json");
const config = JSON.parse(await fs.readFile(configFile, "utf8"));
const b = config.business || {};
const required = ["name", "legalName", "ownerName", "phone", "email", "domain", "city", "region", "state", "stateCode", "zip", "address"];
for (const key of required) {
  if (typeof b[key] !== "string" || !b[key].trim()) throw new Error("client.config.json: missing business." + key);
}
if (b.domain.includes("example.com") || b.name === "Example Mobile Mechanic") {
  throw new Error("Replace all example business details in client.config.json before scaffolding.");
}
if (!/^[A-Z]{2}$/.test(b.stateCode)) throw new Error("business.stateCode must contain a 2-letter US state abbreviation.");
if (!/^\S+@\S+\.\S+$/.test(b.email)) throw new Error("business.email must be a valid email address.");
const domain = b.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) throw new Error("business.domain must be a hostname.");
const url = "https://" + (b.www ? "www." : "") + domain;
const slug = value => String(value).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const phoneRaw = b.phone.replace(/[^\d]/g, "");
if (phoneRaw.length < 10) throw new Error("business.phone requires an area code.");
const social = config.social || {};
const integrations = config.integrations || {};
const replace = {
  "__BUSINESS_NAME__": b.name,
  "__BUSINESS_LEGAL_NAME__": b.legalName,
  "__BUSINESS_DOMAIN__": domain,
  "__BUSINESS_URL__": url,
  "__BUSINESS_PHONE__": b.phone,
  "__BUSINESS_PHONE_RAW__": phoneRaw,
  "__BUSINESS_EMAIL__": b.email,
  "__BUSINESS_ADDRESS__": b.address,
  "__BUSINESS_ZIP__": b.zip,
  "__OWNER_NAME__": b.ownerName,
  "__CITY__": b.city,
  "__CITY_SLUG__": slug(b.city),
  "__REGION__": b.region,
  "__STATE_NAME__": b.state,
  "__STATE_CODE__": b.stateCode,
  "__GTM_ID__": integrations.googleTagManagerId || "",
  "__GOOGLE_BUSINESS_PROFILE_URL__": social.googleBusinessProfile || "",
  "__FACEBOOK_URL__": social.facebook || "",
  "__INSTAGRAM_URL__": social.instagram || "",
  "__TIKTOK_URL__": social.tiktok || ""
};
const marker = path.join(root, ".scaffolded.json");
try { await fs.access(marker); throw new Error("Project has already been scaffolded. Use a fresh template repository for another client."); }
catch (error) { if (error.code !== "ENOENT") throw error; }

let count = 0;
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".html", ".json", ".css", ".xml", ".txt"]);
async function walk(directory) {
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const abs = path.join(directory, item.name);
    if (item.isDirectory()) { if (!["node_modules", "dist", ".git", ".vercel"].includes(item.name)) await walk(abs); continue; }
    if (!item.isFile() || !extensions.has(path.extname(item.name))) continue;
    if (abs.endsWith("scaffold-client.mjs")) continue;
    let contents = await fs.readFile(abs, "utf8");
    let changed = contents;
    for (const [key, value] of Object.entries(replace)) changed = changed.replaceAll(key, value);
    if (changed !== contents) { await fs.writeFile(abs, changed); count++; }
  }
}
for (const dir of ["client", "server", "shared", "api", "scripts"]) await walk(path.join(root, dir));
await fs.copyFile(path.join(root, ".env.example"), path.join(root, ".env"), constants.COPYFILE_EXCL).catch(error => {
  if (error.code !== "EEXIST") throw error;
});
await fs.writeFile(marker, JSON.stringify({ name: b.name, domain, createdAt: new Date().toISOString(), source: "DevOps-NNC/mobile-mechanic-template" }, null, 2) + "\n");
console.log("Scaffolded " + b.name + " (" + domain + ") across " + count + " files.");
console.log("Next: update .env (never commit credentials), run pnpm install, pnpm check, pnpm test, and pnpm build.");
console.log("Run database migrations explicitly on your new Neon database only. See docs/DEPLOYMENT_CHECKLIST.md.");
