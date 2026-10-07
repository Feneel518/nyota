import { and, eq } from "drizzle-orm";
import { db } from "./db";
import {
  analytics,
  audit,
  jobs,
  orders,
  payments,
  webhookEvents,
  weddings,
} from "./db/schema";
import { env, localOnly } from "./env";
import { AppError } from "./security";
import { prepareRevision } from "./weddings";
export type ProviderPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
};
async function razorpay(path: string, init?: RequestInit) {
  const e = env();
  if (!e.RAZORPAY_KEY_ID || !e.RAZORPAY_KEY_SECRET)
    throw new AppError(
      503,
      "Checkout is not available yet. Your draft is safe.",
    );
  const result = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${e.RAZORPAY_KEY_ID}:${e.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
    },
    cache: "no-store",
  });
  if (!result.ok)
    throw new AppError(
      502,
      "The payment provider could not confirm the request. Please check the status before retrying.",
    );
  return result.json();
}
export async function createOrder(
  ownerId: string,
  weddingId: string,
  version: number,
) {
  const order = await db().transaction(async (tx) => {
    const [w] = await tx
      .select()
      .from(weddings)
      .where(and(eq(weddings.id, weddingId), eq(weddings.ownerId, ownerId)))
      .for("update");
    if (!w || w.purgedAt) throw new AppError(404, "Invitation not found.");
    const [prior] = await tx
      .select()
      .from(orders)
      .where(eq(orders.weddingId, weddingId));
    if (prior) return { ...prior, existing: true };
    if (w.version !== version)
      throw new AppError(
        409,
        "Save and review your latest changes before checkout.",
      );
    const revision = await prepareRevision(tx, weddingId, version);
    const [row] = await tx
      .insert(orders)
      .values({
        ownerId,
        weddingId,
        revisionId: revision.id,
        amount: env().PRICE_PAISE,
        currency: "INR",
      })
      .returning();
    await tx.insert(jobs).values({
      key: `reconcile:${row.id}`,
      kind: "reconcile",
      payload: { orderId: row.id },
      dueAt: new Date(Date.now() + 60000),
    });
    await tx
      .insert(analytics)
      .values({
        key: `checkout:${row.id}`,
        weddingId,
        kind: "checkout_started",
      });
    return { ...row, existing: false };
  });
  if (order.existing || order.providerOrderId) return order;
  // One provider creation attempt only. An ambiguous response is recovered by receipt lookup.
  let providerId: string;
  if (env().PAYMENT_ADAPTER === "local") {
    localOnly();
    providerId = `local_${order.id}`;
  } else {
    const result = await razorpay("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: order.amount,
        currency: "INR",
        receipt: order.id,
        notes: { wedding_id: weddingId },
      }),
    });
    providerId = result.id;
  }
  const [updated] = await db()
    .update(orders)
    .set({ providerOrderId: providerId, paymentState: "pending" })
    .where(eq(orders.id, order.id))
    .returning();
  return updated;
}
export function validateCapture(
  payment: ProviderPayment,
  order: { providerOrderId: string | null; amount: number; currency: string },
) {
  if (
    payment.order_id !== order.providerOrderId ||
    payment.amount !== order.amount ||
    payment.currency !== order.currency ||
    payment.status !== "captured"
  )
    throw new AppError(
      400,
      "The payment has not been verified as captured for this order.",
    );
}
export async function capturePayment(payment: ProviderPayment) {
  return db().transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.providerOrderId, payment.order_id))
      .for("update");
    if (!order) throw new AppError(404, "Payment order not found.");
    validateCapture(payment, order);
    if (order.paymentState === "refunded" || order.paymentState === "disputed")
      return;
    const [prior] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, payment.id));
    if (prior) return;
    await tx.insert(payments).values({
      id: payment.id,
      orderId: order.id,
      amount: payment.amount,
      state: "captured",
    });
    if (order.paymentState === "captured") {
      await tx.insert(audit).values({
        action: "duplicate_capture",
        targetId: order.id,
        outcome: "support_required",
      });
      return;
    }
    await tx
      .update(orders)
      .set({ paymentState: "captured", fulfillment: "queued" })
      .where(eq(orders.id, order.id));
    await tx
      .insert(jobs)
      .values({
        key: `publish:${order.id}`,
        kind: "publish",
        payload: { orderId: order.id },
      })
      .onConflictDoNothing();
    await tx.insert(audit).values({
      action: "payment_verified",
      targetId: order.id,
      outcome: "captured",
    });
    await tx
      .insert(analytics)
      .values({
        key: `paid:${order.id}`,
        weddingId: order.weddingId,
        kind: "payment_verified",
      })
      .onConflictDoNothing();
  });
}
export async function reconcileOrder(id: string) {
  const [order] = await db().select().from(orders).where(eq(orders.id, id));
  if (!order) return;
  if (env().PAYMENT_ADAPTER === "local") return;
  if (!order.providerOrderId) {
    const found = await razorpay(
      `/orders?receipt=${encodeURIComponent(order.id)}`,
    );
    const matches = (
      found.items as {
        id: string;
        receipt: string;
        amount: number;
        currency: string;
      }[]
    ).filter(
      (o) =>
        o.receipt === order.id &&
        o.amount === order.amount &&
        o.currency === "INR",
    );
    if (matches.length !== 1)
      throw new Error("Ambiguous order needs reconciliation");
    await db()
      .update(orders)
      .set({ providerOrderId: matches[0].id, paymentState: "pending" })
      .where(eq(orders.id, id));
    order.providerOrderId = matches[0].id;
  }
  const data = await razorpay(
    `/orders/${encodeURIComponent(order.providerOrderId)}/payments`,
  );
  for (const payment of data.items as ProviderPayment[])
    if (payment.status === "captured") await capturePayment(payment);
  if (!data.items.some((p: ProviderPayment) => p.status === "captured"))
    throw new Error("Payment not captured yet");
}
export async function verifyCallback(orderId: string, paymentId: string) {
  const payment = (await razorpay(
    `/payments/${encodeURIComponent(paymentId)}`,
  )) as ProviderPayment;
  if (payment.order_id !== orderId)
    throw new AppError(400, "Payment does not belong to this order.");
  await capturePayment(payment);
}

// Refunds/disputes pause public access pending an explicit support decision.
// Preserve the original hosting dates so replayed events cannot change retention.
export async function recordPaymentReview(
  paymentId: string,
  event: string,
  key: string,
) {
  return db().transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));
    if (!payment)
      throw new AppError(409, "Payment event must be reconciled first.");
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .for("update");
    const claimed = await tx
      .insert(webhookEvents)
      .values({ id: key, kind: event })
      .onConflictDoNothing()
      .returning();
    if (!claimed.length) return;
    const state =
      event === "refund.processed" || order.paymentState === "refunded"
        ? "refunded"
        : "disputed";
    await tx
      .select({ id: weddings.id })
      .from(weddings)
      .where(eq(weddings.id, order.weddingId))
      .for("update");
    await tx.update(payments).set({ state }).where(eq(payments.id, paymentId));
    await tx
      .update(orders)
      .set({ paymentState: state, fulfillment: "reversed" })
      .where(eq(orders.id, order.id));
    await tx.insert(audit).values({
      action: event,
      targetId: order.id,
      outcome: "entitlement_suspended_support_review",
    });
  });
}
