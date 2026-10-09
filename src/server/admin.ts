import "server-only";
import { currentUser } from "./auth";
import { pool } from "./db";
import { AppError } from "./security";
import {
  ADMIN_EMAIL,
  isAdmin,
  type AdminCustomer,
  type AdminFilters,
} from "@/lib/admin";

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) throw new AppError(401, "Please sign in to continue.");
  if (!isAdmin(user)) throw new AppError(403, "Administrator access required.");
  return user;
}

// Aggregate each relation first: joining orders and invitations directly would
// multiply revenue and counts for customers with several invitations.
const customersSql = `WITH login_history AS (
  SELECT actor_id AS user_id, max(created_at) AS last_login
  FROM audit_events WHERE action = 'auth.sign_in' AND outcome = 'success' GROUP BY actor_id
), sessions AS (
  SELECT user_id, max(created_at) AS last_login, max(updated_at) AS last_active FROM session GROUP BY user_id
), invitations AS (
  SELECT owner_id, count(*)::int AS invitations,
    count(*) FILTER (WHERE first_published_at IS NOT NULL)::int AS published,
    max(updated_at) AS last_active FROM weddings GROUP BY owner_id
), purchases AS (
  SELECT owner_id,
    count(*) FILTER (WHERE payment_state = 'captured')::int AS paid,
    count(*) FILTER (WHERE payment_state IN ('captured', 'refunded', 'disputed'))::int AS purchases,
    count(*) FILTER (WHERE payment_state IN ('creating', 'pending'))::int AS pending,
    count(*) FILTER (WHERE payment_state IN ('refunded', 'disputed'))::int AS reviews,
    coalesce(sum(amount) FILTER (WHERE payment_state = 'captured'), 0)::float8 AS revenue,
    max(created_at) AS last_active FROM orders GROUP BY owner_id
), customers AS (
  SELECT u.id, u.name, u.email, u.email_verified AS verified, u.created_at AS joined,
    greatest(l.last_login, s.last_login) AS "lastLogin",
    greatest(l.last_login, s.last_active, i.last_active, p.last_active) AS "lastActive",
    coalesce(i.invitations, 0) AS invitations, coalesce(i.published, 0) AS published,
    coalesce(p.paid, 0) AS paid, coalesce(p.purchases, 0) AS purchases,
    coalesce(p.pending, 0) AS pending, coalesce(p.reviews, 0) AS reviews,
    coalesce(p.revenue, 0) AS revenue
  FROM "user" u LEFT JOIN login_history l ON l.user_id = u.id
  LEFT JOIN sessions s ON s.user_id = u.id
  LEFT JOIN invitations i ON i.owner_id = u.id
  LEFT JOIN purchases p ON p.owner_id = u.id
  WHERE lower(trim(u.email)) <> $1
), filtered AS (
  SELECT * FROM customers WHERE
    ($2 = '' OR position(lower($2) in lower(name)) > 0 OR position(lower($2) in lower(email)) > 0)
    AND (CASE $3
      WHEN 'paid' THEN paid > 0
      WHEN 'active' THEN "lastActive" >= now() - interval '30 days'
      WHEN 'unpaid' THEN purchases = 0 AND "lastLogin" IS NOT NULL
      WHEN 'checkout' THEN purchases = 0 AND pending > 0
      WHEN 'review' THEN reviews > 0
      ELSE true END)
)`;

export type AdminReport = {
  rows: AdminCustomer[];
  total: number;
  summary: {
    accounts: number;
    paid: number;
    active: number;
    unpaid: number;
    checkout: number;
    revenue: number;
  };
};
export const PAGE_SIZE = 50;
export async function adminReport(filters: AdminFilters): Promise<AdminReport> {
  await requireAdmin();
  const result = await pool().query<AdminReport>(
    `${customersSql}
    SELECT (SELECT count(*)::int FROM filtered) AS total,
      (SELECT json_build_object(
        'accounts', count(*), 'paid', count(*) FILTER (WHERE paid > 0),
        'active', count(*) FILTER (WHERE "lastActive" >= now() - interval '30 days'),
        'unpaid', count(*) FILTER (WHERE purchases = 0 AND "lastLogin" IS NOT NULL),
        'checkout', count(*) FILTER (WHERE purchases = 0 AND pending > 0),
        'revenue', coalesce(sum(revenue), 0)) FROM customers) AS summary,
      coalesce((SELECT json_agg(r) FROM (
        SELECT * FROM filtered ORDER BY joined DESC, id LIMIT $4 OFFSET $5
      ) r), '[]'::json) AS rows`,
    [
      ADMIN_EMAIL,
      filters.q,
      filters.segment,
      PAGE_SIZE,
      (filters.page - 1) * PAGE_SIZE,
    ],
  );
  return result.rows[0];
}

export async function exportCustomers(
  filters: AdminFilters,
): Promise<AdminCustomer[]> {
  await requireAdmin();
  // JSON keeps timestamp serialization identical to the dashboard.
  const result = await pool().query<{ customer: AdminCustomer }>(
    `${customersSql}
    SELECT row_to_json(r) AS customer FROM (SELECT * FROM filtered ORDER BY joined DESC, id) r`,
    [ADMIN_EMAIL, filters.q, filters.segment],
  );
  return result.rows.map((row) => row.customer);
}
