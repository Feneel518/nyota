import { describe, it, expect } from "vitest";
import {
  demoContent,
  emptyContent,
  publicationSchema,
  contentSchema,
  localizedText,
} from "../src/lib/content";
import {
  hostingDates,
  isActive,
  responseSchema,
  csv,
  attendanceTotals,
  safeReturn,
} from "../src/lib/domain";
import { verifySignature, signature } from "../src/server/security";
import { validateCapture } from "../src/server/billing";
describe("Invitation contracts", () => {
  it("allows incomplete private drafts but refuses to publish them", () => {
    expect(contentSchema.safeParse(emptyContent()).success).toBe(true);
    expect(publicationSchema.safeParse(emptyContent()).success).toBe(false);
    expect(publicationSchema.safeParse(demoContent).success).toBe(true);
  });
  it("requires the default-language names and a valid main event", () => {
    const c = structuredClone(demoContent);
    c.names[0].en = " ";
    c.mainEventId = "missing";
    expect(publicationSchema.safeParse(c).success).toBe(false);
  });
  it("rejects executable directions, duplicate event IDs, and invalid end times", () => {
    const c = structuredClone(demoContent);
    c.events[0].directions = "javascript:alert(1)";
    expect(contentSchema.safeParse(c).success).toBe(false);
    c.events[0].directions = "";
    c.events[1].id = c.events[0].id;
    expect(contentSchema.safeParse(c).success).toBe(false);
    c.events[1].id = crypto.randomUUID();
    c.events[0].end = "2020-01-01T10:00";
    expect(publicationSchema.safeParse(c).success).toBe(false);
  });
  it("falls back to the selected default language without inventing translations", () => {
    expect(localizedText({ en: "Aarya", gu: "" }, "gu", "en")).toBe("Aarya");
    expect(localizedText({ en: "", gu: "આર્યા" }, "en", "gu")).toBe("આર્યા");
  });
  it("rejects calendar dates that JavaScript would silently normalize", () => {
    const c = structuredClone(demoContent);
    c.events[0].start = "2027-02-31T16:00";
    expect(contentSchema.safeParse(c).success).toBe(false);
    c.events[0].start = "2028-02-29T16:00";
    expect(contentSchema.safeParse(c).success).toBe(true);
  });
});
describe("Money, lifecycle, and private response rules", () => {
  it("grants six calendar months, clamping month-end in Kolkata", () => {
    const dates = hostingDates(new Date("2026-08-31T18:15:00Z"));
    expect(dates.expiresAt.toISOString()).toBe("2027-02-28T18:15:00.000Z");
    expect(dates.purgeAt.toISOString()).toBe("2027-03-30T18:15:00.000Z");
  });
  it("blocks precisely at expiry", () => {
    const now = new Date("2027-01-01T00:00:00Z");
    expect(isActive(now, now)).toBe(false);
    expect(isActive(new Date(+now + 1), now)).toBe(true);
  });
  it("checks raw-body HMAC signatures in constant time", () => {
    const s = signature("payload", "secret");
    expect(verifySignature("payload", s, "secret")).toBe(true);
    expect(verifySignature("changed", s, "secret")).toBe(false);
    expect(verifySignature("payload", "short", "secret")).toBe(false);
  });
  it("never treats an authorization, mismatched amount, currency, or order as captured payment", () => {
    const order = {
      providerOrderId: "order_test",
      amount: 199900,
      currency: "INR",
    };
    const valid = {
      id: "pay_test",
      order_id: "order_test",
      amount: 199900,
      currency: "INR",
      status: "captured",
    };
    expect(() => validateCapture(valid, order)).not.toThrow();
    for (const change of [
      { status: "authorized" },
      { amount: 1 },
      { currency: "USD" },
      { order_id: "other" },
    ])
      expect(() => validateCapture({ ...valid, ...change }, order)).toThrow();
  });
  it("requires event-specific counts of 1–20 and zero selections for a decline", () => {
    const id = crypto.randomUUID();
    const base = {
      family: "Patel family",
      attending: true,
      note: "",
      counts: { [id]: 3 },
    };
    expect(responseSchema.safeParse(base).success).toBe(true);
    expect(responseSchema.safeParse({ ...base, counts: {} }).success).toBe(
      false,
    );
    expect(
      responseSchema.safeParse({ ...base, counts: { [id]: 21 } }).success,
    ).toBe(false);
    expect(
      responseSchema.safeParse({ ...base, attending: false }).success,
    ).toBe(false);
    expect(
      responseSchema.safeParse({ ...base, attending: false, counts: {} })
        .success,
    ).toBe(true);
  });
  it("keeps per-event counts separate and preserves Gujarati in safe CSV", () => {
    expect(
      attendanceTotals(
        [
          { family: "A", attending: true, note: "", counts: { a: 4, b: 4 } },
          { family: "B", attending: true, note: "", counts: { b: 2 } },
        ],
        ["a", "b"],
      ),
    ).toEqual({ a: 4, b: 6 });
    const exportText = csv([["=SUM(A1)", " +123", "પટેલ પરિવાર", 'a"b']]);
    expect(exportText).toContain("'=SUM");
    expect(exportText).toContain("' +123");
    expect(exportText).toContain("પટેલ પરિવાર");
    expect(exportText).toContain('a""b');
  });
  it("only returns to relative owner paths", () => {
    expect(safeReturn("https://evil.test")).toBe("/dashboard");
    expect(safeReturn("//evil.test")).toBe("/dashboard");
    expect(safeReturn("/dashboard/123/edit")).toBe("/dashboard/123/edit");
  });
});
