import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, FileText, Settings } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { BlogContentBuilder } from "@/components/BlogContentBuilder";
import BlogContentRenderer from "@/components/BlogContentRenderer";
import BlogShareLinks from "@/components/BlogShareLinks";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { parseBlogContent, serializeBlogContent, type BlogBlock } from "@shared/blogContent";
import { parseBlogTags, slugifyBlogTitle } from "@shared/blogTracking";
import { BUSINESS_CONFIG } from "@shared/config";
import { toast } from "sonner";

const menuItems = [
  { icon: BookOpen, label: "Blog", href: "/admin/blog" },
  { icon: FileText, label: "Services", href: "/admin/services" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

type ArticleStatus = "draft" | "published" | "scheduled";

function formatDateTimeLocal(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the selected image."));
    });
    reader.addEventListener("error", () => reject(new Error("Could not read the selected image.")));
    reader.readAsDataURL(file);
  });
}

export default function AdminBlogEditor() {
  const [, params] = useRoute("/admin/blog/:id");
  const isNew = params?.id === "new";
  const id = isNew ? undefined : Number(params?.id);
  const [, navigate] = useLocation();

  const { data: existing } = trpc.blog.getById.useQuery({ id: id! }, { enabled: !!id });
  const createMutation = trpc.blog.create.useMutation();
  const updateMutation = trpc.blog.update.useMutation();
  const uploadImageMutation = trpc.blog.uploadImage.useMutation();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [contentBlocks, setContentBlocks] = useState<BlogBlock[]>([]);
  const [category, setCategory] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [status, setStatus] = useState<ArticleStatus>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [activePanel, setActivePanel] = useState<"editor" | "preview">("editor");

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setSlug(existing.slug);
    setExcerpt(existing.excerpt || "");
    setTags(existing.tags?.join(", ") || "");
    setContentBlocks(parseBlogContent(existing.content).blocks);
    setCategory(existing.category || "");
    setMetaTitle(existing.metaTitle || "");
    setMetaDescription(existing.metaDescription || "");
    setStatus(existing.status === "published" || existing.status === "scheduled" ? existing.status : "draft");
    setScheduledAt(existing.scheduledAt ? formatDateTimeLocal(existing.scheduledAt) : "");
  }, [existing]);

  const effectiveSlug = slug.trim() || slugifyBlogTitle(title) || "new-article";
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    const data = {
      title: title.trim(),
      slug: effectiveSlug,
      excerpt: excerpt.trim(),
      content: serializeBlogContent({ version: 1, blocks: contentBlocks }),
      category: category.trim(),
      tags: parseBlogTags(tags),
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      status,
      scheduledAt: status === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    };

    try {
      if (id) {
        await updateMutation.mutateAsync({ id, ...data });
        toast.success("Article updated");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Article created");
        navigate("/admin/blog");
      }
    } catch {
      toast.error("Failed to save article");
    }
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("Choose a PNG, JPG, GIF, or WebP image.");
    const data = await readFileAsDataUrl(file);
    try {
      return await uploadImageMutation.mutateAsync({ fileName: file.name, contentType: file.type, data });
    } catch {
      toast.error("Image upload failed");
      throw new Error("Image upload failed. Try again.");
    }
  };

  const preview = (
    <div className="rounded-2xl border border-border bg-muted/20 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Live pre-render</p>
          <p className="mt-1 text-sm text-muted-foreground">This is the article surface visitors will read.</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Unsaved preview</span>
      </div>
      <article className="rounded-xl border border-border bg-background p-5 shadow-sm md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{category || "Vehicle care"}</p>
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight">{title || "Your article title"}</h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{excerpt || "Your article description will appear here."}</p>
        <BlogContentRenderer document={{ version: 1, blocks: contentBlocks }} className="mt-7" />
      </article>
    </div>
  );

  return (
    <DashboardLayout menuItems={menuItems} title={isNew ? "New Article" : "Edit Article"}>
      <div className="mx-auto w-full max-w-[1500px] p-2 sm:p-4 lg:p-6">
        <Link href="/admin/blog" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">{isNew ? "New Article" : "Edit Article"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Build a practical guide from reusable content blocks.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/blog"><Button type="button" variant="outline">Cancel</Button></Link>
            <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>{isSaving ? "Saving..." : "Save Article"}</Button>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7" aria-labelledby="article-metadata-heading">
          <div className="border-b border-border pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Section A</p>
            <h2 id="article-metadata-heading" className="mt-1 text-xl font-bold">Article metadata</h2>
            <p className="mt-1 text-sm text-muted-foreground">Set the public title, URL, description, and discoverability details before composing the article.</p>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="article-title">Title</Label>
              <Input id="article-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Article title" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="article-slug">Slug</Label>
              <Input id="article-slug" value={slug} onChange={event => setSlug(event.target.value)} placeholder={slugifyBlogTitle(title) || "auto-generated-from-title"} className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">Public URL: /blog/{effectiveSlug}</p>
            </div>
            <div>
              <Label htmlFor="article-tags">Tags</Label>
              <Input id="article-tags" value={tags} onChange={event => setTags(event.target.value)} placeholder="battery, diagnostics, safety" className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">Separate tags with commas.</p>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="article-description">Description</Label>
              <Textarea id="article-description" value={excerpt} onChange={event => setExcerpt(event.target.value)} placeholder="Brief summary for the blog index and article header..." rows={3} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="article-category">Category</Label>
              <Input id="article-category" value={category} onChange={event => setCategory(event.target.value)} placeholder="Diagnostics" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="article-status">Status</Label>
              <select id="article-status" value={status} onChange={event => setStatus(event.target.value as ArticleStatus)} className="mt-2 min-h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            {status === "scheduled" && <div>
              <Label htmlFor="article-scheduled-at">Publish date and time</Label>
              <Input id="article-scheduled-at" type="datetime-local" value={scheduledAt} min={formatDateTimeLocal(new Date())} onChange={event => setScheduledAt(event.target.value)} className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">Use your local time. The scheduler publishes due articles within five minutes.</p>
            </div>}
            <div>
              <Label htmlFor="article-meta-title">Meta title</Label>
              <Input id="article-meta-title" value={metaTitle} onChange={event => setMetaTitle(event.target.value)} placeholder="Optional SEO title" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="article-meta-description">Meta description</Label>
              <Textarea id="article-meta-description" value={metaDescription} onChange={event => setMetaDescription(event.target.value)} placeholder="Optional SEO description" rows={2} className="mt-2" />
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-6">
            <BlogShareLinks baseUrl={BUSINESS_CONFIG.website} slug={effectiveSlug} />
          </div>
        </section>

        <div className="mt-6 flex gap-2 lg:hidden" role="tablist" aria-label="Article editor panels">
          <Button type="button" variant={activePanel === "editor" ? "default" : "outline"} onClick={() => setActivePanel("editor")} role="tab" aria-selected={activePanel === "editor"}>Editor</Button>
          <Button type="button" variant={activePanel === "preview" ? "default" : "outline"} onClick={() => setActivePanel("preview")} role="tab" aria-selected={activePanel === "preview"}>Pre-render</Button>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7" aria-labelledby="content-builder-section-heading">
          <div className="border-b border-border pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Section B</p>
            <h2 id="content-builder-section-heading" className="mt-1 text-xl font-bold">Dynamic content builder</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every block is optional. Add, rearrange, preview, and remove sections without changing your metadata.</p>
          </div>
          <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)] lg:items-start lg:gap-8">
            <div className={activePanel === "editor" ? "block" : "hidden lg:block"}>
              <BlogContentBuilder blocks={contentBlocks} onChange={setContentBlocks} uploadImage={uploadImage} />
            </div>
            <div className={activePanel === "preview" ? "block" : "hidden lg:block"}>{preview}</div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
