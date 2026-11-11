import { useRoute, Link } from "wouter";
import PublicLayout from "@/components/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { BUSINESS_CONFIG } from "@shared/config";
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/JsonLd";
import siteConfig from "../../../client.config.json";
export default function ServiceAreaDetail() {
  const [, params] = useRoute("/service-areas/:slug");
  const area = siteConfig.serviceAreas.find(item => item.slug === params?.slug);
  if (!area) return <PublicLayout><section className="container py-16"><h1>Area not found</h1><Link href="/service-areas">See our service areas</Link></section></PublicLayout>;
  const canonical = BUSINESS_CONFIG.website + "/service-areas/" + area.slug;
  return <PublicLayout>
    <SEOHead title={"Mobile mechanic in " + area.name + " | " + BUSINESS_CONFIG.shortName} description={area.description} canonical={canonical}/>
    <BreadcrumbJsonLd items={[{name:"Home",url:"/"},{name:"Service areas",url:"/service-areas"},{name:area.name,url:"/service-areas/"+area.slug}]}/>
    <ServiceJsonLd name={"Mobile mechanic services in "+area.name} description={area.description} url={"/service-areas/"+area.slug}/>
    <section className="container py-16"><p className="text-sm font-semibold uppercase text-primary">Service locations</p>
      <h1 className="mt-2 text-3xl font-bold">Mobile mechanic in {area.name}, {siteConfig.business.stateCode}</h1>
      <p className="mt-5 max-w-2xl text-lg">{area.description}</p>
      <p className="mt-5">Request service with your vehicle details and a safely accessible location. Availability and the appropriate next step are confirmed individually.</p>
      <div className="mt-8 flex flex-wrap gap-5"><Link href="/request-service" className="underline">Request service</Link><a href={"tel:"+BUSINESS_CONFIG.phoneRaw} className="underline">Call {BUSINESS_CONFIG.phone}</a></div>
    </section>
  </PublicLayout>;
}
