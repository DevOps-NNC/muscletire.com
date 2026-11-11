import { z } from "zod";
import { createLeadWithSideEffects } from "./routers/leads.js";
import type { LeadCreateInput } from "./leadInput.js";

export const AMP_PUBLISHER_ORIGIN = "__BUSINESS_URL__";
const AMP_CACHE_ORIGINS = new Set((process.env.AMP_CACHE_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean));
const MAX_BODY_BYTES = 32 * 1024;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 5;
const attempts = new Map<string, number[]>();

const optionalText = (max = 500) => z.preprocess(value => value === "" ? undefined : value, z.string().max(max).optional());
const formBoolean = z.preprocess(value => value === undefined ? undefined : ["1", "true", "on", "yes"].includes(String(value).toLowerCase()), z.boolean().optional());

const ampLeadFormSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(80),
  email: z.preprocess(value => value === "" ? undefined : value, z.string().trim().email().max(320).optional()),
  preferredContact: z.enum(["call", "text", "email"]).default("call"),
  streetAddress: optionalText(300), unit: optionalText(100), city: optionalText(120), zipCode: optionalText(20),
  locationType: z.enum(["home", "workplace", "roadside", "parking_lot", "dealership", "other"]).default("home"), locationNotes: optionalText(1000),
  vehicleYear: optionalText(10), vehicleMake: optionalText(100), vehicleModel: optionalText(100), vehicleTrim: optionalText(100), vin: optionalText(40), mileage: optionalText(40),
  requestedService: optionalText(160), mainSymptom: optionalText(500), problemDescription: optionalText(4000), vehicleStarts: formBoolean, vehicleSafe: formBoolean, preferredDate: optionalText(30), preferredTime: optionalText(80), isAsap: formBoolean, customerNotes: optionalText(4000),
  consent: z.enum(["on", "true", "1", "yes"], { message: "Privacy consent is required" }),
  adsDataConsent: formBoolean,
  website: optionalText(200),
}).transform(({ consent: _consent, website: _website, ...input }) => input satisfies LeadCreateInput);

export type AmpLeadDependencies = {
  createLead: (input: LeadCreateInput) => Promise<{ referenceNumber: string }>;
};

function response(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store", ...headers } });
}

function publisherOrigin() {
  return process.env.PUBLIC_SITE_ORIGIN || AMP_PUBLISHER_ORIGIN;
}

function originIsAllowed(origin: string | null) {
  if (!origin) return false;
  return origin === publisherOrigin() || AMP_CACHE_ORIGINS.has(origin);
}

function corsHeaders(request: Request): { allowed: boolean; headers: Record<string, string> } {
  const origin = request.headers.get("origin");
  const sameOrigin = request.headers.get("amp-same-origin")?.toLowerCase() === "true";
  if ((!origin && sameOrigin) || originIsAllowed(origin)) {
    return { allowed: true, headers: { "access-control-allow-origin": origin || publisherOrigin(), "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "Content-Type, AMP-Same-Origin", vary: "Origin" } };
  }
  return { allowed: false, headers: { vary: "Origin" } };
}

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || request.headers.get("origin") || "unknown";
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = clientKey(request);
  const recent = (attempts.get(key) || []).filter(timestamp => now - timestamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    attempts.set(key, recent);
    return true;
  }
  recent.push(now);
  attempts.set(key, recent);
  return false;
}

export function resetAmpLeadRateLimit() {
  attempts.clear();
}

export async function handleAmpLeadRequest(request: Request, dependencies: AmpLeadDependencies = { createLead: createLeadWithSideEffects }) {
  const cors = corsHeaders(request);
  if (!cors.allowed) return response({ message: "Origin is not allowed." }, 403, cors.headers);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors.headers });
  if (request.method !== "POST") return response({ message: "Method not allowed." }, 405, { ...cors.headers, allow: "POST, OPTIONS" });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/x-www-form-urlencoded")) return response({ message: "AMP form submissions must use application/x-www-form-urlencoded." }, 415, cors.headers);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return response({ message: "Form submission is too large." }, 413, cors.headers);
  if (isRateLimited(request)) return response({ message: "Too many requests. Please try again later." }, 429, { ...cors.headers, "retry-after": String(Math.ceil(RATE_WINDOW_MS / 1000)) });

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) return response({ message: "Form submission is too large." }, 413, cors.headers);
  const values = Object.fromEntries(new URLSearchParams(body).entries());
  if (values.website) return response({ message: "Invalid form submission." }, 400, cors.headers);
  const parsed = ampLeadFormSchema.safeParse(values);
  if (!parsed.success) return response({ message: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, 400, cors.headers);

  try {
    const result = await dependencies.createLead(parsed.data);
    return response({ referenceNumber: result.referenceNumber, message: "Thanks — your service request was received." }, 200, cors.headers);
  } catch (error) {
    console.error("[AMP lead] Lead creation failed:", error instanceof Error ? error.message : error);
    return response({ message: "We could not receive your request right now. Please call us directly." }, 503, cors.headers);
  }
}
