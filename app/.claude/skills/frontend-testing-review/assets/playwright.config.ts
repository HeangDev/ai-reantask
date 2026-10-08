import { defineConfig, devices } from "@playwright/test";

/**
 * Mobile-first Playwright config for apps used in Cambodia.
 * Default project = 360x800 touch phone; plus one desktop project.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,          // fail CI if a test.only slipped in
  retries: process.env.CI ? 1 : 0,       // one retry in CI; flaky tests are still reported
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    locale: "km-KH",
    timezoneId: "Asia/Phnom_Penh",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "mobile-360",
      use: {
        ...devices["Pixel 7"],              // Chromium mobile UA + touch
        viewport: { width: 360, height: 800 },
      },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    // Optional: Safari engine for iPhone users
    // { name: "iphone", use: { ...devices["iPhone 13"] } },
  ],

  webServer: {
    command: "npm run build && npm run start",   // adjust: "npm run preview" for Vite
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});