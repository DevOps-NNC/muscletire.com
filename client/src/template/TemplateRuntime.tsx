import { trpc } from "@/lib/trpc";
import { DEFAULT_SITE_TEMPLATE, type SiteTemplateConfig } from "@shared/siteTemplate";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { configureGoogleMapsBrowserKey } from "@/components/Map";

const TemplateContext = createContext<SiteTemplateConfig>(DEFAULT_SITE_TEMPLATE);

export function useSiteTemplate() { return useContext(TemplateContext); }

const GOOGLE_TAG_MANAGER_ID_PATTERN = /^GTM-[A-Z0-9]+$/i;

export function getTemplateThemeValues(palette: SiteTemplateConfig["palette"]): Record<string, string> {
  return {
    "--color-primary": palette.primary,
    "--color-secondary": palette.secondary,
    "--color-hero-bg": palette.darkSurface,
    "--color-page-bg": palette.background,
    "--color-card-bg": palette.surface,
    "--color-footer-bg": palette.darkSurface,
    "--color-text-main": palette.foreground,
    "--color-text-muted": palette.mutedForeground,
    "--color-text-inverse": palette.darkSurfaceForeground,
    "--color-primary-foreground": palette.primaryForeground,
    "--color-border": palette.secondary,
    "--color-accent": palette.accent,
    "--public-ink": palette.darkSurface,
    "--public-ink-soft": `color-mix(in srgb, ${palette.darkSurface} 78%, ${palette.surface})`,
    "--public-paper": palette.background,
    "--public-paper-muted": `color-mix(in srgb, ${palette.background} 72%, ${palette.secondary})`,
    "--public-orange": palette.primary,
    "--public-dark-copy": palette.darkSurfaceForeground,
    "--public-paper-copy": palette.foreground,
    "--public-paper-copy-muted": palette.mutedForeground,
    "--public-copy-muted": `color-mix(in srgb, ${palette.darkSurfaceForeground} 82%, ${palette.darkSurface})`,
    "--public-line": `color-mix(in srgb, ${palette.background} 14%, transparent)`,
  };
}

export function installGoogleTagManager(rawId: string) {
  const id = rawId.trim();
  if (!GOOGLE_TAG_MANAGER_ID_PATTERN.test(id)) return () => undefined;

  document.querySelectorAll<HTMLElement>("[data-template-gtm-source=\"shell\"]").forEach(node => {
    if (node.dataset.templateGtm !== id && node.dataset.templateGtmNoscript !== id) node.remove();
  });

  const existingHeadScript = document.querySelector<HTMLScriptElement>(`script[data-template-gtm="${id}"]`);
  const headScript = existingHeadScript ?? document.createElement("script");
  const ownsHeadScript = !existingHeadScript;
  if (ownsHeadScript) {
    headScript.dataset.templateGtm = id;
    headScript.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer','${id}');`;
    document.head.appendChild(headScript);
  }

  const existingBodyNoscript = document.querySelector<HTMLElement>(`noscript[data-template-gtm-noscript="${id}"]`);
  const bodyNoscript = existingBodyNoscript ?? document.createElement("noscript");
  const ownsBodyNoscript = !existingBodyNoscript;
  if (ownsBodyNoscript) {
    bodyNoscript.dataset.templateGtmNoscript = id;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    bodyNoscript.appendChild(iframe);
    document.body.insertBefore(bodyNoscript, document.body.firstChild);
  }

  return () => {
    if (ownsHeadScript) headScript.remove();
    if (ownsBodyNoscript) bodyNoscript.remove();
  };
}

function appendHtmlSnippet(target: HTMLElement, html: string, marker: string) {
  if (!html.trim() || document.querySelector(`[data-template-snippet="${marker}"]`)) return () => undefined;
  const container = document.createElement("template");
  container.innerHTML = html;
  const nodes = Array.from(container.content.childNodes).map(node => {
    if (!(node instanceof HTMLScriptElement)) return node.cloneNode(true);
    const script = document.createElement("script");
    for (const attribute of Array.from(node.attributes)) script.setAttribute(attribute.name, attribute.value);
    script.text = node.text;
    return script;
  });
  const wrapper = document.createElement("div");
  wrapper.dataset.templateSnippet = marker;
  wrapper.hidden = true;
  nodes.forEach(node => wrapper.appendChild(node));
  target.appendChild(wrapper);
  return () => wrapper.remove();
}

function useMarketingScriptReady(delayMs = 1200) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;
      setReady(true);
    };
    const timer = window.setTimeout(activate, delayMs);
    const interactionEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
    interactionEvents.forEach(eventName => window.addEventListener(eventName, activate, { once: true, passive: true }));
    return () => {
      window.clearTimeout(timer);
      interactionEvents.forEach(eventName => window.removeEventListener(eventName, activate));
    };
  }, [delayMs]);

  return ready;
}

function TemplateTracking({ config }: { config: SiteTemplateConfig }) {
  const marketingScriptReady = useMarketingScriptReady();
  useEffect(() => {
    const root = document.documentElement;
    const palette = config.palette;
    const values = getTemplateThemeValues(palette);
    Object.entries(values).forEach(([key, value]) => root.style.setProperty(key, value));
    return () => Object.keys(values).forEach(key => root.style.removeProperty(key));
  }, [config.palette]);

  useEffect(() => {
    configureGoogleMapsBrowserKey(config.integrations.googleMapsBrowserKey);
  }, [config.integrations.googleMapsBrowserKey]);

  useEffect(() => installGoogleTagManager(config.integrations.googleTagManagerId), [config.integrations.googleTagManagerId]);

  useEffect(() => {
    if (!marketingScriptReady) return;
    const cleanups = [
      appendHtmlSnippet(document.head, config.integrations.headHtml, "head"),
      appendHtmlSnippet(document.body, config.integrations.bodyHtml, "body"),
    ];
    if (config.integrations.googleAnalyticsId && !document.querySelector(`[data-template-ga="${config.integrations.googleAnalyticsId}"]`)) {
      const script = document.createElement("script"); script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.integrations.googleAnalyticsId)}`; script.dataset.templateGa = config.integrations.googleAnalyticsId; document.head.appendChild(script);
      const inline = document.createElement("script"); inline.dataset.templateGa = `${config.integrations.googleAnalyticsId}-config`; inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${config.integrations.googleAnalyticsId}');`; document.head.appendChild(inline);
      cleanups.push(() => { script.remove(); inline.remove(); });
    }
    if (config.integrations.metaPixelId && !document.querySelector(`[data-template-meta-pixel="${config.integrations.metaPixelId}"]`)) {
      const script = document.createElement("script"); script.dataset.templateMetaPixel = config.integrations.metaPixelId; script.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${config.integrations.metaPixelId}');fbq('track','PageView');`; document.head.appendChild(script); cleanups.push(() => script.remove());
    }
    return () => cleanups.forEach(cleanup => cleanup());
  }, [config.integrations, marketingScriptReady]);
  return null;
}

export function TemplateRuntime({ children }: { children: ReactNode }) {
  const template = trpc.crm.publicTemplateConfig.useQuery(undefined, { staleTime: 60_000 });
  const config = template.data ?? DEFAULT_SITE_TEMPLATE;
  return <TemplateContext.Provider value={config}><TemplateTracking config={config} />{children}</TemplateContext.Provider>;
}
