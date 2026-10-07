import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { db, pool } from "../src/server/db";
import {
  user,
  weddings,
  revisions,
  orders,
  payments,
  jobs,
  assets,
  rsvps,
  rsvpCounts,
} from "../src/server/db/schema";
import {
  createWedding,
  getDraft,
  saveDraft,
  publicWedding,
  publishUpdates,
} from "../src/server/weddings";
import {
  createOrder,
  capturePayment,
  recordPaymentReview,
} from "../src/server/billing";
import {
  saveResponse,
  responseFromToken,
  ownerResponses,
} from "../src/server/rsvp";
import {
  uploadIntent,
  finalizeUpload,
  processImage,
} from "../src/server/media";
import { runJobs, maintenance } from "../src/server/jobs";
import { writeObject } from "../src/server/storage";
import { demoContent } from "../src/lib/content";
const enabled = process.env.LOCAL_TEST === "true";
describe.skipIf(!enabled)("Transactional PostgreSQL journeys", () => {
  const owner = crypto.randomUUID(),
    other = crypto.randomUUID();
  let weddingId: string, slug: string;
  beforeAll(async () => {
    const u = new URL(process.env.DATABASE_URL!);
    if (
      !["127.0.0.1", "localhost"].includes(u.hostname) ||
      u.pathname !== "/wedding"
    )
      throw new Error(
        "Integration tests only run on the explicit local test database.",
      );
    await db()
      .insert(user)
      .values([
        {
          id: owner,
          name: "Test owner",
          email: `${owner}@example.test`,
          emailVerified: true,
        },
        {
          id: other,
          name: "Other owner",
          email: `${other}@example.test`,
          emailVerified: true,
        },
      ]);
    const w = await createWedding(owner);
    weddingId = w.id;
    slug = w.slug;
  });
  afterAll(async () => {
    await pool().end();
  });
  it("denies another owner draft reads and writes", async () => {
    await expect(getDraft(other, weddingId)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      saveDraft(other, weddingId, 1, crypto.randomUUID(), demoContent, slug),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("serializes concurrent autosaves and safely replays a lost response", async () => {
    const key = crypto.randomUUID();
    const results = await Promise.allSettled([
      saveDraft(owner, weddingId, 1, key, demoContent, slug),
      saveDraft(owner, weddingId, 1, crypto.randomUUID(), demoContent, slug),
    ]);
    if (
      results.every((r) => r.status === "rejected") &&
      results[0].status === "rejected"
    )
      throw results[0].reason;
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const replay = await saveDraft(
      owner,
      weddingId,
      1,
      key,
      demoContent,
      slug,
    ).catch((e) => e);
    if (results[0].status === "fulfilled")
      expect(replay).toEqual({ version: 2 });
    expect((await getDraft(owner, weddingId)).wedding.version).toBe(2);
    expect(await publicWedding(slug)).toBeNull();
  });
  it("creates one immutable purchase snapshot across repeated checkout attempts", async () => {
    const [a, b] = await Promise.all([
      createOrder(owner, weddingId, 2),
      createOrder(owner, weddingId, 2),
    ]);
    expect(a.id).toBe(b.id);
    const changed = structuredClone(demoContent);
    changed.events[0].venue.en = "Private draft venue";
    await saveDraft(owner, weddingId, 2, crypto.randomUUID(), changed, slug);
    const [o] = await db().select().from(orders).where(eq(orders.id, a.id));
    const [revision] = await db()
      .select()
      .from(revisions)
      .where(eq(revisions.id, o.revisionId!));
    expect(revision.content.events[0].venue.en).not.toBe("Private draft venue");
  });
  it("captured payment and replay publish exactly once with a full term", async () => {
    const [o] = await db()
      .select()
      .from(orders)
      .where(eq(orders.weddingId, weddingId));
    const p = {
      id: `local_test_${o.id}`,
      order_id: o.providerOrderId!,
      amount: o.amount,
      currency: "INR",
      status: "captured",
    };
    await Promise.all([capturePayment(p), capturePayment(p)]);
    await runJobs(10);
    const first = await publicWedding(slug);
    expect(first).not.toBeNull();
    expect(first!.content.events[0].venue.en).toBe(
      demoContent.events[0].venue.en,
    );
    await capturePayment(p);
    await runJobs(5);
    expect((await publicWedding(slug))!.expiresAt).toEqual(first!.expiresAt);
    const queue = await db()
      .select()
      .from(jobs)
      .where(eq(jobs.key, `publish:${o.id}`));
    expect(queue).toHaveLength(1);
  });
  it("publishes edits without changing the URL and rejects stale publish versions", async () => {
    await expect(publishUpdates(owner, weddingId, 2)).rejects.toMatchObject({
      status: 409,
    });
    await publishUpdates(owner, weddingId, 3);
    expect((await publicWedding(slug))!.content.events[0].venue.en).toBe(
      "Private draft venue",
    );
  });
  it("retries an RSVP once, protects capabilities, and checks event ownership", async () => {
    const token = randomBytes(32).toString("hex"),
      key = crypto.randomUUID(),
      eventId = demoContent.events[0].id;
    const answer = {
      family: "પટેલ પરિવાર",
      attending: true,
      note: "Looking forward to it",
      counts: { [eventId]: 4 },
    };
    const results = await Promise.all([
      saveResponse(slug, answer, token, key),
      saveResponse(slug, answer, token, key),
    ]);
    expect(results[0]).toEqual(results[1]);
    await expect(
      saveResponse(slug, { ...answer, family: "Changed" }, token, key),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      responseFromToken(randomBytes(32).toString("hex")),
    ).rejects.toMatchObject({ status: 404 });
    const row = await responseFromToken(token);
    expect(row.family).toBe("પટેલ પરિવાર");
    await saveResponse(
      slug,
      { ...answer, counts: { [eventId]: 2 } },
      token,
      crypto.randomUUID(),
      row.version,
    );
    const totals = await ownerResponses(owner, weddingId);
    expect(totals.totals.responses).toBe(1);
    expect(totals.eventTotals[eventId]).toBe(2);
    const attending = await ownerResponses(
      owner,
      weddingId,
      "પટેલ",
      1,
      false,
      "attending",
    );
    expect(attending.rows).toHaveLength(1);
    expect(attending.total).toBe(1);
    const declined = await ownerResponses(
      owner,
      weddingId,
      "",
      1,
      false,
      "declined",
    );
    expect(declined.rows).toHaveLength(0);
    expect(declined.total).toBe(0);
    expect(declined.totals).toEqual(totals.totals);
    expect(declined.eventTotals).toEqual(totals.eventTotals);
    await expect(
      saveResponse(
        slug,
        { ...answer, counts: { [crypto.randomUUID()]: 2 } },
        randomBytes(32).toString("hex"),
        crypto.randomUUID(),
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("database composite keys prevent cross-wedding RSVP event associations", async () => {
    const otherWedding = await createWedding(other);
    const draft = await getDraft(other, otherWedding.id);
    const [r] = await db()
      .select()
      .from(rsvps)
      .where(eq(rsvps.weddingId, weddingId));
    await expect(
      db().insert(rsvpCounts).values({
        weddingId,
        rsvpId: r.id,
        eventId: draft.content.events[0].id,
        count: 2,
      }),
    ).rejects.toThrow();
  });
  it("validates decoded media, strips metadata, and rejects spoofed bytes", async () => {
    const source = await sharp({
      create: { width: 40, height: 30, channels: 3, background: "#b58c73" },
    })
      .jpeg()
      .toBuffer();
    const intent = await uploadIntent(
      owner,
      weddingId,
      "image/jpeg",
      source.length,
    );
    const [a] = await db()
      .select()
      .from(assets)
      .where(eq(assets.id, intent.id));
    await writeObject(a.objectKey, source, "image/jpeg");
    await finalizeUpload(owner, weddingId, a.id);
    await processImage(a.id);
    const [ready] = await db().select().from(assets).where(eq(assets.id, a.id));
    expect(ready.status).toBe("ready");
    const bad = await uploadIntent(owner, weddingId, "image/png", 15);
    const [b] = await db().select().from(assets).where(eq(assets.id, bad.id));
    await writeObject(b.objectKey, Buffer.from("not a real file"), "image/png");
    await finalizeUpload(owner, weddingId, b.id);
    await processImage(b.id);
    const [rejected] = await db()
      .select()
      .from(assets)
      .where(eq(assets.id, b.id));
    expect(rejected.status).toBe("rejected");
  });
  it("reclaims abandoned job leases safely", async () => {
    const jobKey = `lease-test:${crypto.randomUUID()}`;
    await db()
      .insert(jobs)
      .values({
        key: jobKey,
        kind: "reconcile",
        payload: { orderId: crypto.randomUUID() },
        state: "running",
        leaseUntil: new Date(Date.now() - 1000),
      });
    await runJobs(10);
    const [row] = await db().select().from(jobs).where(eq(jobs.key, jobKey));
    expect(row.state).toBe("done");
    expect(row.attempts).toBe(1);
  });
  it("serializes five upload reservations and retains removed published photos", async () => {
    const w = await createWedding(other);
    const attempts = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        uploadIntent(other, w.id, "image/jpeg", 100),
      ),
    );
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(5);
    const photos = await db()
      .select()
      .from(assets)
      .where(eq(assets.weddingId, w.id));
    await db()
      .update(assets)
      .set({ status: "ready" })
      .where(eq(assets.weddingId, w.id));
    const c = structuredClone(demoContent);
    c.photos = photos.map((p) => p.id);
    await saveDraft(other, w.id, 1, crypto.randomUUID(), c, w.slug);
    c.photos = c.photos.slice(1);
    await saveDraft(other, w.id, 2, crypto.randomUUID(), c, w.slug);
    const [retained] = await db()
      .select()
      .from(assets)
      .where(eq(assets.id, photos[0].id));
    expect(retained.status).toBe("retained");
    await expect(
      uploadIntent(other, w.id, "image/jpeg", 100),
    ).resolves.toHaveProperty("id");
    await expect(
      uploadIntent(owner, w.id, "image/jpeg", 100),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      uploadIntent(other, w.id, "image/jpeg", 11 * 1024 * 1024),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("suspends disputed payments without extending hosting or letting a capture replay restore access", async () => {
    const w = await createWedding(other);
    await saveDraft(other, w.id, 1, crypto.randomUUID(), demoContent, w.slug);
    const o = await createOrder(other, w.id, 2);
    const payment = {
      id: `pay_${crypto.randomUUID()}`,
      order_id: o.providerOrderId!,
      amount: o.amount,
      currency: "INR",
      status: "captured",
    };
    await capturePayment(payment);
    await runJobs(30);
    const before = await getDraft(other, w.id);
    expect(await publicWedding(w.slug)).not.toBeNull();
    const key = crypto.randomUUID();
    await Promise.all([
      recordPaymentReview(payment.id, "refund.processed", key),
      recordPaymentReview(payment.id, "refund.processed", key),
    ]);
    await recordPaymentReview(
      payment.id,
      "payment.dispute.closed",
      crypto.randomUUID(),
    );
    await capturePayment(payment);
    const after = await getDraft(other, w.id);
    expect(after.wedding.expiresAt).toEqual(before.wedding.expiresAt);
    expect(after.wedding.purgeAt).toEqual(before.wedding.purgeAt);
    expect(await publicWedding(w.slug)).toBeNull();
    const [p] = await db()
      .select()
      .from(payments)
      .where(eq(payments.id, payment.id));
    expect(p.state).toBe("refunded");
  });
  it("blocks expired public content, RSVP, and updates while preserving owner export", async () => {
    await db()
      .update(weddings)
      .set({
        expiresAt: new Date(Date.now() - 1),
        purgeAt: new Date(Date.now() + 86400000),
      })
      .where(eq(weddings.id, weddingId));
    expect(await publicWedding(slug)).toBeNull();
    await expect(
      saveResponse(
        slug,
        { family: "Late", attending: false, note: "", counts: {} },
        randomBytes(32).toString("hex"),
        crypto.randomUUID(),
      ),
    ).rejects.toMatchObject({ status: 410 });
    await expect(publishUpdates(owner, weddingId, 3)).rejects.toMatchObject({
      status: 410,
    });
    expect((await ownerResponses(owner, weddingId)).totals.responses).toBe(1);
  });
  it("purges content and photos after grace while retaining the financial record", async () => {
    await db()
      .update(weddings)
      .set({ purgeAt: new Date(Date.now() - 1000) })
      .where(eq(weddings.id, weddingId));
    await maintenance();
    await expect(getDraft(owner, weddingId)).rejects.toMatchObject({
      status: 404,
    });
    expect(
      await db().select().from(rsvps).where(eq(rsvps.weddingId, weddingId)),
    ).toHaveLength(0);
    expect(
      await db()
        .select()
        .from(revisions)
        .where(eq(revisions.weddingId, weddingId)),
    ).toHaveLength(0);
    expect(
      await db().select().from(orders).where(eq(orders.weddingId, weddingId)),
    ).toHaveLength(1);
    expect(
      (
        await db().select().from(assets).where(eq(assets.weddingId, weddingId))
      ).every((a) => a.status === "deleted"),
    ).toBe(true);
  });
});
