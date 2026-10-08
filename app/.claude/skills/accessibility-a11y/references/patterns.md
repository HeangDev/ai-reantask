# Accessible component patterns (React + TypeScript)

Written for React (matching the `react-conventions` skill: kebab-case files, named exports, `cn()`, react-i18next). The HTML/ARIA is the same in any framework — translate the JSX.

Prefer a headless library (React Aria, Radix UI, Headless UI) for tabs, menus, comboboxes, date pickers and tooltips. The patterns below are the ones that are simple enough to own.

## Contents
1. ESLint: jsx-a11y
2. SkipLink
3. VisuallyHidden
4. IconButton (name required by type)
5. FormField with hint and error
6. Error summary and focus on submit
7. Dialog (native `<dialog>`)
8. Disclosure / accordion
9. Focus and title on route change
10. Live-region announcer
11. Sortable table header
12. Language switcher
13. Images and alt text examples

---

## 1. ESLint: jsx-a11y

```js
// eslint.config.js — add to the react-conventions config
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  // …existing config
  jsxA11y.flatConfigs.recommended,
  {
    settings: {
      // let the plugin treat design-system components as native elements
      "jsx-a11y": { components: { Button: "button", Link: "a", Input: "input" } },
    },
    rules: {
      "jsx-a11y/no-autofocus": ["error", { ignoreNonDOM: true }],
    },
  },
);
```

## 2. SkipLink

```tsx
// components/ui/skip-link.tsx
import { useTranslation } from "react-i18next";

export function SkipLink({ targetId = "main" }: { targetId?: string }) {
  const { t } = useTranslation();
  return (
    <a href={`#${targetId}`} className="skip-link">
      {t("a11y.skipToContent")} {/* km: "រំលងទៅមាតិកាចម្បង" en: "Skip to main content" */}
    </a>
  );
}

// layout: <SkipLink /> <Header /> <main id="main" tabIndex={-1}>…</main>
```
`tabIndex={-1}` on `<main>` makes the skip target reliably receive focus in all browsers.

## 3. VisuallyHidden

```tsx
// components/ui/visually-hidden.tsx
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
```

## 4. IconButton

The `label` prop is required by the type, so an unlabelled icon button can't compile.

```tsx
// components/ui/icon-button.tsx
import { cn } from "@/lib/cn";

type IconButtonProps = Omit<React.ComponentProps<"button">, "children" | "aria-label"> & {
  label: string;          // translated accessible name
  icon: React.ReactNode;  // decorative svg
};

export function IconButton({ label, icon, className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn("inline-flex size-11 items-center justify-center rounded-md", className)}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}

// <IconButton label={t("cart.remove", { name })} icon={<TrashIcon />} onClick={…} />
```
Include *which* item in the label ("លុប កាហ្វេទឹកដោះគោ / Remove iced latte") when there are many identical buttons in a list.

## 5. FormField with hint and error

```tsx
// components/ui/field.tsx
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

type FieldProps = React.ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string;     // i18n key or message
  isRequired?: boolean;
};

export function Field({ label, hint, error, isRequired, id, className, ...props }: FieldProps) {
  const { t } = useTranslation();
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block font-medium">
        {label}
        {isRequired && <span className="text-danger"> *<span className="sr-only">{t("a11y.required")}</span></span>}
      </label>
      {hint && <p id={hintId} className="text-sm text-muted-foreground">{hint}</p>}
      <input
        id={inputId}
        required={isRequired}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={cn("w-full rounded-md border px-3 py-2", error && "border-danger", className)}
        {...props}
      />
      {error && (
        <p id={errorId} className="flex gap-1 text-sm text-danger">
          <span aria-hidden="true">⚠</span>
          {t(error)}
        </p>
      )}
    </div>
  );
}
```
Usage for a Cambodian phone number:
```tsx
<Field label={t("form.phone")} hint={t("form.phoneHint")} type="tel" inputMode="tel" autoComplete="tel" isRequired … />
```

## 6. Error summary and focus on submit

With react-hook-form, focus the first invalid field (it does this by default with `shouldFocusError: true` when fields are registered via `register`). For long forms, also render a summary:

```tsx
// components/ui/error-summary.tsx
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

type ErrorSummaryProps = { errors: { fieldId: string; message: string }[] };

export function ErrorSummary({ errors }: ErrorSummaryProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (errors.length) ref.current?.focus(); }, [errors.length]);
  if (!errors.length) return null;

  return (
    <div ref={ref} tabIndex={-1} role="alert" aria-labelledby="error-summary-title" className="rounded-md border-2 border-danger p-4">
      <h2 id="error-summary-title" className="font-semibold">{t("a11y.errorSummary", { count: errors.length })}</h2>
      <ul className="list-disc ps-5">
        {errors.map((e) => (
          <li key={e.fieldId}><a href={`#${e.fieldId}`}>{t(e.message)}</a></li>
        ))}
      </ul>
    </div>
  );
}
```

## 7. Dialog (native `<dialog>`)

`showModal()` gives focus trapping, Escape to close, an inert background and top-layer rendering.

```tsx
// components/ui/dialog.tsx
import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "./icon-button";

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function Dialog({ isOpen, onClose, title, description, children }: DialogProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function handleClose() {
    onClose();
    returnFocusRef.current?.focus(); // most browsers restore focus; this makes it reliable
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={handleClose}                       // fires on Escape and on dialog.close()
      onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }} // backdrop click
      className="w-[min(100%-2rem,32rem)] rounded-lg p-0"
    >
      <div className="space-y-4 p-6">
        <header className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
          <IconButton label={t("a11y.close")} icon={<span>✕</span>} onClick={() => ref.current?.close()} />
        </header>
        {description && <p id={descId}>{description}</p>}
        {children}
      </div>
    </dialog>
  );
}
```
Initial focus: the browser focuses the first focusable element. To focus a specific field, give it the `autoFocus` attribute inside the dialog (allowed by the jsx-a11y config above only for this case — add an inline disable comment with a reason) or focus it in an effect after `showModal()`.

## 8. Disclosure / accordion

Simplest: `<details>` / `<summary>` (keyboard and state built in).

```tsx
<details className="rounded-md border p-3">
  <summary className="cursor-pointer font-medium">{t("faq.delivery.q")}</summary>
  <p className="mt-2">{t("faq.delivery.a")}</p>
