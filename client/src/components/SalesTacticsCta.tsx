import { ArrowRight, Clock3 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { DEFAULT_SALES_TACTICS, FOMO_CTA_HREF } from "@shared/salesTactics";

export default function SalesTacticsCta() {
  const { data = DEFAULT_SALES_TACTICS } =
    trpc.crm.publicSalesTacticsConfig.useQuery(undefined, {
      staleTime: 60_000,
    });
  const tactic = data.fomoCta;

  if (!tactic.enabled) return null;

  return (
    <section
      className="fomo-cta border-y text-[var(--color-text-inverse)]"
      aria-labelledby="fomo-cta-heading"
    >
      <div className="fomo-cta-inner container py-8 md:py-12">
        <div className="fomo-cta-panel flex flex-col gap-7 rounded-[var(--public-radius-lg)] p-6 sm:p-8 md:flex-row md:items-center md:justify-between md:gap-10">
          <div className="max-w-3xl">
            <p className="fomo-cta-eyebrow flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em]">
              <span className="fomo-cta-icon" aria-hidden="true">
                <Clock3 className="h-4 w-4" />
              </span>
              <span>{tactic.eyebrow}</span>
            </p>
            <h2
              id="fomo-cta-heading"
              className="fomo-cta-headline mt-4 text-2xl font-black tracking-tight md:text-3xl"
            >
              {tactic.headline}
            </h2>
            <p className="fomo-cta-body mt-3 max-w-2xl text-base leading-7">
              {tactic.body}
            </p>
          </div>
          <Link
            href={FOMO_CTA_HREF}
            className="fomo-cta-action inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition sm:px-6"
          >
            {tactic.ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
