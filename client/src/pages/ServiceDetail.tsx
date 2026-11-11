import PublicLayout from "@/components/PublicLayout";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BUSINESS_CONFIG } from "@shared/config";
import { Phone, Wrench, MapPin, ChevronRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbJsonLd, FAQPageJsonLd, ServiceJsonLd } from "@/components/JsonLd";
import BlogEngagementSection from "@/components/BlogEngagementSection";

// Service content data - in production this would come from the database
const serviceData: Record<string, { title: string; description: string; symptoms: string[]; howItWorks: string[]; faqs: Array<{q: string; a: string}> }> = {
  "diagnostics": {
    title: "Vehicle Diagnostics",
    description: "Mobile diagnostic support at your location for warning lights, no-start concerns, and difficult-to-describe symptoms. The visit begins with the vehicle condition, available codes or data, and a clear discussion of the appropriate next step.",
    symptoms: ["Check engine light on", "Vehicle won't start", "Rough idle or misfires", "Poor fuel economy", "Unusual noises or vibrations", "Warning lights on dashboard"],
    howItWorks: ["Review the vehicle concern and location details", "Connect available diagnostic equipment and review stored codes when appropriate", "Consider live data and the vehicle's reported symptoms", "Explain the findings and the information needed for a repair decision", "Discuss whether an eligible next step can be completed on-site or needs another solution"],
    faqs: [{ q: "What happens during a mobile diagnostic visit?", a: "The technician reviews the concern, checks available vehicle information, and explains the recommended next step based on the condition found." }, { q: "Can every issue be repaired at my location?", a: "Many common repairs can be completed where the vehicle is parked safely. Some jobs may require a shop, additional parts, or a different next step." }],
  },
  "brake-service": {
    title: "Brake Service",
    description: "Mobile brake inspection and eligible brake service at an approved home, workplace, or accessible parking location. The vehicle condition and required parts are reviewed before a service plan is confirmed.",
    symptoms: ["Squealing or grinding when braking", "Brake pedal feels soft or spongy", "Vehicle pulls to one side when braking", "Brake warning light illuminated", "Longer stopping distances", "Vibration when braking"],
    howItWorks: ["Review the reported brake concern and vehicle details", "Inspect relevant brake components when the location and service are appropriate", "Discuss observed condition and the information needed for a repair decision", "Confirm the approved work scope and parts before work begins", "Review the completed work and next-step information with the customer"],
    faqs: [{ q: "How long does a brake visit take?", a: "Timing depends on the vehicle, the brake condition, and the parts required. The technician can discuss the expected work after an inspection." }, { q: "What is checked during a brake inspection?", a: "Brake components, pad and rotor condition, and the reported symptoms are reviewed before the recommended next step is discussed." }],
  },
  "battery-replacement": {
    title: "Battery & Electrical Service",
    description: "Battery testing, eligible replacement, and charging-system checks at an approved location. A no-start or electrical concern is reviewed with the vehicle condition and service location in mind.",
    symptoms: ["Car won't start or slow cranking", "Dim headlights or interior lights", "Battery warning light on", "Electrical accessories not working", "Clicking sound when turning key", "Battery is more than 3-4 years old"],
    howItWorks: ["Review the no-start or electrical symptom", "Check the battery and relevant charging-system information when appropriate", "Inspect accessible cables, terminals, and connections", "Explain the findings and available next step", "Discuss eligible replacement or repair options before work is confirmed"],
    faqs: [{ q: "How long does a battery replacement take?", a: "Timing depends on the vehicle, battery access, the condition found, and whether the correct battery is available. The team can discuss an expected next step after reviewing the request." }, { q: "Do you carry batteries with you?", a: "Availability depends on the vehicle and battery specification. Share the year, make, model, and no-start details so the team can discuss the appropriate option." }],
  },
  "oil-change": {
    title: "Oil Changes",
    description: "Convenient mobile oil change service at an approved home, workplace, or accessible parking location. The vehicle specification and maintenance need are reviewed before service is confirmed.",
    symptoms: ["Oil change reminder light on", "Dark or dirty oil on dipstick", "Engine running louder than normal", "Over mileage since last oil change", "Oil level low"],
    howItWorks: ["Review the vehicle's oil specification and maintenance information", "Confirm the appropriate oil and filter details", "Perform the eligible oil and filter service at a safe, accessible location", "Check the service area and fluid level as appropriate", "Discuss the completed work and maintenance information"],
    faqs: [{ q: "How long does an oil change take?", a: "Timing depends on the vehicle, access, oil specification, and service scope. The team can discuss the expected timing after reviewing the request." }, { q: "Can you discuss synthetic oil options?", a: "Share the vehicle year, make, model, and maintenance need. The team can discuss the oil specification and available service options." }],
  },
  "tune-up": {
    title: "Tune-Ups & Maintenance",
    description: "Mobile maintenance support for eligible spark-plug, filter, and scheduled-service needs at an approved location. The work scope is based on the vehicle specification and condition.",
    symptoms: ["Reduced fuel economy", "Rough idle", "Difficulty starting", "Engine misfires", "Sluggish acceleration", "Due for scheduled maintenance"],
    howItWorks: ["Review the vehicle's maintenance history and stated need", "Discuss the relevant manufacturer guidance and vehicle condition", "Confirm eligible maintenance items and parts", "Perform the agreed service at a safe, accessible location", "Review the completed work and next maintenance considerations"],
    faqs: [{ q: "How often should I get a tune-up?", a: "Maintenance timing varies by vehicle, mileage, driving conditions, and manufacturer guidance. Share the vehicle details and service history so the team can discuss the appropriate next step." }],
  },
  "pre-purchase-inspections": {
    title: "Pre-Purchase Vehicle Inspections",
    description: "Buying a used vehicle? A pre-purchase inspection can help you better understand visible condition, diagnostic information, and questions to consider before making a decision.",
    symptoms: [],
    howItWorks: ["Review the vehicle and seller-location details", "Discuss whether the location and timing are appropriate for mobile inspection", "Inspect accessible vehicle systems and visible condition", "Review available diagnostic information when appropriate", "Explain the observed findings and questions to consider before purchase"],
    faqs: [{ q: "Can you inspect a car at a dealership?", a: "Yes, we can perform inspections at dealerships, private sellers' locations, or anywhere the vehicle is available." }, { q: "What does the inspection cover?", a: "We check mechanical systems, electrical components, body condition, fluid levels, tire condition, brake wear, and scan for diagnostic codes." }],
  },
  "cooling-system": {
    title: "Cooling System & Radiator Service",
    description: "Cooling-system and overheating diagnostic support for a safely parked vehicle. The team reviews symptoms and location details to discuss whether an eligible mobile next step is appropriate.",
    symptoms: ["Temperature gauge running hot", "Coolant leaking under vehicle", "Steam from under the hood", "Sweet smell from engine area", "Heater not working", "Coolant level dropping"],
    howItWorks: ["Review the overheating or coolant-loss symptom", "Inspect accessible cooling-system components when appropriate", "Discuss the condition observed and any safety concerns", "Confirm the appropriate repair or service next step", "Review whether eligible work can be completed at the current location"],
    faqs: [{ q: "Is it safe to drive with an overheating engine?", a: "No. Driving while overheating can cause severe engine damage. Pull over safely and call us." }],
  },
  "electrical-repair": {
    title: "Electrical System Repair",
    description: "Mobile electrical troubleshooting for eligible warning lights, wiring, fuse, sensor, and accessory concerns at an approved location.",
    symptoms: ["Lights flickering or not working", "Power windows or locks not functioning", "Blown fuses", "Parasitic battery drain", "Sensors triggering warning lights", "Wiring damage"],
    howItWorks: ["Review the electrical symptom and vehicle details", "Use appropriate diagnostic information to narrow the concern", "Inspect accessible circuits, fuses, connectors, or components", "Discuss the findings and the next available option", "Confirm the work scope before eligible repair is performed"],
    faqs: [{ q: "Can you help with wiring problems?", a: "Some accessible wiring, connector, and electrical concerns may be appropriate for mobile service. The vehicle, location, and scope need to be reviewed first." }],
  },
  "belt-replacement": {
    title: "Belt & Hose Replacement",
    description: "Mobile inspection and eligible replacement support for worn belts and hoses at an approved location. The vehicle specification, access, and condition are reviewed before work is confirmed.",
    symptoms: ["Squealing noise from engine", "Visible cracks in belt", "Power steering feels heavy", "AC not blowing cold", "Coolant hose leaking", "Belt slipping"],
    howItWorks: ["Review the reported symptom and vehicle details", "Inspect accessible belts, hoses, and related components", "Discuss visible condition and relevant manufacturer guidance", "Confirm the approved replacement scope and parts", "Review the completed work and next-step information"],
    faqs: [{ q: "How often should belts be replaced?", a: "Inspection and replacement needs vary by vehicle, belt type, mileage, condition, and manufacturer guidance. The team can discuss the appropriate next step after reviewing the vehicle." }],
  },
  "ac-repair": {
    title: "AC Repair & Recharge",
    description: "Mobile A/C diagnostic support and eligible service for Florida drivers dealing with warm air, weak airflow, unusual noise, or inconsistent cooling.",
    symptoms: ["AC blowing warm air", "Weak airflow from vents", "Strange smell from AC", "AC making unusual noises", "AC only cold sometimes", "Moisture buildup on windshield"],
    howItWorks: ["Review the A/C symptom and vehicle details", "Check accessible A/C-system information when appropriate", "Discuss findings, safety considerations, and possible causes", "Confirm the appropriate eligible service scope", "Review whether the work can be completed at the current location"],
    faqs: [{ q: "Can A/C work be completed at my location?", a: "Some A/C diagnostic and repair work may be appropriate for mobile service. The vehicle, work scope, equipment needs, and location are reviewed before work is confirmed." }],
  },
};

