import { useState } from "react";
import { Check, Clipboard, Link2, Share2 } from "lucide-react";
import { buildBlogShareLinks } from "@shared/blogTracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ShareChannel = "twitter" | "newsletter";

export function BlogShareLinks({ baseUrl, slug }: { baseUrl: string; slug: string }) {
  const [links, setLinks] = useState<ReturnType<typeof buildBlogShareLinks> | null>(null);
  const [copied, setCopied] = useState<ShareChannel | null>(null);

  const generateLinks = () => {
    setCopied(null);
    setLinks(buildBlogShareLinks(baseUrl, slug));
  };

  const copyLink = async (channel: ShareChannel) => {
    const link = links?.[channel];
    if (!link || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(channel);
      window.setTimeout(() => setCopied(current => current === channel ? null : current), 1800);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-muted/20 p-5" aria-labelledby="share-links-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="share-links-heading" className="flex items-center gap-2 font-bold"><Share2 className="h-4 w-4 text-primary" />Generate Share Links</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create channel-specific URLs with clean GA4 campaign tags for this article.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={generateLinks}><Link2 className="h-4 w-4" />Generate Share Links</Button>
      </div>

      {links && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(["twitter", "newsletter"] as const).map(channel => (
            <div key={channel} className="space-y-2">
              <label htmlFor={`share-${channel}`} className="text-sm font-semibold">{channel === "twitter" ? "Twitter/X" : "Newsletter"}</label>
              <div className="flex gap-2">
                <Input id={`share-${channel}`} aria-label={`${channel === "twitter" ? "Twitter" : "Newsletter"} share link`} value={links[channel]} readOnly className="bg-background text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={() => void copyLink(channel)} aria-label={`Copy ${channel === "twitter" ? "Twitter" : "Newsletter"} share link`}>
                  {copied === channel ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Clipboard className="h-4 w-4" />}
                </Button>
              </div>
              {copied === channel && <p className="text-xs font-medium text-[var(--color-success)]">Copied</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default BlogShareLinks;
