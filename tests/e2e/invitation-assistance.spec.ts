import { test, expect, type Page } from "@playwright/test";
import { mkdir, readdir, readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByPlaceholder("you@example.com", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(
    page.getByRole("heading", { name: "Check your inbox." }),
  ).toBeVisible({ timeout: 90000 });
  let link = "";
  await expect
    .poll(async () => {
      const files = await readdir(".local/mail");
      for (const file of files.reverse()) {
        const mail = JSON.parse(await readFile(`.local/mail/${file}`, "utf8"));
        if (mail.to === email) {
          link =
            mail.text.match(/https?:\/\/[^\s]+\/sign-in\/verify\?\S+/)?.[0] ||
            "";
          break;
        }
      }
      return !!link;
    })
    .toBe(true);
  await page.goto(link);
  await page
    .getByRole("button", { name: "Continue to my invitations" })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function contentLanguage(page: Page, language: "English" | "ગુજરાતી") {
  await page
    .locator(".editor-form")
    .getByRole("radiogroup")
    .first()
    .getByRole("radio", { name: language, exact: true })
    .click();
}

test("bilingual templates, editable translation, mothers, reused venues, and guest subdomain RSVP", async ({
  page,
  browser,
}) => {
  test.setTimeout(420000);
  const stamp = Date.now();
  await signIn(page, `assistance-${stamp}@example.test`);
  await page
    .getByRole("button", { name: "Create an invitation" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/dashboard\/.+\/edit$/, { timeout: 90000 });
  const weddingId = new URL(page.url()).pathname.split("/")[2];
  await page.getByLabel("Partner 1’s name", { exact: true }).fill("Feneel");
  await page.getByLabel("Partner 2’s name", { exact: true }).fill("Nidharmi");
  await page.getByLabel("Partner 1’s mother’s name").fill("Meena");
  await page.getByLabel("Partner 2’s mother’s name").fill("Neeta");
  await page
    .getByLabel("Your welcome message")
    .fill("Together with our families");

  await page
    .getByRole("button", { name: "Browse 6 templates" })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("અમારા પરિવાર સાથે");
  await dialog.getByRole("combobox", { name: "Wording style" }).click();
  await expect(page.getByRole("option")).toHaveCount(6);
  await page
    .getByRole("option", { name: "Parents’ blessings", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Use English & Gujarati" }).click();
  await expect(page.getByLabel("Family line", { exact: true })).toHaveValue(
    "With the love and blessings of our parents",
  );
  await page.getByRole("button", { name: "Browse 6 templates" }).last().click();
  await dialog.getByRole("button", { name: "Use English & Gujarati" }).click();
  await page.getByRole("button", { name: "Offer Gujarati to guests" }).click();

  await page
    .getByRole("button", { name: "Translate missing Gujarati" })
    .click();
  for (const checkbox of await dialog.getByRole("checkbox").all())
    await checkbox.uncheck();
  await dialog
    .getByRole("checkbox", { name: "Your welcome message", exact: true })
    .check();
  await dialog
    .getByRole("button", { name: "Translate selected fields", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Review your Gujarati translations" }),
  ).toBeVisible({ timeout: 90000 });
  const translation = dialog.getByRole("textbox", {
    name: "Your welcome message",
    exact: true,
  });
  await expect(translation).toHaveValue("અમારા પરિવાર સાથે");
  await translation.fill("અમારા પરિવાર સાથે આપનું હાર્દિક સ્વાગત છે.");
  await dialog
    .getByRole("button", { name: /Apply reviewed translations/ })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel("Your welcome message")).toHaveValue(
    "અમારા પરિવાર સાથે આપનું હાર્દિક સ્વાગત છે.",
  );
  await page.getByLabel("Partner 1’s name", { exact: true }).fill("ફેનીલ");
  await page.getByLabel("Partner 2’s name", { exact: true }).fill("નિધર્મી");
  await page.getByLabel("Partner 1’s mother’s name").fill("મીનાબેન");
  await page.getByLabel("Partner 2’s mother’s name").fill("નીતાબેન");
  await contentLanguage(page, "English");
  await page.getByRole("button", { name: "2. Functions", exact: true }).click();
  const first = page.locator(".event-editor").first();
  await first.getByLabel("Starts · Asia/Kolkata").fill("2027-02-14T16:00");
  await first.getByLabel("Venue name", { exact: true }).fill("Rose Garden");
  await first.getByLabel("Address", { exact: true }).fill("Surat, Gujarat");
  await first
    .getByLabel("Directions link · optional")
    .fill("https://maps.google.com/?q=Surat");
  await contentLanguage(page, "ગુજરાતી");
  await first.getByLabel("Venue name", { exact: true }).fill("રોઝ ગાર્ડન");
  await first.getByLabel("Address", { exact: true }).fill("સુરત, ગુજરાત");
  await contentLanguage(page, "English");
  await page.getByRole("button", { name: "Haldi", exact: true }).click();
  const second = page.locator(".event-editor").last();
  await second.getByLabel("Starts · Asia/Kolkata").fill("2027-02-14T10:00");
  await second
    .getByRole("combobox", { name: "Use venue from an earlier function" })
    .click();
  await page
    .getByRole("option", { name: "Wedding — Rose Garden", exact: true })
    .click();
  await expect(second.getByLabel("Venue name", { exact: true })).toHaveValue(
    "Rose Garden",
  );
  await expect(second.getByLabel("Directions link · optional")).toHaveValue(
    "https://maps.google.com/?q=Surat",
  );
  await contentLanguage(page, "ગુજરાતી");
  await expect(second.getByLabel("Venue name", { exact: true })).toHaveValue(
    "રોઝ ગાર્ડન",
  );
  await expect(second.getByLabel("Address", { exact: true })).toHaveValue(
    "સુરત, ગુજરાત",
  );
  await contentLanguage(page, "English");

  await page.getByRole("button", { name: "4. Review", exact: true }).click();
  const slug = `assistance-${stamp}`;
  await page.getByLabel("Your invitation link", { exact: true }).fill(slug);
  await expect(
    page.getByText(`http://${slug}.localhost:${new URL(page.url()).port}`, {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "1. Couple", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The two of you.", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Partner 1’s mother’s name")).toHaveValue(
    "Meena",
  );
  await contentLanguage(page, "ગુજરાતી");
  await expect(page.getByLabel("Partner 1’s mother’s name")).toHaveValue(
    "મીનાબેન",
  );
  await expect(page.getByLabel("Family line", { exact: true })).toHaveValue(
    "અમારા માતા-પિતાના પ્રેમ અને આશીર્વાદ સાથે",
  );
  await page.getByRole("button", { name: "4. Review", exact: true }).click();
  await expect(
    page.getByLabel("Your invitation link", { exact: true }),
  ).toHaveValue(slug);
  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await page.getByRole("checkbox").check();
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
  expect(new URL(publicUrl!).hostname).toBe(`${slug}.localhost`);

  const guest = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const guestPage = await guest.newPage();
  await guestPage.goto(publicUrl!);
  await expect(guestPage.getByRole("heading", { level: 1 })).toHaveText(
    "Feneel & Nidharmi",
  );
  await expect(guestPage.locator(".cover-top .family-blessings")).toContainText(
    "Meena",
  );
  await guestPage
    .getByRole("link", { name: "Invitation details", exact: true })
    .last()
    .click();
  await expect(guestPage).toHaveURL(`${publicUrl}/details`);
  await guestPage.getByRole("checkbox").first().check();
  await guestPage.getByLabel("People: Wedding").fill("3");
  await guestPage
    .getByLabel("Family or group name")
    .fill("Assistance test family");
  await guestPage
    .getByRole("button", { name: "Send response", exact: true })
    .click();
  await expect(
    guestPage.getByText("Your response is saved", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  const editLink = await guestPage
    .getByLabel("Keep your private edit link")
    .inputValue();
  expect(new URL(editLink).hostname).toBe(`${slug}.localhost`);
  const editPage = await guest.newPage();
  await editPage.goto(editLink);
  await expect(editPage.getByLabel("People: Wedding")).toHaveValue("3", {
    timeout: 90000,
  });
  await editPage.getByLabel("People: Wedding").fill("2");
  await editPage
    .getByRole("button", { name: "Send response", exact: true })
    .click();
  await expect(
    editPage.getByText("Your response is saved", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  await editPage.close();
  await guestPage.getByRole("radio", { name: "ગુજરાતી", exact: true }).click();
  await expect(guestPage.locator(".family-blessings")).toContainText("મીનાબેન");
  await expect(guestPage.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await mkdir("docs/screenshots", { recursive: true });
  await guestPage.screenshot({
    path: "docs/screenshots/assistance-guest-mobile.png",
    fullPage: true,
  });
  const accessibility = await new AxeBuilder({ page: guestPage })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  const social = await guestPage.request.get(`${publicUrl}/social`);
  expect(social.ok()).toBe(true);
  expect(social.headers()["content-type"]).toContain("image/png");
  const unauthorized = await guest.request.post(
    new URL(`/api/weddings/${weddingId}/translate`, page.url()).toString(),
    {
      headers: { origin: new URL(page.url()).origin },
      data: { items: [{ id: "welcome", text: "Together with our families" }] },
    },
  );
  expect(unauthorized.status()).toBe(401);
  await guest.close();
});
