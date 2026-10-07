import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

test("wedding stationery and sign-in are accessible at desktop and mobile sizes", async ({
  page,
}) => {
  await mkdir("docs/screenshots", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Nyota home" }).first(),
    ).toBeVisible();
    await expect(page.locator("#features article")).toHaveCount(5);
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/screenshots/nyota-home-${width}.png`,
      fullPage: true,
    });
    await page.goto("/sign-in");
    await expect(
      page.getByLabel("Email address", { exact: true }),
    ).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({
      path: `docs/screenshots/sign-in-redesign-${width}.png`,
      fullPage: true,
    });
    await page.goto("/demo?theme=midnight#details");
    await expect(page.locator(".ceremony-card")).toHaveCount(5);
    await page.locator("#details").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `docs/screenshots/invitation-redesign-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .include("#details")
          .withTags(["wcag2a", "wcag2aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.getByRole("radio", { name: "ગુજરાતી", exact: true }).click();
    await expect(page.locator(".celebrations-heading h2")).toHaveText(
      "આપણી ઉજવણી",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
