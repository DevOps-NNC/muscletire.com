import fs from "node:fs/promises";
import path from "node:path";
import amphtmlValidator from "amphtml-validator";

const root = path.resolve("dist/public");
const files = (await fs.readdir(root, { recursive: true })).filter(file => file.endsWith("/amp.html") || file === "amp.html");
if (!files.length) throw new Error("No generated AMP documents were found.");

const validator = await amphtmlValidator.getInstance();
const failures = [];
for (const relativeFile of files) {
  const html = await fs.readFile(path.join(root, relativeFile), "utf8");
  const result = validator.validateString(html);
  if (result.status !== "PASS") {
    const errors = result.errors.map(error => `${error.line}:${error.col} ${error.message}`).join(" | ");
    failures.push(`${relativeFile}: ${errors}`);
  }
}

if (failures.length) {
  console.error("AMP validation failed:\n" + failures.map(failure => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`AMP validator passed for ${files.length} generated documents.`);
