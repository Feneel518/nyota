import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  contentSchema,
  emptyContent,
  publicationSchema,
  type InvitationContent,
} from "@/lib/content";
import { isActive } from "@/lib/domain";
import { invitationSlugError } from "@/lib/invitation-url";
import { env } from "./env";
import { db, type Transaction } from "./db";
import {
  assets,
  analytics,
  audit,
  drafts,
  events,
  idempotency,
  orders,
  revisionAssets,
  revisions,
  weddings,
} from "./db/schema";
import { AppError, hash } from "./security";

export async function ownerWedding(ownerId: string, id: string, tx = db()) {
  const [w] = await tx
    .select()
    .from(weddings)
    .where(and(eq(weddings.id, id), eq(weddings.ownerId, ownerId)));
  if (!w || w.purgedAt) throw new AppError(404, "Invitation not found.");
  if (w.purgeAt && w.purgeAt <= new Date())
    throw new AppError(410, "The export period has ended.");
  return w;
}
export async function createWedding(ownerId: string) {
  return db().transaction(async (tx) => {
    const content = emptyContent();
    const [w] = await tx
      .insert(weddings)
      .values({
        ownerId,
        slug: `our-wedding-${crypto.randomUUID().slice(0, 8)}`,
      })
      .returning();
    await tx.insert(drafts).values({ weddingId: w.id, content });
    await tx
      .insert(analytics)
      .values({ key: `draft:${w.id}`, weddingId: w.id, kind: "draft_created" });
    await syncEvents(tx, w.id, content);
    return w;
  });
}
export async function syncEvents(
  tx: Transaction,
  weddingId: string,
  content: InvitationContent,
) {
  // Removed draft events are archived, preserving all historical RSVP foreign keys.
  await tx
    .update(events)
    .set({ archived: true })
    .where(eq(events.weddingId, weddingId));
  for (const event of content.events)
    await tx
      .insert(events)
      .values({
        id: event.id,
        weddingId,
        title: event.title,
        archived: event.archived,
      })
      .onConflictDoUpdate({
        target: [events.weddingId, events.id],
        set: { title: event.title, archived: event.archived },
      });
}
export async function listWeddings(ownerId: string) {
  return db()
    .select({ wedding: weddings, content: drafts.content })
    .from(weddings)
    .innerJoin(drafts, eq(drafts.weddingId, weddings.id))
    .where(eq(weddings.ownerId, ownerId))
    .orderBy(desc(weddings.updatedAt));
}
export async function getDraft(ownerId: string, id: string) {
  const wedding = await ownerWedding(ownerId, id);
  const [draft] = await db()
    .select()
    .from(drafts)
    .where(eq(drafts.weddingId, id));
  if (!draft) throw new AppError(404, "Draft not found.");
  return { wedding, content: draft.content };
}
function domainError(slug: string) {
  const error = invitationSlugError(slug);
  if (error) return error;
  const { APP_URL, INVITATION_DOMAIN } = env();
  return INVITATION_DOMAIN &&
    `${slug}.${INVITATION_DOMAIN}` === new URL(APP_URL).hostname
    ? "This domain name is reserved. Choose another."
    : "";
}
export async function checkDomain(ownerId: string, id: string, slug: string) {
  const wedding = await ownerWedding(ownerId, id);
  if (wedding.slug === slug) return { available: true, current: true };
  const error = domainError(slug);
  if (error) return { available: false, error };
  const [collision] = await db()
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.slug, slug));
  return collision
    ? { available: false, error: "That link is already taken. Choose another." }
    : { available: true, current: false };
}
export async function saveDraft(
  ownerId: string,
  id: string,
  version: number,
  mutation: string,
  raw: unknown,
  slug: string,
) {
  const content = contentSchema.parse(raw);
  const requestHash = hash(JSON.stringify({ content, slug, version }));
  return db()
    .transaction(async (tx) => {
      const [w] = await tx
        .select()
        .from(weddings)
        .where(and(eq(weddings.id, id), eq(weddings.ownerId, ownerId)))
        .for("update");
      if (!w || w.purgedAt) throw new AppError(404, "Invitation not found.");
      if (w.expiresAt && !isActive(w.expiresAt))
        throw new AppError(
          410,
          "This invitation has expired. Responses remain available during the export period.",
        );
      const scope = `draft:${id}`;
      const [prior] = await tx
        .select()
        .from(idempotency)
        .where(
          and(eq(idempotency.scope, scope), eq(idempotency.key, mutation)),
        );
      if (prior) {
        if (prior.requestHash !== requestHash)
          throw new AppError(
            409,
            "This save identifier was already used for different changes.",
          );
        return prior.result as { version: number };
      }
      if (w.version !== version)
        throw new AppError(
          409,
          "Another tab saved a newer version. Your changes are still here. Review the saved version before replacing them.",
        );
      if (w.slug !== slug) {
        const error = domainError(slug);
        if (error) throw new AppError(422, error);
      }
      const [collision] = await tx
        .select({ id: weddings.id })
        .from(weddings)
        .where(eq(weddings.slug, slug));
      if (collision && collision.id !== id)
        throw new AppError(422, "That link is already taken. Choose another.");
      const [previous] = await tx
        .select()
        .from(drafts)
        .where(eq(drafts.weddingId, id));
      if (!previous) throw new AppError(404, "Draft not found.");
      const ownedPhotos = await tx
        .select()
        .from(assets)
        .where(eq(assets.weddingId, id));
      if (
        content.photos.some(
          (photo) =>
            !ownedPhotos.some(
              (a) =>
                a.id === photo &&
                a.ownerId === ownerId &&
                ["ready", "retained"].includes(a.status),
            ),
        )
      )
        throw new AppError(400, "Choose only your completed photos.");
      const removed = previous.content.photos.filter(
        (photo) => !content.photos.includes(photo),
      );
      const activePhotos = ownedPhotos.filter(
        (a) =>
          ["pending", "processing"].includes(a.status) ||
          content.photos.includes(a.id) ||
          (a.status === "ready" && !removed.includes(a.id)),
      );
      if (activePhotos.length > 5)
        throw new AppError(
          400,
          "Keep up to five photos, including uploads in progress.",
        );
      if (removed.length)
        await tx
          .update(assets)
          .set({ status: "retained" })
          .where(and(eq(assets.weddingId, id), inArray(assets.id, removed)));
      if (content.photos.length)
        await tx
          .update(assets)
          .set({ status: "ready" })
          .where(
            and(eq(assets.weddingId, id), inArray(assets.id, content.photos)),
          );
      await tx.update(drafts).set({ content }).where(eq(drafts.weddingId, id));
      await syncEvents(tx, id, content);
      await tx
        .update(weddings)
        .set({ version: version + 1, updatedAt: new Date(), slug })
        .where(eq(weddings.id, id));
      const result = { version: version + 1 };
      await tx.insert(idempotency).values({
        scope,
        key: mutation,
        requestHash,
        result,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });
      return result;
    })
    .catch((error: unknown) => {
      // The unique constraint settles simultaneous claims after both checks pass.
      let cause = error;
      while (cause && typeof cause === "object") {
        if (
          "code" in cause &&
          cause.code === "23505" &&
          "constraint" in cause &&
          cause.constraint === "weddings_slug_unique"
        )
          throw new AppError(
            422,
            "That link is already taken. Choose another.",
          );
        cause = "cause" in cause ? cause.cause : undefined;
      }
      throw error;
    });
}
export async function prepareRevision(
  tx: Transaction,
  weddingId: string,
  version: number,
) {
  const [draft] = await tx
    .select()
    .from(drafts)
    .where(eq(drafts.weddingId, weddingId));
  if (!draft) throw new AppError(404, "Draft not found.");
  const content = publicationSchema.parse(draft.content);
  if (content.photos.length) {
    const ready = await tx
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.weddingId, weddingId),
          eq(assets.status, "ready"),
          inArray(assets.id, content.photos),
        ),
      );
    if (ready.length !== content.photos.length)
      throw new AppError(
        400,
        "Wait for your photos to finish processing or remove them before publishing.",
      );
  }
  const [existing] = await tx
    .select()
    .from(revisions)
    .where(
      and(
        eq(revisions.weddingId, weddingId),
        eq(revisions.draftVersion, version),
      ),
    );
  if (existing) return existing;
  const [revision] = await tx
    .insert(revisions)
    .values({ weddingId, draftVersion: version, content })
    .returning();
  if (content.photos.length)
    await tx
      .insert(revisionAssets)
      .values(
        content.photos.map((assetId) => ({ assetId, revisionId: revision.id })),
      );
  return revision;
}
export async function publishUpdates(
  ownerId: string,
  id: string,
  version: number,
) {
  return db().transaction(async (tx) => {
    const [w] = await tx
      .select()
      .from(weddings)
      .where(and(eq(weddings.id, id), eq(weddings.ownerId, ownerId)))
      .for("update");
    if (!w || !w.publishedRevisionId)
      throw new AppError(404, "A published invitation is required.");
    if (!isActive(w.expiresAt))
      throw new AppError(410, "This invitation has expired.");
    if (w.version !== version)
      throw new AppError(
        409,
        "Save and review the latest changes before publishing.",
      );
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.weddingId, id));
    if (order?.paymentState !== "captured")
      throw new AppError(
        409,
        "Publication is paused. Contact support about this payment.",
      );
    const revision = await prepareRevision(tx, id, version);
    await tx
      .update(weddings)
      .set({ publishedRevisionId: revision.id })
      .where(eq(weddings.id, id));
    await tx.insert(audit).values({
      actorId: ownerId,
      action: "publish_updates",
      targetId: id,
      outcome: "published",
    });
    return { published: true };
  });
}
export async function publicWedding(slug: string) {
  const [w] = await db()
    .select({
      id: weddings.id,
      slug: weddings.slug,
      expiresAt: weddings.expiresAt,
      content: revisions.content,
      revisionId: revisions.id,
    })
    .from(weddings)
    .innerJoin(
      revisions,
      and(
        eq(revisions.id, weddings.publishedRevisionId),
        eq(revisions.weddingId, weddings.id),
      ),
    )
    .innerJoin(
      orders,
      and(
        eq(orders.weddingId, weddings.id),
        eq(orders.paymentState, "captured"),
      ),
    )
    .where(
      and(
        eq(weddings.slug, slug),
        sql`${weddings.expiresAt} > now()`,
        sql`${weddings.purgedAt} IS NULL`,
      ),
    );
  if (!w) return null;
  return {
    ...w,
    content: {
      ...w.content,
      events: w.content.events.filter((e) => !e.archived),
      hosts: w.content.hosts.filter((h) => h.public),
    },
  };
}
