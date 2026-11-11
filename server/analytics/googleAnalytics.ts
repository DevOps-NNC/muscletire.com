const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_ADMIN_API_URL = "https://analyticsadmin.googleapis.com/v1beta";
const GOOGLE_DATA_API_URL = "https://analyticsdata.googleapis.com/v1beta";
const GOOGLE_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export type GoogleAnalyticsErrorCode = "configuration" | "authorization" | "rate_limit" | "api";

export class GoogleAnalyticsProviderError extends Error {
  constructor(
    public readonly code: GoogleAnalyticsErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GoogleAnalyticsProviderError";
  }
}

export type GoogleAnalyticsToken = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
};

export type Ga4Property = {
  accountId: string;
  accountName: string;
  propertyId: string;
  propertyName: string;
};

export type Ga4ReportRequest = {
  dateRanges: Array<{ startDate: string; endDate: string }>;
  dimensions?: Array<{ name: string }>;
  metrics?: Array<{ name: string }>;
  dimensionFilter?: unknown;
  metricFilter?: unknown;
  limit?: number;
  offset?: number;
  orderBys?: unknown[];
};

export type NormalizedGa4Report = {
  dimensions: string[];
  metrics: string[];
  rows: Array<{ dimensions: Record<string, string>; metrics: Record<string, string> }>;
};

type ProviderOptions = {
  fetchImpl?: typeof fetch;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  codeVerifier?: string;
};

function configuredValue(name: string, override?: string) {
  const value = override ?? process.env[name];
  if (!value?.trim()) {
    throw new GoogleAnalyticsProviderError("configuration", name + " is not configured");
  }
  return value.trim();
}

function getFetch(fetchImpl?: typeof fetch) {
  return fetchImpl ?? fetch;
}

function errorCodeForStatus(status: number, tokenRequest = false): GoogleAnalyticsErrorCode {
  if (status === 429) return "rate_limit";
  if (tokenRequest || status === 401) return "authorization";
  return "api";
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function requestJson(
  url: string,
  init: RequestInit,
  options: ProviderOptions = {},
  tokenRequest = false,
) {
  const response = await getFetch(options.fetchImpl)(url, init);
  const payload = await readJson(response);
  if (!response.ok) {
    throw new GoogleAnalyticsProviderError(
      errorCodeForStatus(response.status, tokenRequest),
      "Google Analytics request failed with HTTP " + response.status,
      response.status,
    );
  }
  return payload;
}

export function buildGoogleAuthorizationUrl(input: { state: string; redirectUri: string; codeChallenge?: string }, options: ProviderOptions = {}) {
  const clientId = configuredValue("GOOGLE_ANALYTICS_CLIENT_ID", options.clientId);
  const redirectUri = input.redirectUri || configuredValue("GOOGLE_ANALYTICS_REDIRECT_URI", options.redirectUri);
  const url = new URL(GOOGLE_AUTH_URL);
  const parameters = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_ANALYTICS_SCOPE,
    state: input.state,
  });
  if (input.codeChallenge) {
    parameters.set("code_challenge", input.codeChallenge);
    parameters.set("code_challenge_method", "S256");
  }
  url.search = parameters.toString();
  return url.toString();
}

export async function exchangeGoogleAuthorizationCode(code: string, options: ProviderOptions = {}): Promise<GoogleAnalyticsToken> {
  const clientId = configuredValue("GOOGLE_ANALYTICS_CLIENT_ID", options.clientId);
  const clientSecret = configuredValue("GOOGLE_ANALYTICS_CLIENT_SECRET", options.clientSecret);
  const redirectUri = configuredValue("GOOGLE_ANALYTICS_REDIRECT_URI", options.redirectUri);
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  if (options.codeVerifier) body.set("code_verifier", options.codeVerifier);
  const payload = await requestJson(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  }, options, true);

  if (typeof payload.access_token !== "string") {
    throw new GoogleAnalyticsProviderError("authorization", "Google did not return an access token");
  }

  return {
    accessToken: payload.access_token,
    refreshToken: typeof payload.refresh_token === "string" ? payload.refresh_token : undefined,
    expiresIn: typeof payload.expires_in === "number" ? payload.expires_in : undefined,
    tokenType: typeof payload.token_type === "string" ? payload.token_type : undefined,
    scope: typeof payload.scope === "string" ? payload.scope : undefined,
  };
}

