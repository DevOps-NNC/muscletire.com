import fs from "node:fs/promises";
import path from "node:path";
const roots = ["client", "server", "shared", "api", "scripts"];
const allowed = /\.(ts|tsx|js|mjs|html|xml|css|json|txt)$/;
const bad = [/newagemobilemechanic/i, /New Age Mobile Mechanic/i, /NEW\+AGE\+MOBILE\+MECHANIC/i, /files\.manuscdn\.com/i, /\bJuan's\b/i];
const config = JSON.parse(await fs.readFile("client.config.json", "utf8"));
const initialized = await fs.access(".scaffolded.json").then(() => true).catch(() => false);
const problems = [];
let files = 0;
async function scan(dir) {
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) { await scan(file); continue; }
    if (!allowed.test(item.name) || file.endsWith("verify-template.mjs") || file.endsWith("scaffold-client.mjs")) continue;
    files++;
    const content = await fs.readFile(file, "utf8");
    for (const r of bad) if (r.test(content)) problems.push(file + ": old client brand/asset reference");
    if (initialized && /__(?:BUSINESS|OWNER|CITY|REGION|STATE|GTM|FACEBOOK|INSTAGRAM|TIKTOK|GOOGLE_BUSINESS)[A-Z_]*__/.test(content)) problems.push(file + ": unfilled business marker");
  }
}
for (const dir of roots) await scan(dir);
if (initialized && config.business.domain.includes("example.com")) problems.push("client.config.json has example domain after setup");
if (!initialized && config.business.name !== "Example Mobile Mechanic") problems.push("Uninitialized template has custom business details; run pnpm scaffold:client");
if (problems.length) { for (const p of problems.slice(0,60)) console.error("FAIL " + p); process.exit(1); }
console.log("Template verification passed: " + files + " source files scanned; state=" + (initialized ? "scaffolded" : "template") + ".");
