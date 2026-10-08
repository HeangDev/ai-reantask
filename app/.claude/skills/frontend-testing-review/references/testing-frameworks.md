# Testing setup by framework

Read only the sections for the project's stack. Default choice for new web projects: **Vitest + Testing Library + MSW + Playwright**.

## Contents
1. Pinning time zone and locale (all JS projects)
2. Vitest + React Testing Library
3. Vue Test Utils / @testing-library/vue
4. Svelte and Angular
5. MSW (API mocking)
6. Unit tests for Khmer formatters
7. Playwright
8. Jest (existing projects)
9. React Native Testing Library
10. Flutter

---

## 1. Pinning time zone and locale

`TZ` must be set before any `Date` is created. A global setup runs in the main process before test workers start, so workers inherit it — this works on Windows too (unlike `TZ=… vitest` in npm scripts).

```ts
// test/global-setup.ts
export default function setup() {
  process.env.TZ = "Asia/Phnom_Penh";
}
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react"; // or vue(), svelte()

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    coverage: { provider: "v8", reporter: ["text", "html"], include: ["src/**"] },
  },
});
```

Jest: `globalSetup: "<rootDir>/test/global-setup.js"` with the same body.

Verify in a test: `expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("Asia/Phnom_Penh")`.

## 2. Vitest + React Testing Library

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw
```

```ts
// test/setup.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw-server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); cleanup(); });
afterAll(() => server.close());
```

Example component test (behavior, roles, Khmer data, error state):

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../test/msw-server";
import { ProductList } from "./ProductList";

it("shows products with riel prices", async () => {
  server.use(http.get("/api/products", () =>
    HttpResponse.json([{ id: 1, name: "កាហ្វេទឹកដោះគោ", priceRiel: 8000 }])));
  render(<ProductList />);
  expect(await screen.findByRole("heading", { name: "កាហ្វេទឹកដោះគោ" })).toBeInTheDocument();
  expect(screen.getByText("8,000៛")).toBeInTheDocument();
});

it("shows an error with retry when the API fails", async () => {
  server.use(http.get("/api/products", () => new HttpResponse(null, { status: 500 })));
  render(<ProductList />);
  const retry = await screen.findByRole("button", { name: /ព្យាយាមម្តងទៀត|retry/i });
  await userEvent.click(retry);
});
```

Wrap components needing providers (i18n, router, query client) in a shared `renderWithProviders()` helper in `test/utils.tsx`, defaulting to the `km` locale.

## 3. Vue

```bash
npm i -D vitest jsdom @testing-library/vue @testing-library/user-event @testing-library/jest-dom msw
```
Same `setup.ts` (cleanup is automatic). Provide plugins via `render(Comp, { global: { plugins: [i18n, router, pinia] } })`. Nuxt: use `@nuxt/test-utils` (`mountSuspended`) with the `nuxt` Vitest environment.

## 4. Svelte and Angular

- **Svelte:** `@testing-library/svelte` with Vitest; for Svelte 5 add `svelteTesting()` from `@testing-library/svelte/vite` to the plugins.
- **Angular:** keep the CLI's runner or move to Jest/Vitest; use `@testing-library/angular` (`await render(Component, { imports: [...] })`) for behavior-focused tests. Use `HttpTestingController` or MSW for HTTP.

## 5. MSW (API mocking)

```ts
// test/msw-server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";
export const server = setupServer(...handlers);

// test/handlers.ts — happy-path defaults; override per test with server.use()
import { http, HttpResponse } from "msw";
export const handlers = [
  http.get("/api/me", () => HttpResponse.json({ id: 1, name: "សុខា", locale: "km" })),
];
```
The same handlers can power the browser in development (`setupWorker`) and Storybook.

## 6. Unit tests for Khmer formatters

```ts
import { describe, expect, it } from "vitest";
import { formatRiel, toLatinDigits, normalizeKhPhone, truncateGraphemes } from "@/lib/khmer-format";

describe("khmer-format", () => {
  it("formats riel without decimals", () => expect(formatRiel(40000.4)).toBe("40,000៛"));
  it("parses Khmer digits", () => expect(toLatinDigits("០១២៣")).toBe("0123"));
  it.each([
    ["012 345 678", "+85512345678"],
    ["០១២៣៤៥៦៧៨", "+85512345678"],
    ["+855 97 123 4567", "+855971234567"],
    ["123", null],
  ])("normalizes phone %s", (input, out) => expect(normalizeKhPhone(input)).toBe(out));
  it("never cuts a Khmer cluster", () => expect(truncateGraphemes("ស្ត្រីកម្ពុជា", 1)).toBe("ស្ត្រី…"));
});
```
Note: `Intl` output can differ slightly between Node/ICU versions (separators, spaces like U+202F). If an exact-string test fails only in CI, compare Node versions before changing the formatter.

## 7. Playwright

```bash
npm init playwright@latest
npm i -D @axe-core/playwright
```
Copy `assets/playwright.config.ts` and `assets/e2e-baseline.spec.ts`. Selectors: `page.getByRole`, `getByLabel`, `getByText` — same priority as Testing Library. Use `test.step()` for readable reports and `storageState` to reuse a logged-in session across tests.

Visual comparisons: `await expect(page).toHaveScreenshot({ fullPage: true, animations: "disabled" })` after `document.fonts.ready`. Generate baselines in the same OS/browser as CI (use the Playwright Docker image) — fonts render differently across OSes.

## 8. Jest (existing projects)

Keep Jest if the project already uses it: `jest-environment-jsdom`, `@testing-library/jest-dom`, `globalSetup` for TZ. Same test style as Vitest (replace `vi` with `jest`). Migrating to Vitest is optional, not a review requirement.

## 9. React Native Testing Library

```bash
npm i -D @testing-library/react-native
```
```tsx
import { render, screen, userEvent } from "@testing-library/react-native";
it("submits the phone number", async () => {
  render(<LoginScreen />);
  await userEvent.type(screen.getByLabelText("លេខទូរស័ព្ទ"), "012345678");
  await userEvent.press(screen.getByRole("button", { name: "បន្ត" }));
  expect(await screen.findByText(/OTP/)).toBeOnTheScreen();
});
```
E2E on devices: Maestro (simple YAML flows) or Detox. Run at least one flow on a budget Android device/emulator.

## 10. Flutter

- Unit: `test` package; widget: `testWidgets` with `find.bySemanticsLabel` / `find.text`; integration: `integration_test` package.
- Wrap widgets with `MaterialApp(locale: Locale('km'), localizationsDelegates: …)` in tests; call `initializeDateFormatting('km')` for `intl`.
- Golden tests (`matchesGoldenFile`) must load the real Khmer font (`FontLoader`) — the default test font renders boxes and hides clipping bugs.
- Fix time with `clock` package (`withClock(Clock.fixed(...))`).