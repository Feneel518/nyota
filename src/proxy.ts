import { NextResponse, type NextRequest } from "next/server";
import { invitationSlug } from "@/lib/invitation-url";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-invitation-host");
  const hostname = (request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();
  if (
    hostname ===
    new URL(process.env.APP_URL || "http://127.0.0.1:3000").hostname
  )
    return NextResponse.next({ request: { headers: requestHeaders } });
  const slug = invitationSlug(
    hostname,
    process.env.INVITATION_DOMAIN?.trim().toLowerCase(),
  );
  if (!slug) return NextResponse.next({ request: { headers: requestHeaders } });
  requestHeaders.set("x-invitation-host", hostname);
  if (request.nextUrl.pathname.startsWith("/w/"))
    return NextResponse.next({ request: { headers: requestHeaders } });
  // Preserve the server's original origin so this stays an internal rewrite.
  const url = new URL(request.url);
  url.pathname = `/w/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}
export const config = { matcher: ["/", "/details", "/social", "/w/:path*"] };
