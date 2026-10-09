import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Client } from "pg";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/server/auth", () => ({
  currentUser: async () => ({
    email: "feneelp@gmail.com",
    emailVerified: true,
  }),
}));
vi.mock("@/server/db", () => ({ pool: () => ({ query: mocks.query }) }));
import { adminReport, exportCustomers } from "@/server/admin";

// Temporary tables shadow application tables only on this connection. All
// fixtures are rolled back; never write to a customer's actual data.
describe.skipIf(process.env.LOCAL_TEST !== "true")(
  "Admin analytics SQL",
  () => {
    let client: Client;
    beforeAll(async () => {
      const url = new URL(process.env.DATABASE_URL!);
      if (!["127.0.0.1", "localhost"].includes(url.hostname))
        throw new Error("Local database required");
      client = new Client({ connectionString: url.toString() });
      await client.connect();
      await client.query(`BEGIN;
      CREATE TEMP TABLE "user" (id text, name text, email text, email_verified boolean, created_at timestamptz) ON COMMIT DROP;
      CREATE TEMP TABLE session (user_id text, created_at timestamptz, updated_at timestamptz) ON COMMIT DROP;
      CREATE TEMP TABLE audit_events (actor_id text, created_at timestamptz, action text, outcome text) ON COMMIT DROP;
      CREATE TEMP TABLE weddings (owner_id text, first_published_at timestamptz, updated_at timestamptz) ON COMMIT DROP;
      CREATE TEMP TABLE orders (owner_id text, payment_state text, amount int, created_at timestamptz) ON COMMIT DROP;
      INSERT INTO "user" VALUES
        ('admin', 'Admin', 'feneelp@gmail.com', true, now()),
        ('paid', 'Paid customer', 'paid@example.test', true, now()),
        ('refund', 'Refunded customer', 'refund@example.test', true, now()),
        ('unpaid', 'Unpaid customer', 'unpaid@example.test', true, now()),
        ('unknown', 'Unknown history', 'unknown@example.test', true, now());
      INSERT INTO session VALUES ('paid', now(), now());
      INSERT INTO audit_events VALUES ('unpaid', now(), 'auth.sign_in', 'success'), ('refund', now(), 'auth.sign_in', 'success');
      INSERT INTO weddings VALUES ('paid', now(), now()), ('paid', now(), now()), ('unpaid', null, now());
      INSERT INTO orders VALUES ('paid', 'captured', 199900, now()), ('paid', 'captured', 199900, now()),
        ('refund', 'refunded', 199900, now()), ('refund', 'pending', 199900, now()), ('unpaid', 'pending', 199900, now());`);
      mocks.query.mockImplementation((...args: Parameters<Client["query"]>) =>
        client.query(...args),
      );
    });
    afterAll(async () => {
      if (client) {
        await client.query("ROLLBACK");
        await client.end();
      }
    });
    it("does not multiply revenue across invitations, or count the admin", async () => {
      const report = await adminReport({ q: "", segment: "all", page: 1 });
      expect(report.total).toBe(4);
      expect(report.summary).toEqual({
        accounts: 4,
        paid: 1,
        active: 3,
        unpaid: 1,
        checkout: 1,
        revenue: 399800,
      });
      expect(report.rows.find((r) => r.id === "paid")).toMatchObject({
        invitations: 2,
        paid: 2,
        revenue: 399800,
      });
    });
    it("retains durable sign-ins without a session and excludes refunds from prospects", async () => {
      for (const segment of ["unpaid", "checkout"] as const) {
        const report = await adminReport({ q: "", segment, page: 1 });
        expect(report.rows.map((r) => r.id)).toEqual(["unpaid"]);
        expect(report.rows[0].lastLogin).toBeTruthy();
      }
      const report = await adminReport({ q: "", segment: "review", page: 1 });
      expect(report.rows.map((r) => r.id)).toEqual(["refund"]);
    });
    it("searches literally and exports the same filtered segment", async () => {
      const filters = { q: "PAID@", segment: "paid" as const, page: 1 };
      const report = await adminReport(filters);
      expect(await exportCustomers(filters)).toEqual(report.rows);
      expect(
        (await adminReport({ q: "%", segment: "all", page: 1 })).total,
      ).toBe(0);
    });
  },
);
