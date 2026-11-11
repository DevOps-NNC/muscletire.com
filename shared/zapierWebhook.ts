export type LeadHandoffWebhookPayload = {
  event: "lead_follow_up_ready";
  occurredAt: string;
  followUp: { notes: string };
  lead: {
    id: number;
    referenceNumber: string;
    fullName: string;
    phone: string;
    email: string | null;
    preferredContact: string | null;
    requestedService: string | null;
    mainSymptom: string | null;
    problemDescription: string | null;
    vehicle: string | null;
    serviceLocation: string | null;
  };
};

export function isZapierWebhookUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "hooks.zapier.com" || url.hostname.endsWith(".zapier.com"));
  } catch {
    return false;
  }
}

export function buildLeadHandoffWebhookPayload(input: Omit<LeadHandoffWebhookPayload, "event" | "occurredAt">): LeadHandoffWebhookPayload {
  return { event: "lead_follow_up_ready", occurredAt: new Date().toISOString(), ...input };
}
