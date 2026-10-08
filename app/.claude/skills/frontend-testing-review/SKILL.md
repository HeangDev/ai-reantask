---
name: frontend-testing-review
description: How to write tests and how to review code for any frontend project (React, Next.js, Vue, Nuxt, Svelte, Angular, plain JS/TS, React Native, Flutter). Covers which tests to write (static checks, unit, component, end-to-end, accessibility, visual and performance), making tests deterministic (time zone, locale, network, fonts), Khmer and mobile checks for apps used in Cambodia, CI order, and a structured code-review process with severity levels, a full checklist (correctness, security, accessibility, i18n, responsive/performance, state, errors, tests, readability) and a fixed output format. Use this skill whenever you write or change application code that should have tests, when asked to add/fix/run tests, debug a flaky test, set up Vitest/Jest/Playwright/Cypress/Testing Library, review a PR, diff, branch, file or snippet, check code quality, or prepare code for merge — even if the user just says "check this", "is this OK?", "look over my code" or "ពិនិត្យកូដនេះ".
---

# Frontend Testing & Code Review

Two jobs live here: **writing tests** (sections 1–5) and **reviewing code** (sections 6–8). For code Claude writes itself, do both: write the tests, then review the change with the checklist before handing it over.

Framework-specific setup is in `references/testing-frameworks.md`. The full review checklist is in `references/review-checklist.md`. Ready-to-copy files are in `assets/`.

---

## Part A — Testing

### 1. What to test, at which level

Spend effort where bugs are likely and costly. Default mix for a frontend app:

| Level | Tool (default) | What it covers | Share of effort |
|---|---|---|---|
| Static | TypeScript (strict), ESLint, Prettier | typos, wrong types, unused code, hook rules | always on |
| Unit | Vitest (or Jest) | pure logic: formatters, validators, reducers, utils | some |
| Component / integration | Testing Library (+ MSW for API) | a component or screen behaving correctly with its data | **most** |
| End-to-end | Playwright | critical user journeys in a real browser | few, high value |
| Accessibility | axe (`@axe-core/playwright`, `vitest-axe`) | automatic WCAG checks | on key pages |
| Visual | Playwright screenshots | layout regressions at mobile/desktop widths | key pages only |
| Performance | Lighthouse CI | budgets and Core Web Vitals | key pages |

Critical journeys deserving E2E tests usually include: sign-up/login, search → detail, add to cart → checkout/payment, the main form of the app, and language switching.

Don't test: framework internals, third-party libraries, trivial markup with no logic, or exact CSS values.

### 2. How to write good tests

