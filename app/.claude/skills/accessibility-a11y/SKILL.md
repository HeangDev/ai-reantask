---
name: accessibility-a11y
description: Accessibility (a11y) rules for building and reviewing any frontend (HTML/CSS, React, Vue, Svelte, Angular, React Native, Flutter) to WCAG 2.2 AA, including bilingual Khmer/English interfaces. Covers semantic HTML and ARIA, keyboard and focus management (skip links, dialogs, route changes in SPAs), labels and accessible names, forms and error messages, color contrast, zoom and reflow, live regions for toasts and loading, motion, media captions, touch targets, timeouts and login/OTP, language tagging, common widget patterns (dialog, tabs, accordion, menu, combobox, tooltip, carousel, data table), and how to test with axe, eslint-plugin-jsx-a11y, keyboard and screen readers. Use this skill whenever you create or review any UI component, page, form, modal, navigation or interactive widget, when the user mentions accessibility, a11y, WCAG, screen reader, keyboard, focus, contrast, ARIA, alt text or disabled users, and before finishing any frontend change — even if accessibility isn't mentioned.
---

# Accessibility (a11y)

Target: **WCAG 2.2 level AA**. Accessibility isn't a separate feature added at the end — it's part of each component's definition of done, like handling errors. Accessible UIs also work better for everyone: keyboard power users, people on small phones in bright sun, older users, people with slow connections or temporary injuries.

Work in this order of preference:
1. **Native HTML** element that already does the job (`<button>`, `<a href>`, `<label>`, `<dialog>`, `<details>`, `<select>`, `<table>`).
2. A **tested headless library** for complex widgets (React Aria, Radix UI, Headless UI, Ark UI; Angular CDK; Vue: Reka UI) — then style it.
3. **Custom ARIA** only when 1–2 are impossible, following the WAI-ARIA Authoring Practices (APG) pattern exactly.

Code patterns are in `references/patterns.md`; manual test scripts in `references/testing.md`; base CSS in `assets/a11y-base.css`.

## 1. Semantics and ARIA

