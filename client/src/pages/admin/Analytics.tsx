import { DashboardLayout } from "@/components/DashboardLayout";
import { crmMenuItems } from "@/components/CrmNav";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { AnalyticsEmptyState } from "@/components/analytics/AnalyticsEmptyState";
import { AnalyticsOverviewCards } from "@/components/analytics/AnalyticsOverviewCards";
import { AnalyticsPeriodPicker } from "@/components/analytics/AnalyticsPeriodPicker";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import type { ReportingPeriod } from "@shared/analytics";
import { AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<ReportingPeriod>("last_7_days");
  const [customRange, setCustomRange] = useState({ startDate: "", endDate: "" });
  const customRangeReady = period !== "custom" || Boolean(customRange.startDate && customRange.endDate && customRange.startDate <= customRange.endDate);
  const queryInput = period === "custom" ? { period, startDate: customRange.startDate || undefined, endDate: customRange.endDate || undefined } : { period };
  const overview = trpc.analytics.overview.useQuery(queryInput, { enabled: customRangeReady });
  const connection = trpc.analytics.connectionStatus.useQuery();
  const sync = trpc.analytics.sync.useMutation({ onSuccess: () => { overview.refetch(); toast.success("Analytics synchronized"); }, onError: error => toast.error(error.message) });
  const data = overview.data;
  const status = data?.sourceStatus.ga4 ?? (connection.data?.status === "unavailable" ? "unavailable" : connection.data?.status === "connected" ? "no_data" : "not_connected");

  return <DashboardLayout menuItems={crmMenuItems} title="Marketing analytics">
    <div className="mx-auto max-w-7xl p-3 md:p-6">
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Marketing intelligence</p><h1 className="mt-1 text-3xl font-black tracking-tight">Marketing analytics</h1><p className="mt-2 max-w-2xl text-muted-foreground">Connect verified GA4 traffic with actual CRM requests so every metric has a clear source.</p></div><div className="flex flex-wrap items-center gap-2"><AnalyticsPeriodPicker value={period} onChange={value => setPeriod(value)} startDate={customRange.startDate} endDate={customRange.endDate} onCustomRangeChange={setCustomRange} /><Button variant="outline" className="min-h-11" onClick={() => sync.mutate(queryInput)} disabled={sync.isPending || status === "not_connected" || status === "unavailable" || !customRangeReady}><RefreshCw className={sync.isPending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />{sync.isPending ? "Syncing…" : "Sync GA4 data"}</Button><Link href="/admin/analytics/reports" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-bold text-foreground transition hover:bg-muted"><FileText className="h-4 w-4" />Reports</Link></div></div>
      {overview.isError && <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--color-danger)]" /><p>{overview.error?.message ?? "Analytics could not be loaded."}</p></div>}
      {period === "custom" && !customRangeReady && <div className="mb-6 rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">Choose a valid start and end date to load this reporting period.</div>}
      {overview.isLoading && <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading reporting data…</div>}
      {!overview.isLoading && data && <>
        <AnalyticsEmptyState status={status} onSync={status !== "not_connected" && status !== "unavailable" && customRangeReady ? () => sync.mutate(queryInput) : undefined} syncing={sync.isPending} />
        {status === "connected" && <><div className="mt-6"><AnalyticsOverviewCards ga4={data.ga4} crm={data.crm} conversionRate={data.conversion.rate} /></div><AnalyticsCharts daily={data.ga4.daily} channels={data.channels} pages={data.pages} /><section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black">Service demand</h2><p className="mt-1 text-sm text-muted-foreground">CRM requests grouped by the service name customers submitted.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">CRM source</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{data.crm.services.slice(0, 8).map(service => <div key={service.service} className="rounded-xl border border-border bg-muted/20 p-4"><p className="truncate text-sm font-bold">{service.service}</p><p className="mt-2 text-2xl font-black">{service.leads}</p><p className="text-xs text-muted-foreground">leads</p></div>)}{!data.crm.services.length && <p className="text-sm text-muted-foreground">No service requests in this period.</p>}</div></section></>}
      </>}
    </div>
  </DashboardLayout>;
}
