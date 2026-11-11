import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, BookOpen, FileText, Settings } from "lucide-react";

const menuItems = [
  { icon: Users, label: "Leads", href: "/admin/leads" },
  { icon: BookOpen, label: "Blog", href: "/admin/blog" },
  { icon: FileText, label: "Services", href: "/admin/services" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export default function AdminServicesManager() {
  return (
    <DashboardLayout menuItems={menuItems} title="Services Manager">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Services Management</h1>
        <p className="text-muted-foreground">Service management interface — manage your service pages, descriptions, and ordering from here.</p>
      </div>
    </DashboardLayout>
  );
}
