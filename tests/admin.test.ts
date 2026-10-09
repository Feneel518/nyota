import { beforeEach, expect, it, vi } from "vitest";
import {
  adminFilters,
  customerCsv,
  isAdmin,
  type AdminCustomer,
} from "@/lib/admin";
import { safeReturn } from "@/lib/domain";

const { currentUser, query } = vi.hoisted(() => ({
  currentUser: vi.fn(),
  query: vi.fn(),
}));
vi.mock("@/server/auth", () => ({ currentUser }));
vi.mock("@/server/db", () => ({ pool: () => ({ query }) }));

import { adminReport, exportCustomers } from "@/server/admin";
import { GET } from "@/app/api/admin/export/route";

beforeEach(() => vi.resetAllMocks());

it("requires the verified exact admin email", () => {
  expect(isAdmin(null)).toBe(false);
  expect(isAdmin({ email: "feneelp@gmail.com", emailVerified: false })).toBe(
    false,
  );
  expect(isAdmin({ email: "Feneelp@gmail.com", emailVerified: true })).toBe(
    true,
  );
  expect(
    isAdmin({ email: "feneelp@gmail.com.evil.test", emailVerified: true }),
  ).toBe(false);
});

it.each([
  null,
  { email: "other@example.test", emailVerified: true },
  { email: "feneelp@gmail.com", emailVerified: false },
])("blocks private report and export reads for %j", async (user) => {
  currentUser.mockResolvedValue(user);
  const filters = adminFilters(new URLSearchParams());
  await expect(adminReport(filters)).rejects.toMatchObject({
    status: user ? 403 : 401,
  });
  await expect(exportCustomers(filters)).rejects.toMatchObject({
    status: user ? 403 : 401,
  });
  const response = await GET(
    new Request("https://example.test/api/admin/export"),
  );
  expect(response.status).toBe(user ? 403 : 401);
  expect(query).not.toHaveBeenCalled();
});

it("passes search text as a parameter, never executable SQL", async () => {
  currentUser.mockResolvedValue({
    email: "feneelp@gmail.com",
    emailVerified: true,
  });
  query.mockResolvedValue({ rows: [{ rows: [], summary: {}, total: 0 }] });
  const q = "'; DROP TABLE users; --";
  await adminReport({ q, segment: "unpaid", page: 2 });
  expect(query.mock.calls[0][0]).not.toContain(q);
  expect(query.mock.calls[0][1]).toEqual([
    "feneelp@gmail.com",
    q,
    "unpaid",
    50,
    50,
  ]);
});

it("normalizes invalid filters and permits a safe admin sign-in return", () => {
  expect(
    adminFilters(new URLSearchParams("segment=__proto__&page=NaN")),
  ).toEqual({ q: "", segment: "all", page: 1 });
  expect(adminFilters(new URLSearchParams("page=-5")).page).toBe(1);
  expect(safeReturn("/admin")).toBe("/admin");
  expect(safeReturn("//evil.test/admin")).toBe("/dashboard");
  expect(safeReturn("/admin\\evil.test")).toBe("/dashboard");
});

it("exports filtered rows with private download headers and safe CSV cells", async () => {
  const customer: AdminCustomer = {
    id: "1",
    name: '=HYPERLINK("evil")',
    email: "person@example.test",
    verified: true,
    joined: "2026-10-09",
    lastLogin: null,
    lastActive: null,
    invitations: 0,
    published: 0,
    paid: 0,
    purchases: 0,
    pending: 0,
    reviews: 0,
    revenue: 0,
  };
  expect(customerCsv([customer])).toContain('"\'=HYPERLINK(""evil"")"');
  currentUser.mockResolvedValue({
    email: "feneelp@gmail.com",
    emailVerified: true,
  });
  query.mockResolvedValue({ rows: [{ customer }] });
  const response = await GET(
    new Request(
      "https://example.test/api/admin/export?segment=unpaid&q=person",
    ),
  );
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("content-disposition")).toContain(
    "nyota-unpaid.csv",
  );
  expect(await response.text()).toContain("person@example.test");
  expect(query.mock.calls[0][1]).toEqual([
    "feneelp@gmail.com",
    "person",
    "unpaid",
  ]);
});
