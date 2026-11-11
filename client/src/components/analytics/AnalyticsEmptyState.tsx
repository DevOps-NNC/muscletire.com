import { BarChart3, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";

export function AnalyticsEmptyState({ status, onSync, syncing }: { status: string; onSync?: () => void; syncing?: boolean }) {
  if (status === "unavailable") {
    return <section className="rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-6 shadow-sm"><div className="flex items-start gap-4"><div className="rounded-xl bg-[var(--color-warning)] p-3 text-[var(--color-text-inverse)]"><BarChart3 className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Analytics storage needs setup</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">CRM reporting is still available, but the GA4 integration storage is not ready in this environment. Apply the pending analytics database migration, then reload this page.</p></div></div></section>;
  }

  if (status === "not_connected") {
    return <section className="rounded-2xl border border-primary/25 bg-primary/5 p-6 shadow-sm"><div className="flex items-start gap-4"><div className="rounded-xl bg-primary p-3 text-[var(--color-text-inverse)]"><BarChart3 className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Connect Google Analytics</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Connect Google Analytics to unlock website traffic reporting. The GA4 property used by the website will remain connected to this CRM.</p><a href="/api/analytics/google/start" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-black text-[var(--color-text-inverse)] shadow-sm transition hover:bg-primary/90">Connect Google Analytics <ExternalLink className="h-4 w-4" /></a></div></div></section>;
  }

  if (status === "no_data") {
    return <section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="flex items-start gap-4"><div className="rounded-xl bg-[var(--color-secondary-soft)] p-3 text-secondary-foreground"><RefreshCw className="h-5 w-5" /></div><div><h2 className="text-xl font-black">GA4 data is not synchronized yet</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Google Analytics is connected, but no report has been synchronized for this period.</p>{onSync && <button type="button" onClick={onSync} disabled={syncing} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary bg-background px-4 py-2.5 text-sm font-black text-primary transition hover:bg-primary/5 disabled:cursor-wait disabled:opacity-60"><RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />{syncing ? "Syncing…" : "Sync analytics"}</button>}</div></div></section>;
  }

  if (status === "partial") return <section className="rounded-2xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-6"><div className="flex items-start gap-4"><CheckCircle2 className="mt-1 h-5 w-5 text-[var(--color-warning)]" /><div><h2 className="font-black">Analytics needs attention</h2><p className="mt-1 text-sm text-muted-foreground">The integration is connected, but the latest synchronization was incomplete. Review sync history in Settings.</p></div></div></section>;
  return null;
}
