import { requireUser } from "@/server/auth";
import { getDraft } from "@/server/weddings";
import { Editor } from "@/features/weddings/editor";
import { env } from "@/server/env";
export const metadata = { title: "Create your invitation" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const data = await getDraft(user.id, (await params).id);
  return (
    <Editor
      id={data.wedding.id}
      initial={data.content}
      initialVersion={data.wedding.version}
      initialSlug={data.wedding.slug}
      published={!!data.wedding.firstPublishedAt}
      invitationBaseUrl={env().APP_URL}
      invitationDomain={env().INVITATION_DOMAIN}
    />
  );
}
