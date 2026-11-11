import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import MobileCTA from "./MobileCTA";
import BlogEngagementSection, { shouldShowGlobalBlogEngagement } from "./BlogEngagementSection";
import { GoogleReviewsStrip } from "./GoogleReviewsStrip";
import { WebSiteJsonLd } from "./JsonLd";
import { ConversionTracking } from "./ConversionTracking";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { captureLeadAttributionFromCurrentPage } from "@/lib/leadAttribution";
import SalesTacticsCta from "./SalesTacticsCta";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [location] = useLocation();
  const hasDedicatedReviewPlacement = location === "/" || location === "/request-service";
  const showGlobalBlogEngagement = shouldShowGlobalBlogEngagement(location);
  useEffect(() => { captureLeadAttributionFromCurrentPage(); }, [location]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);
  return (
    <div className="public-site min-h-screen flex flex-col">
      <WebSiteJsonLd />
      <ConversionTracking />
      <SiteHeader />
      <main className="public-site__main flex-1 pb-16 lg:pb-0">
        {children}
        {showGlobalBlogEngagement && <BlogEngagementSection compact />}
        {!hasDedicatedReviewPlacement && <GoogleReviewsStrip compact />}
      </main>
      {location.split("?")[0] !== "/request-service" && <SalesTacticsCta />}
      <SiteFooter />
      <MobileCTA />
    </div>
  );
}
