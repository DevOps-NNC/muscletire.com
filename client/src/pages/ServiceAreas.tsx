import PublicLayout from "@/components/PublicLayout";
import { Link } from "wouter";
import { useSiteTemplate } from "@/template/TemplateRuntime";
import siteConfig from "../../../client.config.json";
export default function ServiceAreas() {
  const template = useSiteTemplate();
  const state = siteConfig.business.stateCode;
  return <PublicLayout><section className="container py-14">
    <h1 className="text-3xl font-bold">Mobile mechanic service areas</h1>
    <p className="mt-3 text-muted-foreground">Availability depends on vehicle needs and safe site access. Contact us to confirm your location.</p>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {siteConfig.serviceAreas.map(area => <Link key={area.slug} href={"/service-areas/" + area.slug} className="rounded-xl border p-5 hover:border-primary">
        <h2 className="text-xl font-bold">{area.name}, {state}</h2><p className="mt-2">{area.description}</p>
      </Link>)}
    </div>
    <p className="mt-8"><a href={"tel:" + template.brand.phoneRaw} className="underline">Call {template.brand.phone} to check availability</a></p>
  </section></PublicLayout>;
}
