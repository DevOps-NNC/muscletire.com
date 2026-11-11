import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const bundle = require(resolve(process.cwd(), "dist/vercel-api.cjs"));

const handler = bundle.default ?? bundle;

if (typeof handler !== "function") {
  throw new Error("The Vercel API bundle does not export a request handler.");
}

let statusCode = 200;
let responseBody = "";
const req = {
  method: "GET",
  url: "/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D",
  headers: { host: "localhost" },
};
const res = {
  setHeader() {},
  status(code) { statusCode = code; return this; },
  send(body) { responseBody = body; return this; },
};

await handler(req, res);

if (statusCode !== 200 || !responseBody.includes("result")) {
  throw new Error(`The Vercel API bundle failed its auth.me smoke test (status ${statusCode}).`);
}

console.log("Vercel API bundle exports a request handler and serves auth.me.");
