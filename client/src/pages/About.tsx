import PublicLayout from "@/components/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { TemplatePageRenderer } from "@/components/template/TemplatePage";
import { useSiteTemplate } from "@/template/TemplateRuntime";

export default function About() {
  const config = useSiteTemplate();
  const page = config.pages.find(item => item.id === "about");
  if (!page) return null;
  return <PublicLayout><SEOHead title={page.seoTitle} description={page.seoDescription} canonical="__BUSINESS_URL__/about" /><TemplatePageRenderer page={page} /></PublicLayout>;
}
