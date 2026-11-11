import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSiteTemplate } from "@/template/TemplateRuntime";
import { Phone, Menu, X, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLOG_INDEX_HREF } from "@shared/blogTracking";

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const config = useSiteTemplate();
  const locationPath = location.split("?")[0];
  const navItems = [
    { label: config.pages.find(page => page.id === "services")?.label ?? "Services", href: "/services" },
    { label: config.pages.find(page => page.id === "areas")?.label ?? "Service Areas", href: "/service-areas" },
    { label: config.pages.find(page => page.id === "about")?.label ?? "About", href: "/about" },
    { label: "Reviews", href: "/reviews" },
    { label: "Blog", href: BLOG_INDEX_HREF },
    { label: config.pages.find(page => page.id === "contact")?.label ?? "Contact", href: "/contact" },
  ];

  return (
    <header className="site-header sticky top-0 z-50">
      {/* Top bar - contact info */}
      <div className="site-header__topbar hidden md:block">
        <div className="container flex items-center justify-between py-2 text-sm">
          <span className="font-medium">Mobile service in {config.brand.city} and approved surrounding communities</span>
          <div className="flex items-center gap-4">
            <a href={`tel:${config.brand.phoneRaw}`} className="flex items-center gap-1 hover:underline">
              <Phone className="h-3.5 w-3.5" />
              {config.brand.phone}
            </a>
            <a href={`sms:${config.brand.phoneRaw}`} className="flex items-center gap-1 hover:underline">
              <MessageCircle className="h-3.5 w-3.5" />
              Text Us
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container flex h-[5.5rem] items-center justify-between">
        <Link href="/" className="site-header__brand flex min-w-0 items-center gap-3 font-bold text-lg" aria-label="__BUSINESS_NAME__ home">
          <img
            src={config.brand.logoUrl}
            alt={config.brand.shortName}
            width={112}
            height={112}
            fetchPriority="high"
            decoding="async"
            className="h-14 w-14 shrink-0 object-contain sm:h-[4.25rem] sm:w-[4.25rem]"
          />
          <span className="hidden min-[420px]:inline leading-tight tracking-tight">{config.brand.shortName}<br /><span className="text-sm font-semibold text-muted-foreground">Mobile Mechanic</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="site-header__nav hidden lg:flex items-center gap-1" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`site-header__nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                locationPath.startsWith(item.href.split("?")[0])
                  ? "bg-primary/10"
                  : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/request-service" className="site-header__cta hidden sm:inline-flex">
            <Button size="sm" className="gap-1.5 shadow-sm">
              Get an Estimate <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <a href={`tel:${config.brand.phoneRaw}`} className="site-header__phone lg:hidden" aria-label={`Call ${config.brand.phone}`}>
            <Button size="sm" variant="outline" className="gap-1 border-primary/30 text-primary hover:bg-primary/5">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Call Now</span>
            </Button>
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="site-header__menu-toggle lg:hidden p-2 rounded-md"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="site-header__mobile-menu lg:hidden">
          <nav id="mobile-navigation-menu" className="site-header__mobile-nav container py-4 flex flex-col gap-1" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`site-header__mobile-nav-link px-4 py-3 rounded-md text-base font-medium ${
                  locationPath.startsWith(item.href.split("?")[0])
                    ? "bg-primary/10"
                    : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/request-service" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full mt-2 gap-2">Get an Estimate <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
