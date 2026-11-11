import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerGoogleAnalyticsRoutes } from "../analytics/googleAnalyticsRoutes";
import { registerAnalyticsCronRoute } from "../analytics/analyticsCron";
import { handleAmpLeadRequest } from "../ampLead";
import { registerBlogApiRoutes } from "../blogApi";
import { registerBlogCronRoute } from "../blogCron";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerGoogleAnalyticsRoutes(app);
  registerAnalyticsCronRoute(app);
  registerBlogApiRoutes(app);
  registerBlogCronRoute(app);
  app.all("/api/amp/leads", async (req, res) => {
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers.set(name, value);
      else if (Array.isArray(value)) headers.set(name, value.join(", "));
    }
    const body = req.method === "GET" || req.method === "HEAD" || req.body === undefined
      ? undefined
      : typeof req.body === "string" ? req.body : new URLSearchParams(Object.entries(req.body as Record<string, unknown>).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : String(value ?? "")])).toString();
    const response = await handleAmpLeadRequest(new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`, { method: req.method, headers, body }));
    response.headers.forEach((value, name) => res.setHeader(name, value));
    if (response.status === 204) { res.status(204).end(); return; }
    res.status(response.status).send(await response.text());
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
