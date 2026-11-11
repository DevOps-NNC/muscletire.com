import { LucideIcon } from "lucide-react";

export function LeadProfileSection({ icon: Icon, title, eyebrow, children }: { icon: LucideIcon; title: string; eyebrow?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-primary">{eyebrow ?? "Request details"}</p><h2 className="mt-0.5 text-lg font-black">{title}</h2></div></div><div className="mt-5">{children}</div></section>;
}

export function LeadDataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="grid grid-cols-[112px_1fr] gap-3 border-b border-border/70 py-3 last:border-0"><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="min-w-0 text-sm font-semibold leading-5">{value || <span className="font-normal text-muted-foreground">Not provided</span>}</dd></div>;
}
