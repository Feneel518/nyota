import { test, expect } from "@playwright/test";
import { readFile, readdir } from "node:fs/promises";
import { demoContent } from "../../src/lib/content";

test("sign-in confirmation fits the viewport without a split colour strip", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/sign-in/verify?token=layout-test");
    await expect(
      page.getByRole("button", { name: "Continue to my invitations" }),
    ).toBeVisible();
    await expect(page.locator(".owner-language-bar")).toHaveCSS(
      "background-image",
      "none",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/verify-${width}.png`,
      fullPage: true,
    });
  }
});

test("cancelled checkout and paid invitations allow checked domain changes and continued editing", async ({
  page,
  baseURL,
}) => {
  const email = `domain-${Date.now()}@example.test`;
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
  const editPath = new URL(page.url()).pathname;
  const id = editPath.split("/")[2];
  const draft = await (
    await page.request.get(`/api/weddings/${id}/draft`)
  ).json();
  const saved = await page.request.post(`/api/weddings/${id}/draft`, {
    headers: { origin: baseURL! },
    data: {
      content: demoContent,
      slug: draft.wedding.slug,
      version: 1,
      mutation: crypto.randomUUID(),
    },
  });
  expect(saved.ok()).toBe(true);
  // Reserve a real local order, then return without capturing payment.
  expect(
    (
      await page.request.post(`/api/weddings/${id}/order`, {
        headers: { origin: baseURL! },
        data: { version: 2 },
      })
    ).ok(),
  ).toBe(true);
  await page.goto(`/dashboard/${id}/checkout`);
  await page.getByRole("link", { name: "Back to your invitation" }).click();
  await page.getByRole("button", { name: "4. Review", exact: true }).click();
  await page.getByLabel("Your invitation link", { exact: true }).fill("www");
  await expect(
    page.getByText("This domain name is reserved. Choose another.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "1. Couple", exact: true }).click();
  await expect(page.getByLabel("Partner 1’s name")).toBeVisible();
  await page.getByRole("button", { name: "4. Review", exact: true }).click();
  const slug = `browser-${Date.now()}`;
  await page.getByLabel("Your invitation link", { exact: true }).fill(slug);
  await expect(
    page.getByText("This domain is available.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save domain", exact: true }).click();
  await expect(
    page.getByText("Your domain is saved.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Complete local test payment" })
    .click();
  await expect(
    page.getByText("Your invitation is published", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to your invitation" }).click();
  await page.getByRole("button", { name: "4. Review", exact: true }).click();
  await page
    .getByLabel("Your invitation link", { exact: true })
    .fill(`${slug}-paid`);
  await expect(
    page.getByText("This domain is available.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save domain", exact: true }).click();
  await expect(
    page.getByText("Your domain is saved.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "2. Functions", exact: true }).click();
  await expect(
    page.getByLabel("Venue name", { exact: true }).first(),
  ).toBeVisible();
  expect(
    (await (await page.request.get(`/api/weddings/${id}/draft`)).json()).wedding
      .slug,
  ).toBe(`${slug}-paid`);
  expect((await page.request.get(`/w/${slug}-paid`)).ok()).toBe(true);
});
