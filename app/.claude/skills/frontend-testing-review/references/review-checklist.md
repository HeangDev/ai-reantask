# Frontend code review checklist

Focus on the areas the change touches. Each item notes the usual severity if violated (🔴 Blocker, 🟠 Major, 🟡 Minor).

## Contents
1. Correctness & logic
2. Security & privacy
3. Accessibility
4. i18n & Khmer
5. Responsive & performance
6. State, data fetching & side effects
7. Error, loading & empty states
8. Types & API contracts
9. Tests
10. Readability & structure
11. Git & PR hygiene
12. Framework-specific pitfalls

---

## 1. Correctness & logic
- 🔴 Does it do what the PR/request says, for all paths — not just the happy one?
- 🔴 Off-by-one, wrong comparisons (`==` vs `===`, `<` vs `<=`), inverted conditions, falsy traps (`0`, `""` treated as missing: use `??` not `||` for defaults).
- 🔴 Money: no floating-point arithmetic on amounts (`0.1 + 0.2`); integers in minor units or a decimal library; rounding rule explicit.
- 🔴 Dates: time zone explicit (`Asia/Phnom_Penh` for Cambodian users), no `new Date("2026-10-08")` parsing ambiguity (date-only strings parse as UTC), no month off-by-one (`getMonth()` is 0-based).
- 🟠 Async: awaited where needed, no unhandled promise rejections, race conditions handled (stale responses overwriting newer ones — use AbortController or ignore outdated results).
- 🟠 Mutations of props/state/shared objects; array sort/reverse mutating in place.
- 🟡 Dead code, leftover `console.log`, commented-out blocks, TODOs without an issue link.

## 2. Security & privacy
- 🔴 XSS: no unsanitized HTML (`dangerouslySetInnerHTML`, `v-html`, `{@html}`, `innerHTML`, `[innerHTML]`). If unavoidable, sanitize with DOMPurify and explain why.
- 🔴 No secrets in frontend code or public env vars (`NEXT_PUBLIC_*`, `VITE_*`, `NUXT_PUBLIC_*` are shipped to the browser). API keys for paid/privileged services belong on the server.
- 🔴 Authorization enforced on the server, not only by hiding buttons in the UI.
- 🔴 No tokens in `localStorage` for sensitive apps where httpOnly cookies are possible; no tokens or personal data in URLs, logs or analytics events.
- 🔴 User-controlled URLs in `href`/`src`/redirects validated (block `javascript:`; allowlist redirect targets — open redirect).
- 🟠 `target="_blank"` links have `rel="noopener noreferrer"` (older browsers) when linking externally.
- 🟠 Forms that change state are protected against CSRF (SameSite cookies, CSRF token) per the backend's approach.
- 🟠 New dependencies: maintained, reasonable size, no known vulnerabilities (`npm audit`), license compatible; lockfile updated.
- 🟠 Personal data (phone numbers, national ID, addresses, payment info) shown only where needed, masked where appropriate, never cached publicly.

## 3. Accessibility
- 🔴 Interactive elements are real `<button>`/`<a href>`/form controls — no clickable `<div>`s without role, tabindex and keyboard handlers.
- 🔴 Every input has a visible `<label>` (or `aria-label` when visually labelled otherwise); errors are associated (`aria-describedby`) and announced.
- 🔴 Keyboard: everything reachable and operable with Tab/Enter/Space/Escape; visible focus style (no `outline: none` without replacement); modals trap and restore focus.
- 🟠 Images have meaningful `alt` (empty `alt=""` for decorative); icon-only buttons have an accessible name.
- 🟠 Color contrast ≥ 4.5:1 for text (3:1 for large text and UI components); information not conveyed by color alone.
- 🟠 Headings in logical order; one `<h1>` per page; landmarks (`<main>`, `<nav>`, `<header>`).
- 🟠 `lang` set correctly on `<html>` and on mixed-language fragments.
- 🟡 Respects `prefers-reduced-motion`; no auto-playing motion that can't be paused.

## 4. i18n & Khmer
- 🟠 No hard-coded user-facing strings; new keys added to **both** `km` and `en` files; no string concatenation of translated fragments.
- 🟠 Numbers, prices and dates go through the shared formatter (riel without decimals, USD style per house rule, `Asia/Phnom_Penh`).
- 🟠 Khmer text not clipped: no fixed `height` + `overflow: hidden` on text containers; line-height ≥ 1.6 for Khmer body; no `letter-spacing`/`tracking-*` on Khmer.
- 🟠 Long Khmer strings wrap (`lang="km"`, `overflow-wrap: anywhere`); no `white-space: nowrap` on Khmer paragraphs.
- 🟠 Truncation is grapheme-safe (CSS ellipsis or `Intl.Segmenter`), not `.slice()`.
- 🟠 Input parsing accepts Khmer digits; search normalizes (NFC, strip ZWSP); sorting uses `Intl.Collator("km")`.
- 🟡 Layout tested in both languages (Khmer is taller; label lengths differ).