</details>
```

Custom (when animation or controlled state is needed):

```tsx
// components/ui/disclosure.tsx
import { useId, useState } from "react";

export function Disclosure({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div>
      <h3>
        <button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setIsOpen((o) => !o)} className="flex w-full justify-between py-3">
          {title}
          <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
        </button>
      </h3>
      <div id={panelId} hidden={!isOpen}>{children}</div>
    </div>
  );
}
```

## 9. Focus and title on route change

```tsx
// components/layouts/route-focus.tsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/** Wrap each page's <h1>. Moves focus to it after client-side navigation (not on first load). */
export function PageHeading({ children, title }: { children: React.ReactNode; title: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    document.title = `${title} · ${import.meta.env.VITE_APP_NAME ?? ""}`.trim();
  }, [title]);

  // Focus only when the path changes — not when the title changes (e.g. language switch).
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    ref.current?.focus();
  }, [pathname]);

  return <h1 ref={ref} tabIndex={-1} className="text-2xl font-semibold">{children}</h1>;
}
```
(With the `react-conventions` ESLint rule, read `VITE_APP_NAME` from `config/env.ts` instead.)

Don't move focus when only search params change (filters, pagination) — announce the result count with the announcer instead.

## 10. Live-region announcer

Render the regions once at the app root; call `announce()` from anywhere.

```tsx
// components/ui/announcer.tsx
import { create } from "zustand";

type AnnouncerState = { polite: string; assertive: string; announce: (msg: string, urgent?: boolean) => void };

export const useAnnouncer = create<AnnouncerState>()((set) => ({
  polite: "",
  assertive: "",
  announce: (msg, urgent = false) => {
    // clear first so repeating the same message is announced again
    set(urgent ? { assertive: "" } : { polite: "" });
    setTimeout(() => set(urgent ? { assertive: msg } : { polite: msg }), 100);
  },
}));

export function Announcer() {
  const polite = useAnnouncer((s) => s.polite);
  const assertive = useAnnouncer((s) => s.assertive);
  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{polite}</div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">{assertive}</div>
    </>
  );
}

// usage: const announce = useAnnouncer((s) => s.announce);
//        announce(t("cart.added", { name }));               // "បានបន្ថែម កាហ្វេ ទៅកន្ត្រក"
//        announce(t("products.resultsCount", { count }));   // after filtering
```
Put `<Announcer />` in `app/provider.tsx`. Visible toasts can call `announce()` too, so the toast component itself doesn't need to be a live region.

## 11. Sortable table header

```tsx
type SortDir = "ascending" | "descending" | "none";

function SortableTh({ label, dir, onSort }: { label: string; dir: SortDir; onSort: () => void }) {
  return (
    <th scope="col" aria-sort={dir}>
      <button type="button" onClick={onSort} className="inline-flex items-center gap-1">
        {label}
        <span aria-hidden="true">{dir === "ascending" ? "▲" : dir === "descending" ? "▼" : "↕"}</span>
      </button>
    </th>
  );
}
// Table needs <caption> (can be .sr-only) describing it.
```

## 12. Language switcher

```tsx
// features/settings/components/language-switcher.tsx
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "km", label: "ខ្មែរ" },
  { code: "en", label: "English" },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  return (
    <nav aria-label={t("a11y.language")}>
      <ul className="flex gap-2">
        {LANGUAGES.map(({ code, label }) => (
          <li key={code}>
            <button
              type="button"
              lang={code}
              aria-pressed={i18n.language === code}
              onClick={() => i18n.changeLanguage(code)}
              className="min-h-11 px-3"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```
`i18n.on("languageChanged")` already updates `<html lang>` (see `react-conventions` examples).

## 13. Images and alt text examples

| Image | alt |
|---|---|
| Product photo in a card whose title is a link with the name | `alt=""` (name already announced) or the name if the image is the link |
| Logo linking home | `alt="{Company} – ទំព័រដើម"` / `"{Company} home"` |
| Decorative background/illustration | `alt=""` (or CSS background) |
| Chart | short `alt` with the key takeaway + a data table or text summary nearby |
| Photo of a document/receipt the user must read | full text available elsewhere on the page |
| User avatar next to their name | `alt=""` |
| Icon with adjacent text | `aria-hidden="true"` on the icon |

Translate `alt` with the UI language; store bilingual alt text in the CMS for content images.

Common i18n keys used above (add to the `common` namespace):

```json
{
  "a11y": {
    "skipToContent": "រំលងទៅមាតិកាចម្បង",
    "required": "ចាំបាច់",
    "close": "បិទ",
    "language": "ភាសា",
    "errorSummary": "មានបញ្ហា {{count}} ដែលត្រូវកែ"
  }
}
```
English: "Skip to main content", "required", "Close", "Language", "There are {{count}} problems to fix" (use i18next plural keys `_one`/`_other` for English).