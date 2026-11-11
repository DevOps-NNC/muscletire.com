export type GoogleAdsAttributionInput = {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  dclid?: string;
  gclsrc?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gadSource?: string;
  gadCampaignId?: string;
  googleAnalyticsClientId?: string;
  googleAnalyticsSessionId?: string;
  landingUrl?: string;
  referrer?: string;
};

const queryFieldMap: Record<string, keyof GoogleAdsAttributionInput> = {
  gclid: "gclid",
  gbraid: "gbraid",
  wbraid: "wbraid",
  dclid: "dclid",
  gclsrc: "gclsrc",
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_term: "utmTerm",
  utm_content: "utmContent",
  gad_source: "gadSource",
  gad_campaignid: "gadCampaignId",
  ga_client_id: "googleAnalyticsClientId",
  ga_session_id: "googleAnalyticsSessionId",
};

export const GOOGLE_ADS_ATTRIBUTION_QUERY_KEYS = Object.keys(queryFieldMap);

function clean(value: string | null, maxLength = 2048) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

export function attributionFromSearchParams(searchParams: URLSearchParams): GoogleAdsAttributionInput {
  const attribution: GoogleAdsAttributionInput = {};
  for (const [queryKey, field] of Object.entries(queryFieldMap)) {
    const maxLength = ["gclsrc", "gad_source", "gad_campaignid", "ga_client_id", "ga_session_id"].includes(queryKey) ? 300 : 2048;
    const value = clean(searchParams.get(queryKey), maxLength);
    if (value) attribution[field] = value;
  }
  return attribution;
}

export function hasAttributionContext(value: GoogleAdsAttributionInput | null | undefined) {
  return Boolean(value && Object.values(value).some(Boolean));
}

/** True when a lead carries bounded first-party visit context, even without a campaign identifier. */
export function hasLeadAttributionSignal(value: GoogleAdsAttributionInput | null | undefined) {
  return Boolean(value && (value.landingUrl || value.referrer || hasAttributionContext(value)));
}

export function hasGoogleAdsMatchKey(value: { gclid?: string | null; gbraid?: string | null; wbraid?: string | null } | null | undefined) {
  return Boolean(value?.gclid || value?.gbraid || value?.wbraid);
}

export function formatGoogleAdsPhone(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return "";
}

function escapeCsv(value: string | number | null | undefined) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export type GoogleAdsDataManagerExportRow = {
  conversionName: string;
  conversionTime: Date | string;
  conversionValue?: string | null;
  conversionCurrency?: string | null;
  orderId: string;
  includeUserData: boolean;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  email?: string | null;
  phone?: string | null;
};

/** Creates a headered CSV intended to be mapped in Google Ads Data Manager. */
export function buildGoogleAdsDataManagerCsv(rows: GoogleAdsDataManagerExportRow[]) {
  const headers = ["Conversion action", "GCLID", "GBRAID", "WBRAID", "Email Address", "Phone number", "Conversion date and time", "Conversion value", "Conversion currency", "Order ID"];
  const records = rows.map(row => {
    const conversionTime = new Date(row.conversionTime).toISOString();
    return [
      row.conversionName,
      row.gclid,
      row.gbraid,
      row.wbraid,
      row.includeUserData ? row.email?.trim().toLowerCase() : "",
      row.includeUserData ? formatGoogleAdsPhone(row.phone) : "",
      conversionTime,
      row.conversionValue ?? "",
      row.conversionCurrency?.toUpperCase() || "USD",
      row.orderId,
    ].map(escapeCsv).join(",");
  });
  return [headers.map(escapeCsv).join(","), ...records].join("\r\n");
}
