import { DashboardLayout } from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Users, BookOpen, FileText, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: Users, label: "Leads", href: "/admin/leads" },
  { icon: BookOpen, label: "Blog", href: "/admin/blog" },
  { icon: FileText, label: "Services", href: "/admin/services" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export default function AdminBlogManager() {
  const { data: articles, isLoading } = trpc.blog.listAll.useQuery();

  return (
    <DashboardLayout menuItems={menuItems} title="Blog Manager">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Blog Articles</h1>
          <Link href="/admin/blog/new">
            <Button className="gap-1"><Plus className="h-4 w-4" /> New Article</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Title</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-muted/30">
                    <td className="p-3 font-medium">{article.title}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        article.status === "published" ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" :
                        article.status === "scheduled" ? "bg-[var(--color-info-soft)] text-[var(--color-info)]" :
                        "bg-[var(--color-neutral-soft)] text-[var(--color-text-muted)]"
                      }`}>{article.status}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{article.status === "scheduled" && article.scheduledAt ? `Scheduled ${new Date(article.scheduledAt).toLocaleString()}` : new Date(article.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Link href={`/admin/blog/${article.id}`}>
                        <Button size="sm" variant="outline">Edit</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-border rounded-lg">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No articles yet.</p>
            <Link href="/admin/blog/new">
              <Button className="mt-4 gap-1"><Plus className="h-4 w-4" /> Create First Article</Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
