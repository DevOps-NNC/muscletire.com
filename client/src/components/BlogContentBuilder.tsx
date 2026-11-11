import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  ImagePlus,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createContentBlock,
  createImageBlock,
  type BlogBlock,
  type BlogContentBlock,
  type BlogImageBlock,
} from "@shared/blogContent";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type BlogImageUploader = (file: File) => Promise<{ url: string; fileName: string }>;

type BlogContentBuilderProps = {
  blocks: BlogBlock[];
  onChange: (blocks: BlogBlock[]) => void;
  uploadImage: BlogImageUploader;
};

function updateBlock(blocks: BlogBlock[], id: string, update: Partial<BlogBlock>) {
  return blocks.map(block => (block.id === id ? { ...block, ...update } as BlogBlock : block));
}

function moveBlock(blocks: BlogBlock[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= blocks.length) return blocks;
  const next = [...blocks];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

function BlockControls({
  index,
  total,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" size="icon-sm" variant="ghost" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move block ${index + 1} up`}>
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move block ${index + 1} down`}>
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove} aria-label={`Remove block ${index + 1}`}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ContentBlockEditor({ block, onChange }: { block: BlogContentBlock; onChange: (update: Partial<BlogContentBlock>) => void }) {
  return (
    <div>
      <Label htmlFor={`content-${block.id}`}>Body text</Label>
      <Textarea id={`content-${block.id}`} value={block.body} onChange={event => onChange({ body: event.target.value })} placeholder="Write a section of your guide in Markdown..." rows={7} className="mt-2 font-mono text-sm" />
      <p className="mt-2 text-xs text-muted-foreground">Markdown headings, links, lists, and emphasis are supported.</p>
    </div>
  );
}

function ImageBlockEditor({ block, onChange, uploadImage }: { block: BlogImageBlock; onChange: (update: Partial<BlogImageBlock>) => void; uploadImage: BlogImageUploader }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setIsUploading(true);
    try {
      const uploaded = await uploadImage(file);
      onChange({ src: uploaded.url, fileName: uploaded.fileName });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={event => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
        onDragEnter={event => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={event => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={event => { event.preventDefault(); setIsDragging(false); void handleFile(event.dataTransfer.files?.[0]); }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-primary/50"}`}
        aria-label="Image drop zone"
      >
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" onChange={event => void handleFile(event.target.files?.[0])} />
        {block.src ? (
          <img src={block.src} alt={block.alt || "Uploaded blog image preview"} className="mx-auto max-h-56 rounded-lg object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isUploading ? <Upload className="h-8 w-8 animate-pulse text-primary" /> : <ImagePlus className="h-8 w-8 text-primary" />}
            <span className="font-semibold text-foreground">{isUploading ? "Uploading image..." : "Drop an image here or choose a file"}</span>
            <span className="text-xs">PNG, JPG, GIF, or WebP up to 8 MiB</span>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor={`image-alt-${block.id}`}>Alt text</Label>
          <Input id={`image-alt-${block.id}`} value={block.alt} onChange={event => onChange({ alt: event.target.value })} placeholder="Describe the image for visitors" className="mt-2" />
        </div>
        <div>
          <Label htmlFor={`image-placement-${block.id}`}>Image placement</Label>
          <Select value={block.placement} onValueChange={placement => onChange({ placement: placement as BlogImageBlock["placement"] })}>
            <SelectTrigger id={`image-placement-${block.id}`} aria-label="Image placement" className="mt-2 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="above">Display above Content Box</SelectItem>
              <SelectItem value="below">Display below Content Box</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function BlogBlockCard({ block, index, total, onChange, onMove, onRemove, uploadImage }: { block: BlogBlock; index: number; total: number; onChange: (update: Partial<BlogBlock>) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void; uploadImage: BlogImageUploader }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 text-sm font-bold">
          {block.type === "content" ? <FileText className="h-4 w-4 text-primary" /> : <ImagePlus className="h-4 w-4 text-primary" />}
          {block.type === "content" ? "Content Box" : "Image Drop Zone"}
        </div>
        <BlockControls index={index} total={total} onMove={onMove} onRemove={onRemove} />
      </div>
      {block.type === "content" ? <ContentBlockEditor block={block} onChange={onChange} /> : <ImageBlockEditor block={block} onChange={onChange} uploadImage={uploadImage} />}
    </article>
  );
}

export function BlogContentBuilder({ blocks, onChange, uploadImage }: BlogContentBuilderProps) {
  const appendBlock = (type: "content" | "image") => {
    onChange([...blocks, type === "content" ? createContentBlock() : createImageBlock()]);
  };

  return (
    <section aria-labelledby="content-builder-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="content-builder-heading" className="text-lg font-bold">Content blocks</h2>
          <p className="text-sm text-muted-foreground">Add only the sections you need, then arrange them in the order visitors should read.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="gap-2"><Plus className="h-4 w-4" />Add block</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => appendBlock("content")}><FileText className="h-4 w-4" />Content Box</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => appendBlock("image")}><ImagePlus className="h-4 w-4" />Image Drop Zone</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">No content blocks yet. Use Add block to start the article.</div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <BlogBlockCard
              key={block.id}
              block={block}
              index={index}
              total={blocks.length}
              onChange={update => onChange(updateBlock(blocks, block.id, update))}
              onMove={direction => onChange(moveBlock(blocks, index, direction))}
              onRemove={() => onChange(blocks.filter(current => current.id !== block.id))}
              uploadImage={uploadImage}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default BlogContentBuilder;
