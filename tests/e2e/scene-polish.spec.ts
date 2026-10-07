import { test, expect } from "@playwright/test";

test("invitation turns through seven chapters without the redundant story screen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Open the invitation", exact: true })
    .click();

  for (let scene = 1; scene <= 7; scene++) {
    await expect(page.locator("[data-invitation-screen]")).toHaveAttribute(
      "data-invitation-screen",
      String(scene),
    );
    await expect(page.locator(".invitation")).not.toHaveAttribute(
      "data-scene-turn",
      /.+/,
    );
    if (scene === 2) {
      await expect(
        page.getByRole("heading", { name: "Our journey" }),
      ).toHaveCount(0);
    }
    if (scene === 4) {
      await expect(
        page.locator('[data-ceremony="sangeet"] [data-attire="sangeet"]'),
      ).toHaveCount(4);
      await expect(page.locator("[data-disco-stage]")).toBeVisible();
    }
    if (scene === 5) {
      await expect(page.locator('[data-attire="baraat"]')).toHaveCount(1);
    }
    if (scene === 7) {
      await expect(page.locator('[data-ceremony="celebration"]')).toBeVisible();
    } else {
      await page
        .getByRole("button", {
          name: scene === 6 ? "To the invitation" : "Continue",
          exact: true,
        })
        .click();
    }
  }
  expect(errors).toEqual([]);
});

test("scene curtain finishes and reduced motion changes instantly", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Open the invitation", exact: true })
    .click();
  await expect(page.locator(".invitation")).not.toHaveAttribute(
    "data-scene-turn",
    /.+/,
  );
  await page
    .getByRole("navigation", { name: "Celebration chapters" })
    .getByRole("button", { name: "An evening of music", exact: true })
    .click();
  await expect(page.locator("[data-invitation-screen]")).toHaveAttribute(
    "data-invitation-screen",
    "4",
  );
  await expect(page.locator(".invitation")).not.toHaveAttribute(
    "data-scene-turn",
    /.+/,
  );
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.locator("[data-invitation-screen]")).toHaveAttribute(
    "data-invitation-screen",
    "3",
  );
  await expect(page.locator(".invitation")).not.toHaveAttribute(
    "data-scene-turn",
    /.+/,
  );
});
