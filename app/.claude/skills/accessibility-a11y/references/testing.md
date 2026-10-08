# Accessibility testing

Automated checks catch only part of the problems. Do the manual checks below for every new component and for key flows before release.

## Contents
1. Automated: unit (vitest-axe), E2E (Playwright + axe)
2. Keyboard walkthrough (5 minutes per page)
3. Screen-reader smoke test
4. Visual checks: zoom, reflow, spacing, contrast, motion
5. Bug report template

---

## 1. Automated

**Component tests (Vitest + vitest-axe):**

```ts
// test/setup.ts
import * as matchers from "vitest-axe/matchers";
import { expect } from "vitest";
expect.extend(matchers);
```

```tsx
import { axe } from "vitest-axe";
import { render } from "@testing-library/react";
import { Field } from "./field";

it("has no axe violations, including the error state", async () => {
  const { container } = render(<Field label="លេខទូរស័ព្ទ" error="form.errors.phone" />);
  expect(await axe(container)).toHaveNoViolations();
});
```
jsdom can't compute colors, so contrast is checked in E2E, not here. (Jest: `jest-axe`, same API.)

**Role-based queries are a11y tests too:**
```ts
screen.getByRole("button", { name: "បិទ" });                  // icon button is labelled
screen.getByRole("textbox", { name: /លេខទូរស័ព្ទ/ });           // input has a label
expect(screen.getByRole("textbox", { name: /លេខទូរស័ព្ទ/ })).toHaveAccessibleDescription(/012/); // hint linked
expect(screen.getByRole("dialog", { name: "បញ្ជាក់ការលុប" })).toBeVisible();
```

**Playwright + axe** on pages *and states* (dialog open, form errors shown, dark mode):

```ts
import AxeBuilder from "@axe-core/playwright";

test("checkout form errors are accessible", async ({ page }) => {
  await page.goto("/checkout");
  await page.getByRole("button", { name: "បន្ត" }).click();      // trigger validation
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await expect(page.getByRole("textbox", { name: /លេខទូរស័ព្ទ/ })).toBeFocused(); // focus moved to first error
});

test("dark mode contrast", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(results.violations).toEqual([]);
});

test("dialog traps focus and returns it", async ({ page }) => {
  await page.goto("/app/products");
  const trigger = page.getByRole("button", { name: "បន្ថែមផលិតផល" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});
```

## 2. Keyboard walkthrough

Unplug the mouse (or don't touch it). Start at the address bar.

1. **Tab** once: the skip link appears. Press **Enter**: focus lands on main content.
2. Keep pressing **Tab** through the whole page:
   - Every interactive element is reached; nothing non-interactive is.
   - Order follows the visual layout (left→right, top→bottom).
   - The focus indicator is always clearly visible and never hidden under a sticky header, cookie bar or chat button.
3. Operate each control: **Enter** on links/buttons, **Space** on buttons/checkboxes, **arrows** in radio groups, tabs, menus, selects, sliders.
4. Open every popup (menu, dialog, dropdown, date picker): focus moves into it; **Tab** stays inside a modal; **Escape** closes it; focus returns to the trigger.
5. Submit forms with errors: focus goes to the first error or the error summary.
6. Navigate to another page via a link: focus is at the top/`<h1>` of the new page, not left at the bottom.
7. **Shift+Tab** backwards works the same.

## 3. Screen-reader smoke test

Pick at least one desktop and one mobile combination. Use the page's language: test once in Khmer and once in English if both exist.

| Platform | Screen reader + browser | Start/stop | Next item | Headings | Landmarks | Elements list |
|---|---|---|---|---|---|---|
| Windows | **NVDA** + Chrome/Firefox (free) | Ctrl+Alt+N / Insert+Q | ↓ | H | D | Insert+F7 |
| macOS | **VoiceOver** + Safari | Cmd+F5 | VO(Ctrl+Opt)+→ | VO+Cmd+H | rotor (VO+U) | VO+U |
| iOS | **VoiceOver** + Safari | Settings → Accessibility, or triple-click side button shortcut | swipe right | rotor (two-finger twist) → Headings, swipe down | rotor → Landmarks | — |
| Android | **TalkBack** + Chrome | volume up+down 3 s (if enabled) | swipe right | swipe up/down to change granularity → Headings | — | — |

Khmer voices: on Android install a Khmer TTS voice (Settings → Text-to-speech output) and check that Khmer pages switch voice correctly via `lang`. Khmer TTS availability varies by device and screen reader; note gaps rather than assuming support.

What to check:
- Page title is announced on load and after navigation.
- Headings list gives a usable outline of the page.
- Every button/link/field announces a meaningful name, its role, and its state (expanded, selected, checked, invalid).
- Images announce useful `alt` or are skipped if decorative.
- Form errors are announced when they appear; status messages (added to cart, saved, N results) are announced without moving focus.
- Dialogs announce their title when opened.
- Mixed Khmer/English content is read with the right voice.

## 4. Visual checks

- **Zoom 200%** (Ctrl/Cmd +) at 1280px wide: all content and functions available, no overlap.
- **Reflow:** 320px wide viewport (or 400% zoom at 1280px): no horizontal scrolling except for data tables/maps/code.
- **Text spacing:** apply this bookmarklet-style CSS in DevTools and look for clipped or overlapping text (common with Khmer in fixed-height boxes):
  ```css
  * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
  p { margin-bottom: 2em !important; }
  ```
- **Contrast:** DevTools color picker or axe; check hover, focus, disabled, placeholder, dark mode, text over images.
- **Color blindness:** DevTools → Rendering → Emulate vision deficiencies (deuteranopia, protanopia, achromatopsia): errors, charts and status still understandable.
- **Reduced motion:** DevTools → Rendering → `prefers-reduced-motion: reduce`: big animations stop.
- **Forced colors:** DevTools → Rendering → `forced-colors: active`: borders, focus and icons still visible.

## 5. Bug report template

```
Title: [a11y] <component/page> – <problem>
WCAG: <criterion number and name, e.g. 2.4.7 Focus Visible (AA)>
Severity: Blocker (prevents completing a task) / Major / Minor
Where: <URL, component, state>
Environment: <browser, screen reader, device, language km/en>
Steps: 1. … 2. …
Expected: …
Actual: …
Fix suggestion: …
```