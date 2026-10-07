import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { webhookEvents } from "@/server/db/schema";
import { env } from "@/server/env";
import { capturePayment, recordPaymentReview } from "@/server/billing";
import {
  AppError,
  boundedBody,
  endpoint,
  hash,
  response,
  verifySignature,
} from "@/server/security";
export async function POST(req: Request) {
  return endpoint(async () => {
    const raw = (await boundedBody(req, 128000)).toString("utf8");
    const secret = env().RAZORPAY_WEBHOOK_SECRET;
    if (
      !secret ||
      !verifySignature(
        raw,
        req.headers.get("x-razorpay-signature") || "",
        secret,
      )
    )
      throw new AppError(400, "Invalid webhook signature.");
    const input = JSON.parse(raw);
    const event = z.string().parse(input.event);
    const key = req.headers.get("x-razorpay-event-id") || hash(raw);
    const [prior] = await db()
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, key));
    if (prior) return response({ received: true });
    if (event === "payment.captured" || event === "order.paid") {
      const p = z
        .object({
          id: z.string(),
          order_id: z.string(),
          amount: z.number().int(),
          currency: z.string(),
          status: z.string(),
        })
        .parse(input.payload.payment.entity);
      await capturePayment(p);
    }
    if (event === "refund.processed" || event.startsWith("payment.dispute.")) {
      const paymentId =
        input.payload.refund?.entity?.payment_id ||
        input.payload.dispute?.entity?.payment_id;
      if (typeof paymentId !== "string")
        throw new AppError(400, "Missing payment identifier.");
      await recordPaymentReview(paymentId, event, key);
    }
    await db()
      .insert(webhookEvents)
      .values({ id: key, kind: event })
      .onConflictDoNothing();
    return response({ received: true });
  });
}
