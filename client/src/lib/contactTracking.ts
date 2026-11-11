export const CONTACT_LINK_UTM = {
  source: "website",
  medium: "contact",
  campaign: "contact_methods",
} as const;

export function contactLinkTracking(content: "call_us" | "text_us" | "email") {
  return {
    "data-tracking-placement": `contact-${content}`,
    "data-utm-source": CONTACT_LINK_UTM.source,
    "data-utm-medium": CONTACT_LINK_UTM.medium,
    "data-utm-campaign": CONTACT_LINK_UTM.campaign,
    "data-utm-content": content,
  } as const;
}
