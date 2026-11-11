import PublicLayout from "@/components/PublicLayout";
import { CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_CONFIG } from "@shared/config";
import { Link } from "wouter";

export default function RequestConfirmation() {
  return (
    <PublicLayout>
      <section className="py-16 md:py-24">
        <div className="container max-w-2xl text-center">
          <CheckCircle2 className="h-16 w-16 text-[var(--color-success)] mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Service Request Submitted</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your request. This is not a confirmed appointment — __OWNER_NAME__ will review your 
            information and contact you shortly to discuss your vehicle's needs and schedule service.
          </p>
          <div className="bg-secondary/50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold mb-3">What happens next:</h2>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>We review your service request details</li>
              <li>__OWNER_NAME__ contacts you to discuss the issue and confirm availability</li>
              <li>We schedule a time that works for you</li>
              <li>We arrive at your location to diagnose and repair your vehicle</li>
            </ol>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Need immediate help? Call us directly:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={`tel:${BUSINESS_CONFIG.phoneRaw}`}>
              <Button size="lg" className="gap-2">
                <Phone className="h-5 w-5" />
                Call {BUSINESS_CONFIG.phone}
              </Button>
            </a>
            <Link href="/">
              <Button size="lg" variant="outline">Return Home</Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

