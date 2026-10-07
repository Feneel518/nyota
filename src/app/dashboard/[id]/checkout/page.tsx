import { eq } from "drizzle-orm";
import { requireUser } from "@/server/auth";
import { getDraft } from "@/server/weddings";
import { db } from "@/server/db";
import { orders, revisions } from "@/server/db/schema";
import { env } from "@/server/env";
import { hostingDates } from "@/lib/domain";
import { Checkout } from "@/features/billing/checkout";
import { invitationUrl } from "@/lib/invitation-url";
export const metadata = { title: "Publish your invitation" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(),
    { id } = await params;
  const { wedding: w, content } = await getDraft(user.id, id);
  const [order] = await db()
    .select()
    .from(orders)
    .where(eq(orders.weddingId, id));
  const [revision] = order?.revisionId
    ? await db()
        .select()
        .from(revisions)
        .where(eq(revisions.id, order.revisionId))
    : [];
  return (
    <Checkout
      id={id}
      content={revision?.content || content}
      version={w.version}
      slug={w.slug}
      url={invitationUrl(env().APP_URL, w.slug, env().INVITATION_DOMAIN)}
      price={env().PRICE_PAISE}
      local={env().PAYMENT_ADAPTER === "local"}
      keyId={env().RAZORPAY_KEY_ID}
      initialOrder={order || null}
      firstPublishedAt={w.firstPublishedAt?.toISOString() || null}
      expiresAt={w.expiresAt?.toISOString() || null}
      purgeAt={w.purgeAt?.toISOString() || null}
      expectedExpiry={hostingDates(new Date()).expiresAt.toISOString()}
    />
  );
}
