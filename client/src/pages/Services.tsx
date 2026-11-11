import PublicLayout from "@/components/PublicLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSiteTemplate } from "@/template/TemplateRuntime";
import {
  Gauge, Shield, Battery, Car, Wrench, CheckCircle2,
  Thermometer, Zap, Phone
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import type { TemplateItem } from "@shared/siteTemplate";

const allServices = [
  { title: "Vehicle Diagnostics", slug: "diagnostics", icon: Gauge, description: "Complete computer diagnostics, check engine light diagnosis, and no-start troubleshooting." },
  { title: "Brake Service", slug: "brake-service", icon: Shield, description: "Brake pad and rotor replacement, brake fluid flush, and complete brake system inspection." },
  { title: "Battery & Electrical", slug: "battery-replacement", icon: Battery, description: "Battery testing and replacement, alternator testing, starter diagnosis, and electrical system repair." },
  { title: "Oil Changes", slug: "oil-change", icon: Car, description: "Conventional and synthetic oil changes with filter replacement at your location." },
  { title: "Tune-Ups & Maintenance", slug: "tune-up", icon: Wrench, description: "Spark plugs, air filters, fuel filters, belts, and scheduled maintenance services." },
  { title: "Pre-Purchase Inspections", slug: "pre-purchase-inspections", icon: CheckCircle2, description: "Comprehensive vehicle inspection before buying a used car." },
  { title: "Cooling System & Radiator", slug: "cooling-system", icon: Thermometer, description: "Radiator repair, coolant flush, thermostat replacement, and overheating diagnosis." },
  { title: "Electrical System Repair", slug: "electrical-repair", icon: Zap, description: "Wiring repair, fuse diagnosis, lighting issues, and electrical component replacement." },
  { title: "Belt & Hose Replacement", slug: "belt-replacement", icon: Wrench, description: "Serpentine belt, timing belt, and coolant hose replacement." },
  { title: "AC Repair & Recharge", slug: "ac-repair", icon: Thermometer, description: "Air conditioning diagnosis, refrigerant recharge, and AC component repair." },
];

export default function Services() {
  const config = useSiteTemplate();
  const templatePage = config.pages.find(page => page.id === "services");
  const hero = templatePage?.sections.find(section => section.kind === "hero");
  const catalog = templatePage?.sections.find(section => section.id === "service-catalog");
  const serviceIconMap = { gauge: Gauge, shield: Shield, battery: Battery, car: Car, wrench: Wrench, check: CheckCircle2, thermometer: Thermometer, zap: Zap };
  const editableServices: Array<TemplateItem & { icon?: string }> = catalog?.items?.length ? catalog.items : allServices.map(service => ({ ...service, icon: "wrench", href: `/services/${service.slug}` }));
  return (
    <PublicLayout>
      <SEOHead
        title={templatePage?.seoTitle ?? "Mobile Mechanic Services"}
        description={templatePage?.seoDescription ?? "Mobile auto repair services at your location."}
        canonical="__BUSINESS_URL__/services"
      />
      <section className="public-page--ink py-12 md:py-16">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <p className="text-sm font-black uppercase tracking-[.18em] text-primary">{hero?.eyebrow}</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold mb-4">{hero?.title ?? "Mobile Mechanic Services"}</h1>
            <p className="text-lg text-muted-foreground">
              {hero?.body ?? "Professional auto repair and maintenance at your location."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {editableServices.map((service, index) => {
              const Icon = serviceIconMap[service.icon as keyof typeof serviceIconMap] ?? Wrench;
              return <Link key={`${service.title}-${index}`} href={service.href ?? "/request-service"}>
                <div className="public-paper-card flex h-full flex-col rounded-lg border p-6 transition-all hover:border-primary/50 hover:shadow-lg">
                  <Icon className="h-8 w-8 text-primary mb-4" />
                  <h2 className="font-semibold text-lg mb-2">{service.title}</h2>
                  <p className="text-sm text-muted-foreground flex-1">{service.description}</p>
                  <span className="text-primary text-sm font-medium mt-4 inline-block">Learn more →</span>
                </div>
              </Link>;
            })}
          </div>

          <div className="public-ink-callout mt-12 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Don't See Your Service Listed?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              We handle many additional repairs. Call or text to describe your vehicle's issue and we'll let you know if we can help.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={`tel:${config.brand.phoneRaw}`}>
                <Button size="lg" className="gap-2">
                  <Phone className="h-5 w-5" />
                  Call {config.brand.phone}
                </Button>
              </a>
              <Link href="/request-service">
                <Button size="lg" variant="outline">Request Service</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
