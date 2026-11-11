import { BUSINESS_CONFIG } from "@shared/config";
import { ClipboardList, Phone } from "lucide-react";

/**
 * Sticky mobile conversion bar. It keeps the two highest-intent actions
 * continuously available with touch targets that meet mobile accessibility guidance.
 */
export default function MobileCTA() {
  return (
    <div className="theme-mobile-cta-shadow fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-[var(--color-card-bg)] safe-area-pb lg:hidden">
      <div className="grid grid-cols-2 divide-x divide-border">
        <a
          href={`tel:${BUSINESS_CONFIG.phoneRaw}`}
          className="flex min-h-16 items-center justify-center gap-2 py-3 text-primary transition-colors hover:bg-primary/5"
          aria-label="Call __BUSINESS_NAME__ now"
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-bold">Call Now</span>
        </a>
        <a
          href="/request-service"
          className="flex min-h-16 items-center justify-center gap-2 bg-primary py-3 text-primary-foreground transition-colors hover:bg-primary/90"
          aria-label="Request mobile service"
        >
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-bold">Request Service</span>
        </a>
      </div>
    </div>
  );
}
