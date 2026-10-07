import type { InvitationContent } from "./content";

const hostnameSlug = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;
const reservedSlugs = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "sign-in",
  "auth",
  "mail",
  "email",
  "smtp",
  "support",
  "help",
  "status",
  "cdn",
  "assets",
]);
export function resolveInvitationDomain(appUrl: string, configured?: string) {
  const domain = configured?.trim().toLowerCase();
  if (domain) return domain;
  const hostname = new URL(appUrl).hostname;
  return hostname === "nyotaa.app" || hostname === "www.nyotaa.app"
    ? "nyotaa.app"
    : undefined;
}

export function invitationSlugError(slug: string) {
  if (
    slug.length < 3 ||
    slug.length > 63 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  )
    return "Use 3–63 lowercase letters, numbers, or single hyphens between words.";
  if (reservedSlugs.has(slug))
    return "This domain name is reserved. Choose another.";
  return "";
}
export function invitationSlug(hostname: string, domain?: string) {
  if (!domain) return null;
  const suffix = `.${domain.toLowerCase()}`;
  const host = hostname.toLowerCase();
  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  return hostnameSlug.test(slug) && !reservedSlugs.has(slug) ? slug : null;
}
export function invitationUrl(appUrl: string, slug: string, domain?: string) {
  const url = new URL(appUrl);
  if (
    domain &&
    hostnameSlug.test(slug) &&
    `${slug}.${domain}` !== url.hostname
  ) {
    url.hostname = `${slug}.${domain}`;
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  }
  return new URL(`/w/${encodeURIComponent(slug)}`, url).toString();
}
export function invitationPath(
  appUrl: string,
  slug: string,
  hostname: string,
  domain?: string,
) {
  return hostname.toLowerCase() !== new URL(appUrl).hostname &&
    invitationSlug(hostname, domain) === slug
    ? "/"
    : `/w/${slug}`;
}
export function isInvitationOrigin(
  origin: string,
  appUrl: string,
  slug: string,
  domain?: string,
) {
  try {
    const guest = new URL(origin);
    const base = new URL(appUrl);
    return (
      guest.origin === origin &&
      guest.protocol === base.protocol &&
      guest.port === base.port &&
      invitationSlug(guest.hostname, domain) === slug
    );
  } catch {
    return false;
  }
}
export function suggestedCoupleSlug(names: InvitationContent["names"]) {
  const parts = names.map((name) =>
    name.en.toLowerCase().replace(/[^a-z0-9]/g, ""),
  );
  if (!parts.every(Boolean)) return "";
  return parts.join("").slice(0, 63);
}
