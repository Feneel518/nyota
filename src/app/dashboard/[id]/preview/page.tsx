import { requireUser } from "@/server/auth";
import { getDraft } from "@/server/weddings";
import { Preview } from "@/features/weddings/preview";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private preview",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const data = await getDraft(user.id, (await params).id);
  return <Preview initial={data.content} />;
}
