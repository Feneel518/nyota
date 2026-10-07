import { requireUser } from "@/server/auth";
import { getDraft } from "@/server/weddings";
import { ownerResponses } from "@/server/rsvp";
import { Responses } from "@/features/rsvp/responses";
export const metadata = { title: "Guest responses" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(),
    { id } = await params;
  const draft = await getDraft(user.id, id),
    data = await ownerResponses(user.id, id);
  return (
    <Responses
      id={id}
      content={draft.content}
      initial={{
        ...data,
        rows: data.rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      }}
    />
  );
}
