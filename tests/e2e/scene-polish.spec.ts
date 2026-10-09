import { test, expect } from "@playwright/test";

test("Sangeet performers stay visible and the bride waits through the horse arrival", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Open the invitation", exact: true })
    .click();
  const chapters = page.getByRole("navigation", {
    name: "Celebration chapters",
  });
  for (const viewport of [
    { width: 1365, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await chapters
      .getByRole("button", { name: "An evening of music", exact: true })
      .click();
    const dancers = page.locator(
      '[data-ceremony="sangeet"] [data-attire="sangeet"]',
    );
    await expect(dancers).toHaveCount(4);
    for (const dancer of await dancers.all()) {
      await expect(dancer).toBeInViewport();
      const box = await dancer.boundingBox();
      expect(box!.height).toBeGreaterThan(60);
    }
    await expect(
      page.locator('[data-ceremony="sangeet"] foreignObject'),
    ).toHaveCount(0);
    await page.screenshot({ path: `.local/sangeet-${viewport.width}.png` });

    await chapters
      .getByRole("button", { name: "The wedding", exact: true })
      .click();
    const art = page.locator('[data-ceremony="wedding"]');
    await expect(art).toBeVisible();
    await art.evaluate((element) =>
      element.getAnimations({ subtree: true }).forEach((a) => {
        a.pause();
        a.currentTime = 3000;
      }),
    );
    const waiting = art.locator('[data-wedding-role="waiting"]');
    const arriving = art.locator('[data-wedding-role="arriving"]');
    await expect(waiting).toBeInViewport();
    await expect(arriving).toBeInViewport();
    await expect(waiting.locator('[data-outfit="0"]')).toHaveCount(1);
    await expect(arriving.locator('[data-outfit="1"]')).toHaveCount(1);
    expect(
      await waiting.evaluate((e) => getComputedStyle(e.parentElement!).opacity),
    ).toBe("1");
    // The waiting partner stays still while the procession advances.
    const before = await waiting.boundingBox();
    const riderBefore = await arriving.boundingBox();
    await art.evaluate((element) =>
      element.getAnimations({ subtree: true }).forEach((a) => {
        a.currentTime = 4500;
      }),
    );
    const after = await waiting.boundingBox();
    const riderAfter = await arriving.boundingBox();
    expect(Math.abs(after!.x - before!.x)).toBeLessThan(4);
    expect(riderAfter!.x).toBeGreaterThan(riderBefore!.x + 10);
    await page.screenshot({ path: `.local/baraat-${viewport.width}.png` });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() =>
        art
          .locator('[data-wedding-role="waiting"]')
          .evaluate((e) => getComputedStyle(e.parentElement!).opacity),
      )
      .toBe("0");
    await expect(art.locator(".character-garland").first()).toBeInViewport();
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});

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
