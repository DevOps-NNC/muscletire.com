import { attributionFromSearchParams, hasLeadAttributionSignal, type GoogleAdsAttributionInput } from "@shared/googleAdsAttribution";

const STORAGE_KEY = "namm:google-ads-attribution:v1";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

type StoredLeadAttribution = GoogleAdsAttributionInput & { savedAt: number };

function readStoredAttribution(): StoredLeadAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as StoredLeadAttribution | null;
    if (!parsed || typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readGoogleAnalyticsClientId() {
  if (typeof document === "undefined") return undefined;
  const cookie = document.cookie.split(";").map(value => value.trim()).find(value => value.startsWith("_ga="));
  const raw = cookie?.slice(4);
  const parts = raw?.split(".") ?? [];
  return parts.length >= 4 ? `${parts.at(-2)}.${parts.at(-1)}` : undefined;
}

function readGoogleAnalyticsSessionId() {
  if (typeof document === "undefined") return undefined;
  const cookie = document.cookie.split(";").map(value => value.trim()).find(value => value.startsWith("_ga_") && !value.startsWith("_ga="));
  const raw = cookie?.slice(cookie.indexOf("=") + 1);
  const parts = raw?.split(".") ?? [];
  return raw?.startsWith("GS") && parts.length >= 3 ? parts[2] : undefined;
}

function readGoogleClickIdCookie() {
  if (typeof document === "undefined") return undefined;
  const cookie = document.cookie.split(";").map(value => value.trim()).find(value => value.startsWith("_gcl_aw="));
  const raw = cookie?.slice(8);
  const candidate = raw?.split(".").at(-1)?.trim();
  return candidate || undefined;
}

export function captureLeadAttributionFromCurrentPage() {
  if (typeof window === "undefined") return null;
  const existing = readStoredAttribution();
  if (existing) return existing;

  const url = new URL(window.location.href);
  const attribution = attributionFromSearchParams(url.searchParams);
  attribution.gclid = attribution.gclid ?? readGoogleClickIdCookie();
  attribution.googleAnalyticsClientId = attribution.googleAnalyticsClientId ?? readGoogleAnalyticsClientId();
  attribution.googleAnalyticsSessionId = attribution.googleAnalyticsSessionId ?? readGoogleAnalyticsSessionId();

  const stored: StoredLeadAttribution = {
    ...attribution,
    googleAnalyticsClientId: attribution.googleAnalyticsClientId,
    googleAnalyticsSessionId: attribution.googleAnalyticsSessionId,
    landingUrl: url.toString().slice(0, 4000),
    referrer: document.referrer ? document.referrer.slice(0, 4000) : undefined,
    savedAt: Date.now(),
  };
  if (!hasLeadAttributionSignal(stored)) return null;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch { /* Browser storage can be unavailable. */ }
  return stored;
}

export function getStoredLeadAttribution(): GoogleAdsAttributionInput | undefined {
  const stored = captureLeadAttributionFromCurrentPage() ?? readStoredAttribution();
  if (!stored) return undefined;
  const { savedAt: _savedAt, ...attribution } = stored;
  return attribution;
}

/** Adds only minimal first-party context when the customer explicitly opted into ads measurement. */
export function getLeadAttributionForSubmission(includeConsentedContext: boolean): GoogleAdsAttributionInput | undefined {
  const stored = getStoredLeadAttribution();
  if (stored || !includeConsentedContext || typeof window === "undefined") return stored;
  return {
    googleAnalyticsClientId: readGoogleAnalyticsClientId(),
    googleAnalyticsSessionId: readGoogleAnalyticsSessionId(),
    landingUrl: window.location.href.slice(0, 4000),
    referrer: document.referrer ? document.referrer.slice(0, 4000) : undefined,
  };
}
