import { Link } from "wouter";
import { BUSINESS_CONFIG } from "@shared/config";
import { BLOG_INDEX_HREF } from "@shared/blogTracking";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

const DESIGNER_CONTACT_HREF = "https://www.innovate360marketing.com/";

const footerLinkClassName = "footer-link inline-flex items-center transition-colors";
const footerSectionClassName = "footer-section-label mb-5 text-xs font-black uppercase tracking-[0.18em]";

export default function SiteFooter() {
  return (
    <footer className="theme-site-footer text-[var(--color-text-inverse)]" aria-labelledby="site-footer-heading">
      <div className="container relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="footer-cta footer-cta-panel mb-12 flex flex-col gap-6 rounded-3xl p-6 sm:p-8 lg:mb-16 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <p className="footer-eyebrow">Mobile care, made convenient</p>
            <h2 id="site-footer-heading" className="mt-3 text-2xl font-black tracking-tight text-[var(--color-text-inverse)] sm:text-3xl">
              Keep your day moving with service that comes to you.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[color-mix(in_srgb,var(--color-text-inverse)_72%,transparent)] sm:text-base">
              Tell us what your vehicle needs and we&apos;ll help you plan the next step.
            </p>
          </div>
          <Link href="/request-service" className="footer-cta-link inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-transform sm:px-6">
            Request service
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1.2fr_1fr] lg:gap-8">
          {/* Company info */}
          <div>
            <p className="footer-eyebrow">About the shop</p>
            <h3 className="mt-3 text-xl font-black tracking-tight text-[var(--color-text-inverse)]">{BUSINESS_CONFIG.shortName}</h3>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)]">
              Professional mobile mechanic services in {BUSINESS_CONFIG.city} and nearby communities.
            </p>
            <div className="mt-6 flex gap-2.5">
              <a href={BUSINESS_CONFIG.social.facebook} target="_blank" rel="noopener noreferrer" className="footer-social-link text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)] transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href={BUSINESS_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="footer-social-link text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)] transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href={BUSINESS_CONFIG.social.tiktok} target="_blank" rel="noopener noreferrer" className="footer-social-link text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)] transition-colors" aria-label="TikTok">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className={footerSectionClassName}>Services</h3>
            <ul className="space-y-3 text-sm text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)]">
              <li><Link href="/services/diagnostics" className={footerLinkClassName}>Vehicle Diagnostics</Link></li>
              <li><Link href="/services/brake-service" className={footerLinkClassName}>Brake Service</Link></li>
              <li><Link href="/services/battery-replacement" className={footerLinkClassName}>Battery Replacement</Link></li>
              <li><Link href="/services/oil-change" className={footerLinkClassName}>Oil Changes</Link></li>
              <li><Link href="/services/tune-up" className={footerLinkClassName}>Tune-Ups</Link></li>
              <li><Link href="/services/pre-purchase-inspections" className={footerLinkClassName}>Pre-Purchase Inspections</Link></li>
              <li><Link href="/services" className={`${footerLinkClassName} font-bold`}>View all services <ArrowUpRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" /></Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className={footerSectionClassName}>Resources</h3>
            <ul className="space-y-3 text-sm text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)]">
              <li><Link href={BLOG_INDEX_HREF} className={footerLinkClassName}>Blog</Link></li>
              <li><Link href="/reviews" className={footerLinkClassName}>Customer reviews</Link></li>
              <li><Link href="/service-areas" className={footerLinkClassName}>Service areas</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={footerSectionClassName}>Contact</h3>
            <ul className="space-y-4 text-sm text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)]">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                <div className="flex flex-col items-start gap-1">
                  <a href={`tel:${BUSINESS_CONFIG.phoneRaw}`} className={footerLinkClassName}>{BUSINESS_CONFIG.phone}</a>
                  <a href={`tel:${BUSINESS_CONFIG.phoneSecondaryRaw}`} className={footerLinkClassName}>{BUSINESS_CONFIG.phoneSecondary}</a>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                <a href={`sms:${BUSINESS_CONFIG.phoneRaw}`} className={footerLinkClassName}>Text us</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                <a href={`mailto:${BUSINESS_CONFIG.email}`} className={footerLinkClassName}>{BUSINESS_CONFIG.email}</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                <span>{BUSINESS_CONFIG.serviceArea.description}</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className={footerSectionClassName}>Business hours</h3>
            <ul className="space-y-2 text-sm text-[color-mix(in_srgb,var(--color-text-inverse)_70%,transparent)]">
              <li className="flex justify-between gap-3"><span>Monday</span><span className="text-right tabular-nums">{BUSINESS_CONFIG.hours.monday}</span></li>
              <li className="flex justify-between gap-3"><span>Tuesday</span><span className="text-right tabular-nums">{BUSINESS_CONFIG.hours.tuesday}</span></li>
              <li className="flex justify-between gap-3"><span>Wednesday</span><span className="text-right tabular-nums">{BUSINESS_CONFIG.hours.wednesday}</span></li>
              <li className="flex justify-between gap-3"><span>Thursday</span><span className="text-right tabular-nums">{BUSINESS_CONFIG.hours.thursday}</span></li>
              <li className="flex justify-between gap-3"><span>Friday</span><span className="text-right tabular-nums">{BUSINESS_CONFIG.hours.friday}</span></li>
              <li className="flex justify-between gap-3"><span>Saturday</span><span className="text-right tabular-nums">{BUSINESS_CONFIG.hours.saturday}</span></li>
              <li className="flex justify-between gap-3"><span>Sunday</span><span className="text-right tabular-nums">{BUSINESS_CONFIG.hours.sunday}</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom-bar">
        <div className="container flex flex-col gap-5 py-5 text-xs text-[color-mix(in_srgb,var(--color-text-inverse)_52%,transparent)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
            <p>&copy; {new Date().getFullYear()} {BUSINESS_CONFIG.name}. All rights reserved.</p>
            <span className="hidden text-[color-mix(in_srgb,var(--color-text-inverse)_24%,transparent)] sm:inline" aria-hidden="true">•</span>
            <p>Web design &amp; development by <span className="font-semibold text-[color-mix(in_srgb,var(--color-text-inverse)_72%,transparent)]">Kayman Narine</span>. <a href={DESIGNER_CONTACT_HREF} target="_blank" rel="noopener noreferrer" className="footer-inquiry-link">Inquire here <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a></p>
          </div>
          <nav aria-label="Footer legal links" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/privacy" className="footer-legal-link">Privacy Policy</Link>
            <Link href="/terms" className="footer-legal-link">Terms</Link>
            <Link href="/accessibility" className="footer-legal-link">Accessibility</Link>
            <Link href="/admin/login" className="footer-legal-link">CRM Sign in</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
