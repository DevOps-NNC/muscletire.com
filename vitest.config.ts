import { defineConfig } from "vitest/config";  
import react from "@vitejs/plugin-react";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [react()],
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    // End-to-end/production integration tests require a separately provisioned Neon database,
    // configured Auth and a running test server. Opt in explicitly when those are available.
    exclude: process.env.RUN_LIVE_INTEGRATION_TESTS === "1" ? ["**/node_modules/**"] : [
      "**/node_modules/**",
      "server/neon-auth.config.test.ts",
      "server/neon.connection.test.ts",
      "server/neon.schema.test.ts",
      "server/recovery-secret.test.ts",
    ],
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/**/*.test.tsx", "client/**/*.test.ts", "shared/**/*.test.ts"],
  },
});
