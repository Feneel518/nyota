import { and, eq } from "drizzle-orm";
import { z } from "zod";
import QRCode from "qrcode";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { assets, events, orders } from "@/server/db/schema";
import { env, localOnly } from "@/server/env";
import {
  getDraft,
  ownerWedding,
  publishUpdates,
  saveDraft,
  checkDomain,
} from "@/server/weddings";
import {
  createOrder,
  capturePayment,
  reconcileOrder,
  verifyCallback,
} from "@/server/billing";
import { deleteResponse, ownerResponses } from "@/server/rsvp";
import { finalizeUpload, removeAsset, uploadIntent } from "@/server/media";
import { writeObject } from "@/server/storage";
import { runJobs } from "@/server/jobs";
import {
  AppError,
  body,
  boundedBody,
  checkOrigin,
  endpoint,
  rateLimitRequest,
  response,
  verifySignature,
} from "@/server/security";
import { csv } from "@/lib/domain";
import { invitationUrl } from "@/lib/invitation-url";
type Context = { params: Promise<{ id: string; action: string }> };
export async function GET(req: Request, ctx: Context) {
  return endpoint(async () => {
    const { id, action } = await ctx.params;
    z.uuid().parse(id);
    const user = await requireUser();
    await ownerWedding(user.id, id);
    const url = new URL(req.url);
    if (action === "domain") {
      await rateLimitRequest(req, "owner:domain", 90, user.id);
      return response(
        await checkDomain(user.id, id, url.searchParams.get("slug") || ""),
      );
    }
    if (action === "draft") return response(await getDraft(user.id, id));
    if (action === "assets")
      return response(
        await db()
          .select({ id: assets.id, status: assets.status, error: assets.error })
          .from(assets)
          .where(eq(assets.weddingId, id)),
      );
    if (action === "responses")
      return response(
        await ownerResponses(
          user.id,
          id,
          url.searchParams.get("q")?.slice(0, 100) || "",
          Math.max(
            1,
            Math.min(10000, Number(url.searchParams.get("page")) || 1),
          ),
          false,
          z
            .enum(["all", "attending", "declined"])
            .parse(url.searchParams.get("status") || "all"),
        ),
      );
    if (action === "export") {
      const data = await ownerResponses(user.id, id, "", 1, true);
      const labels = await db()
        .select()
        .from(events)
        .where(eq(events.weddingId, id));
      return new Response(
        csv([
          [
            "Family",
            "Status",
            ...labels.map(
              (e) =>
                `${e.title.en || e.title.gu}${e.archived ? " (archived)" : ""}`,
            ),
            "Note",
            "Submitted",
            "Updated",
          ],
          ...data.rows.map((r) => [
            r.family,
            r.attending ? "Attending" : "Declined",
            ...labels.map(
              (e) => r.counts[e.id] || (r.attending ? "No response" : 0),
            ),
            r.note,
            r.createdAt.toISOString(),
            r.updatedAt.toISOString(),
          ]),
        ]),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="wedding-responses.csv"',
            "Cache-Control": "private, no-store",
          },
        },
      );
    }
    if (action === "qr") {
      const w = await ownerWedding(user.id, id);
      if (!w.firstPublishedAt)
        throw new AppError(409, "Publish before sharing.");
      const data = await QRCode.toBuffer(
        invitationUrl(env().APP_URL, w.slug, env().INVITATION_DOMAIN),
        {
          width: 1000,
          margin: 3,
          color: { dark: "#4a1728", light: "#fbf6ef" },
        },
      );
      return new Response(new Uint8Array(data), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition":
            'attachment; filename="wedding-invitation-qr.png"',
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (action === "order") {
      const [order] = await db()
        .select()
        .from(orders)
        .where(eq(orders.weddingId, id));
      return response({
        order: order || null,
        keyId: env().RAZORPAY_KEY_ID,
        local: env().PAYMENT_ADAPTER === "local",
        price: env().PRICE_PAISE,
      });
    }
    throw new AppError(404, "Page not found.");
  });
}
export async function POST(req: Request, ctx: Context) {
  return endpoint(async () => {
    checkOrigin(req);
    const user = await requireUser();
    const { id, action } = await ctx.params;
    z.uuid().parse(id);
    await ownerWedding(user.id, id);
    await rateLimitRequest(req, `owner:${action}`, 90, user.id);
    const data = await body(req);
    if (action === "draft") {
      const input = z
        .object({
          content: z.unknown(),
          version: z.number().int().positive(),
          mutation: z.uuid(),
          slug: z.string(),
        })
        .parse(data);
      return response(
        await saveDraft(
          user.id,
          id,
          input.version,
          input.mutation,
          input.content,
          input.slug,
        ),
      );
    }
    if (action === "publish")
      return response(
        await publishUpdates(
          user.id,
          id,
          z.number().int().positive().parse(data.version),
        ),
      );
    if (action === "order")
      return response(
        await createOrder(
          user.id,
          id,
          z.number().int().positive().parse(data.version),
        ),
      );
    if (
      action === "reconcile" ||
      action === "verify" ||
      action === "local-payment"
    ) {
      const [order] = await db()
        .select()
        .from(orders)
        .where(and(eq(orders.weddingId, id), eq(orders.ownerId, user.id)));
      if (!order) throw new AppError(404, "Order not found.");
      if (action === "local-payment") {
        localOnly();
        if (env().PAYMENT_ADAPTER !== "local")
          throw new AppError(403, "Test payments are disabled.");
        await capturePayment({
          id: `local_payment_${order.id}`,
          order_id: order.providerOrderId!,
          amount: order.amount,
          currency: "INR",
          status: "captured",
        });
      } else if (action === "verify") {
        const input = z
          .object({
            paymentId: z.string().regex(/^pay_[a-zA-Z0-9]+$/),
            signature: z.string(),
          })
          .parse(data);
        if (
          !order.providerOrderId ||
          !verifySignature(
            `${order.providerOrderId}|${input.paymentId}`,
            input.signature,
            env().RAZORPAY_KEY_SECRET!,
          )
        )
          throw new AppError(400, "Payment signature could not be verified.");
        await verifyCallback(order.providerOrderId, input.paymentId);
      } else {
        await rateLimitRequest(req, "reconcile", 6, user.id);
        await reconcileOrder(order.id).catch(() => {});
      }
      await runJobs(3);
      return response({ checked: true });
    }
    if (action === "upload-intent") {
      const input = z
        .object({ type: z.string(), bytes: z.number().int().positive() })
        .parse(data);
      return response(await uploadIntent(user.id, id, input.type, input.bytes));
    }
    if (action === "upload-finalize") {
      const result = await finalizeUpload(
        user.id,
        id,
        z.uuid().parse(data.assetId),
      );
      if (env().APP_MODE === "local") await runJobs(2);
      return response(result);
    }
    if (action === "remove-asset") {
      await removeAsset(user.id, id, z.uuid().parse(data.assetId));
      return response({ removed: true });
    }
    if (action === "delete-response") {
      await deleteResponse(user.id, id, z.uuid().parse(data.responseId));
      return response({ deleted: true });
    }
    throw new AppError(404, "Action not found.");
  });
}
export async function PUT(req: Request, ctx: Context) {
  return endpoint(async () => {
    localOnly();
    checkOrigin(req);
    const user = await requireUser();
    const { id, action } = await ctx.params;
    if (action !== "upload") throw new AppError(404, "Not found.");
    await ownerWedding(user.id, id);
    const assetId = z.uuid().parse(new URL(req.url).searchParams.get("asset"));
    const [a] = await db()
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.id, assetId),
          eq(assets.weddingId, id),
          eq(assets.ownerId, user.id),
          eq(assets.status, "pending"),
        ),
      );
    if (!a) throw new AppError(404, "Upload not found.");
    await writeObject(
      a.objectKey,
      await boundedBody(req, 10 * 1024 * 1024),
      a.type,
    );
    return response({ uploaded: true });
  });
}
