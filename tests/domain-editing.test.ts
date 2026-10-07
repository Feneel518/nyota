import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, pool } from "../src/server/db";
import { user } from "../src/server/db/schema";
import {
  checkDomain,
  createWedding,
  getDraft,
  publicWedding,
  saveDraft,
} from "../src/server/weddings";
import { createOrder, capturePayment } from "../src/server/billing";
import { runJobs } from "../src/server/jobs";
import { demoContent } from "../src/lib/content";

describe.skipIf(process.env.LOCAL_TEST !== "true")(
  "Invitation domain editing",
  () => {
    const owner = crypto.randomUUID();
    beforeAll(async () => {
      const url = new URL(process.env.DATABASE_URL!);
      if (url.hostname !== "127.0.0.1" || url.pathname !== "/wedding")
        throw new Error("Requires the isolated local database");
      await db()
        .insert(user)
        .values({
          id: owner,
          name: "Domain test",
          email: `${owner}@example.test`,
          emailVerified: true,
        });
    });
    afterAll(async () => {
      await pool().end();
    });

    it("checks availability and rejects invalid, reserved, taken and concurrently claimed domains without preventing later saves", async () => {
      const a = await createWedding(owner),
        b = await createWedding(owner);
      expect(await checkDomain(owner, a.id, a.slug)).toMatchObject({
        available: true,
        current: true,
      });
      expect(await checkDomain(owner, a.id, b.slug)).toMatchObject({
        available: false,
      });
      for (const slug of [
        "www",
        "ab",
        "double--hyphen",
        "a".repeat(64),
        b.slug,
      ]) {
        expect(await checkDomain(owner, a.id, slug)).toMatchObject({
          available: false,
        });
        await expect(
          saveDraft(owner, a.id, 1, crypto.randomUUID(), demoContent, slug),
        ).rejects.toMatchObject({ status: 422 });
      }
      await expect(
        checkDomain(crypto.randomUUID(), a.id, a.slug),
      ).rejects.toMatchObject({ status: 404 });
      const slug = `race-${crypto.randomUUID()}`;
      const results = await Promise.allSettled(
        [a, b].map((wedding) =>
          saveDraft(
            owner,
            wedding.id,
            1,
            crypto.randomUUID(),
            demoContent,
            slug,
          ),
        ),
      );
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      const rejected = results.find((result) => result.status === "rejected");
      expect(rejected?.reason).toMatchObject({ status: 422 });
      const loser = results[0].status === "rejected" ? a : b;
      await expect(
        saveDraft(
          owner,
          loser.id,
          1,
          crypto.randomUUID(),
          demoContent,
          loser.slug,
        ),
      ).resolves.toEqual({ version: 2 });
    });

    it("can change the domain after abandoning checkout and after payment without losing details or hosting time", async () => {
      const wedding = await createWedding(owner);
      await saveDraft(
        owner,
        wedding.id,
        1,
        crypto.randomUUID(),
        demoContent,
        wedding.slug,
      );
      const order = await createOrder(owner, wedding.id, 2);
      const nextSlug = `changed-${crypto.randomUUID()}`;
      await expect(
        saveDraft(
          owner,
          wedding.id,
          2,
          crypto.randomUUID(),
          demoContent,
          nextSlug,
        ),
      ).resolves.toEqual({ version: 3 });
      const edited = structuredClone(demoContent);
      edited.welcome.en = "Saved after cancelling checkout";
      await saveDraft(
        owner,
        wedding.id,
        3,
        crypto.randomUUID(),
        edited,
        nextSlug,
      );
      expect((await getDraft(owner, wedding.id)).content.welcome.en).toBe(
        edited.welcome.en,
      );
      expect((await createOrder(owner, wedding.id, 4)).id).toBe(order.id);
      await capturePayment({
        id: `local_domain_${order.id}`,
        order_id: order.providerOrderId!,
        amount: order.amount,
        currency: "INR",
        status: "captured",
      });
      await runJobs(50);
      const live = await publicWedding(nextSlug);
      expect(live).not.toBeNull();
      const paidSlug = `paid-${crypto.randomUUID()}`;
      await expect(
        saveDraft(owner, wedding.id, 4, crypto.randomUUID(), edited, paidSlug),
      ).resolves.toEqual({ version: 5 });
      expect(await publicWedding(nextSlug)).toBeNull();
      const renamed = await publicWedding(paidSlug);
      expect(renamed?.id).toBe(wedding.id);
      expect(renamed?.expiresAt).toEqual(live?.expiresAt);
      expect(renamed?.revisionId).toBe(live?.revisionId);
    });
  },
);
