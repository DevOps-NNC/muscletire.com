import { useEffect } from "react";
import { trackConversion } from "@/lib/conversionTracking";

export function ConversionTracking() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      const attribution = {
        placement: anchor.dataset.trackingPlacement ?? "site",
        ...(anchor.dataset.utmSource ? { utm_source: anchor.dataset.utmSource } : {}),
        ...(anchor.dataset.utmMedium ? { utm_medium: anchor.dataset.utmMedium } : {}),
        ...(anchor.dataset.utmCampaign ? { utm_campaign: anchor.dataset.utmCampaign } : {}),
        ...(anchor.dataset.utmContent ? { utm_content: anchor.dataset.utmContent } : {}),
      };
      if (href.startsWith("tel:")) trackConversion("call_click", attribution);
      if (href.startsWith("sms:")) trackConversion("text_click", attribution);
      if (href.startsWith("mailto:")) trackConversion("email_click", attribution);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
