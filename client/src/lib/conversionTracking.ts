export type ConversionEvent = "call_click" | "text_click" | "email_click" | "request_start" | "request_submit";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackConversion(event: ConversionEvent, parameters: Record<string, string | boolean | number> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag?.("event", event, parameters);
  window.dataLayer.push({ event, ...parameters });
  window.dispatchEvent(new CustomEvent("namm:conversion", { detail: { event, parameters } }));
}
