const base = import.meta.env.BASE_URL;

export function sitePath(path = "/"): string {
  return base + path.replace(/^\/+/, "");
}

export function siteRoute(pathname: string): string {
  const prefix = base.replace(/\/$/, "");
  const relative = pathname === prefix ? "/" : pathname.startsWith(base) ? "/" + pathname.slice(base.length) : pathname;
  return relative.replace(/\/index\.html$/, "").replace(/\/+$/, "") || "/";
}
