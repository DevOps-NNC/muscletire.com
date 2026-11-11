import DashboardLayout from "@/components/DashboardLayout";
import { crmMenuItems } from "@/components/CrmNav";
import { TemplatePageRenderer } from "@/components/template/TemplatePage";
import SiteColorEditor from "./SiteColorEditor";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCrmAuth } from "@/hooks/useCrmAuth";
import { trpc } from "@/lib/trpc";
import type { SiteTemplateConfig, TemplateItem, TemplatePage, TemplateSection } from "@shared/siteTemplate";
import { ArchiveRestore, ChevronRight, Eye, History, Loader2, MonitorUp, Pencil, Plus, RotateCcw, Save, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

function toServiceHref(title: string) {
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug ? `/request-service?service=${encodeURIComponent(slug)}` : "/request-service";
}

function summarizePageChanges(previous: SiteTemplateConfig, next: SiteTemplateConfig, pageId: TemplatePage["id"]) {
  const oldPage = previous.pages.find(page => page.id === pageId);
  const newPage = next.pages.find(page => page.id === pageId);
  if (!oldPage || !newPage) return "Updated page configuration";
  const changes = [
    ...(JSON.stringify(previous.palette) !== JSON.stringify(next.palette) ? ["Updated site colors"] : []),
    ...newPage.sections.flatMap(section => {
    const before = oldPage.sections.find(item => item.id === section.id);
    if (!before) return [`Added ${section.label}`];
    if (before.title !== section.title) return [`${section.label}: “${before.title}” → “${section.title}”`];
    if (before.body !== section.body) return [`Updated supporting text in ${section.label}`];
    if (before.enabled !== section.enabled) return [`${section.enabled ? "Showed" : "Hid"} ${section.label}`];
    if (JSON.stringify(before.items) !== JSON.stringify(section.items)) return [`Updated ${section.label} items`];
    return [];
    }),
  ];
  return (`${newPage.label}: ${changes.length ? changes.join("; ") : "Updated page configuration"}`).slice(0, 400);
}

function Field({ label, value, onChange, multiline = false, placeholder }: { label: string; value?: string; onChange: (value: string) => void; multiline?: boolean; placeholder?: string }) {
  return <div className="grid gap-2"><Label className="font-bold">{label}</Label>{multiline ? <Textarea value={value ?? ""} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="min-h-28" /> : <Input value={value ?? ""} onChange={event => onChange(event.target.value)} placeholder={placeholder} />}</div>;
}

function ItemEditor({ item, index, onChange, onRemove, serviceMode }: { item: TemplateItem; index: number; onChange: (next: TemplateItem) => void; onRemove: () => void; serviceMode: boolean }) {
  return <div className="rounded-2xl border border-border bg-muted/30 p-4"><div className="mb-3 flex items-center justify-between gap-3"><p className="font-black">{serviceMode ? `Service ${index + 1}` : `Item ${index + 1}`}</p><Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}><Trash2 className="mr-1 h-4 w-4" />Remove</Button></div><div className="grid gap-3 md:grid-cols-2"><Field label={serviceMode ? "Service name" : "Title"} value={item.title} onChange={title => onChange({ ...item, title, href: serviceMode ? toServiceHref(title) : item.href })} /><Field label="Icon key" value={item.icon} onChange={icon => onChange({ ...item, icon })} placeholder="wrench" /><div className="md:col-span-2"><Field label="Description" value={item.description} onChange={description => onChange({ ...item, description })} multiline /></div><Field label="Link" value={item.href} onChange={href => onChange({ ...item, href })} placeholder="/request-service" /><Field label="Image URL" value={item.image} onChange={image => onChange({ ...item, image })} placeholder="https://…" /></div></div>;
}

