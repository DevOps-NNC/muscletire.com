import PublicLayout from "@/components/PublicLayout";
import { BUSINESS_CONFIG } from "@shared/config";

export default function Terms() {
  return (
    <PublicLayout>
      <section className="py-12 md:py-16">
        <div className="container max-w-3xl prose prose-lg">
          <h1>Terms and Conditions</h1>
          <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
          <p>These terms govern your use of the {BUSINESS_CONFIG.name} website and services.</p>

          <h2>Service Requests</h2>
          <p>Submitting a service request through our website is a request for service, not a confirmed appointment. We will contact you to confirm availability, pricing, and scheduling.</p>

          <h2>Estimates and Pricing</h2>
          <p>All estimates are provided after diagnosis. Final pricing may vary based on actual conditions found during inspection. We will always communicate any changes before proceeding with additional work.</p>

          <h2>Warranty</h2>
          <p>Parts and labor warranty terms are provided at the time of service. Warranty coverage varies by service type and parts used.</p>

          <h2>Limitation of Liability</h2>
          <p>Our liability is limited to the cost of services performed. We are not responsible for pre-existing conditions or issues unrelated to our work.</p>

          <h2>Contact</h2>
          <p>Questions? Contact us at <a href={`mailto:${BUSINESS_CONFIG.email}`}>{BUSINESS_CONFIG.email}</a> or call <a href={`tel:${BUSINESS_CONFIG.phoneRaw}`}>{BUSINESS_CONFIG.phone}</a>.</p>
        </div>
      </section>
    </PublicLayout>
  );
}