## 5. Responsive & performance
- 🟠 Works at 360px width with no horizontal page scroll; touch targets ≥ 44px; nothing relies on hover.
- 🟠 Images: width/height set, responsive sizes, modern formats, LCP image not lazy, others lazy.
- 🟠 No large new dependencies for small tasks (Moment.js, full lodash, big UI kits for one component); heavy components lazy-loaded.
- 🟠 Third-party scripts deferred / behind a facade.
- 🟠 No layout shift introduced (reserved space for images, ads, async content; skeletons sized like content).
- 🟡 Expensive work memoized only when measured as needed; lists > ~100 items virtualized or paginated.
- 🟡 Next.js/RSC: `"use client"` only where needed, not on whole pages/layouts.

## 6. State, data fetching & side effects
- 🟠 Single source of truth; no duplicated derived state that can drift (compute it instead).
- 🟠 Effects have correct dependencies, clean up subscriptions/timers/listeners, and aren't used for things that should be event handlers or derived values.
- 🟠 Data fetching via the project's standard (TanStack Query, SWR, `useFetch`, server components…) — not ad-hoc `useEffect` fetches with missing error/loading handling.
- 🟠 Forms: double-submit prevented (disable while pending), server errors displayed, input preserved on failure.
- 🟡 Cache invalidation after mutations is correct (lists refresh after create/update/delete).

## 7. Error, loading & empty states
- 🟠 Every async UI has loading, error (with retry) and empty states.
- 🟠 Errors shown to users are human-readable and translated; technical details go to logging/monitoring, not to the UI.
- 🟠 Error boundaries (React) / `error.vue` / `+error.svelte` catch render errors on routes.
- 🟡 Timeouts on requests; offline handled gracefully where relevant.

## 8. Types & API contracts
- 🟠 No `any`/`as unknown as` on public interfaces without justification; `strict` TypeScript respected.
- 🟠 API responses validated or typed from a single source (OpenAPI/zod/tRPC) — not hand-written types that silently drift.
- 🟡 Props minimal and named clearly; optional props have sensible defaults.

## 9. Tests
- 🟠 New logic has tests; bug fixes have a regression test.
- 🟠 Tests assert behavior (roles, labels, visible text), not implementation details.
- 🟠 Async tests use `findBy`/`waitFor`/web-first assertions — no fixed sleeps.
- 🟠 Deterministic: time frozen/time zone pinned, network mocked, no order dependence.
- 🟡 Error/empty/loading states and Khmer inputs covered.
- 🟡 No large snapshots; no `.only`/`.skip` left behind.

## 10. Readability & structure
- 🟡 Names say what things are/do; no unexplained abbreviations; booleans read as questions (`isOpen`, `hasError`).
- 🟡 Functions/components do one thing; very long components (> ~200 lines) split.
- 🟡 Follows existing project patterns (folder structure, styling approach, state library) rather than introducing a new one.
- 🟡 Comments explain *why*, not *what*; complex logic has a short explanation.
- ⚪ Formatting matches Prettier/ESLint (if not, recommend running them rather than listing nits).

## 11. Git & PR hygiene
- 🟡 PR does one thing; unrelated refactors split out; ideally < ~400 lines of logic changes.
- 🟡 Description explains what/why, how to test, screenshots (mobile + desktop, Khmer + English) for UI changes.
- 🟡 Commit messages meaningful (Conventional Commits if the team uses them: `feat:`, `fix:`, `refactor:`…).
- 🟠 No generated files, build output, `.env` or large binaries committed; lockfile changes intentional.

## 12. Framework-specific pitfalls
- **React:** missing/unstable `key`s in lists (index as key for reorderable lists); hooks called conditionally; state updates based on stale state (use updater form); objects/functions recreated every render passed to memoized children.
- **Next.js:** secrets in client components; `fetch` caching behavior misunderstood; using browser APIs in server components; hydration mismatches from `Date.now()`/random/locale-dependent formatting during render.
- **Vue:** mutating props; losing reactivity by destructuring `reactive()` (use `toRefs`); `v-if` with `v-for` on the same element; missing `:key`.
- **Svelte:** reactive statements with hidden dependencies; stores not unsubscribed outside components.
- **Angular:** subscriptions not unsubscribed (`takeUntilDestroyed`/`async` pipe); heavy logic in templates; missing `trackBy`/`track` in loops.
- **React Native:** `ScrollView` + `.map()` for long lists; inline styles/functions in list rows; missing `keyboardShouldPersistTaps` / keyboard avoidance on forms.
- **Flutter:** `setState` after dispose; heavy work in `build`; missing `const` constructors; controllers not disposed.