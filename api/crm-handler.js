// Vercel Node function wrapper. The implementation is prebundled into
// dist/vercel-api.cjs during the production build, eliminating TypeScript
// path-alias and native ESM-resolution issues in the serverless runtime.
const implementation = require("../dist/vercel-api.cjs");

module.exports = implementation.default ?? implementation;
