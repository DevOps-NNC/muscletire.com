import { crmMenuItems } from "@/components/CrmNav";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCrmAuth } from "@/hooks/useCrmAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Download, FileDown, KeyRound, Loader2, MousePointerClick, ShieldCheck, Target, UsersRound, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function toLocalInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function GoogleAdsConversions() {
  const { user } = useCrmAuth();
  const utils = trpc.useUtils();
  const ownerStatus = trpc.crm.ownerStatus.useQuery(undefined, { enabled: Boolean(user) });
  const isOwner = ownerStatus.data?.isOwner === true;
  const summary = trpc.googleAds.summary.useQuery(undefined, { enabled: isOwner });
  const attributedLeads = trpc.googleAds.attributedLeads.useQuery(undefined, { enabled: isOwner });
  const events = trpc.googleAds.listEvents.useQuery(undefined, { enabled: isOwner });
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [conversionName, setConversionName] = useState("Qualified lead");
  const [conversionTime, setConversionTime] = useState(() => toLocalInputValue());
  const [conversionValue, setConversionValue] = useState("");
  const [includeUserData, setIncludeUserData] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);

  const selectedLead = useMemo(() => attributedLeads.data?.find(item => item.lead.id === selectedLeadId) ?? null, [attributedLeads.data, selectedLeadId]);
  const supportsUserData = selectedLead?.attribution.adsDataConsent === true;
  const recordConversion = trpc.googleAds.recordConversion.useMutation({
    onSuccess: () => {
      toast.success("Conversion event prepared for Google Ads export.");
      setConversionValue("");
      setIncludeUserData(false);
      utils.googleAds.listEvents.invalidate();
      utils.googleAds.summary.invalidate();
      if (selectedLeadId) utils.googleAds.leadAttribution.invalidate({ leadId: selectedLeadId });
    },
    onError: error => toast.error(error.message),
  });
  const exportCsv = trpc.googleAds.exportCsv.useMutation({
    onSuccess: result => {
      downloadCsv(result.csv, result.filename);
      toast.success(`${result.eventCount} conversion ${result.eventCount === 1 ? "event" : "events"} downloaded for Data Manager.`);
      setSelectedEventIds([]);
      utils.googleAds.listEvents.invalidate();
      utils.googleAds.summary.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const toggleEvent = (id: number) => setSelectedEventIds(previous => previous.includes(id) ? previous.filter(eventId => eventId !== id) : [...previous, id]);
  const metricCards: Array<{ Icon: LucideIcon; label: string; value: number; detail: string }> = [
    { Icon: MousePointerClick, label: "Attributed requests", value: summary.data?.capturedLeads ?? 0, detail: "Leads with campaign context" },
    { Icon: KeyRound, label: "Matchable requests", value: summary.data?.matchableLeads ?? 0, detail: "Click ID, braid, or consented data" },
    { Icon: Target, label: "Ready to export", value: summary.data?.pendingEvents ?? 0, detail: "Prepared conversion outcomes" },
    { Icon: CheckCircle2, label: "Previously exported", value: summary.data?.exportedEvents ?? 0, detail: "Events downloaded for upload" },
  ];

  if (ownerStatus.isLoading) return <DashboardLayout menuItems={crmMenuItems} title="Google Ads"><div className="p-6 text-muted-foreground">Checking access…</div></DashboardLayout>;
  if (!isOwner) return <DashboardLayout menuItems={crmMenuItems} title="Google Ads"><div className="mx-auto max-w-2xl rounded-3xl border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-7 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[var(--color-warning)]" /><h1 className="mt-3 text-2xl font-black">Owner access required</h1><p className="mt-2 text-sm text-muted-foreground">Google Ads click identifiers and conversion exports are only available to the CRM owner.</p></div></DashboardLayout>;

  return <DashboardLayout menuItems={crmMenuItems} title="Google Ads conversions">
    <div className="mx-auto max-w-7xl space-y-5 p-1 sm:p-3">
      <header className="overflow-hidden rounded-3xl border border-sidebar bg-sidebar px-5 py-6 text-sidebar-foreground shadow-sm sm:px-7">
        <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Offline conversion feedback loop</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Turn qualified leads into better Google Ads signals.</h1><p className="mt-3 text-sm leading-6 text-sidebar-foreground/75">Capture Google click identifiers at intake, record meaningful outcomes in CRM, then export only the events you want Google Ads Data Manager to learn from.</p></div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ Icon, label, value, detail }) => <div key={label} className="rounded-2xl border bg-card p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div></div></div>)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="border-b bg-muted/30 px-5 py-4"><p className="text-xs font-black uppercase tracking-[.14em] text-primary">1. Select an attributed lead</p><h2 className="mt-1 text-xl font-black">Prepare a meaningful business outcome</h2><p className="mt-1 text-sm text-muted-foreground">Choose a lead only after it reaches a real quality milestone, such as qualified, scheduled, or completed.</p></div>
          <div className="divide-y">
            {attributedLeads.isLoading && <p className="p-5 text-sm text-muted-foreground">Loading attributed requests…</p>}
            {!attributedLeads.isLoading && !attributedLeads.data?.length && <div className="p-8 text-center"><UsersRound className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-bold">No attributed leads yet.</p><p className="mt-1 text-sm text-muted-foreground">Future requests that arrive through URLs with Google click IDs, braids, or campaign tags will appear here.</p></div>}
            {attributedLeads.data?.map(({ lead, attribution }) => {
              const isSelected = lead.id === selectedLeadId;
              const matchable = Boolean(attribution.gclid || attribution.gbraid || attribution.wbraid || attribution.adsDataConsent);
              return <button type="button" key={lead.id} onClick={() => { setSelectedLeadId(lead.id); setIncludeUserData(false); }} className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-muted/45 ${isSelected ? "bg-primary/5" : ""}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-foreground">{lead.fullName}</p><Badge variant="outline" className="capitalize">{lead.status.replace("_", " ")}</Badge>{attribution.gclid && <Badge className="bg-[var(--color-success-soft)] text-[var(--color-success)] hover:bg-[var(--color-success-soft)]">GCLID</Badge>}{(attribution.gbraid || attribution.wbraid) && <Badge className="bg-[var(--color-info-soft)] text-[var(--color-info)] hover:bg-[var(--color-info-soft)]">BRAID</Badge>}</div><p className="mt-1 truncate text-sm text-muted-foreground">{lead.referenceNumber} · {lead.requestedService || "Service request"}{attribution.utmCampaign ? ` · ${attribution.utmCampaign}` : ""}</p></div><span className={`shrink-0 text-xs font-bold ${matchable ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}`}>{matchable ? "Match-ready" : "Context only"}</span></button>;
            })}
          </div>
        </section>

        <aside className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-primary">2. Record conversion event</p><h2 className="mt-1 text-xl font-black">Outcome for Google Ads</h2>
          {!selectedLead ? <p className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Select an attributed lead to prepare its offline conversion event.</p> : <div className="mt-5 space-y-4"><div className="rounded-xl border bg-muted/30 p-3"><p className="font-bold">{selectedLead.lead.fullName}</p><p className="mt-1 text-xs text-muted-foreground">{selectedLead.lead.referenceNumber} · {selectedLead.attribution.gclid ? "Google Click ID captured" : selectedLead.attribution.gbraid || selectedLead.attribution.wbraid ? "Google braid captured" : "Consented first-party matching"}</p></div><div className="space-y-2"><Label htmlFor="conversion-name">Conversion action</Label><Input id="conversion-name" value={conversionName} onChange={event => setConversionName(event.target.value)} placeholder="Qualified lead" /></div><div className="space-y-2"><Label htmlFor="conversion-time">When did this happen?</Label><Input id="conversion-time" type="datetime-local" value={conversionTime} onChange={event => setConversionTime(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="conversion-value">Value (optional)</Label><Input id="conversion-value" inputMode="decimal" value={conversionValue} onChange={event => setConversionValue(event.target.value)} placeholder="e.g., 150" /></div><div className="rounded-xl border border-primary/15 bg-primary/5 p-3"><div className="flex items-start gap-3"><Switch id="first-party-data" checked={includeUserData} onCheckedChange={setIncludeUserData} disabled={!supportsUserData} /><div><Label htmlFor="first-party-data" className="font-bold">Include consented email/phone</Label><p className="mt-1 text-xs leading-5 text-muted-foreground">Use only after the customer selected advertising measurement. Google Ads Data Manager can hash these fields during import.</p>{!supportsUserData && <p className="mt-2 text-xs font-bold text-[var(--color-warning)]">This request did not include advertising-measurement consent, so first-party matching is unavailable.</p>}</div></div></div><Button className="min-h-11 w-full" disabled={recordConversion.isPending || conversionName.trim().length < 3 || !conversionTime} onClick={() => recordConversion.mutate({ leadId: selectedLead.lead.id, conversionName, conversionTime: new Date(conversionTime), conversionValue, conversionCurrency: "USD", includeUserData })}>{recordConversion.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Preparing…</> : <><Target className="mr-2 h-4 w-4" />Prepare conversion</>}</Button></div>}
        </aside>
      </div>

      <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-primary">3. Export a Data Manager CSV</p><h2 className="mt-1 text-xl font-black">Prepared conversion events</h2><p className="mt-1 text-sm text-muted-foreground">The file contains GCLID, GBRAID/WBRAID when present, optional consented matching data, ISO conversion time, value, currency, and a unique order ID.</p></div><Button onClick={() => exportCsv.mutate({ eventIds: selectedEventIds })} disabled={selectedEventIds.length === 0 || exportCsv.isPending} className="min-h-11 shrink-0">{exportCsv.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}{exportCsv.isPending ? "Building file…" : `Download CSV${selectedEventIds.length ? ` (${selectedEventIds.length})` : ""}`}</Button></div>
        <div className="divide-y">{events.isLoading && <p className="p-5 text-sm text-muted-foreground">Loading conversion events…</p>}{!events.isLoading && !events.data?.length && <div className="p-8 text-center"><FileDown className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-bold">No conversion events prepared yet.</p><p className="mt-1 text-sm text-muted-foreground">Record a qualified, scheduled, or completed lead above to create an exportable event.</p></div>}{events.data?.map(({ event, lead, attribution }) => <label key={event.id} className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-muted/35"><Checkbox checked={selectedEventIds.includes(event.id)} onCheckedChange={() => toggleEvent(event.id)} aria-label={`Select ${event.conversionName} for ${lead.fullName}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{lead.fullName}</p><Badge variant="outline">{event.conversionName}</Badge>{event.exportedAt && <Badge className="bg-[var(--color-secondary-soft)] text-[var(--color-text-muted)] hover:bg-[var(--color-secondary-soft)]">Exported before</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{lead.referenceNumber} · {new Date(event.conversionTime).toLocaleString()} · {attribution?.gclid ? "GCLID" : attribution?.gbraid || attribution?.wbraid ? "BRAID" : "Consent matching"} · Order {event.orderId}</p></div><span className="shrink-0 text-sm font-black">{event.conversionValue ? `$${event.conversionValue}` : "—"}</span></label>)}</div>
      </section>

      <p className="rounded-2xl border border-[var(--color-info)] bg-[var(--color-info-soft)] px-4 py-3 text-xs leading-5 text-[var(--color-info)]">Next: in Google Ads, use <strong>Data Manager</strong> to upload or connect this CSV, map the header columns, and use a conversion action whose name exactly matches the value selected here. Enable auto-tagging and agree to Google’s customer-data terms before using consented first-party matching.</p>
    </div>
  </DashboardLayout>;
}
