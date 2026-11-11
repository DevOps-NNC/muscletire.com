export const ACCOUNT_SETUP_SETTING_KEY = "crm_account_setup_enabled";

export function isAccountSetupEnabled(value: string | null | undefined): boolean {
  return value !== "disabled";
}

export function isQuoteFeatureEnabled(value: string | null | undefined): boolean {
  return value === "enabled";
}

export function isOwnerEmail(email: string | null | undefined, ownerEmail: string | undefined): boolean {
  return Boolean(email && ownerEmail && email.trim().toLowerCase() === ownerEmail.trim().toLowerCase());
}

export type CrmRole = "admin" | "technician" | "lead_processor" | "lead_viewer" | "user";

export function canReadCrm(role: string | null | undefined): boolean {
  return ["admin", "technician", "lead_processor", "lead_viewer"].includes(role ?? "");
}

export function canProcessLeads(role: string | null | undefined): boolean {
  return ["admin", "technician", "lead_processor"].includes(role ?? "");
}