- **Test behavior, not implementation.** Interact like a user (click, type) and assert what the user sees. Don't assert on internal state, private methods, or component instance details — those tests break on every refactor while catching nothing.
- **Query like a user** (Testing Library priority): `getByRole` (with `name`) → `getByLabelText` → `getByPlaceholderText` → `getByText` → `getByTestId` only as last resort. If an element can't be found by role or label, that is often an accessibility bug to fix in the component.
- Use `userEvent` (not `fireEvent`) and `await` it. Use `findBy*` / `waitFor` for async UI — never fixed `sleep`/`setTimeout` waits.
- Arrange–Act–Assert structure; one behavior per test; descriptive names: `it("shows an error when the phone number is invalid")`.
- Cover: happy path, empty state, loading state, error state (API 500, network failure), edge inputs (empty, very long, Khmer text, Khmer digits, zero/negative amounts), and permission/auth states.
- Mock at the network boundary with **MSW**, not by mocking `fetch` or your own modules. Tests then exercise real data-fetching code.
- Build test data with small factory functions (`makeUser({ name: "សុខា" })`) rather than giant shared fixtures.
- Snapshots: only small, stable outputs (e.g. a formatter's output). Never snapshot whole component trees — nobody reviews big snapshot diffs.
- Coverage is a signal, not a goal. Reasonable floor: ~80% lines for `lib/`/`utils/` logic; for UI, cover the states listed above rather than chasing a number.
- Every bug fix gets a test that fails before the fix and passes after.

### 3. Determinism (no flaky tests)

Flaky tests destroy trust; fix the cause, don't add retries.

- **Time zone and locale:** run tests with `TZ=Asia/Phnom_Penh` (or UTC — but choose one and pin it) and an explicit locale. Otherwise date tests pass locally and fail in CI. Setup in `references/testing-frameworks.md`.
- **Time:** freeze the clock (`vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-15T03:00:00Z"))`) for anything showing "today", relative time, countdowns or expiry.
- **Randomness / IDs:** seed or mock `Math.random`/`crypto.randomUUID` when output depends on them.
- **Network:** no real network in unit/component tests (MSW with `onUnhandledRequest: "error"`). E2E against a seeded test backend or route mocks.
- **Isolation:** each test sets up its own data; no order dependence; reset mocks/storage between tests.
- **Fonts and animations in E2E/visual tests:** wait for `document.fonts.ready` before screenshots (Khmer fonts load late and change line heights), disable animations (`animations: "disabled"` in Playwright screenshot options).
- **E2E waits:** rely on Playwright auto-waiting and web-first assertions (`await expect(locator).toBeVisible()`), never `page.waitForTimeout`.

### 4. Khmer and mobile checks (for apps used in Cambodia)

These catch the bugs most specific to this market. `assets/e2e-baseline.spec.ts` implements them.

- Unit-test the formatters: riel (`40,000៛`), USD, Khmer↔Latin digits, phone normalization (+855), dates in `Asia/Phnom_Penh`, grapheme-safe truncation.
- Component tests render real Khmer strings (e.g. `ព្រះរាជាណាចក្រកម្ពុជា`, `ស្ត្រី`), not "Lorem ipsum" or English only.
- Inputs accept Khmer digits (`០១២៣`) and Khmer text, and validation messages show in the active language.
- E2E at **360×800 mobile** (touch enabled) as the default project, plus one desktop project:
  - no horizontal overflow (`document.documentElement.scrollWidth <= innerWidth`)
  - `<html lang>` matches the selected language after switching
  - no automatic axe violations (serious/critical)
  - screenshot of key pages after `document.fonts.ready`
- No hard-coded user-facing strings: an i18n lint rule (e.g. `eslint-plugin-i18next` / `@intlify/eslint-plugin-vue-i18n`) or a test that both `km.json` and `en.json` have the same keys.

### 5. CI order

Fail fast and cheap first:

1. install (lockfile, `npm ci` / `pnpm i --frozen-lockfile`)
2. typecheck (`tsc --noEmit`)
3. lint + format check
4. unit + component tests (with coverage)
5. build
6. E2E (Playwright) against the built app
7. Lighthouse CI budgets (if the responsive-performance skill's config exists)

Block merging on 2–6. Upload Playwright traces/screenshots on failure.

---

## Part B — Code review

### 6. Review process

When asked to review code (or before handing over code Claude wrote):

1. **Understand intent first.** Read the PR description/request. What should this change do? If intent is unclear, say what you assumed.
2. **Scan the whole diff** before commenting, to see structure and spot what's missing (tests, migrations, translations, error states).
3. **Check behavior:** trace the main path and the failure paths. If you can run the code or tests, do; otherwise say what you couldn't verify.
4. **Go through the checklist** in `references/review-checklist.md`, focusing on areas the change actually touches.
5. **Prioritize.** A few important findings beat fifty nits. Group repeated issues into one comment ("same in 4 places: …").
6. **Write the review** in the format of section 8.

For very large changes (> ~400 changed lines of logic), say so and suggest splitting; still review the riskiest parts first.

### 7. Severity levels

Label every finding:

- **🔴 Blocker** — must fix before merge: bugs, data loss, security holes, crashes, broken builds, accessibility barriers that block a task, legal/privacy issues.
- **🟠 Major** — should fix before merge: missing tests for new logic, unhandled error/loading/empty states, performance regressions, broken mobile layout, missing translations, wrong types (`any`) on public interfaces.
- **🟡 Minor** — fix soon or in a follow-up: duplication, unclear naming, small refactors, missing edge-case tests.
- **⚪ Nit** — optional, style/preference. Don't raise nits that a linter or formatter should catch; suggest the lint rule instead.

Also note genuinely good decisions briefly (one or two lines) so they're kept.

### 8. Review output format

Write in the language the user writes in (Khmer or English); keep code, identifiers and file paths as they are.

~~~markdown
## Summary
<2–3 sentences: what the change does, overall assessment, merge recommendation:
✅ Approve / 💬 Approve with comments / ⛔ Request changes>

## Findings
### 🔴 Blocker
1. **<short title>** — `path/to/file.tsx:42`
   <what's wrong and why it matters (impact on users/security/data)>
   ```suggestion
   <concrete fix>
   ```

### 🟠 Major
…
### 🟡 Minor
…
### ⚪ Nit
…

## Tests
<what is covered, what's missing, which tests to add (name them)>

## What's good
<1–2 lines>

## Not verified
<anything you couldn't check: didn't run, needs backend, needs device>
~~~

Omit empty severity sections. Each finding must be specific (file + line or code excerpt), explain *why*, and give a fix. Comment on the code, never on the person; ask questions when intent is unclear rather than asserting it's wrong.

---

## Files in this skill

- `references/review-checklist.md` — full checklist by area (correctness, security, accessibility, i18n/Khmer, responsive/performance, state & data, errors, tests, readability, git hygiene). Read before any review.
- `references/testing-frameworks.md` — setup and example tests for Vitest/Jest + Testing Library (React, Vue, Svelte, Angular), MSW, Playwright, React Native Testing Library, Flutter. Read the section for the project's stack.
- `assets/playwright.config.ts` — Playwright config with 360px mobile + desktop projects, `km-KH` locale, `Asia/Phnom_Penh` time zone, traces on failure.
- `assets/e2e-baseline.spec.ts` — baseline E2E checks for every key page: overflow, `lang`, axe, fonts-loaded screenshot.
- `assets/pull_request_template.md` — bilingual (ខ្មែរ/English) PR template with the author checklist. Copy to `.github/pull_request_template.md`.