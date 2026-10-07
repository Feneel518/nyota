import { Guest } from "@/features/invitations/guest";
import { publicWedding } from "@/server/weddings";
import { env } from "@/server/env";
import { Unavailable } from "@/components/unavailable";
import { headers } from "next/headers";
import { invitationUrl, invitationPath } from "@/lib/invitation-url";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const w = await publicWedding(slug);
  if (!w)
    return {
      title: "Invitation unavailable",
      robots: { index: false, follow: false },
    };
  const name = w.content.names
    .map((n) => n[w.content.defaultLanguage])
    .join(" & ");
  return {
    title: name,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${name} — You're invited`,
      description: "Join us for our wedding celebrations.",
      images: [
        {
          url: `${invitationUrl(env().APP_URL, slug, env().INVITATION_DOMAIN)}/social?v=${w.revisionId}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}
export default async function Invitation({
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
