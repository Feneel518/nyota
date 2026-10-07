import { Guest } from "@/features/invitations/guest";
import { publicWedding } from "@/server/weddings";
import { env } from "@/server/env";
import { Unavailable } from "@/components/unavailable";
import { headers } from "next/headers";
import { invitationUrl, invitationPath } from "@/lib/invitation-url";
export { generateMetadata } from "../page";
export const dynamic = "force-dynamic";
export default async function Details({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const w = await publicWedding(slug);
  if (!w) return <Unavailable />;
  return (
    <Guest
      content={w.content}
      slug={slug}
      detailsOnly
      canonicalUrl={invitationUrl(env().APP_URL, slug, env().INVITATION_DOMAIN)}
      invitationPath={invitationPath(
        env().APP_URL,
        slug,
        (await headers()).get("x-invitation-host") || "",
        env().INVITATION_DOMAIN,
      )}
    />
  );
}
