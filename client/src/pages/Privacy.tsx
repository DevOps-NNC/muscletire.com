import PublicLayout from "@/components/PublicLayout";
import { BUSINESS_CONFIG } from "@shared/config";

export default function Privacy() {
  return (
    <PublicLayout>
      <section className="py-12 md:py-16">
        <div className="container max-w-3xl prose prose-lg">
          <h1>Privacy Policy</h1>
          <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
          <p>{BUSINESS_CONFIG.name} ("we," "us," or "our") respects your privacy. This policy explains how we collect, use, and protect your personal information when you use our website and services.</p>
          
          <h2>Information We Collect</h2>
          <p>We collect information you provide directly, including:</p>
          <ul>
            <li>Name, phone number, and email address</li>
            <li>Vehicle information (year, make, model, VIN)</li>
            <li>Service location address</li>
            <li>Vehicle problem descriptions and photos</li>
            <li>Scheduling preferences</li>
            <li>When present, advertising click identifiers and campaign information such as Google Click IDs, Google braids, and UTM parameters</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Respond to service requests</li>
            <li>Schedule and perform vehicle repairs</li>
            <li>Communicate about your service</li>
            <li>Improve our services</li>
            <li>Measure whether advertising results in qualified or completed service leads, where permitted and consented</li>
          </ul>

          <h2>Advertising Measurement</h2>
          <p>We may retain advertising click identifiers and campaign context when they are included in a link to our website. If you choose the optional advertising-measurement checkbox in a service request, we may use limited first-party contact information with those identifiers to measure advertising outcomes through Google Ads. This optional choice does not affect your ability to request service. We do not sell your personal information.</p>

          <h2>Information Security</h2>
          <p>We protect your personal information using industry-standard security measures. Customer data including VINs, addresses, and uploaded files are stored securely and not publicly accessible.</p>

          <h2>Contact</h2>
          <p>Questions about this policy? Contact us at <a href={`mailto:${BUSINESS_CONFIG.email}`}>{BUSINESS_CONFIG.email}</a> or call <a href={`tel:${BUSINESS_CONFIG.phoneRaw}`}>{BUSINESS_CONFIG.phone}</a>.</p>
        </div>
      </section>
    </PublicLayout>
  );
}
