import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { AppError, endpoint, equal, response } from "@/server/security";
export async function GET(req: Request) {
  return endpoint(async () => {
    const secret = env().CRON_SECRET;
    if (
      !secret ||
      !equal(req.headers.get("authorization") || "", `Bearer ${secret}`)
    )
      throw new AppError(401, "Unauthorized.");
    const metrics = await db().execute(sql`SELECT
      (SELECT count(*)::int FROM outbox_jobs WHERE state = 'dead') AS dead_jobs,
      (SELECT count(*)::int FROM outbox_jobs WHERE state = 'running' AND lease_until < now()) AS expired_leases,
      (SELECT count(*)::int FROM outbox_jobs WHERE state = 'pending' AND due_at < now() - interval '5 minutes') AS overdue_jobs,
      (SELECT count(*)::int FROM orders WHERE payment_state = 'captured' AND fulfillment <> 'published' AND created_at < now() - interval '5 minutes') AS paid_unpublished,
      (SELECT count(*)::int FROM orders WHERE payment_state IN ('refunded', 'disputed')) AS payment_reviews`);
    const m = metrics.rows[0];
    const degraded =
      Number(m.dead_jobs) > 0 ||
      Number(m.expired_leases) > 0 ||
      Number(m.overdue_jobs) > 0 ||
      Number(m.paid_unpublished) > 0;
    return response(
      { status: degraded ? "degraded" : "ok", ...m },
      degraded ? 503 : 200,
    );
  });
}
