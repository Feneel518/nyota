import sharp, { type Metadata } from "sharp";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { assets, jobs, revisionAssets, weddings } from "./db/schema";
import { AppError } from "./security";
import { env } from "./env";
import {
  deleteObject,
  objectSize,
  readObject,
  signedUpload,
  writeObject,
} from "./storage";
import { ownerWedding } from "./weddings";
export async function uploadIntent(
  ownerId: string,
  weddingId: string,
  type: string,
  bytes: number,
) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(type) ||
    bytes < 1 ||
    bytes > 10 * 1024 * 1024
  )
    throw new AppError(400, "Choose a JPEG, PNG, or WebP photo under 10 MB.");
  const asset = await db().transaction(async (tx) => {
    const [w] = await tx
      .select()
      .from(weddings)
      .where(and(eq(weddings.id, weddingId), eq(weddings.ownerId, ownerId)))
      .for("update");
    if (!w || w.purgedAt || (w.expiresAt && w.expiresAt <= new Date()))
      throw new AppError(404, "Invitation unavailable.");
    const [count] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(assets)
      .where(
        and(
          eq(assets.weddingId, weddingId),
          inArray(assets.status, ["pending", "processing", "ready"]),
        ),
      );
    if (count.count >= 5)
      throw new AppError(
        400,
        "You can add up to five photos. Remove a photo or wait for current uploads.",
      );
    const id = crypto.randomUUID();
    const [a] = await tx
      .insert(assets)
      .values({
        id,
        ownerId,
        weddingId,
        objectKey: `${weddingId}/${id}/source.bin`,
        type,
        bytes,
      })
      .returning();
    return a;
  });
  return {
    id: asset.id,
    url:
      env().STORAGE_ADAPTER === "local"
        ? `/api/weddings/${weddingId}/upload?asset=${asset.id}`
        : await signedUpload(asset.objectKey, type),
    local: env().STORAGE_ADAPTER === "local",
  };
}
export async function finalizeUpload(
  ownerId: string,
  weddingId: string,
  id: string,
) {
  await ownerWedding(ownerId, weddingId);
  const [a] = await db()
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.id, id),
        eq(assets.ownerId, ownerId),
        eq(assets.weddingId, weddingId),
      ),
    );
  if (!a) throw new AppError(404, "Photo not found.");
  if (a.status !== "pending") return { status: a.status };
  if ((await objectSize(a.objectKey)) !== a.bytes) {
    await db()
      .update(assets)
      .set({
        status: "rejected",
        error: "File size changed. Upload this photo again.",
      })
      .where(eq(assets.id, id));
    throw new AppError(
      400,
      "The uploaded file does not match its declared size.",
    );
  }
  await db().transaction(async (tx) => {
    await tx
      .update(assets)
      .set({ status: "processing" })
      .where(and(eq(assets.id, id), eq(assets.status, "pending")));
    await tx
      .insert(jobs)
      .values({ key: `media:${id}`, kind: "media", payload: { assetId: id } })
      .onConflictDoNothing();
  });
  return { status: "processing" };
}
export async function processImage(id: string) {
  const [a] = await db().select().from(assets).where(eq(assets.id, id));
  if (
    !a ||
    a.status === "ready" ||
    a.status === "retained" ||
    a.status === "deleted" ||
    a.status === "rejected"
  )
    return;
  const source = await readObject(a.objectKey, 10 * 1024 * 1024);
  let metadata: Metadata;
  try {
    if (source.length !== a.bytes) throw new Error("Upload size changed");
    metadata = await sharp(source, {
      limitInputPixels: 25000000,
      animated: false,
    }).metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format || "") ||
      (metadata.pages || 1) > 1
    )
      throw new Error("Invalid image");
  } catch {
    await db()
      .update(assets)
      .set({
        status: "rejected",
        error:
          "This photo could not be decoded. Use a non-animated JPEG, PNG, or WebP under 25 megapixels.",
      })
      .where(eq(assets.id, id));
    await deleteObject(a.objectKey);
    return;
  }
  for (const width of [480, 1200]) {
    const data = await sharp(source, { limitInputPixels: 25000000 })
      .rotate()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await writeObject(
      `${a.weddingId}/${a.id}/${width}.webp`,
      data,
      "image/webp",
    );
  }
  await db().transaction(async (tx) => {
    const [w] = await tx
      .select()
      .from(weddings)
      .where(eq(weddings.id, a.weddingId))
      .for("update");
    const [current] = await tx.select().from(assets).where(eq(assets.id, id));
    if (!w || w.purgedAt || current?.status === "deleted") {
      for (const key of [
        a.objectKey,
        `${a.weddingId}/${a.id}/480.webp`,
        `${a.weddingId}/${a.id}/1200.webp`,
      ])
        await deleteObject(key);
      return;
    }
    await tx
      .update(assets)
      .set({ status: "ready", width: metadata.width, height: metadata.height })
      .where(eq(assets.id, id));
  });
}
export async function removeAsset(
  ownerId: string,
  weddingId: string,
  id: string,
) {
  await ownerWedding(ownerId, weddingId);
  const [ref] = await db()
    .select()
    .from(revisionAssets)
    .where(eq(revisionAssets.assetId, id));
  if (ref) return; // Immutable revisions retain media until lifecycle purge.
  const [a] = await db()
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.id, id),
        eq(assets.ownerId, ownerId),
        eq(assets.weddingId, weddingId),
      ),
    );
  if (!a) return;
  await db()
    .insert(jobs)
    .values({
      key: `asset-cleanup:${id}`,
      kind: "asset_cleanup",
      payload: { assetId: id },
      dueAt: new Date(Date.now() + 86400000),
    })
    .onConflictDoNothing();
}