export default function ServiceDetail() {
  const [, params] = useRoute("/services/:slug");
  const slug = params?.slug || "";
  const service = serviceData[slug];

  if (!service) {
    return (
      <PublicLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <p className="text-muted-foreground mb-6">The service you're looking for doesn't exist.</p>
          <Link href="/services"><Button>View All Services</Button></Link>
        </div>
      </PublicLayout>
    );
  }
  const servicePath = `/services/${slug}`;
  const relatedServices = Object.entries(serviceData).filter(([relatedSlug]) => relatedSlug !== slug).slice(0, 4);

  return (
    <PublicLayout>
      <SEOHead title={`${service.title} in __CITY__, FL | __BUSINESS_NAME__`} description={`${service.description} Serving __CITY__ and the approved __REGION__ service area.`} canonical={`${BUSINESS_CONFIG.website}${servicePath}`} />
      <ServiceJsonLd name={service.title} description={service.description} url={servicePath} />
      <FAQPageJsonLd faqs={service.faqs.map(faq => ({ question: faq.q, answer: faq.a }))} />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Services", url: "/services" }, { name: service.title, url: servicePath }]} />
      {/* Breadcrumb */}
      <div className="public-subnav border-b">
        <div className="container py-3">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/services" className="hover:text-foreground">Services</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{service.title}</span>
          </nav>
        </div>
      </div>

      <section className="public-page--ink py-12 md:py-16">
        <div className="container max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{service.title} in __CITY__</h1>
          <p className="text-lg text-muted-foreground mb-8">{service.description}</p>

          {service.symptoms.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">Common Symptoms</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {service.symptoms.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <ol className="space-y-3">
              {service.howItWorks.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Service Area</h2>
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p>This service is available throughout {BUSINESS_CONFIG.serviceArea.description}. We come to your home, workplace, or roadside location.</p>
            </div>
          </div>

          <div className="public-paper-card mb-10 rounded-2xl border p-6">
            <h2 className="text-2xl font-bold">Related mobile services</h2>
            <p className="mt-2 text-muted-foreground">Explore other common mobile-mechanic requests, or start a request if you are not sure which service fits the issue.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {relatedServices.map(([relatedSlug, related]) => <Link key={relatedSlug} href={`/services/${relatedSlug}`} className="rounded-lg border border-border px-4 py-3 font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/5">{related.title} <span aria-hidden="true">→</span></Link>)}
            </div>
          </div>

          {service.faqs.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {service.faqs.map((faq, i) => (
                  <div key={i} className="border border-border rounded-lg p-5">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="public-ink-callout rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold mb-3">Need {service.title}?</h2>
            <p className="text-muted-foreground mb-6">Request mobile service and we'll come to your location in __CITY__ and __REGION__.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={`tel:${BUSINESS_CONFIG.phoneRaw}`}>
                <Button size="lg" className="gap-2">
                  <Phone className="h-5 w-5" />
                  Call {BUSINESS_CONFIG.phone}
                </Button>
              </a>
              <Link href="/request-service">
                <Button size="lg" variant="outline" className="gap-2">
                  <Wrench className="h-5 w-5" />
                  Request This Service
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <BlogEngagementSection
        title={`More answers for ${service.title}`}
        description="Explore practical vehicle guides before you choose the next step for your car."
      />
    </PublicLayout>
  );
}
