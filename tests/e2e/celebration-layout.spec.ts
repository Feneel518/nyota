import { test, expect } from "@playwright/test";
import { readFile, readdir } from "node:fs/promises";
import { demoContent } from "../../src/lib/content";
import { functionSuggestions } from "../../src/content/invitation-templates";

test("compact invitation cards, hosting dates, sharing and new celebration scenes", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const email = `layouts-${Date.now()}@example.test`;
  await page.goto("/sign-in");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(
    page.getByRole("heading", { name: "Check your inbox." }),
  ).toBeVisible();
  let link = "";
  await expect
    .poll(async () => {
      for (const file of await readdir(".local/mail")) {
        const mail = JSON.parse(await readFile(`.local/mail/${file}`, "utf8"));
        if (mail.to === email)
          link =
            mail.text.match(
              /http:\/\/127\.0\.0\.1:\d+\/sign-in\/verify\?\S+/,
            )?.[0] || "";
      }
      return link;
    })
    .toBeTruthy();
  await page.goto(link);
  await page
    .getByRole("button", { name: "Continue to my invitations" })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page
    .getByRole("button", { name: "Create an invitation" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/dashboard\/.+\/edit$/);
  const id = new URL(page.url()).pathname.split("/")[2];
  const draft = await (
    await page.request.get(`/api/weddings/${id}/draft`)
  ).json();
  const content = structuredClone(demoContent);
  for (const suggestion of functionSuggestions.filter((s) =>
    ["carnival", "pool-party", "grah-shanti"].includes(s.animation),
  )) {
    content.events.push({
      ...content.events[0],
      id: crypto.randomUUID(),
      title: { ...suggestion.title },
      animation: suggestion.animation,
      notes: {
        en: "Join us for a beautiful celebration with family and friends.",
        gu: "પરિવાર અને મિત્રો સાથે ઉજવણીમાં પધારો.",
      },
    });
  }
  const saved = await page.request.post(`/api/weddings/${id}/draft`, {
    headers: { origin: baseURL! },
    data: {
      content,
      slug: draft.wedding.slug,
      version: draft.wedding.version,
      mutation: crypto.randomUUID(),
    },
  });
  expect(saved.ok()).toBe(true);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard");
    const card = page.locator(".dashboard-card-stationery");
    await expect(card).toBeVisible();
    expect((await card.boundingBox())!.height).toBeLessThan(350);
    await page.screenshot({
      path: `test-results/dashboard-compact-${width}.png`,
      fullPage: true,
    });
    await page.goto(`/dashboard/${id}/checkout`);
    await expect(page.locator(".checkout-expiry strong time")).toBeVisible();
    expect(
      (await page.locator(".checkout-invitation").boundingBox())!.height,
    ).toBeLessThan(740);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/checkout-compact-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Complete local test payment" })
    .click();
  await expect(
    page.getByText("Your invitation is published", { exact: true }),
  ).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("button", { name: "Share invitation", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Share a little joy" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("img", { name: "Invitation QR code" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        dialog
          .getByRole("img")
          .evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    if (width > 600)
      expect((await dialog.boundingBox())!.width).toBeGreaterThan(700);
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: `test-results/share-redesign-${width}.png` });
    await page.keyboard.press("Escape");
  }
  await page.goto(`/dashboard/${id}/preview`);
  await page
    .getByRole("button", { name: "Open the invitation", exact: true })
    .click();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [kind, title] of [
      ["carnival", "Carnival"],
      ["pool-party", "Pool Party"],
      ["grah-shanti", "Grah Shanti"],
    ]) {
      await page
        .getByRole("navigation", { name: "Celebration chapters" })
        .getByRole("button", { name: title, exact: true })
        .click();
      await expect(
        page.locator(`[data-celebration-art="${kind}"]`),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: title, exact: true, level: 1 }),
      ).toBeVisible();
      const chapters = await page.locator(".scene-chapters").boundingBox();
      if (width <= 600) expect(chapters!.height).toBeLessThan(65);
      else {
        const art = await page
          .locator(".scene-visual > [data-immersive]")
          .boundingBox();
        expect(
          Math.abs(
            chapters!.x + chapters!.width / 2 - (art!.x + art!.width / 2),
          ),
        ).toBeLessThan(3);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `test-results/${kind}-${width}.png` });
    }
  }
  expect(errors).toEqual([]);
});
