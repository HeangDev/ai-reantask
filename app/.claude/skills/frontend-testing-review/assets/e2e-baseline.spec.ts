import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Baseline checks for every key page. Put this file in ./e2e/ and edit PAGES.
 * Runs on every project in playwright.config.ts (mobile-360 and desktop).
 */
const PAGES = [
  { name: "home", path: "/" },
  // { name: "product-list", path: "/products" },
  // { name: "product-detail", path: "/products/1" },
  // { name: "login", path: "/login" },
];

async function ready(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready); // Khmer fonts change line heights when they load
}

for (const { name, path } of PAGES) {
  test.describe(name, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
      await ready(page);
    });

    test("has no horizontal overflow", async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(overflow, "page scrolls sideways — something is wider than the viewport").toBeLessThanOrEqual(0);
    });

    test("declares the page language", async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute("lang", /^(km|en)/);
    });

    test("has no serious accessibility violations", async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? "")
      );
      expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });

    test("has no console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await page.reload();
      await ready(page);
      expect(errors).toEqual([]);
    });

    test("matches the visual baseline", async ({ page }) => {
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        animations: "disabled",
        maxDiffPixelRatio: 0.01,
      });
    });
  });
}

test("language switch updates <html lang>", async ({ page }) => {
  await page.goto("/");
  // Adjust the accessible name to your switcher.
  const toEnglish = page.getByRole("link", { name: "English" }).or(page.getByRole("button", { name: "English" }));
  if (await toEnglish.count() === 0) test.skip(true, "no language switcher on this page");
  await toEnglish.first().click();
  await expect(page.locator("html")).toHaveAttribute("lang", /^en/);
});