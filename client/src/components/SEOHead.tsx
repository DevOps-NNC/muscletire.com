import { useEffect } from "react";
import { BUSINESS_CONFIG } from "@shared/config";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ampHtml?: string;
  ogType?: "website" | "article";
  image?: string;
  noIndex?: boolean;
}

const defaultImage = `${BUSINESS_CONFIG.website}/images/placeholder.svg`;

export function SEOHead({ title, description, canonical, ampHtml, ogType = "website", image = defaultImage, noIndex = false }: SEOHeadProps) {
  useEffect(() => {
    document.title = title;
    const setMeta = (selector: string, attribute: "name" | "property", content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, selector.match(/="([^"]+)/)?.[1] || ""); document.head.appendChild(element); }
      element.setAttribute("content", content);
    };
    setMeta('meta[name="description"]', "name", description);
    setMeta('meta[name="robots"]', "name", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    setMeta('meta[property="og:title"]', "property", title);
    setMeta('meta[property="og:description"]', "property", description);
    setMeta('meta[property="og:type"]', "property", ogType);
    setMeta('meta[property="og:site_name"]', "property", BUSINESS_CONFIG.shortName);
    setMeta('meta[property="og:image"]', "property", image);
    setMeta('meta[property="og:image:width"]', "property", "2560");
    setMeta('meta[property="og:image:height"]', "property", "1440");
    setMeta('meta[property="og:image:alt"]', "property", "Mobile automotive diagnostics in __CITY__, Florida");
    setMeta('meta[name="twitter:card"]', "name", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", title);
    setMeta('meta[name="twitter:description"]', "name", description);
    setMeta('meta[name="twitter:image"]', "name", image);
    if (canonical) {
      setMeta('meta[property="og:url"]', "property", canonical);
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) { link = document.createElement("link"); link.setAttribute("rel", "canonical"); document.head.appendChild(link); }
      link.setAttribute("href", canonical);
    }
    const ampLink = document.querySelector('link[rel="amphtml"]') as HTMLLinkElement | null;
    const resolvedAmpHtml = !noIndex && canonical ? (ampHtml ?? `${canonical.replace(/\/$/, "")}/amp`) : null;
    if (resolvedAmpHtml) {
      const nextAmpLink = ampLink ?? document.createElement("link");
      nextAmpLink.setAttribute("rel", "amphtml");
      nextAmpLink.setAttribute("href", resolvedAmpHtml);
      if (!ampLink) document.head.appendChild(nextAmpLink);
    } else if (ampLink) {
      ampLink.remove();
    }
  }, [title, description, canonical, ampHtml, ogType, image, noIndex]);
  return null;
}