function SectionEditor({ section, open, onOpenChange, onSave }: { section: TemplateSection | null; open: boolean; onOpenChange: (open: boolean) => void; onSave: (section: TemplateSection) => void }) {
  const [draft, setDraft] = useState<TemplateSection | null>(null);
  useEffect(() => { if (open && section) setDraft(clone(section)); }, [open, section]);
  if (!draft) return null;
  const isServiceCatalog = draft.kind === "serviceGrid";
  const update = (field: keyof TemplateSection, value: unknown) => setDraft(current => current ? { ...current, [field]: value } : current);
  const updateItem = (index: number, value: TemplateItem) => update("items", (draft.items ?? []).map((item, itemIndex) => itemIndex === index ? value : item));
  const addItem = () => update("items", [...(draft.items ?? []), isServiceCatalog ? { title: "New service", description: "Describe this mobile service.", icon: "wrench", href: "/request-service" } : { title: "New item", description: "Add helpful supporting copy.", icon: "sparkles" }]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Edit {draft.label}</DialogTitle><DialogDescription>Changes are staged locally. Use Save changes in the Page Editor to publish after confirmation.</DialogDescription></DialogHeader><div className="grid gap-5 py-2"><div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4"><div><p className="font-black">Show this section</p><p className="text-sm text-muted-foreground">Hidden sections stay in the configuration and can be restored later.</p></div><Switch checked={draft.enabled} onCheckedChange={enabled => update("enabled", enabled)} /></div><div className="grid gap-4 md:grid-cols-2"><Field label="Section label" value={draft.label} onChange={label => update("label", label)} /><Field label="Eyebrow" value={draft.eyebrow} onChange={eyebrow => update("eyebrow", eyebrow)} /></div><Field label="Headline" value={draft.title} onChange={title => update("title", title)} /><Field label="Supporting text" value={draft.body} onChange={body => update("body", body)} multiline /><div className="grid gap-4 md:grid-cols-2"><Field label="Primary button label" value={draft.primaryCtaLabel} onChange={primaryCtaLabel => update("primaryCtaLabel", primaryCtaLabel)} /><Field label="Primary button link" value={draft.primaryCtaHref} onChange={primaryCtaHref => update("primaryCtaHref", primaryCtaHref)} /><Field label="Secondary button label" value={draft.secondaryCtaLabel} onChange={secondaryCtaLabel => update("secondaryCtaLabel", secondaryCtaLabel)} /><Field label="Secondary button link" value={draft.secondaryCtaHref} onChange={secondaryCtaHref => update("secondaryCtaHref", secondaryCtaHref)} /></div><Field label="Section image URL" value={draft.image} onChange={image => update("image", image)} placeholder="https://…" />{["featureGrid", "serviceGrid", "faq", "areaList"].includes(draft.kind) && <div className="grid gap-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{isServiceCatalog ? "Services" : "Section items"}</h3><p className="text-sm text-muted-foreground">{isServiceCatalog ? "Add a service here to place it immediately in the live Services catalog." : "Edit the items in the same order visitors see them."}</p></div><Button type="button" size="sm" onClick={addItem}><Plus className="mr-1 h-4 w-4" />{isServiceCatalog ? "Add service" : "Add item"}</Button></div><div className="grid gap-3">{(draft.items ?? []).map((item, index) => <ItemEditor key={`${item.title}-${index}`} item={item} index={index} serviceMode={isServiceCatalog} onChange={value => updateItem(index, value)} onRemove={() => update("items", (draft.items ?? []).filter((_, itemIndex) => itemIndex !== index))} />)}</div></div>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" onClick={() => { onSave(draft); onOpenChange(false); }}>Apply to canvas</Button></DialogFooter></DialogContent></Dialog>;
}

export default function PageEditor() {
  const { user, loading } = useCrmAuth();
  const ownerStatus = trpc.crm.ownerStatus.useQuery(undefined, { enabled: Boolean(user) });
  const configQuery = trpc.crm.templateConfig.useQuery(undefined, { enabled: Boolean(user) && ownerStatus.data?.isOwner === true });
  const historyQuery = trpc.crm.templateConfigHistory.useQuery(undefined, { enabled: Boolean(user) && ownerStatus.data?.isOwner === true });
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<SiteTemplateConfig | null>(null);
  const [pageId, setPageId] = useState<TemplatePage["id"]>("home");
  const [editMode, setEditMode] = useState(true);
  const [activeSection, setActiveSection] = useState<TemplateSection | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [rollbackId, setRollbackId] = useState<number | null>(null);

  useEffect(() => { if (configQuery.data) setDraft(clone(configQuery.data)); }, [configQuery.data]);
  const page = useMemo(() => draft?.pages.find(item => item.id === pageId) ?? null, [draft, pageId]);
  const isDirty = Boolean(draft && configQuery.data && JSON.stringify(draft) !== JSON.stringify(configQuery.data));
  const saveMutation = trpc.crm.setTemplateConfig.useMutation({ onSuccess: async () => { await Promise.all([utils.crm.templateConfig.invalidate(), utils.crm.publicTemplateConfig.invalidate(), utils.crm.templateConfigHistory.invalidate()]); toast.success("Page changes saved."); setSaveConfirmOpen(false); }, onError: error => toast.error(error.message) });
  const rollbackMutation = trpc.crm.rollbackTemplateConfig.useMutation({ onSuccess: async () => { await Promise.all([utils.crm.templateConfig.invalidate(), utils.crm.publicTemplateConfig.invalidate(), utils.crm.templateConfigHistory.invalidate()]); toast.success("Previous page version restored."); setRollbackId(null); }, onError: error => toast.error(error.message) });
  const updateSection = (next: TemplateSection) => setDraft(current => current ? { ...current, pages: current.pages.map(currentPage => currentPage.id === pageId ? { ...currentPage, sections: currentPage.sections.map(section => section.id === next.id ? next : section) } : currentPage) } : current);
  const discard = () => configQuery.data && setDraft(clone(configQuery.data));
  const save = () => { if (!draft || !page || !configQuery.data) return; saveMutation.mutate({ config: draft, pageId, summary: summarizePageChanges(configQuery.data, draft, pageId) }); };

  if (loading || ownerStatus.isLoading || (ownerStatus.data?.isOwner && (configQuery.isLoading || !draft || !page))) return <DashboardLayout menuItems={crmMenuItems} title="Page Editor"><div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  if (!ownerStatus.data?.isOwner) return <DashboardLayout menuItems={crmMenuItems} title="Page Editor"><div className="mx-auto max-w-lg py-16 text-center"><ShieldAlert className="mx-auto h-12 w-12 text-primary" /><h1 className="mt-4 text-2xl font-black">Owner access required</h1><p className="mt-2 text-muted-foreground">Only the CRM owner can edit public page content or restore saved versions.</p></div></DashboardLayout>;
  if (!draft || !page) return <DashboardLayout menuItems={crmMenuItems} title="Page Editor"><div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;

  return <DashboardLayout menuItems={crmMenuItems} title="Page Editor"><div className="mx-auto grid max-w-[1600px] gap-5 p-4 md:p-6 xl:grid-cols-[250px_minmax(0,1fr)_310px]"><aside className="xl:sticky xl:top-5 xl:self-start"><div className="grid gap-5"><Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><MonitorUp className="h-5 w-5 text-primary" />Pages</CardTitle><CardDescription>Open a page, then double-click a section to edit it.</CardDescription></CardHeader><CardContent className="grid gap-2">{draft.pages.map(item => <Button key={item.id} variant={pageId === item.id ? "default" : "ghost"} className="justify-between" onClick={() => { setPageId(item.id); setActiveSection(null); }}><span>{item.label}</span><ChevronRight className="h-4 w-4" /></Button>)}</CardContent></Card><SiteColorEditor palette={draft.palette} onChange={palette => setDraft(current => current ? { ...current, palette } : current)} /></div></aside><main className="min-w-0"><Card className="overflow-hidden"><CardHeader className="border-b border-border bg-card"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[.16em] text-primary">Live page canvas</p><CardTitle className="mt-1 text-2xl">{page.label}</CardTitle><CardDescription>{editMode ? "Double-click any highlighted section or use its Edit control." : "Preview mode is on. No editing hotspots are active."}</CardDescription></div><div className="flex flex-wrap items-center gap-2"><Button variant={editMode ? "default" : "outline"} onClick={() => setEditMode(value => !value)}><Pencil className="mr-2 h-4 w-4" />{editMode ? "Editing" : "Edit mode"}</Button><Button variant="outline" disabled={!isDirty} onClick={discard}><RotateCcw className="mr-2 h-4 w-4" />Discard</Button><Button disabled={!isDirty || saveMutation.isPending} onClick={() => setSaveConfirmOpen(true)}><Save className="h-4 w-4" />Save changes</Button></div></div></CardHeader><CardContent className="p-0"><div className="relative border-x border-b border-border bg-background"><TemplatePageRenderer page={page} editMode={editMode} onEditSection={setActiveSection} /></div></CardContent></Card></main><aside className="xl:sticky xl:top-5 xl:self-start"><Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Edit history</CardTitle><CardDescription>Restore a saved version if a published change needs to be reversed.</CardDescription></CardHeader><CardContent><ScrollArea className="h-[420px] pr-3"><div className="grid gap-3">{(historyQuery.data ?? []).filter(item => item.pageId === pageId || item.pageId === "site").map(item => <div key={item.id} className="rounded-xl border border-border bg-muted/30 p-3"><p className="font-bold leading-5">{item.summary}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p><Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setRollbackId(item.id)}><ArchiveRestore className="mr-2 h-4 w-4" />Restore this version</Button></div>)}{!historyQuery.isLoading && !(historyQuery.data ?? []).length && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Your first confirmed save will appear here.</p>}</div></ScrollArea></CardContent></Card></aside></div><SectionEditor section={activeSection} open={Boolean(activeSection)} onOpenChange={open => !open && setActiveSection(null)} onSave={updateSection} /><AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Save page changes?</AlertDialogTitle><AlertDialogDescription>This will update the public page configuration and create a rollback point in the edit history.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={save}>Save and create history</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><AlertDialog open={rollbackId !== null} onOpenChange={open => !open && setRollbackId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Restore this page version?</AlertDialogTitle><AlertDialogDescription>Your current configuration will be preserved as a new history entry before this saved version is restored.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => rollbackId && rollbackMutation.mutate({ historyId: rollbackId })}>Restore version</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></DashboardLayout>;
}
