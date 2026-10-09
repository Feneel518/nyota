import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { adminReport, PAGE_SIZE } from "@/server/admin";
import { adminFilters, isAdmin, segments } from "@/lib/admin";
import { Brand } from "@/components/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FollowUp } from "@/features/admin/follow-up";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Customer analytics",
  robots: { index: false, follow: false },
};

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : "Not recorded";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=/admin");
  if (!isAdmin(user)) notFound();
  const params = await searchParams;
  const filters = adminFilters(
    new URLSearchParams(
      Object.entries(params).flatMap(([key, value]) =>
        typeof value === "string" ? [[key, value]] : [],
      ),
    ),
  );
  const { rows, total, summary } = await adminReport(filters);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (page: number) =>
    `/admin?${new URLSearchParams({ q: filters.q, segment: filters.segment, page: String(page) })}`;
  if (filters.page > pages) redirect(link(pages));
  const conversion = summary.accounts
    ? ((summary.paid / summary.accounts) * 100).toFixed(1)
    : "0";
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Brand />
        <nav aria-label="Admin navigation">
          <Link href="/dashboard">Your invitations</Link>
          <span>Admin</span>
        </nav>
      </header>
      <main id="main">
        <div className={styles.heading}>
          <div>
            <h1>Behind the celebrations.</h1>
            <p>
              See who is creating, who has paid, and who could use a little
              help.
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href={link(filters.page)}>Refresh data</a>
          </Button>
        </div>
        <section
          className={styles.metrics}
          aria-label="All-time customer overview"
        >
          {[
            ["Accounts", summary.accounts, "Excludes your admin account"],
            ["Paid customers", summary.paid, `${conversion}% of accounts`],
            ["Active in 30 days", summary.active, "Based on recorded activity"],
            ["Never bought", summary.unpaid, "Recorded sign-in, no purchase"],
            ["Unfinished checkout", summary.checkout, "No previous purchase"],
            [
              "Captured revenue",
              money(summary.revenue),
              "Excludes refunds and disputes",
            ],
          ].map(([label, value, note]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
          ))}
        </section>
        <section className={styles.customers} aria-labelledby="customers-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="customers-title">Your customers</h2>
              <p>
                {total} {total === 1 ? "account" : "accounts"} in this view
              </p>
            </div>
            <Button variant="outline" asChild>
              <a
                href={`/api/admin/export?${new URLSearchParams({ q: filters.q, segment: filters.segment })}`}
              >
                Export this segment
              </a>
            </Button>
          </div>
          <form action="/admin" className={styles.filters}>
            <label>
              Search accounts
              <Input
                name="q"
                defaultValue={filters.q}
                placeholder="Name or email address"
                maxLength={200}
              />
            </label>
            <label>
              Customer segment
              <select name="segment" defaultValue={filters.segment}>
                {Object.entries(segments).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">Apply filters</Button>
            {(filters.q || filters.segment !== "all") && (
              <Link href="/admin">Clear</Link>
            )}
          </form>
          {!rows.length ? (
            <div className={styles.empty}>
              <h3>
                {summary.accounts
                  ? "No accounts match this view."
                  : "Your first customers will appear here."}
              </h3>
              <p>
                {summary.accounts
                  ? "Try another segment or search by a different name or email."
                  : "As people sign in and create invitations, you will see their progress here."}
              </p>
            </div>
          ) : (
            <>
              <div
                className={styles.tableScroll}
                role="region"
                aria-label="Customer details"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Customer</th>
                      <th scope="col">Purchase status</th>
                      <th scope="col">Invitations</th>
                      <th scope="col">Last sign-in</th>
                      <th scope="col">Last activity</th>
                      <th scope="col">Captured</th>
                      <th scope="col">Follow-up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.name || "Unnamed account"}</strong>
                          <span className={styles.email}>{row.email}</span>
                          <small>
                            Joined {date(row.joined)}
                            {!row.verified && " · Email unverified"}
                          </small>
                        </td>
                        <td>
                          <span
                            className={row.paid ? styles.paid : styles.status}
                          >
                            {row.paid
                              ? "Paid"
                              : row.reviews
                                ? "Refunded / disputed"
                                : row.pending
                                  ? "Checkout unfinished"
                                  : "Never bought"}
                          </span>
                          {row.paid > 0 && (
                            <small>
                              {row.paid} paid{" "}
                              {row.paid === 1 ? "order" : "orders"}
                            </small>
                          )}
                          {row.paid > 0 && row.reviews > 0 && (
                            <small>{row.reviews} refunded / disputed</small>
                          )}
                        </td>
                        <td>
                          {row.invitations}
                          <small>{row.published} published</small>
                        </td>
                        <td>{date(row.lastLogin)}</td>
                        <td>{date(row.lastActive)}</td>
                        <td>{money(row.revenue)}</td>
                        <td>
                          <FollowUp
                            email={row.email}
                            name={row.name}
                            purchased={row.purchases > 0}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <nav className={styles.pagination} aria-label="Customer pages">
                <span>
                  Page {filters.page} of {pages}
                </span>
                <div>
                  {filters.page > 1 && (
                    <Link href={link(filters.page - 1)}>Previous</Link>
                  )}
                  {filters.page < pages && (
                    <Link href={link(filters.page + 1)}>Next</Link>
                  )}
                </div>
              </nav>
            </>
          )}
        </section>
        <aside className={styles.notes}>
          <h2>What these numbers mean</h2>
          <p>
            Nyota uses one-time purchases, not recurring subscriptions. Paid
            customers have at least one captured order. Activity includes
            recorded sign-ins, session refreshes, invitation changes, and
            checkout creation; it does not mean someone is online now. All dates
            use India time.
          </p>
          <p>
            Sign-in history is preserved from this update onward, with older
            dates taken from remaining sessions. Earlier deleted sessions cannot
            be recovered. Checkout status does not tell us why someone stopped.
            Account creation does not establish marketing permission. Overview
            numbers cover all accounts; filters apply to the table and export.
          </p>
        </aside>
      </main>
    </div>
  );
}
