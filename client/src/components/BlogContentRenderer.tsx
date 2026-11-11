import { lazy, Suspense } from "react";
import { orderBlogBlocksForRender, type BlogContentDocument } from "@shared/blogContent";
import { cn } from "@/lib/utils";

const Streamdown = lazy(() => import("streamdown").then(module => ({ default: module.Streamdown })));

export function BlogContentRenderer({
  document,
  className,
}: {
  document: BlogContentDocument;
  className?: string;
}) {
  const blocks = orderBlogBlocksForRender(document.blocks);

  return (
    <div className={cn("public-article-prose prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-a:text-primary prose-strong:text-foreground prose-li:marker:text-primary prose-p:leading-8", className)}>
      {blocks.map(block => {
        if (block.type === "content") {
          return (
            <Suspense key={block.id} fallback={<div className="h-10 animate-pulse rounded bg-muted" />}>
              <Streamdown>{block.body}</Streamdown>
            </Suspense>
          );
        }

        if (!block.src) return null;

        return (
          <figure key={block.id} className="my-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <img src={block.src} alt={block.alt} className="h-auto w-full object-cover" loading="lazy" />
            {block.alt && <figcaption className="px-4 py-3 text-sm text-muted-foreground">{block.alt}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

export default BlogContentRenderer;
