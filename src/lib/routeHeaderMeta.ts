export type RouteHeaderMeta = {
  title: string;
  subtitle?: string;
};

/** Match routes reliably (strip query, optional trailing slash). */
export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const base = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (base !== "/" && base.endsWith("/")) {
    return base.slice(0, -1) || "/";
  }
  return base;
}

/**
 * Header copy per route. Keep in sync with app routes under `src/app`.
 * Used from the client header so titles update on soft navigation (layout `headers()` can be stale).
 */
export function getRouteHeaderMeta(pathname: string): RouteHeaderMeta {
  const p = normalizePathname(pathname);

  if (p === "/leads") {
    return { title: "Leads", subtitle: "Your pipeline and clients" };
  }
  if (p === "/leads/deleted") {
    return { title: "Recently deleted", subtitle: "Restore leads or remove them forever" };
  }
  if (p.startsWith("/leads/")) {
    return { title: "Leads", subtitle: "Details and activity" };
  }
  if (p === "/calendar" || p.startsWith("/calendar/")) {
    return { title: "Calendar", subtitle: "Events and schedule" };
  }
  if (p === "/users") {
    return { title: "Users", subtitle: "Team members and roles" };
  }
  if (p === "/profile") {
    return { title: "Profile", subtitle: "Your account" };
  }
  if (p === "/login") {
    return { title: "Sign in", subtitle: "Access TSS CRM" };
  }

  return { title: "TSS CRM", subtitle: undefined };
}
