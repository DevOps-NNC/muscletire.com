import { DashboardLayout } from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { CalendarClock, ClipboardList, FileText, LayoutDashboard, Settings, ShieldCheck, Users } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Users, label: "Lead Pipeline", href: "/admin/leads" },
  { icon: ShieldCheck, label: "Team access", href: "/admin/team" },
  { icon: ClipboardList, label: "Blog", href: "/admin/blog" },
  { icon: FileText, label: "Services", href: "/admin/services" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

const stageLabels: Record<string, string> = { new: "New", contacted: "Contacted", quoted: "Quoted", scheduled: "Scheduled", in_progress: "In progress", completed: "Completed" };

export default function AdminDashboard() {
  const { data, isLoading } = trpc.crm.overview.useQuery();
  const { data: leads } = trpc.crm.pipeline.useQuery({});

  const cards = [
    { label: "New this week", value: data?.newThisWeek ?? 0, note: "Fresh service requests", tone: "bg-[var(--color-primary-soft)] text-primary" },
    { label: "Next actions due", value: data?.dueActions ?? 0, note: "Follow-ups that need attention", tone: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]" },
    { label: "Upcoming appointments", value: data?.upcomingAppointments ?? 0, note: "Confirmed service visits", tone: "bg-[var(--color-success-soft)] text-[var(--color-success)]" },
  ];

  return (
    <DashboardLayout menuItems={menuItems} title="New Age CRM">
      <div className="mx-auto max-w-7xl p-3 md:p-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Sales workspace</p><h1 className="mt-1 text-3xl font-black tracking-tight">Your service pipeline</h1><p className="mt-2">Prioritize the customers who need a response, quote, or confirmed visit.</p></div>
          <Link href="/admin/leads" className="inline-flex w-fit items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-extrabold text-[var(--color-text-inverse)] shadow-sm transition hover:bg-primary/90">Open lead pipeline</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => <div key={card.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className={`mb-5 inline-flex rounded-xl p-2.5 ${card.tone}`}><CalendarClock className="h-5 w-5" /></div><p className="text-3xl font-black">{isLoading ? "—" : card.value}</p><p className="mt-1 font-bold">{card.label}</p><p className="mt-1 text-sm">{card.note}</p></div>)}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="m-0 text-xl font-black">Pipeline by stage</h2><p className="mt-1 text-sm">A quick view of where revenue opportunities sit.</p></div><ClipboardList className="h-5 w-5 text-primary" /></div><div className="grid gap-3 sm:grid-cols-2">{(data?.pipeline ?? []).map((stage) => <Link key={stage.status} href={`/admin/leads?status=${stage.status}`} className="rounded-xl border border-[var(--color-border)] p-4 transition hover:border-primary/40 hover:bg-primary/5"><p className="text-sm font-bold text-muted-foreground">{stageLabels[stage.status] ?? stage.status}</p><p className="mt-1 text-2xl font-black">{stage.count}</p></Link>)}</div></section>
          <section className="rounded-2xl border border-border bg-[var(--color-hero-bg)] p-6 text-[var(--color-text-inverse)] shadow-sm"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary p-2.5"><Users className="h-5 w-5" /></div><div><p className="text-sm font-bold text-[var(--color-primary-soft-foreground)]">Recent requests</p><h2 className="m-0 mt-1 text-xl font-black text-[var(--color-text-inverse)]">Respond while intent is high.</h2></div></div><div className="mt-6 space-y-3">{leads?.slice(0, 4).map((lead) => <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="block rounded-xl border border-[color-mix(in_srgb,var(--color-text-inverse)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-text-inverse)_8%,transparent)] p-3 transition hover:bg-[color-mix(in_srgb,var(--color-text-inverse)_14%,transparent)]"><p className="font-bold text-[color-mix(in_srgb,var(--color-text-inverse)_85%,transparent)]">{lead.fullName}</p><p className="mt-1 truncate text-sm text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)]">{lead.requestedService || lead.mainSymptom || "Service request"}</p></Link>)}{!leads?.length && <p className="text-sm text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)]">New requests will appear here as they arrive.</p>}</div></section>
        </div>
      </div>
    </DashboardLayout>
  );
}
