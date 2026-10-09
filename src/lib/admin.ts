export const ADMIN_EMAIL = "feneelp@gmail.com";

export function isAdmin(
  user: { email: string; emailVerified: boolean } | null,
) {
  return (
    !!user?.emailVerified && user.email.trim().toLowerCase() === ADMIN_EMAIL
  );
}

export const segments = {
  all: "All accounts",
  paid: "Paid customers",
  active: "Active in 30 days",
  unpaid: "Signed in, never bought",
  checkout: "Unfinished checkout",
  review: "Refunded / disputed",
} as const;
export type Segment = keyof typeof segments;
export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  joined: string;
  lastLogin: string | null;
  lastActive: string | null;
  invitations: number;
  published: number;
  paid: number;
  purchases: number;
  pending: number;
  reviews: number;
  revenue: number;
};
export type AdminFilters = { q: string; segment: Segment; page: number };
export function adminFilters(params: URLSearchParams): AdminFilters {
  const segment = params.get("segment") || "all";
  const page = Number(params.get("page") || 1);
  return {
    q: (params.get("q") || "").trim().slice(0, 200),
    segment: Object.hasOwn(segments, segment) ? (segment as Segment) : "all",
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1000000) : 1,
  };
}

export function customerCsv(rows: AdminCustomer[]) {
  const escape = (value: unknown) => {
    let text = String(value ?? "");
    // Quoting alone does not prevent spreadsheet formula execution.
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      [
        "Name",
        "Email",
        "Email verified",
        "Joined",
        "Last recorded sign-in",
        "Last activity",
        "Invitations",
        "Published",
        "Paid orders",
        "Pending orders",
        "Refunds / disputes",
        "Captured INR",
      ],
      ...rows.map((r) => [
        r.name,
        r.email,
        r.verified,
        r.joined,
        r.lastLogin,
        r.lastActive,
        r.invitations,
        r.published,
        r.paid,
        r.pending,
        r.reviews,
        (r.revenue / 100).toFixed(2),
      ]),
    ]
      .map((row) => row.map(escape).join(","))
      .join("\r\n")
  );
}
