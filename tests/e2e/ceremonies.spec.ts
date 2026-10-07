import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("ceremony chapters animate, pause, respect reduced motion and fit mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrated|server rendered/i.test(message.text())
    )
      errors.push(message.text());
  });
  for (const theme of ["royal", "marigold", "garden"]) {
    await page.goto(`/demo?theme=${theme}`);
    await page.getByRole("radio", { name: "English", exact: true }).click();
    const cover = await page.locator(".immersive-cover").boundingBox();
    expect(cover?.width).toBe(page.viewportSize()!.width);
    expect(cover!.height).toBeGreaterThanOrEqual(page.viewportSize()!.height);
    await page.screenshot({
      path: `docs/screenshots/${theme}-fullscreen-cover.png`,
    });
    await page
      .getByRole("button", { name: "Open the invitation", exact: true })
      .click();
    const chapters = page.getByRole("navigation", {
      name: "Celebration chapters",
    });
    for (const [kind, title] of [
      ["haldi", "A little sunshine & Haldi"],
      ["mehendi", "An afternoon of Mehendi"],
      ["sangeet", "An evening of music"],
      ["wedding", "The wedding"],
    ]) {
      await chapters.getByRole("button", { name: title, exact: true }).click();
      const art = page.locator(`[data-ceremony="${kind}"]`);
      await expect(art).toBeVisible();
      const stage = await page.locator(".scene-visual").boundingBox();
      expect(stage?.width).toBe(page.viewportSize()!.width);
      expect(stage!.height).toBeGreaterThanOrEqual(page.viewportSize()!.height);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect
        .poll(() =>
          art.evaluate(
            (element) =>
              element
                .getAnimations({ subtree: true })
                .filter((a) => a.playState === "running").length,
          ),
        )
        .toBeGreaterThan(10);
      await page
        .getByRole("button", { name: "Pause animations", exact: true })
        .click();
      await expect
        .poll(() =>
          art.evaluate(
            (element) =>
              element
                .getAnimations({ subtree: true })
                .filter((a) => a.playState === "running").length,
          ),
        )
        .toBe(0);
      // Freeze at a readable storytelling moment for visual review.
      await art.evaluate(
        (element, time) =>
          element.getAnimations({ subtree: true }).forEach((a) => {
            a.currentTime = time;
          }),
        kind === "wedding" ? 3000 : 1600,
      );
      await art.screenshot({
        path: `docs/screenshots/${theme}-${kind}-animated.png`,
      });
      if (theme === "royal")
        await page.screenshot({
          path: `docs/screenshots/fullscreen-${kind}.png`,
        });
      if (kind === "wedding") {
        await art.evaluate((element) =>
          element.getAnimations({ subtree: true }).forEach((a) => {
            a.currentTime = 10500;
          }),
        );
        await art.screenshot({
          path: `docs/screenshots/${theme}-varmala-animated.png`,
        });
      }
      await page
        .getByRole("button", { name: "Play animations", exact: true })
        .click();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("navigation", { name: "Celebration chapters" })
    .getByRole("button", { name: "An afternoon of Mehendi", exact: true })
    .click();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({
    path: "docs/screenshots/fullscreen-mobile-mehendi.png",
  });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page
        .locator("[data-ceremony]")
        .evaluate((element) => element.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
  await page.screenshot({
    path: "docs/screenshots/ceremony-mobile-reduced.png",
    fullPage: true,
  });
  await page.getByRole("radio", { name: "ગુજરાતી", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "મહેંદીની બપોર",
  );
  await expect(page.locator("[data-ceremony]")).toHaveAttribute(
    "data-ceremony",
    "mehendi",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      page
        .locator("[data-ceremony]")
        .evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter((a) => a.playState === "running").length,
        ),
    )
    .toBeGreaterThan(10);
  expect(errors).toEqual([]);
});

test("full-screen framing survives narrow and landscape screens and details remain reachable", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 844, height: 390 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/demo");
    await page
      .getByRole("button", { name: "Open the invitation", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Celebration chapters" })
      .getByRole("button", { name: "The wedding", exact: true })
      .click();
    await expect(page.locator("body")).toHaveJSProperty(
      "scrollWidth",
      viewport.width,
    );
    const stage = await page.locator(".scene-visual").boundingBox();
    expect(stage?.width).toBe(viewport.width);
    expect(stage!.height).toBeGreaterThanOrEqual(viewport.height);
    await page
      .getByRole("button", { name: "Pause animations", exact: true })
      .click();
    await expect
      .poll(() =>
        page
          .locator(".invitation-atmosphere")
          .evaluate(
            (element) =>
              element
                .getAnimations({ subtree: true })
                .filter((a) => a.playState === "running").length,
          ),
      )
      .toBe(0);
    await page.screenshot({
      path: `docs/screenshots/fullscreen-wedding-${viewport.width}.png`,
    });
    await page
      .locator(".guest-toolbar")
      .getByRole("link", { name: "Invitation details", exact: true })
      .click();
    await expect(page.locator(".immersive-scene")).toHaveCount(0);
    await expect(page.locator("#details")).toBeInViewport();
  }
});
