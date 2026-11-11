import { DashboardLayout } from "@/components/DashboardLayout";
import { crmMenuItems } from "@/components/CrmNav";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import type { MarketingReportSnapshot } from "@shared/analytics";
import { ArrowLeft, Download, FileText, Printer, RefreshCw } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";

function formatMetric(value: number | null, suffix = "") {
  return value === null ? "Not available" : `${value}${suffix}`;
}

function formatComparison(value: number | null) {
  if (value === null) return "No comparison";
  return `${value > 0 ? "+" : ""}${value}% vs previous period`;
}

function metricTone(source: string) {
  return source === "ga4" ? "bg-primary/10 text-primary" : source === "attributed" ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]" : "bg-muted text-muted-foreground";
}

export default function AdminAnalyticsReport() {
  const [, params] = useRoute("/admin/analytics/reports/:id");
  const [, setLocation] = useLocation();
  const reportId = params?.id ? Number(params.id) : null;
  const reports = trpc.analytics.reports.useQuery(undefined, { enabled: reportId === null });
  const report = trpc.analytics.getReport.useQuery({ id: reportId ?? 0 }, { enabled: reportId !== null });
  const generate = trpc.analytics.generateReport.useMutation({
    onSuccess: result => {
      toast.success("Marketing report generated");
      setLocation(`/admin/analytics/reports/${result.id}`);
    },
    onError: error => toast.error(error.message),
  });
  const exportCsv = trpc.analytics.exportCsv.useMutation({
    onSuccess: ({ csv, filename }) => {
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: error => toast.error(error.message),
  });

  const snapshot = report.data?.snapshot as MarketingReportSnapshot | undefined;

  return <DashboardLayout menuItems={crmMenuItems} title="Marketing reports">
    <div className="mx-auto max-w-7xl p-3 md:p-6">
      {reportId === null ? (
        <>
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Decision support</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Marketing reports</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">Create a reviewable snapshot of GA4 traffic, CRM demand, attribution coverage, and service intent.</p>
            </div>
            <Button className="min-h-11" onClick={() => generate.mutate({ reportType: "custom", period: "last_30_days" })} disabled={generate.isPending}>
              <RefreshCw className={generate.isPending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
              {generate.isPending ? "Generating…" : "Generate last 30 days"}
            </Button>
          </div>
          {reports.isLoading && <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading reports…</div>}
          {!reports.isLoading && !reports.data?.length && <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center"><FileText className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-black">No reports generated yet</h2><p className="mt-2 text-sm text-muted-foreground">Generate a report after the analytics connection has been synchronized.</p></div>}
          {!!reports.data?.length && <div className="grid gap-3">{reports.data.map(item => <Link key={item.id} href={`/admin/analytics/reports/${item.id}`} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{item.reportType} report</p><h2 className="mt-1 text-lg font-black">{new Date(item.periodStart).toISOString().slice(0, 10)} to {new Date(item.periodEnd).toISOString().slice(0, 10)}</h2></div><span className="text-sm font-bold text-muted-foreground group-hover:text-primary">Open report →</span></div><p className="mt-3 text-xs text-muted-foreground">Generated {item.createdAt ? new Date(item.createdAt).toLocaleString() : "recently"}</p></Link>)}</div>}
        </>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin/analytics/reports" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to reports</Link>
            {report.data && <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-10" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print / Save PDF</Button><Button variant="outline" className="min-h-10" onClick={() => exportCsv.mutate({ id: reportId })} disabled={exportCsv.isPending}><Download className="mr-2 h-4 w-4" />{exportCsv.isPending ? "Preparing…" : "Download CSV"}</Button></div>}
          </div>
          {report.isLoading && <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading report…</div>}
          {report.isError && <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{report.error.message}</div>}
          {!report.isLoading && !report.isError && !snapshot && <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">Report not found.</div>}
          {snapshot && <>
            <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Marketing performance snapshot</p><h1 className="mt-1 text-3xl font-black">{snapshot.range.label}</h1><p className="mt-2 text-sm text-muted-foreground">Compared with {snapshot.comparisonRange.label} · reporting time zone {snapshot.range.timeZone}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">GA4: {snapshot.sourceStatus.ga4.replace("_", " ")}</span><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">CRM: {snapshot.sourceStatus.crm}</span><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">Attribution coverage: {snapshot.attribution.coveragePercent === null ? "Not available" : `${snapshot.attribution.coveragePercent}%`}</span></div></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["users", "sessions", "totalLeads", "leadConversionRate"].map(key => { const metric = snapshot.summary[key as keyof typeof snapshot.summary]; const labels: Record<string, string> = { users: "Website visitors", sessions: "Sessions", totalLeads: "Total leads", leadConversionRate: "Website lead rate" }; return <div key={key} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-sm font-bold text-muted-foreground">{labels[key]}</p><p className="mt-3 text-3xl font-black">{formatMetric(metric.value, key === "leadConversionRate" ? "%" : "")}</p><span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${metricTone(metric.source)}`}>{formatComparison(metric.comparisonPercent)}</span></div>; })}</div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="text-xl font-black">Channel performance</h2><div className="mt-4 divide-y divide-border">{snapshot.channels.length ? snapshot.channels.map(channel => <div key={channel.channel} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="font-bold">{channel.channel.replace(/_/g, " ")}</span><span className="text-muted-foreground">{channel.leads} leads · {formatMetric(channel.sessions, " sessions")} {channel.conversionRate === null ? "" : `· ${channel.conversionRate}% rate`}</span></div>) : <p className="py-4 text-sm text-muted-foreground">No channel data in this report.</p>}</div></section><section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="text-xl font-black">Service demand</h2><div className="mt-4 divide-y divide-border">{snapshot.services.length ? snapshot.services.map(service => <div key={service.service} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="font-bold">{service.service}</span><span className="text-muted-foreground">{service.leads} leads</span></div>) : <p className="py-4 text-sm text-muted-foreground">No service requests in this report.</p>}</div></section></div>
            <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="text-xl font-black">Landing pages</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3 pr-4">Page</th><th className="pb-3 pr-4">Sessions</th><th className="pb-3 pr-4">Leads</th><th className="pb-3">Rate</th></tr></thead><tbody className="divide-y divide-border">{snapshot.pages.length ? snapshot.pages.map(page => <tr key={page.path}><td className="py-3 pr-4 font-bold">{page.path}</td><td className="py-3 pr-4">{formatMetric(page.sessions)}</td><td className="py-3 pr-4">{page.leads}</td><td className="py-3">{formatMetric(page.conversionRate, "%")}</td></tr>) : <tr><td colSpan={4} className="py-5 text-muted-foreground">No landing-page data in this report.</td></tr>}</tbody></table></div></section>
            <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="text-xl font-black">Recommendations</h2><ul className="mt-4 space-y-3">{snapshot.recommendations.map(recommendation => <li key={recommendation} className="rounded-xl bg-muted/40 p-3 text-sm">{recommendation}</li>)}{!snapshot.recommendations.length && <li className="text-sm text-muted-foreground">No recommendations were generated for this snapshot.</li>}</ul></section>
            <section className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 p-5"><h2 className="text-lg font-black">Email delivery</h2><p className="mt-1 text-sm text-muted-foreground">Manual delivery is disabled until an email provider is configured. Use Print / Save PDF or Download CSV for now.</p></section>
          </>}
        </>
      )}
    </div>
  </DashboardLayout>;
}
