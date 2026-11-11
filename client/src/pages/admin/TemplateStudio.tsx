import DashboardLayout from "@/components/DashboardLayout";
import { crmMenuItems } from "@/components/CrmNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCrmAuth } from "@/hooks/useCrmAuth";
import { trpc } from "@/lib/trpc";
import { TEMPLATE_SECTION_KINDS, cloneDefaultTemplate, type SiteTemplateConfig, type TemplateItem, type TemplatePage, type TemplateSection, type TemplateSectionKind, type TemplateVideo } from "@shared/siteTemplate";
import { ArrowDown, ArrowUp, Eye, Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const newSection = (kind: TemplateSectionKind): TemplateSection => ({
  id: `${kind}-${Date.now()}`,
  label: "New section",
  kind,
  enabled: true,
  eyebrow: "Section eyebrow",
  title: kind === "hero" ? "Hero H1 title" : "Section headline",
  body: "Add the supporting paragraph for this section.",
  primaryCtaLabel: kind === "cta" || kind === "hero" ? "Primary CTA" : undefined,
  primaryCtaHref: kind === "cta" || kind === "hero" ? "/request-service" : undefined,
  items: ["featureGrid", "serviceGrid", "faq", "areaList"].includes(kind) ? [{ title: "Item title", description: "Item description" }] : undefined,
  videos: kind === "social" ? [] : undefined,
});

const parseTikTokVideos = (value: string): TemplateVideo[] => value
  .split("\n")
  .map(url => url.trim())
  .filter(Boolean)
  .map((originalUrl, index) => {
    const videoId = originalUrl.match(/\/video\/(\d+)/)?.[1];
    if (!videoId) return null;
    return {
      id: `tiktok-${videoId}`,
      title: `TikTok repair video ${index + 1}`,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      originalUrl,
    };
  })
  .filter((video): video is TemplateVideo => Boolean(video));

export default function TemplateStudio() {
  const { user } = useCrmAuth();
  const configQuery = trpc.crm.templateConfig.useQuery(undefined, { enabled: user?.role === "admin" });
  const saveMutation = trpc.crm.setTemplateConfig.useMutation({
    onSuccess: () => {
      toast.success("Template configuration saved.");
      configQuery.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const [config, setConfig] = useState<SiteTemplateConfig>(cloneDefaultTemplate());
  const [pageId, setPageId] = useState<TemplatePage["id"]>("home");
  const [newKind, setNewKind] = useState<TemplateSectionKind>("featureGrid");

  useEffect(() => { if (configQuery.data) setConfig(configQuery.data); }, [configQuery.data]);
  const page = useMemo(() => config.pages.find(item => item.id === pageId) ?? config.pages[0], [config.pages, pageId]);
  const update = (recipe: (current: SiteTemplateConfig) => SiteTemplateConfig) => setConfig(current => recipe(current));
  const updatePage = (recipe: (current: TemplatePage) => TemplatePage) => update(current => ({ ...current, pages: current.pages.map(item => item.id === page?.id ? recipe(item) : item) }));
  const updateSection = (sectionId: string, patch: Partial<TemplateSection>) => updatePage(current => ({ ...current, sections: current.sections.map(section => section.id === sectionId ? { ...section, ...patch } : section) }));
  const moveSection = (sectionId: string, direction: -1 | 1) => updatePage(current => {
    const index = current.sections.findIndex(section => section.id === sectionId);
    const next = index + direction;
    if (next < 0 || next >= current.sections.length) return current;
    const sections = [...current.sections];
    [sections[index], sections[next]] = [sections[next], sections[index]];
    return { ...current, sections };
  });
  const disabled = user?.role !== "admin";

  return <DashboardLayout title="Template Studio" menuItems={crmMenuItems}>
    {disabled ? <OwnerOnly /> : <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-sm font-black uppercase tracking-[.18em] text-primary">Reusable website intake</p><h1 className="mt-2 text-3xl font-black tracking-tight">Mobile Mechanic Template Studio</h1><p className="mt-2 max-w-3xl text-muted-foreground">Edit labeled content, colors, reusable page sections, tracking, and integrations without changing public-site code.</p></div>
        <div className="flex flex-wrap gap-2"><a href="/" target="_blank" rel="noreferrer"><Button variant="outline" className="min-h-11 gap-2"><Eye className="h-4 w-4" />Preview site</Button></a><Button onClick={() => saveMutation.mutate({ config })} disabled={saveMutation.isPending || configQuery.isLoading} className="min-h-11 gap-2"><Save className="h-4 w-4" />{saveMutation.isPending ? "Saving…" : "Save template"}</Button></div>
      </header>
      {configQuery.isLoading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : <Tabs defaultValue="brand" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:grid-cols-4"><TabsTrigger value="brand" className="min-h-10">Brand & palette</TabsTrigger><TabsTrigger value="pages" className="min-h-10">Pages & sections</TabsTrigger><TabsTrigger value="integrations" className="min-h-10">Tracking & tags</TabsTrigger><TabsTrigger value="webhooks" className="min-h-10">Webhooks</TabsTrigger></TabsList>
        <TabsContent value="brand" className="space-y-6"><BrandAndPalette config={config} update={update} /></TabsContent>
        <TabsContent value="pages"><PageSections config={config} page={page} pageId={pageId} setPageId={setPageId} newKind={newKind} setNewKind={setNewKind} updatePage={updatePage} updateSection={updateSection} moveSection={moveSection} /></TabsContent>
        <TabsContent value="integrations"><Integrations config={config} update={update} /></TabsContent>
        <TabsContent value="webhooks"><Webhooks config={config} update={update} /></TabsContent>
      </Tabs>}
    </main>}
  </DashboardLayout>;
}

function OwnerOnly() { return <div className="mx-auto max-w-2xl p-6"><Card><CardHeader><CardTitle>Owner access required</CardTitle><CardDescription>Only the CRM owner can change reusable website template content, integrations, or snippets.</CardDescription></CardHeader></Card></div>; }

function BrandAndPalette({ config, update }: { config: SiteTemplateConfig; update: (recipe: (current: SiteTemplateConfig) => SiteTemplateConfig) => void }) {
  const brand = (key: keyof SiteTemplateConfig["brand"], value: string) => update(current => ({ ...current, brand: { ...current.brand, [key]: value } }));
  return <><Card><CardHeader><CardTitle>Business intake</CardTitle><CardDescription>These fields populate reusable brand details for future sites.</CardDescription></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><Field label="Business name" value={config.brand.businessName} onChange={value => brand("businessName", value)} /><Field label="Short brand name" value={config.brand.shortName} onChange={value => brand("shortName", value)} /><Field label="Owner / technician name" value={config.brand.ownerName} onChange={value => brand("ownerName", value)} /><Field label="Phone" value={config.brand.phone} onChange={value => brand("phone", value)} /><Field label="Phone digits" value={config.brand.phoneRaw} onChange={value => brand("phoneRaw", value)} /><Field label="Email" value={config.brand.email} onChange={value => brand("email", value)} /><Field label="Website URL" value={config.brand.website} onChange={value => brand("website", value)} /><Field label="Primary city" value={config.brand.city} onChange={value => brand("city", value)} /><Field label="Service region" value={config.brand.region} onChange={value => brand("region", value)} /><Field label="Logo image URL" className="md:col-span-2" value={config.brand.logoUrl} onChange={value => brand("logoUrl", value)} /><Field label="Instagram URL" value={config.brand.social.instagram} onChange={value => update(current => ({ ...current, brand: { ...current.brand, social: { ...current.brand.social, instagram: value } } }))} /><Field label="TikTok URL" value={config.brand.social.tiktok} onChange={value => update(current => ({ ...current, brand: { ...current.brand, social: { ...current.brand.social, tiktok: value } } }))} /></CardContent></Card><Card><CardHeader><CardTitle>Color palette</CardTitle><CardDescription>Pick a new palette per client. Saving applies colors to the reusable public theme.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(["primary", "secondary", "background", "foreground", "mutedForeground", "accent", "surface", "darkSurface", "darkSurfaceForeground", "primaryForeground"] as const).map(key => <ColorField key={key} label={key.replace(/([A-Z])/g, " $1")} value={config.palette[key]} onChange={value => update(current => ({ ...current, palette: { ...current.palette, [key]: value } }))} />)}</CardContent></Card></>;
}

function PageSections({ config, page, pageId, setPageId, newKind, setNewKind, updatePage, updateSection, moveSection }: { config: SiteTemplateConfig; page: TemplatePage; pageId: TemplatePage["id"]; setPageId: (value: TemplatePage["id"]) => void; newKind: TemplateSectionKind; setNewKind: (value: TemplateSectionKind) => void; updatePage: (recipe: (page: TemplatePage) => TemplatePage) => void; updateSection: (sectionId: string, patch: Partial<TemplateSection>) => void; moveSection: (sectionId: string, direction: -1 | 1) => void }) {
  return <Card><CardHeader><CardTitle>Page intake</CardTitle><CardDescription>Change section text, order, visibility, or section type. Social sections accept one public TikTok post URL per line and create official in-page embeds automatically.</CardDescription></CardHeader><CardContent><div className="mb-5 flex flex-wrap gap-2">{config.pages.map(item => <Button key={item.id} variant={item.id === pageId ? "default" : "outline"} onClick={() => setPageId(item.id)}>{item.label}</Button>)}</div><div className="grid gap-4"><div className="grid gap-4 rounded-2xl border bg-muted/20 p-4 md:grid-cols-2"><Field label="SEO page title" value={page.seoTitle} onChange={seoTitle => updatePage(current => ({ ...current, seoTitle }))} /><Field label="SEO description" value={page.seoDescription} onChange={seoDescription => updatePage(current => ({ ...current, seoDescription }))} /></div>{page.sections.map((section, index) => <SectionEditor key={section.id} section={section} index={index} onUpdate={patch => updateSection(section.id, patch)} onMove={direction => moveSection(section.id, direction)} onRemove={() => updatePage(current => ({ ...current, sections: current.sections.filter(item => item.id !== section.id) }))} />)}<div className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-primary/35 bg-primary/[.03] p-4"><div className="min-w-48 flex-1"><Label>Add a reusable section</Label><select value={newKind} onChange={event => setNewKind(event.target.value as TemplateSectionKind)} className="mt-2 min-h-11 w-full rounded-md border bg-background px-3 text-sm">{TEMPLATE_SECTION_KINDS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><Button onClick={() => updatePage(current => ({ ...current, sections: [...current.sections, newSection(newKind)] }))} className="min-h-11 gap-2"><Plus className="h-4 w-4" />Add section</Button></div></div></CardContent></Card>;
}

function Integrations({ config, update }: { config: SiteTemplateConfig; update: (recipe: (current: SiteTemplateConfig) => SiteTemplateConfig) => void }) { return <Card><CardHeader><CardTitle>Analytics, Maps & tags</CardTitle><CardDescription>The Google Tag Manager ID below controls both the head bootstrap and body noscript tag. Head and body HTML are owner-only; paste only other trusted vendor snippets.</CardDescription></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><Field label="Google Analytics measurement ID" placeholder="G-XXXXXXXXXX" value={config.integrations.googleAnalyticsId} onChange={googleAnalyticsId => update(current => ({ ...current, integrations: { ...current.integrations, googleAnalyticsId } }))} /><Field label="Google Tag Manager ID (head + body)" placeholder="GTM-XXXXXXX" value={config.integrations.googleTagManagerId} onChange={googleTagManagerId => update(current => ({ ...current, integrations: { ...current.integrations, googleTagManagerId } }))} /><Field label="Meta Pixel ID" placeholder="1234567890" value={config.integrations.metaPixelId} onChange={metaPixelId => update(current => ({ ...current, integrations: { ...current.integrations, metaPixelId } }))} /><Field label="Google Maps browser key" placeholder="AIza…" value={config.integrations.googleMapsBrowserKey} onChange={googleMapsBrowserKey => update(current => ({ ...current, integrations: { ...current.integrations, googleMapsBrowserKey } }))} /><p className="rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-4 text-sm text-[var(--color-text-main)] md:col-span-2"><strong>Browser key:</strong> This key is delivered to visitors for Google address suggestions and current-location lookup. Restrict it in Google Cloud to <code>__BUSINESS_URL__/*</code> and <code>__BUSINESS_URL__/*</code>, and enable only Maps JavaScript API, Places API, and Geocoding API.</p><TextField label="Head HTML / tracking tags" className="md:col-span-2" value={config.integrations.headHtml} onChange={headHtml => update(current => ({ ...current, integrations: { ...current.integrations, headHtml } }))} /><TextField label="Body HTML / tracking tags" className="md:col-span-2" value={config.integrations.bodyHtml} onChange={bodyHtml => update(current => ({ ...current, integrations: { ...current.integrations, bodyHtml } }))} /></CardContent></Card>; }

function Webhooks({ config, update }: { config: SiteTemplateConfig; update: (recipe: (current: SiteTemplateConfig) => SiteTemplateConfig) => void }) { return <Card><CardHeader><CardTitle>Template webhooks</CardTitle><CardDescription>Existing New Age Zapier delivery remains managed in CRM Settings; these fields prepare the reusable template for a future client.</CardDescription></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><Field label="Lead capture webhook URL" placeholder="https://hooks.example.com/leads" value={config.webhooks.leadCaptureUrl} onChange={leadCaptureUrl => update(current => ({ ...current, webhooks: { ...current.webhooks, leadCaptureUrl } }))} /><Field label="CRM / automation webhook URL" placeholder="https://hooks.example.com/crm" value={config.webhooks.crmWebhookUrl} onChange={crmWebhookUrl => update(current => ({ ...current, webhooks: { ...current.webhooks, crmWebhookUrl } }))} /><p className="md:col-span-2 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-4 text-sm text-[var(--color-text-main)]"><Sparkles className="mr-2 inline h-4 w-4" />Webhook URLs are never exposed in public runtime configuration.</p></CardContent></Card>; }

function Field({ label, value, onChange, placeholder, className = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) { return <div className={className}><Label className="text-sm font-bold">{label}</Label><Input className="mt-2 min-h-11" value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} /></div>; }
function TextField({ label, value, onChange, placeholder, className = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) { return <div className={className}><Label className="text-sm font-bold">{label}</Label><Textarea className="mt-2 min-h-32 font-mono text-xs" value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} /></div>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div className="rounded-xl border bg-card p-3"><Label className="capitalize">{label}</Label><div className="mt-2 flex items-center gap-2"><input aria-label={`${label} color`} type="color" value={value} onChange={event => onChange(event.target.value)} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent p-0" /><Input value={value} onChange={event => onChange(event.target.value)} className="min-h-10 font-mono text-xs" /></div></div>; }

function SectionEditor({ section, index, onUpdate, onMove, onRemove }: { section: TemplateSection; index: number; onUpdate: (patch: Partial<TemplateSection>) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
  const items = section.items ?? [];
  const videoUrls = (section.videos ?? []).map(video => video.originalUrl).join("\n");
  const updateItem = (itemIndex: number, patch: Partial<TemplateItem>) => onUpdate({ items: items.map((item, currentIndex) => currentIndex === itemIndex ? { ...item, ...patch } : item) });
  return <Card className={!section.enabled ? "opacity-65" : ""}><CardHeader className="gap-3 border-b pb-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-lg">{index + 1}. {section.label}</CardTitle><CardDescription>{section.kind} section</CardDescription></div><div className="flex items-center gap-2"><Button size="icon" variant="outline" onClick={() => onMove(-1)} aria-label="Move section up"><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="outline" onClick={() => onMove(1)} aria-label="Move section down"><ArrowDown className="h-4 w-4" /></Button><Button size="icon" variant="outline" onClick={onRemove} aria-label="Remove section"><Trash2 className="h-4 w-4 text-destructive" /></Button><Switch checked={section.enabled} onCheckedChange={enabled => onUpdate({ enabled })} aria-label="Toggle section visibility" /></div></div></CardHeader><CardContent className="grid gap-4 pt-5 md:grid-cols-2"><Field label="Section label" value={section.label} onChange={label => onUpdate({ label })} /><div><Label className="text-sm font-bold">Section type</Label><select value={section.kind} onChange={event => onUpdate({ kind: event.target.value as TemplateSectionKind })} className="mt-2 min-h-11 w-full rounded-md border bg-background px-3 text-sm">{TEMPLATE_SECTION_KINDS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><Field label={section.kind === "hero" ? "Hero H1 title" : "Section headline"} className="md:col-span-2" value={section.title} onChange={title => onUpdate({ title })} /><TextField label={section.kind === "hero" ? "Hero subparagraph" : "Supporting paragraph"} className="md:col-span-2" value={section.body ?? ""} onChange={body => onUpdate({ body })} /><Field label="Eyebrow label" value={section.eyebrow ?? ""} onChange={eyebrow => onUpdate({ eyebrow })} /><Field label="Image URL (optional)" value={section.image ?? ""} onChange={image => onUpdate({ image })} />{(section.kind === "hero" || section.kind === "cta") && <><Field label="Primary CTA label" value={section.primaryCtaLabel ?? ""} onChange={primaryCtaLabel => onUpdate({ primaryCtaLabel })} /><Field label="Primary CTA URL" value={section.primaryCtaHref ?? ""} onChange={primaryCtaHref => onUpdate({ primaryCtaHref })} /></>}{section.kind === "social" && <TextField label="TikTok post URLs (one per line)" className="md:col-span-2" value={videoUrls} placeholder="https://www.tiktok.com/@account/video/123456789" onChange={value => onUpdate({ videos: parseTikTokVideos(value) })} />}{["featureGrid", "serviceGrid", "faq", "areaList"].includes(section.kind) && <div className="space-y-3 rounded-xl border bg-muted/20 p-4 md:col-span-2"><div className="flex items-center justify-between gap-3"><div><p className="font-bold">Repeatable items</p><p className="text-sm text-muted-foreground">Edit service cards, FAQs, area chips, or feature content.</p></div><Button type="button" size="sm" variant="outline" onClick={() => onUpdate({ items: [...items, { title: "New item", description: "Item description" }] })}><Plus className="mr-1 h-4 w-4" />Add item</Button></div>{items.map((item, itemIndex) => <div key={`${item.title}-${itemIndex}`} className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_1fr_auto]"><Field label="Item title" value={item.title} onChange={title => updateItem(itemIndex, { title })} /><Field label="Item description" value={item.description ?? ""} onChange={description => updateItem(itemIndex, { description })} /><Button type="button" size="icon" variant="ghost" className="self-end text-destructive" onClick={() => onUpdate({ items: items.filter((_, currentIndex) => currentIndex !== itemIndex) })} aria-label="Remove item"><Trash2 className="h-4 w-4" /></Button></div>)}</div>}</CardContent></Card>;
}
