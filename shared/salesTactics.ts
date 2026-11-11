export const SALES_TACTICS_SETTING_KEY = "sales_tactics_config";

export const FOMO_CTA_HREF =
  "/request-service?utm_source=website&utm_medium=internal&utm_campaign=fomo_cta";

export interface FomoCtaConfig {
  enabled: boolean;
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
}

export interface SalesTacticsConfig {
  fomoCta: FomoCtaConfig;
}

export const DEFAULT_SALES_TACTICS: SalesTacticsConfig = {
  fomoCta: {
    enabled: true,
    eyebrow: "Appointments are filling fast",
    headline: "__CITY__ drivers are booking mobile service now.",
    body: "Popular time slots can fill quickly—secure your preferred service time today.",
    ctaLabel: "Secure my service time",
  },
};

function recordValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function textValue(
  value: unknown,
  fallback: string,
  maxLength: number
): string {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

export function normalizeSalesTactics(value: unknown): SalesTacticsConfig {
  const root = recordValue(value);
  const fomo = recordValue(root.fomoCta);

  return {
    fomoCta: {
      enabled:
        typeof fomo.enabled === "boolean"
          ? fomo.enabled
          : DEFAULT_SALES_TACTICS.fomoCta.enabled,
      eyebrow: textValue(
        fomo.eyebrow,
        DEFAULT_SALES_TACTICS.fomoCta.eyebrow,
        80
      ),
      headline: textValue(
        fomo.headline,
        DEFAULT_SALES_TACTICS.fomoCta.headline,
        160
      ),
      body: textValue(fomo.body, DEFAULT_SALES_TACTICS.fomoCta.body, 300),
      ctaLabel: textValue(
        fomo.ctaLabel,
        DEFAULT_SALES_TACTICS.fomoCta.ctaLabel,
        80
      ),
    },
  };
}

export function parseSalesTacticsSetting(
  value: string | null | undefined
): SalesTacticsConfig {
  if (!value) return DEFAULT_SALES_TACTICS;
  try {
    return normalizeSalesTactics(JSON.parse(value));
  } catch {
    return DEFAULT_SALES_TACTICS;
  }
}
