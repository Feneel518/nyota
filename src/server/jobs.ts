import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { hostingDates } from "@/lib/domain";
import { invitationUrl } from "@/lib/invitation-url";
import { db, type Transaction } from "./db";
import {
  analytics,
  assets,
  audit,
  buckets,
  drafts,
  events,
  idempotency,
  jobs,
  orders,
  revisions,
  revisionAssets,
  rsvps,
  user,
  weddings,
} from "./db/schema";
import { env } from "./env";
import { sendEmail } from "./email";
import { processImage } from "./media";
import { deleteObject } from "./storage";
import { reconcileOrder } from "./billing";
async function publishOrder(orderId: string) {
  await db().transaction(async (tx) => {
    const [o] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");
    if (!o || o.paymentState !== "captured" || o.fulfillment === "published")
      return;
    const [w] = await tx
      .select()
      .from(weddings)
      .where(eq(weddings.id, o.weddingId))
      .for("update");
    if (!w || w.purgedAt || !o.revisionId)
      throw new Error("Publication data unavailable");
    if (!w.firstPublishedAt) {
      const firstPublishedAt = new Date();
      await tx
        .update(weddings)
        .set({
          firstPublishedAt,
          ...hostingDates(firstPublishedAt),
          publishedRevisionId: o.revisionId,
        })
        .where(eq(weddings.id, w.id));
    }
    await tx
      .update(orders)
      .set({ fulfillment: "published" })
      .where(eq(orders.id, o.id));
    await tx
      .insert(jobs)
      .values({
        key: `published-email:${o.id}`,
        kind: "published_email",
        payload: { weddingId: w.id },
      })
      .onConflictDoNothing();
    await tx
      .insert(analytics)
      .values({
        key: `published:${w.id}`,
        weddingId: w.id,
        kind: "invitation_published",
      })
      .onConflictDoNothing();
  });
}
async function cleanupAsset(
  id: string,
  force = false,
  transaction?: Transaction,
): Promise<void> {
  if (!transaction)
    return db().transaction((tx) => cleanupAsset(id, force, tx));
  const tx = transaction;
  const [a] = await tx.select().from(assets).where(eq(assets.id, id));
  if (!a || a.status === "deleted") return;
  await tx
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.id, a.weddingId))
    .for("update");
  if (!force) {
    const [ref] = await tx
      .select()
      .from(revisionAssets)
      .where(eq(revisionAssets.assetId, id));
    const [draft] = await tx
      .select()
      .from(drafts)
      .where(eq(drafts.weddingId, a.weddingId));
    if (ref || draft?.content.photos.includes(id)) return;
  }
  for (const key of [
    a.objectKey,
    `${a.weddingId}/${id}/480.webp`,
    `${a.weddingId}/${id}/1200.webp`,
  ])
    await deleteObject(key);
  await tx.update(assets).set({ status: "deleted" }).where(eq(assets.id, id));
}
export async function maintenance() {
  const expired = await db()
    .select()
    .from(weddings)
    .where(
      sql`${weddings.purgedAt} IS NULL AND (${weddings.purgeAt} <= now() OR (${weddings.firstPublishedAt} IS NULL AND ${weddings.updatedAt} < now() - interval '90 days'))`,
    )
    .limit(20);
  for (const w of expired) {
    await db().transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(weddings)
        .where(eq(weddings.id, w.id))
        .for("update");
      if (
        !current ||
        current.purgedAt ||
        !(
          (current.purgeAt && current.purgeAt <= new Date()) ||
          (!current.firstPublishedAt &&
            current.updatedAt < new Date(Date.now() - 90 * 86400000))
        )
      )
        return;
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.weddingId, w.id));
      if (!current.firstPublishedAt && order) return; // Unresolved financial intent requires reconciliation, never automatic deletion.
      const ownedAssets = await tx
        .select()
        .from(assets)
        .where(eq(assets.weddingId, w.id));
      for (const a of ownedAssets) await cleanupAsset(a.id, true, tx);
      await tx.delete(rsvps).where(eq(rsvps.weddingId, w.id));
      await tx.delete(revisions).where(eq(revisions.weddingId, w.id));
      await tx.delete(drafts).where(eq(drafts.weddingId, w.id));
      await tx.delete(events).where(eq(events.weddingId, w.id));
      await tx.delete(analytics).where(eq(analytics.weddingId, w.id));
      await tx
        .update(weddings)
        .set({ publishedRevisionId: null, purgedAt: new Date() })
        .where(eq(weddings.id, w.id));
      await tx.insert(audit).values({
        action: "content_purged",
        targetId: w.id,
        outcome: "complete",
      });
    });
  }
  const staleAssets = await db()
    .select()
    .from(assets)
    .where(
      and(
        lt(assets.createdAt, new Date(Date.now() - 86400000)),
        inArray(assets.status, ["pending", "rejected", "ready", "retained"]),
      ),
    )
    .limit(30);
  for (const a of staleAssets) await cleanupAsset(a.id);
  await db().delete(buckets).where(lt(buckets.expiresAt, new Date()));
  await db().delete(idempotency).where(lt(idempotency.expiresAt, new Date()));
  await db()
    .delete(analytics)
    .where(lt(analytics.createdAt, new Date(Date.now() - 180 * 86400000)));
  const reminders = await db()
    .select()
    .from(weddings)
    .where(
      sql`${weddings.purgedAt} IS NULL AND ((${weddings.expiresAt} BETWEEN now() AND now() + interval '7 days') OR (${weddings.firstPublishedAt} IS NULL AND ${weddings.updatedAt} BETWEEN now() - interval '89 days' AND now() - interval '83 days'))`,
    )
    .limit(30);
  for (const w of reminders)
    await db()
      .insert(jobs)
      .values({
        key: `expiry-email:${w.id}:${w.updatedAt.toISOString().slice(0, 10)}`,
        kind: "expiry_email",
        payload: { weddingId: w.id },
      })
      .onConflictDoNothing();
}
export async function runJobs(limit = 5) {
  let completed = 0;
  for (let i = 0; i < limit; i++) {
    const lease = crypto.randomUUID();
    const rows = await db().execute(
      sql`UPDATE outbox_jobs SET state = 'running', lease_until = now() + interval '2 minutes', lease_token = ${lease}::uuid, attempts = attempts + 1 WHERE id = (SELECT id FROM outbox_jobs WHERE (state = 'pending' AND due_at <= now()) OR (state = 'running' AND lease_until < now()) ORDER BY due_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id, kind, payload, attempts`,
    );
    const row = rows.rows[0] as
      | {
          id: string;
          kind: string;
          payload: Record<string, string>;
          attempts: number;
        }
      | undefined;
    if (!row) break;
    try {
      if (row.kind === "publish") await publishOrder(row.payload.orderId);
      else if (row.kind === "media") await processImage(row.payload.assetId);
      else if (row.kind === "reconcile")
        await reconcileOrder(row.payload.orderId);
      else if (row.kind === "asset_cleanup")
        await cleanupAsset(row.payload.assetId);
      else if (row.kind === "published_email" || row.kind === "expiry_email") {
        const [data] = await db()
          .select({ wedding: weddings, email: user.email })
          .from(weddings)
          .innerJoin(user, eq(user.id, weddings.ownerId))
          .where(eq(weddings.id, row.payload.weddingId));
        if (data)
          await sendEmail(
            data.email,
            row.kind === "published_email"
              ? "Your invitation is live"
              : "Your invitation hosting reminder",
            row.kind === "published_email"
              ? `Your invitation: ${invitationUrl(env().APP_URL, data.wedding.slug, env().INVITATION_DOMAIN)}\nHosting ends: ${data.wedding.expiresAt?.toISOString()}\nExport your responses before: ${data.wedding.purgeAt?.toISOString()}`
              : `Review your invitation and export your responses: ${env().APP_URL}/dashboard\n${data.wedding.expiresAt ? `Hosting ends ${data.wedding.expiresAt.toISOString()}. Export period ends ${data.wedding.purgeAt?.toISOString()}.` : "Your inactive draft will be removed after 90 days without edits. Open and save it to keep working."}`,
            row.id,
          );
      } else throw new Error("Unknown job kind");
      await db()
        .update(jobs)
        .set({
          state: "done",
          leaseUntil: null,
          leaseToken: null,
          lastError: null,
        })
        .where(and(eq(jobs.id, row.id), eq(jobs.leaseToken, lease)));
      completed++;
    } catch {
      await db()
        .update(jobs)
        .set({
          state: row.attempts >= 12 ? "dead" : "pending",
          dueAt: new Date(
            Date.now() +
              Math.min(3600000, 15000 * 2 ** row.attempts) +
              Math.random() * 5000,
          ),
          leaseUntil: null,
          leaseToken: null,
          lastError: "JOB_FAILED",
        })
        .where(and(eq(jobs.id, row.id), eq(jobs.leaseToken, lease)));
      console.error(
        JSON.stringify({ code: "JOB_FAILED", jobId: row.id, kind: row.kind }),
      );
    }
  }
  return { completed };
}
