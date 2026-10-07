import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { responseSchema, type GuestResponse } from "@/lib/domain";
import { db } from "./db";
import {
  analytics,
  idempotency,
  orders,
  revisions,
  rsvpCounts,
  rsvps,
  weddings,
} from "./db/schema";
import { AppError, hash } from "./security";
import { ownerWedding } from "./weddings";
export async function saveResponse(
  slug: string,
  raw: unknown,
  token: string,
  key: string,
  expectedVersion?: number,
) {
  const data = responseSchema.parse(raw);
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new AppError(400, "Invalid private response link.");
  const tokenHash = hash(token),
    requestHash = hash(JSON.stringify({ data, expectedVersion }));
  return db().transaction(async (tx) => {
    // Serializes lifecycle/publication checks with the write; expiry is checked in the SQL statement too.
    const [w] = await tx
      .select()
      .from(weddings)
      .where(
        and(
          eq(weddings.slug, slug),
          sql`${weddings.expiresAt} > now()`,
          sql`${weddings.purgedAt} IS NULL`,
        ),
      )
      .for("update");
    if (!w?.publishedRevisionId || !w.expiresAt || w.expiresAt <= new Date())
      throw new AppError(
        410,
        "This invitation is no longer accepting responses.",
      );
    const [entitlement] = await tx
      .select()
      .from(orders)
      .where(
        and(eq(orders.weddingId, w.id), eq(orders.paymentState, "captured")),
      );
    if (!entitlement)
      throw new AppError(410, "This invitation is unavailable.");
    const scope = `rsvp:${w.id}:${tokenHash}`;
    const [prior] = await tx
      .select()
      .from(idempotency)
      .where(and(eq(idempotency.scope, scope), eq(idempotency.key, key)));
    if (prior) {
      if (prior.requestHash !== requestHash)
        throw new AppError(
          409,
          "This submission was already used for different answers. Please submit again.",
        );
      return prior.result as { id: string; version: number };
    }
    const [revision] = await tx
      .select()
      .from(revisions)
      .where(eq(revisions.id, w.publishedRevisionId));
    const active = new Set(
      revision.content.events.filter((e) => !e.archived).map((e) => e.id),
    );
    if (Object.keys(data.counts).some((id) => !active.has(id)))
      throw new AppError(
        409,
        "The event list has changed. Reload the invitation and review your selections; your response has not been changed.",
      );
    const [existing] = await tx
      .select()
      .from(rsvps)
      .where(eq(rsvps.tokenHash, tokenHash));
    if (
      existing &&
      (existing.weddingId !== w.id || expectedVersion !== existing.version)
    )
      throw new AppError(
        409,
        "Your response has a newer version. Reopen your private edit link to review it.",
      );
    let result: { id: string; version: number };
    if (existing) {
      [result] = await tx
        .update(rsvps)
        .set({
          family: data.family,
          attending: data.attending,
          note: data.note,
          version: existing.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(rsvps.id, existing.id))
        .returning({ id: rsvps.id, version: rsvps.version });
      await tx
        .delete(rsvpCounts)
        .where(
          and(
            eq(rsvpCounts.rsvpId, existing.id),
            inArray(rsvpCounts.eventId, [...active]),
          ),
        );
    } else {
      if (expectedVersion) throw new AppError(404, "Response not found.");
      [result] = await tx
        .insert(rsvps)
        .values({
          weddingId: w.id,
          family: data.family,
          attending: data.attending,
          note: data.note,
          tokenHash,
        })
        .returning({ id: rsvps.id, version: rsvps.version });
    }
    if (data.attending)
      await tx.insert(rsvpCounts).values(
        Object.entries(data.counts).map(([eventId, count]) => ({
          weddingId: w.id,
          rsvpId: result.id,
          eventId,
          count,
        })),
      );
    await tx
      .insert(idempotency)
      .values({ scope, key, requestHash, result, expiresAt: w.expiresAt! });
    await tx
      .insert(analytics)
      .values({
        key: `rsvp:${result.id}`,
        weddingId: w.id,
        kind: "rsvp_submitted",
      })
      .onConflictDoNothing();
    return result;
  });
}
export async function responseFromToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new AppError(404, "Private response link not found.");
  const [row] = await db()
    .select({ response: rsvps, slug: weddings.slug })
    .from(rsvps)
    .innerJoin(weddings, eq(weddings.id, rsvps.weddingId))
    .innerJoin(
      orders,
      and(
        eq(orders.weddingId, weddings.id),
        eq(orders.paymentState, "captured"),
      ),
    )
    .where(
      and(eq(rsvps.tokenHash, hash(token)), sql`${weddings.expiresAt} > now()`),
    );
  if (!row)
    throw new AppError(
      404,
      "This private response link is invalid or expired.",
    );
  const counts = await db()
    .select()
    .from(rsvpCounts)
    .where(eq(rsvpCounts.rsvpId, row.response.id));
  return {
    id: row.response.id,
    version: row.response.version,
    slug: row.slug,
    family: row.response.family,
    attending: row.response.attending,
    note: row.response.note,
    counts: Object.fromEntries(counts.map((c) => [c.eventId, c.count])),
  };
}
export async function ownerResponses(
  ownerId: string,
  weddingId: string,
  search = "",
  page = 1,
  exportAll = false,
) {
  await ownerWedding(ownerId, weddingId);
  const filter = and(
    eq(rsvps.weddingId, weddingId),
    search
      ? ilike(
          rsvps.family,
          `%${search.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
        )
      : undefined,
  );
  const rows = await db()
    .select({
      id: rsvps.id,
      family: rsvps.family,
      attending: rsvps.attending,
      note: rsvps.note,
      createdAt: rsvps.createdAt,
      updatedAt: rsvps.updatedAt,
    })
    .from(rsvps)
    .where(filter)
    .orderBy(desc(rsvps.createdAt))
    .limit(exportAll ? 10000 : 25)
    .offset(exportAll ? 0 : (page - 1) * 25);
  const counts = await db()
    .select()
    .from(rsvpCounts)
    .where(eq(rsvpCounts.weddingId, weddingId));
  const [totals] = await db()
    .select({
      responses: sql<number>`count(*)::int`,
      attending: sql<number>`count(*) filter (where ${rsvps.attending})::int`,
      declines: sql<number>`count(*) filter (where not ${rsvps.attending})::int`,
    })
    .from(rsvps)
    .where(eq(rsvps.weddingId, weddingId));
  const [filtered] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(rsvps)
    .where(filter);
  if (exportAll && filtered.count > 10000)
    throw new AppError(
      413,
      "This invitation has more than 10,000 responses. Contact support for a complete export; no partial file has been generated.",
    );
  const [visits] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(analytics)
    .where(
      and(
        eq(analytics.weddingId, weddingId),
        eq(analytics.kind, "invitation_opened"),
      ),
    );
  return {
    rows: rows.map((r) => ({
      ...r,
      counts: Object.fromEntries(
        counts
          .filter((c) => c.rsvpId === r.id)
          .map((c) => [c.eventId, c.count]),
      ),
    })),
    totals,
    total: filtered.count,
    visits: visits.count,
    eventTotals: counts.reduce<Record<string, number>>(
      (acc, c) => ({ ...acc, [c.eventId]: (acc[c.eventId] || 0) + c.count }),
      {},
    ),
  };
}
export async function deleteResponse(
  ownerId: string,
  weddingId: string,
  id: string,
) {
  await ownerWedding(ownerId, weddingId);
  await db()
    .delete(rsvps)
    .where(and(eq(rsvps.weddingId, weddingId), eq(rsvps.id, id)));
}
export type ResponseRow = GuestResponse & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