export async function revokeGoogleToken(token: string, options: ProviderOptions = {}) {
  const response = await getFetch(options.fetchImpl)(GOOGLE_REVOKE_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }).toString(),
  });
  if (!response.ok) throw new GoogleAnalyticsProviderError(errorCodeForStatus(response.status), "Google Analytics token revocation failed with HTTP " + response.status, response.status);
}

export async function refreshGoogleAccessToken(refreshToken: string, options: ProviderOptions = {}): Promise<GoogleAnalyticsToken> {
  const clientId = configuredValue("GOOGLE_ANALYTICS_CLIENT_ID", options.clientId);
  const clientSecret = configuredValue("GOOGLE_ANALYTICS_CLIENT_SECRET", options.clientSecret);
  const payload = await requestJson(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }).toString(),
  }, options, true);

  if (typeof payload.access_token !== "string") {
    throw new GoogleAnalyticsProviderError("authorization", "Google did not return a refreshed access token");
  }

  return {
    accessToken: payload.access_token,
    expiresIn: typeof payload.expires_in === "number" ? payload.expires_in : undefined,
    tokenType: typeof payload.token_type === "string" ? payload.token_type : undefined,
    scope: typeof payload.scope === "string" ? payload.scope : undefined,
  };
}

export async function listAccessibleGa4Properties(accessToken: string, options: ProviderOptions = {}): Promise<Ga4Property[]> {
  const payload = await requestJson(GOOGLE_ADMIN_API_URL + "/accountSummaries", {
    headers: { authorization: "Bearer " + accessToken },
  }, options);
  const accountSummaries = Array.isArray(payload.accountSummaries)
    ? payload.accountSummaries.filter((summary): summary is Record<string, unknown> => Boolean(summary && typeof summary === "object"))
    : [];

  return accountSummaries.flatMap(summary => {
    if (!summary || typeof summary !== "object") return [];
    const account = typeof summary.account === "string" ? summary.account : "";
    const accountName = typeof summary.displayName === "string" ? summary.displayName : account;
    const propertySummaries = Array.isArray(summary.propertySummaries)
      ? summary.propertySummaries.filter((property): property is Record<string, unknown> => Boolean(property && typeof property === "object"))
      : [];
    return propertySummaries.flatMap(property => {
      if (!property || typeof property !== "object" || typeof property.property !== "string") return [];
      return [{
        accountId: account.replace(/^accounts\//, ""),
        accountName,
        propertyId: property.property.replace(/^properties\//, ""),
        propertyName: typeof property.displayName === "string" ? property.displayName : property.property,
      }];
    });
  });
}

export async function runGa4Report(accessToken: string, propertyId: string, request: Ga4ReportRequest, options: ProviderOptions = {}): Promise<NormalizedGa4Report> {
  const normalizedPropertyId = propertyId.replace(/^properties\//, "");
  const payload = await requestJson(GOOGLE_DATA_API_URL + "/properties/" + encodeURIComponent(normalizedPropertyId) + ":runReport", {
    method: "POST",
    headers: { authorization: "Bearer " + accessToken, "content-type": "application/json" },
    body: JSON.stringify(request),
  }, options);
  const dimensions = Array.isArray(payload.dimensionHeaders) ? payload.dimensionHeaders.flatMap(header => header && typeof header === "object" && typeof header.name === "string" ? [header.name] : []) : [];
  const metrics = Array.isArray(payload.metricHeaders) ? payload.metricHeaders.flatMap(header => header && typeof header === "object" && typeof header.name === "string" ? [header.name] : []) : [];
  const rows = Array.isArray(payload.rows) ? payload.rows : [];

  return {
    dimensions,
    metrics,
    rows: rows.flatMap(row => {
      if (!row || typeof row !== "object") return [];
      const dimensionValues = Array.isArray(row.dimensionValues) ? row.dimensionValues : [];
      const metricValues = Array.isArray(row.metricValues) ? row.metricValues : [];
      return [{
        dimensions: Object.fromEntries(dimensions.map((name, index) => [name, readValue(dimensionValues[index])])),
        metrics: Object.fromEntries(metrics.map((name, index) => [name, readValue(metricValues[index])])),
      }];
    }),
  };
}

function readValue(value: unknown) {
  return value && typeof value === "object" && typeof (value as { value?: unknown }).value === "string"
    ? (value as { value: string }).value
    : "";
}
