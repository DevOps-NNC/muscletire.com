import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
const root = import.meta.dirname;
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: {
    "@": path.resolve(root, "client", "src"),
    "@shared": path.resolve(root, "shared"),
    "@assets": path.resolve(root, "attached_assets")
  }},
  envDir: root,
  root: path.resolve(root, "client"),
  publicDir: path.resolve(root, "client", "public"),
  build: { outDir: path.resolve(root, "dist/public"), emptyOutDir: true },
  server: { host: true, fs: { strict: true, deny: ["**/.*"] } },
});
