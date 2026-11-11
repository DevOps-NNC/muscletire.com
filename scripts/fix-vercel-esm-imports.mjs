import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const files = [
  "api/trpc.ts",
  "server/db.ts",
  "server/routers.ts",
  "server/routers/leads.ts",
  "server/routers/blog.ts",
  "server/routers/crm.ts",
  "server/_core/context.ts",
  "server/_core/sdk.ts",
  "server/_core/systemRouter.ts",
  "server/_core/trpc.ts",
  "server/_core/notification.ts",
];

for (const file of files) {
  const path = resolve(process.cwd(), file);
  const source = readFileSync(path, "utf8");
  const next = source.replace(/(from\s+["'])(\.{1,2}\/[^"']+)(["'])/g, (_, start, specifier, end) => {
    return /\.(?:js|mjs|cjs|json)$/.test(specifier) ? `${start}${specifier}${end}` : `${start}${specifier}.js${end}`;
  });
  writeFileSync(path, next);
}

console.log("Updated Vercel API dependency imports to explicit .js specifiers.");
