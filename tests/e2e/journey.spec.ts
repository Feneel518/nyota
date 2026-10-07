import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Pool } from "pg";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
async function requestSignInLink(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(
    page.getByRole("heading", { name: "Check your inbox." }),
  ).toBeVisible();
  let link = "";
  for (let attempt = 0; attempt < 20; attempt++) {
    const files = await readdir(".local/mail").catch(() => []);
    for (const file of files.reverse()) {
      const mail = JSON.parse(await readFile(`.local/mail/${file}`, "utf8"));
      if (mail.to === email) {
        link =
          mail.text.match(
            /http:\/\/127\.0\.0\.1:3001\/sign-in\/verify\?\S+/,
          )?.[0] || "";
        break;
      }
    }
    if (link) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  expect(link).toBeTruthy();
  return link;
}
async function signIn(page: Page, email: string) {
  const link = await requestSignInLink(page, email);
  await page.goto(link);
  await page
    .getByRole("button", { name: "Continue to my invitations" })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.screenshot({
    path: "docs/screenshots/nyota-dashboard.png",
    fullPage: true,
  });
  return link;
}
test("marketing, themes, Gujarati, scene navigation, and mobile accessibility", async ({
  page,
}) => {
  await mkdir("docs/screenshots", { recursive: true });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A wedding invitation worth exploring.",
  );
  await page.screenshot({
    path: "docs/screenshots/home-desktop.png",
    fullPage: true,
  });
  const desktop = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(desktop.violations).toEqual([]);
  for (const theme of ["royal", "marigold", "garden"]) {
    await page.goto(`/demo?theme=${theme}`);
    await page.getByRole("radio", { name: "English" }).click();
    await page
      .getByRole("button", { name: "Open the invitation", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Two people. One beautiful beginning.",
    );
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "A little sunshine & Haldi",
    );
    for (let chapter = 0; chapter < 4; chapter++) {
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await expect(page.locator("[data-invitation-screen]")).toHaveAttribute(
        "data-invitation-screen",
        String(chapter + 3),
      );
    }
    await page
      .getByRole("button", { name: "To the invitation", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "You are warmly invited",
    );
    await page.getByRole("radio", { name: "ગુજરાતી" }).click();
    await expect(page.locator(".invitation")).toHaveAttribute("lang", "gu");
    await expect(page.locator(".invitation")).toContainText("આર્યા");
    await page.screenshot({
      path: `docs/screenshots/${theme}-gujarati.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({
    path: "docs/screenshots/home-mobile.png",
    fullPage: true,
  });
  await page.goto("/demo");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const mobile = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(mobile.violations).toEqual([]);
  await page.screenshot({
    path: "docs/screenshots/demo-mobile.png",
    fullPage: true,
  });
});
test("real magic link → persisted draft → local verified publication → RSVP/edit/export → republish", async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  const email = `journey-${Date.now()}@example.test`;
  await signIn(page, email);
  await page
    .getByRole("button", { name: "Create an invitation" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/dashboard\/.+\/edit$/);
  const editPath = new URL(page.url()).pathname;
  const weddingId = editPath.split("/")[2];
  await page.getByRole("radio", { name: "ગુજરાતી કાર્યસ્થળ" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("તમે બંને.");
  await expect(
    page.getByRole("button", { name: "4. સમીક્ષા", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("તમે બંને.");
  await page.getByRole("radio", { name: "English workspace" }).click();
  await page.getByLabel("Partner 1’s name").fill("Aarya");
  await page.getByLabel("Partner 2’s name").fill("Dev");
  await page
    .getByLabel("Your welcome message")
    .fill("Join us for our next chapter.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Event title", { exact: true }).fill("The wedding");
  await page.getByRole("combobox", { name: "Ceremony animation" }).click();
  await page
    .getByRole("option", { name: "Wedding · Baraat & Varmala", exact: true })
    .click();
  await page.getByLabel("Starts · Asia/Kolkata").fill("2027-02-14T16:00");
  await page
    .getByLabel("Venue name", { exact: true })
    .fill("The Rose Pavilion");
  await page
    .getByLabel("Address", { exact: true })
    .fill("A fictional venue in Surat, Gujarat");
  await page
    .getByLabel("Directions link · optional")
    .fill("https://maps.google.com/?q=Surat");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make it feel like you." }),
  ).toBeVisible();
  for (const track of [
    "Courtyard melody",
    "Garden at dusk",
    "Shaadi morning",
    "Sitar serenade",
    "Mehendi afternoon",
    "Sangeet under the stars",
  ]) {
    await page.getByRole("combobox", { name: "Music", exact: true }).click();
    await page.getByRole("option", { name: track, exact: true }).click();
    await page
      .getByRole("button", { name: "Preview music", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Stop preview", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Stop preview", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Ready for your final preview")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/editor-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByLabel("Partner 1’s name")).toHaveValue("Aarya");
  await page.getByRole("button", { name: "2. Functions", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Ceremony animation" }),
  ).toContainText("Wedding · Baraat & Varmala");
  await page.getByRole("button", { name: "4. Review", exact: true }).click();
  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByRole("checkbox").check();
  await page.screenshot({
    path: "docs/screenshots/checkout.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Complete local test payment" })
    .click();
  await expect(
    page.getByText("Your invitation is published", { exact: true }),
  ).toBeVisible();
  const publicUrl = await page
    .locator('a[target="_blank"]')
    .first()
    .getAttribute("href");
  expect(publicUrl).toBeTruthy();
  await writeFile(
    ".local/last-journey.json",
    JSON.stringify({ publicUrl, weddingId }),
  );
  const guest = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const guestPage = await guest.newPage();
  await guestPage.goto(`${publicUrl}/details`);
  await expect(
    guestPage.getByRole("heading", { name: "Aarya & Dev" }),
  ).toBeVisible();
  await guestPage.getByLabel("Family or group name").fill("Patel family");
  await guestPage.getByRole("checkbox").check();
  await guestPage.getByLabel("People: The wedding").fill("4");
  await guestPage
    .getByLabel("A note for the couple")
    .fill("Can’t wait to celebrate!");
  await guestPage
    .getByRole("button", { name: "Send response", exact: true })
    .click();
  await expect(
    guestPage.getByText("Your response is saved", { exact: true }),
  ).toBeVisible();
  const editLink = await guestPage
    .getByLabel("Keep your private edit link")
    .inputValue();
  await guestPage.screenshot({
    path: "docs/screenshots/rsvp-success-mobile.png",
    fullPage: true,
  });
  await page.goto(`/dashboard/${weddingId}/responses`);
  await page.getByRole("radio", { name: "Declined", exact: true }).click();
  await expect(
    page.getByText("No matching families", { exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "Attending", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Patel family", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "4", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/responses.png",
    fullPage: true,
  });
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Delete response from Patel family" })
    .click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep response" }).click();
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/nyota-responses-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 720 });
  const exportResponse = await page.request.get(
    `/api/weddings/${weddingId}/export`,
  );
  expect(exportResponse.status()).toBe(200);
  expect(await exportResponse.text()).toContain("Patel family");
  await guestPage.goto(editLink);
  await expect(guestPage.getByLabel("Family or group name")).toHaveValue(
    "Patel family",
  );
  expect(new URL(guestPage.url()).hash).toBe("");
  await guestPage.getByLabel("People: The wedding").fill("2");
  await guestPage
    .getByRole("button", { name: "Send response", exact: true })
    .click();
  await expect(
    guestPage.getByText("Your response is saved", { exact: true }),
  ).toBeVisible();
  await page.goto(editPath);
  await page.getByRole("button", { name: "2. Functions", exact: true }).click();
  await page
    .getByLabel("Venue name", { exact: true })
    .fill("The Updated Rose Pavilion");
  await page.getByRole("button", { name: "4. Review", exact: true }).click();
  await page
    .getByRole("button", { name: "Publish updates", exact: true })
    .click();
  await expect(
    page.getByText("Your invitation updates are published", { exact: true }),
  ).toBeVisible();
  await guestPage.goto(`${publicUrl}/details`);
  await expect(
    guestPage.getByText("The Updated Rose Pavilion", { exact: true }),
  ).toBeVisible();
  const unauthorized = await guestPage.request.get(
    `/api/weddings/${weddingId}/export`,
  );
  expect(unauthorized.status()).toBe(401);
  await guest.close();
});
test("magic links are single-use and logout revokes protected access", async ({
  page,
}) => {
  const link = await signIn(page, `auth-${Date.now()}@example.test`);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3001/");
  expect((await page.request.get("/api/weddings")).status()).toBe(401);
  await page.goto(link);
  await page
    .getByRole("button", { name: "Continue to my invitations" })
    .click();
  await expect(
    page.getByText("This link cannot be used", { exact: true }),
  ).toBeVisible();
  expect((await page.request.get("/api/weddings")).status()).toBe(401);
});
test("expired magic links show recovery and cannot start a session", async ({
  page,
}) => {
  const email = `expired-${Date.now()}@example.test`;
  const link = await requestSignInLink(page, email);
  const databaseUrl = process.env.DATABASE_URL;
  if (
    process.env.LOCAL_TEST !== "true" ||
    !databaseUrl ||
    new URL(databaseUrl).hostname !== "127.0.0.1"
  )
    throw new Error("Auth expiry test requires the isolated local database.");
  const connection = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const changed = await connection.query(
      "UPDATE verification SET expires_at = now() - interval '1 minute' WHERE value LIKE $1",
      [`%${email}%`],
    );
    expect(changed.rowCount).toBe(1);
  } finally {
    await connection.end();
  }
  await page.goto(link);
  await page
    .getByRole("button", { name: "Continue to my invitations" })
    .click();
  await expect(
    page.getByText("This link cannot be used", { exact: true }),
  ).toBeVisible();
  expect((await page.request.get("/api/weddings")).status()).toBe(401);
});
