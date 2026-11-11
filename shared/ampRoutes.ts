const AMP_SUFFIX = "/amp";

export function ampRouteFor(route: string): string {
  const normalized = route === "/" ? "" : route.replace(/\/+$/, "");
  return `${normalized}${AMP_SUFFIX}` || AMP_SUFFIX;
}

export function canonicalRouteForAmp(route: string): string {
  if (route === AMP_SUFFIX) return "/";
  if (!route.endsWith(AMP_SUFFIX)) throw new Error(`Not an AMP route: ${route}`);
  return route.slice(0, -AMP_SUFFIX.length) || "/";
}

export function isAmpEligibleRoute(route: string): boolean {
  const normalized = route === "/" ? "/" : `/${route.replace(/^\/+/, "").replace(/\/+$/, "")}`;
  return normalized === "/"
    || normalized === "/about"
    || normalized === "/contact"
    || normalized === "/services"
    || normalized.startsWith("/services/")
    || normalized === "/service-areas"
    || normalized.startsWith("/service-areas/")
    || normalized === "/reviews"
    || normalized === "/faq"
    || normalized === "/blog"
    || normalized.startsWith("/blog/")
    || normalized === "/request-service"
    || normalized === "/privacy"
    || normalized === "/terms";
}
