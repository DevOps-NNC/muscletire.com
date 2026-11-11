import { ArchiveRestore, BarChart3, ClipboardList, FileText, LayoutDashboard, LayoutTemplate, MonitorUp, Settings, ShieldCheck, Target, Users } from "lucide-react";

export const crmMenuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Users, label: "Lead Pipeline", href: "/admin/leads" },
  { icon: Target, label: "Google Ads", href: "/admin/google-ads" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
  { icon: ArchiveRestore, label: "Lead Recovery", href: "/admin/leads/recovery" },
  { icon: FileText, label: "Quotes", href: "/admin/quotes" },
  { icon: ShieldCheck, label: "Team", href: "/admin/team" },
  { icon: ClipboardList, label: "Blog", href: "/admin/blog" },
  { icon: FileText, label: "Services", href: "/admin/services" },
  { icon: MonitorUp, label: "Page Editor", href: "/admin/page-editor" },
  { icon: LayoutTemplate, label: "Template Studio", href: "/admin/template" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];