- Use elements for their meaning: `<button>` for actions, `<a href>` for navigation. A clickable `<div>`/`<span>` is a bug (no keyboard, no role, no focus).
- Landmarks on every page: `<header>`, `<nav>` (with `aria-label` if more than one), `<main>` (exactly one), `<footer>`; `<aside>` and `<section aria-labelledby>` where useful.
- Headings: one `<h1>` per page describing it; levels in order (don't skip h2→h4 for styling — style with classes).
- Lists for groups of similar items (`<ul>`/`<ol>`), tables for tabular data (`<th scope>`, `<caption>`), never tables for layout.
- **First rule of ARIA:** don't use ARIA if a native element works. Wrong ARIA is worse than none.
- Never put `role="button"` on a `<div>` instead of using `<button>`; never `aria-hidden="true"` on focusable elements; don't override native semantics (`<button role="link">`).
- `aria-*` states must stay in sync with the UI: `aria-expanded`, `aria-selected`, `aria-pressed`, `aria-current="page"` (current nav link), `aria-invalid`, `aria-busy`.
- Hide decorative things from assistive tech (`aria-hidden="true"` on decorative icons, `alt=""` on decorative images). Use visually-hidden text (`.sr-only`) for information sighted users get from context.

## 2. Keyboard and focus

- Everything interactive is reachable with **Tab** and operable with **Enter/Space**; composite widgets (tabs, menus, listboxes, grids) use **arrow keys** inside and a single Tab stop (roving `tabindex` or `aria-activedescendant`). **Escape** closes popups and dialogs.
- Tab order follows visual/reading order. Don't use positive `tabindex` (1, 2…); only `0` (make focusable) and `-1` (focus programmatically).
- **Visible focus** always: never `outline: none` without a replacement. Use `:focus-visible` with a 2px+ outline that has ≥3:1 contrast against its background (`assets/a11y-base.css`).
- **Focus not obscured (2.4.11):** sticky headers/footers and cookie bars must not cover the focused element — use `scroll-padding-top` equal to the sticky header height.
- **Skip link** as the first focusable element: "រំលងទៅមាតិកាចម្បង / Skip to main content" → `#main`.
- **Dialogs/modals:** move focus into the dialog on open (first field or the dialog heading), trap focus inside, close on Escape, return focus to the trigger on close, make the rest of the page inert. Native `<dialog>` + `showModal()` does most of this; see `references/patterns.md`.
- **SPA route changes:** after navigation, move focus to the new page's `<h1>` (with `tabIndex={-1}`) or announce the new title, and update `document.title`. Otherwise screen-reader users don't know the page changed.
- After deleting an item or closing a panel, put focus somewhere sensible (next item, list heading) — never let it fall to `<body>`.
- No keyboard traps (except intentional modal trapping with Escape to exit).

## 3. Names, labels and descriptions

Every interactive element needs an **accessible name** that matches or contains its visible label (2.5.3, so voice-control users can say what they see).

- Form fields: a visible `<label for>` (or wrapping `<label>`). Placeholder is not a label — it disappears and often has low contrast.
- Icon-only buttons: `aria-label` (translated!) or visually-hidden text. The icon gets `aria-hidden="true"`.
- Links: text makes sense out of context — not "ចុចទីនេះ / click here" or "more" repeated ten times. If the visual text must be short, add `.sr-only` context ("អានបន្ថែម<span class="sr-only"> អំពី {title}</span>").
- Links opening a new tab or downloading a file say so (text or icon with label).
- Images: `alt` describes the purpose/content in the current language; `alt=""` for decorative; complex images (charts) need a text summary or data table nearby. Product images: the product name is usually enough. Never "image of…", never the filename.
- Groups of controls (radio groups, related checkboxes, date parts): `<fieldset>` + `<legend>`.
- Help text and errors linked with `aria-describedby`.

## 4. Forms and errors

- Labels visible and persistent; required fields marked in text ("(ចាំបាច់ / required)" or `*` explained once), plus `required`/`aria-required`.
- Correct `type`, `inputmode` and **`autocomplete`** tokens (`name`, `tel`, `email`, `street-address`, `one-time-code`, `current-password`, `new-password`) — required by 1.3.5 and a huge help on phones.
- Validate on submit (and on blur for touched fields), not on every keystroke while typing.
- On error: set `aria-invalid="true"`, show the message as text next to the field (linked via `aria-describedby`), explain **how to fix** it ("លេខទូរស័ព្ទត្រូវមាន ៩ ឬ ១០ ខ្ទង់ ឧ. 012 345 678"), and move focus to the first invalid field (or to an error summary for long forms). Don't rely on red color alone — add an icon and text.
- Don't clear the user's input on error.
- **Redundant entry (3.3.7):** don't make users re-type information they already entered in the same process (offer "same as shipping address").
- **Accessible authentication (3.3.8):** allow paste and password managers in password/OTP fields; no cognitive puzzles without an alternative. OTP: `autocomplete="one-time-code"`, `inputmode="numeric"`, and preferably a single input rather than six boxes (if six boxes, paste must fill all).
- Disabled submit buttons hide *why* the form can't be submitted; prefer an enabled button that shows errors.

## 5. Color, contrast and visual design

- Text contrast ≥ **4.5:1**; large text (≥ 24px, or ≥ 18.66px bold) ≥ **3:1**.
- UI components and graphics (input borders, icons conveying meaning, focus rings, chart lines) ≥ **3:1** against adjacent colors (1.4.11).
- Check both light and dark themes, hover/disabled/placeholder states, and text on images (add an overlay).
- Never use color alone to convey meaning (error vs success, required, chart series, links inside paragraphs — underline them).
- **Khmer specifics:** Khmer glyphs have thin strokes and small subscripts that vanish first at low contrast or light weights. For Khmer body text prefer weight ≥ 400 (avoid 100–300 thin weights), size ≥ 16px, and aim above the minimum contrast (≥ 7:1 for long reading when the brand allows).

## 6. Zoom, reflow and text spacing

- Text resizes to **200%** without loss of content (1.4.4); layout reflows at **320 CSS px** width without horizontal scrolling (1.4.10) — equivalent to 400% zoom on desktop. Use relative units (`rem`) for font sizes.
- **Text spacing (1.4.12):** nothing breaks if users set line-height 1.5, paragraph spacing 2×, letter-spacing 0.12em, word spacing 0.16em. Fixed heights on text containers fail this — the same rule that prevents Khmer clipping.
- Don't put meaningful text in images.
- Orientation: works in portrait and landscape (1.3.4).

## 7. Dynamic content and announcements

- Use **live regions** for changes that happen without focus moving: toast messages, "added to cart", search result counts, async validation, loading finished.
  - `role="status"` (polite) for most messages; `role="alert"` (assertive) only for urgent errors.
  - The live region element must **already exist in the DOM** before the text changes; inject text into it rather than mounting a new region with text (many screen readers miss new regions).
- Loading: `aria-busy="true"` on the updating region, and announce completion if it's significant ("បានផ្ទុកផលិតផល ២៤ / 24 products loaded").
- Toasts: stay at least ~5 seconds (longer for longer text), pausable on hover/focus, dismissible, and never the only place important information or actions appear (e.g. "Undo" must also be reachable elsewhere or the toast must stay until dismissed).
- Infinite scroll: provide a "load more" button alternative and keep the footer reachable.

## 8. Motion, time and media

- Respect `prefers-reduced-motion`: disable parallax, large transitions, auto-scrolling.
- Nothing flashes more than 3 times per second (2.3.1).
- Auto-moving content (carousels, tickers) that lasts > 5 s has pause/stop controls (2.2.2); prefer no autoplay.
- Session timeouts: warn before expiry and allow extending (2.2.1); save form progress.
- Video: captions (Khmer and/or English as the audience needs), controls, no autoplay with sound; audio-only content gets a transcript.

## 9. Touch and pointer

- Target size ≥ **24×24 px** is the AA minimum (2.5.8); this project standard is **44×44 px** (see `responsive-performance`).
- Any drag interaction (sliders, reordering, maps) has a single-pointer alternative (buttons, inputs) (2.5.7).
- No action depends on complex gestures (pinch, multi-finger swipe) or on hover only.
- Activation happens on pointer **up**, so users can slide off to cancel (native buttons do this).

## 10. Language (Khmer/English)

- `<html lang="km">` or `lang="en"` matching the UI language (3.1.1); `lang` on any phrase in the other language (3.1.2). Screen readers pick the voice from `lang` — wrong `lang` makes Khmer read with an English voice (gibberish) or vice versa.
- Translate **all** accessibility text, not just visible text: `aria-label`, `alt`, `.sr-only` text, `title` of the page, live-region messages, error messages, skip link.
- Language switcher: each language in its own name with `lang` on it: `<a lang="km" hreflang="km">ខ្មែរ</a>`, `<a lang="en" hreflang="en">English</a>`.
- Khmer text-to-speech support varies by device and screen reader; test the main flows with TalkBack on Android with a Khmer voice installed, and with VoiceOver on iOS. Where Khmer TTS is unavailable, correct structure (headings, labels, roles) still lets users navigate.

## 11. Widget patterns (summary)

Follow `references/patterns.md` for code. In short:

| Widget | Use | Key requirements |
|---|---|---|
| Disclosure / accordion | `<details>/<summary>` or `<button aria-expanded aria-controls>` | Enter/Space toggles |
| Dialog | `<dialog>` + `showModal()` or library | focus in, trap, Escape, return focus, labelled by its heading |
| Tabs | library or APG tabs | `role=tablist/tab/tabpanel`, arrows move, one Tab stop |
| Dropdown menu of actions | library | `role=menu` only for app-style action menus — **not** for site navigation (use a `<nav>` list of links + disclosure button) |
| Combobox / autocomplete | library (React Aria, Downshift, Radix) | very hard to get right by hand |
| Tooltip | library or `aria-describedby` | appears on focus too, dismissible with Escape, hoverable, never holds essential info |
| Toast | live region | see section 7 |
| Carousel | prefer a static grid/scroll-snap list | if used: pause button, prev/next buttons with labels, slide "x of y" |
| Data table | `<table>` with `<th scope>`, `<caption>` | sortable headers: `<button>` inside `<th>` + `aria-sort` |
| Pagination | `<nav aria-label>` + links | `aria-current="page"` on current |
| Breadcrumbs | `<nav aria-label>` + `<ol>` | `aria-current="page"` on last |

## 12. Testing

Automated tools find only a portion of accessibility problems; keyboard and screen-reader checks are required for new components and key flows.

- **Lint:** `eslint-plugin-jsx-a11y` (React), `eslint-plugin-vuejs-accessibility` (Vue), `@angular-eslint/template` accessibility rules.
- **Unit/component:** `vitest-axe` / `jest-axe` on rendered components; Testing Library queries by role and label (if `getByRole("button", { name })` can't find it, neither can a screen reader).
- **E2E:** `@axe-core/playwright` on every key page and state (open dialog, error state) — already in `frontend-testing-review`'s baseline spec.
- **Manual (per new component/page):** the keyboard walkthrough and screen-reader script in `references/testing.md`; zoom to 200% and 400%; check at 320px; check reduced motion and dark mode.
- Lighthouse accessibility score ≥ 90 is a floor, not proof of accessibility.

## 13. Definition of done (checklist)

- [ ] Semantic elements and landmarks; one `<h1>`; heading levels in order.
- [ ] All functionality works with keyboard only; visible focus; logical order; no traps; focus not hidden by sticky elements.
- [ ] Dialogs, menus and route changes manage focus correctly.
- [ ] Every control has an accessible name matching its visible label; icon buttons labelled; images have appropriate `alt`.
- [ ] Forms: visible labels, `autocomplete`, errors in text linked with `aria-describedby`, focus moves to errors, input kept.
- [ ] Contrast meets 4.5:1 / 3:1 in all themes and states; no color-only meaning.
- [ ] Works at 200% zoom and 320px width; no clipping with increased text spacing.
- [ ] Status messages announced via live regions; toasts not the only source of information.
- [ ] Reduced motion respected; no autoplaying moving content without pause.
- [ ] `lang` correct on page and mixed-language parts; all a11y text translated (km + en).
- [ ] axe reports no serious/critical issues; keyboard and screen-reader smoke test done.

## Files in this skill

- `assets/a11y-base.css` — focus-visible styles, `.sr-only`, skip link, scroll padding for sticky headers, reduced motion, forced-colors (Windows High Contrast) fixes.
- `references/patterns.md` — React code (adaptable to any framework) for SkipLink, VisuallyHidden, IconButton, FormField with errors, native Dialog, Disclosure, route-change focus, live-region announcer hook, sortable table header, plus jsx-a11y ESLint setup.
- `references/testing.md` — keyboard walkthrough, screen-reader quick commands (NVDA, VoiceOver macOS/iOS, TalkBack), and automated test snippets.