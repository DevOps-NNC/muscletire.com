import { BarChart3, ClipboardList, MousePointerClick, Users } from "lucide-react";

type Metric = { value: number | null; source: string; comparisonPercent: number | null } | null;

function displayMetric(metric: Metric, suffix = "") {
  if (!metric || metric.value === null) return "Not available";
  return metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) + suffix;
}

function Comparison({ metric }: { metric: Metric }) {
  if (!metric || metric.comparisonPercent === null) return <span className="text-xs font-bold text-muted-foreground">No comparison</span>;
  const sign = metric.comparisonPercent > 0 ? "+" : "";
  return <span className={metric.comparisonPercent >= 0 ? "text-xs font-bold text-[var(--color-success)]" : "text-xs font-bold text-[var(--color-danger)]"}>{sign}{metric.comparisonPercent}% vs prior</span>;
}

export function AnalyticsOverviewCards({ ga4, crm, conversionRate }: { ga4: { users: Metric; sessions: Metric }; crm: { totalLeads: Metric; attributedLeads: Metric }; conversionRate: number | null }) {
  const cards = [
    { label: "Website visitors", value: displayMetric(ga4.users), note: "GA4 unique users", icon: Users, source: "GA4" },
    { label: "Sessions", value: displayMetric(ga4.sessions), note: "GA4 sessions", icon: MousePointerClick, source: "GA4" },
    { label: "Total leads", value: displayMetric(crm.totalLeads), note: "CRM service requests", icon: ClipboardList, source: "CRM" },
    { label: "Website lead rate", value: conversionRate === null ? "Not available" : `${conversionRate}%`, note: "Attributed leads ÷ GA4 sessions", icon: BarChart3, source: "Combined" },
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <section key={card.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><card.icon className="h-5 w-5" /></div><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-wide text-muted-foreground">{card.source}</span></div><p className="mt-5 text-3xl font-black">{card.value}</p><p className="mt-1 font-bold">{card.label}</p><p className="mt-1 text-sm text-muted-foreground">{card.note}</p>{card.label !== "Website lead rate" && <div className="mt-3"><Comparison metric={card.label === "Website visitors" ? ga4.users : card.label === "Sessions" ? ga4.sessions : crm.totalLeads} /></div>}</section>)}</div>;
}
