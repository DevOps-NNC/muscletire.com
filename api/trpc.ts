import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";
import { handleGoogleAnalyticsRequest } from "../server/analytics/googleAnalyticsRoutes.js";
import { handleAnalyticsCronRequest } from "../server/analytics/analyticsCron.js";
import { handleAmpLeadRequest } from "../server/ampLead.js";
import { handleBlogApiRequest } from "../server/blogApi.js";
import { handleBlogCronRequest } from "../server/blogCron.js";

function requestHeaders(headers: VercelRequest["headers"]) {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (typeof value === "string") result.set(name, value);
    else if (Array.isArray(value)) result.set(name, value.join(", "));
  }
  return result;
}

/**
 * Vercel API entry point. The Fetch adapter avoids mounting an Express app in
 * a serverless runtime while still supplying the original Vercel request and
 * response to the existing context/auth layer.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const headers = requestHeaders(req.headers);
  const protocol = headers.get("x-forwarded-proto") ?? "https";
  const host = headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost";
  const method = req.method ?? "GET";
  const requestUrl = `${protocol}://${host}${req.url ?? "/api/trpc"}`;
  if (new URL(requestUrl).pathname === "/api/amp/leads") {
    const body = method === "GET" || method === "HEAD" || req.body === undefined
      ? undefined
      : typeof req.body === "string" ? req.body : new URLSearchParams(Object.entries(req.body as Record<string, unknown>).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : String(value ?? "")])).toString();
    const response = await handleAmpLeadRequest(new Request(requestUrl, { method, headers, body }));
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(await response.text());
    return;
  }
  if (new URL(requestUrl).pathname.startsWith("/api/analytics/google/")) {
    const response = await handleGoogleAnalyticsRequest(new Request(requestUrl, { method, headers }));
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(await response.text());
    return;
  }
  if (new URL(requestUrl).pathname === "/api/analytics/cron") {
    const response = await handleAnalyticsCronRequest(new Request(requestUrl, { method, headers }));
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(await response.text());
    return;
  }
  if (new URL(requestUrl).pathname === "/api/blog/cron") {
    const response = await handleBlogCronRequest(new Request(requestUrl, { method, headers }));
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(await response.text());
    return;
  }
  const pathname = new URL(requestUrl).pathname;
  if (pathname === "/api/v1/openapi.json" || pathname.startsWith("/api/v1/blogs")) {
    const blogBody = method === "GET" || method === "HEAD" || req.body === undefined
      ? undefined
      : typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const response = await handleBlogApiRequest(new Request(requestUrl, { method, headers, body: blogBody }));
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.status(response.status).send(await response.text());
    return;
  }
  const body = method === "GET" || method === "HEAD" || req.body === undefined
    ? undefined
    : typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: new Request(requestUrl, { method, headers, body }),
    router: appRouter,
    createContext: () => createContext({ req: req as any, res: res as any }),
    onError({ error, path }) {
      console.error(`[tRPC] ${path ?? "unknown"} failed`, error);
    },
  });

  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(response.status).send(await response.text());
}
