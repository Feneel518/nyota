import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { assets, orders, revisionAssets, weddings } from "@/server/db/schema";
import { currentUser } from "@/server/auth";
import { readObject } from "@/server/storage";
import { endpoint, AppError } from "@/server/security";
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return endpoint(async () => {
    const id = z.uuid().parse((await ctx.params).id);
    const [a] = await db()
      .select()
      .from(assets)
      .where(
        and(eq(assets.id, id), inArray(assets.status, ["ready", "retained"])),
      );
    if (!a) throw new AppError(404, "Photo unavailable.");
    const owner = await currentUser();
    const [published] = await db()
      .select({ id: weddings.id })
      .from(weddings)
      .innerJoin(
        orders,
        and(
          eq(orders.weddingId, weddings.id),
          eq(orders.paymentState, "captured"),
        ),
      )
      .innerJoin(
        revisionAssets,
        eq(revisionAssets.revisionId, weddings.publishedRevisionId),
      )
      .where(
        and(
          eq(revisionAssets.assetId, id),
          eq(weddings.id, a.weddingId),
          sql`${weddings.expiresAt} > now()`,
        ),
      );
    const [w] = await db()
      .select()
      .from(weddings)
      .where(eq(weddings.id, a.weddingId));
    if (
      !published &&
      !(
        owner?.id === a.ownerId &&
        !w.purgedAt &&
        (!w.purgeAt || w.purgeAt > new Date())
      )
    )
      throw new AppError(404, "Photo unavailable.");
    const width =
      new URL(req.url).searchParams.get("width") === "1200" ? 1200 : 480;
    return new Response(
      new Uint8Array(await readObject(`${a.weddingId}/${a.id}/${width}.webp`)),
      {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  });
}
