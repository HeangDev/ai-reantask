---
name: khmer-typography-i18n
description: Rules and ready-made helpers for displaying Khmer (ភាសាខ្មែរ) text correctly in any frontend — web, React, Next.js, Vue, Nuxt, Svelte, Angular, plain HTML/CSS, Tailwind, React Native or Flutter. Covers Khmer fonts and font stacks, line-height and clipping of stacked consonants and vowels, line breaking without spaces, Khmer/Latin mixed text, bilingual Khmer–English UI, Khmer digits, riel (៛) and USD formatting, Khmer dates and time zone, string truncation, search and sorting. Use this skill whenever you build or review any UI, component, page, email template or design that will show Khmer text or serve users in Cambodia, whenever the user writes in Khmer and asks for frontend work, and whenever numbers, prices, dates or translations for the km/km-KH locale are involved — even if the user never says "typography" or "i18n".
---

# Khmer Typography & i18n

Khmer is a complex script: consonants stack vertically (subscript forms via COENG U+17D2), vowels sit above, below, before and after the base, and words are written without spaces. Most UI bugs with Khmer come from treating it like Latin text — fixed heights clip the stacks, `letter-spacing` breaks clusters apart, text never wraps because there are no spaces, and `.slice()` cuts a syllable in half. This skill exists so those bugs never ship.

Apply every section below that is relevant to the task. Framework-specific code lives in `references/frameworks.md`; copy-paste base files live in `assets/`.

## Workflow

1. Identify the stack (plain CSS, Tailwind, React/Next, Vue/Nuxt, React Native, Flutter…). Read the matching section of `references/frameworks.md`.
2. Set up fonts and the `:lang(km)` typography rules (sections 1–2). For web projects, start from `assets/khmer-base.css`.
3. Make sure every Khmer element carries `lang="km"` (section 3).
4. Route all numbers, money and dates through one formatter module (section 5). For JS/TS projects, start from `assets/khmer-format.js`.
5. Handle wrapping, truncation, search and sort with segment-aware code (sections 4 and 6).
6. Before finishing, render the test strings in section 8 and check them against the checklist.

## 1. Fonts

Load a real Khmer web font; do not rely on system fonts, which differ wildly between Windows, macOS, Android and iOS.

Recommended defaults (all free on Google Fonts):

| Use                          | Font                                       | Why                                                             |
|------------------------------|--------------------------------------------|-----------------------------------------------------------------|
| UI / body (default)          | **Kantumruy Pro**                          | Modern, variable weight 100–700, includes matching Latin glyphs |
| Body, alt                    | **Noto Sans Khmer** / **Noto Serif Khmer** | Very wide coverage, many weights                                |
| Traditional body / documents | **Battambang**, **Hanuman**, **Siemreap**  | Familiar "Khmer OS" look                                        |
| Display headings only        | **Moul**, **Bayon**, **Koulen**            | Decorative; never use for paragraphs or small text              |

Recommended stack (system fallbacks per OS):

```css
--font-khmer: "Kantumruy Pro", "Noto Sans Khmer", "Khmer UI", "Khmer Sangam MN", "Khmer OS System", "Khmer OS", sans-serif;
```

`Khmer UI` ships with Windows 8+, `Khmer Sangam MN` with Apple platforms, `Khmer OS*` is common on machines in Cambodia.

Rules:
- Load only the weights you use, with `font-display: swap`. Google Fonts already splits Khmer into its own `unicode-range` subset, so Latin pages don't pay for it.
- Load the bold weight. Synthesized ("faux") bold smears Khmer subscripts; set `font-synthesis: none` on Khmer text.
- If the Latin font is different from the Khmer font, put the Latin font **first** in the stack only when it has no Khmer glyphs — the browser falls through to the Khmer font per character. Kantumruy Pro already contains Latin, so it can stand alone.
- Never use legacy non-Unicode fonts (Limon, ABC). Text typed in them is not real Khmer Unicode — it can't be searched, sorted or read by screen readers. If content arrives in a legacy encoding, flag it to the user; don't try to style around it.

## 2. Size, line-height and clipping

Khmer glyphs carry marks above and below the line, so at the same `font-size` Khmer looks smaller and needs more vertical room than Latin.

- Body text: `font-size` at least 16px (1rem), and `line-height: 1.7` (range 1.6–1.8). Headings: `line-height: 1.4–1.5`. Latin defaults of 1.2–1.5 clip stacked consonants or make lines collide.
- Many teams scale Khmer up ~5–10% relative to Latin in the same UI (`:lang(km) { font-size: 1.0625em }`) so both languages look the same size. Decide once, put it in the base CSS.
- **Never give text containers a fixed `height` + `overflow: hidden`.** Buttons, tabs, badges, table cells and inputs must size from `padding` + `line-height`, or use `min-height`. Center with flexbox (`display:inline-flex; align-items:center`), not with `line-height` equal to the box height.
- Inputs: set `line-height` and vertical padding explicitly; check the caret and selection don't clip the subscripts.
- Never apply `letter-spacing` (or Tailwind `tracking-*`) to Khmer. Spacing between glyphs breaks visual clusters. Reset it under `:lang(km)`.
- `text-transform: uppercase` and small-caps do nothing useful for Khmer; don't rely on them for emphasis — use weight or color.
- Italic: most Khmer fonts have no italic; browsers fake a slant that looks wrong. Use weight or color for emphasis.
- `text-align: justify` produces ugly gaps because there are no spaces to stretch; prefer `start`.

## 3. Language tagging and bilingual UI

- Set `<html lang="km">` for Khmer pages (or `lang="en"` for English pages) and put `lang="km"` / `lang="en"` on any element whose language differs from the page. This drives font selection, line breaking, hyphenation, screen-reader voice, and the `:lang(km)` CSS rules.
- Style by language with `:lang(km)` rather than with class names, so mixed content just works.
- Language switcher: show each language in its own name — **ខ្មែរ** and **English** — and never use flags for languages.
- Layout must tolerate both languages: Khmer strings are often taller, and can be shorter or longer than English. Avoid fixed widths on buttons and labels; let them wrap or grow.
- Khmer has no plural forms (CLDR plural category is only `other`), but keep using the i18n library's plural/ICU syntax so the English side works.
- Don't concatenate translated fragments (`t("you_have") + n + t("items")`). Word order differs; use full messages with placeholders.
- Translation keys and files: `km.json` (or `km-KH`), UTF-8, no BOM. Fallback locale `en`.

## 4. Line breaking (no spaces between words)

Khmer separates phrases, not words, with spaces. A long Khmer sentence is effectively one giant "word", so browsers may overflow instead of wrapping.

- Modern Chromium, Safari and recent Firefox break Khmer using a dictionary, **but only when `lang="km"` is set** — another reason section 3 is mandatory. Support still varies by browser and version, so add safety nets:
  - Always set `overflow-wrap: anywhere` on Khmer text so nothing ever overflows its container.
  - Never use `word-break: keep-all` or `white-space: nowrap` on Khmer paragraphs.
- For high-quality wrapping (headlines, cards, narrow mobile columns), insert ZERO WIDTH SPACE (U+200B) between words:
  - **Static/CMS content:** insert ZWSP at authoring or build time.
  - **Dynamic content:** use `Intl.Segmenter("km", { granularity: "word" })` — helper `insertBreakOpportunities()` in `assets/khmer-format.js`. Or render `<wbr>` between segments.
- ZWSP is invisible but real: strip it before search, comparison, storage of user input, slug generation and copy-to-clipboard if exactness matters (helper `stripZwsp()`).
- Never insert normal spaces between Khmer words to force wrapping — that changes the text.

## 5. Numbers, money, dates

Put all formatting in one module and call it everywhere. Never hand-roll `toFixed` + string concatenation for prices or dates in components. `assets/khmer-format.js` provides the functions below; adapt to the project's language.

**Digits.** Khmer digits are ០១២៣៤៥៦៧៨៩ (U+17E0–17E9). `Intl` with `km-KH` defaults to Latin digits. To get Khmer digits use the `-u-nu-khmr` extension (`km-KH-u-nu-khmr`) or `numberingSystem: "khmr"`. Ask or follow the existing product: government/formal contexts often use Khmer digits; apps, prices and phone numbers usually use Latin digits. Make it a single config switch. Always parse user-entered numbers through a normalizer that maps Khmer digits to Latin (`toLatinDigits()`), because users type both.

**Separators.** Grouping/decimal separators in `Intl` output depend on numbering system and ICU version (e.g. Latin digits give `1,234,567` while Khmer digits may give `១.២៣៤.៥៦៧`). Don't assume — call the formatter, check the output in the target runtime, and if the product wants a fixed house style, set it explicitly in the one formatter module.

**Currency.** Cambodia uses both riel (KHR, symbol ៛ U+17DB) and US dollars daily.
- Riel: no decimals in practice → `maximumFractionDigits: 0`. CLDR places the symbol after the amount (`40,000៛`); many Cambodian products also write `40,000 រៀល` — choose one and keep it consistent.
- USD: `Intl` with `km-KH` may output `12.50$`; most Cambodian apps show `$12.50`. Decide the house style once in the formatter.
- Dual display (`$10.00 (≈ 41,000៛)`) is common. Never hardcode the exchange rate; take it from config or an API and show it's approximate.
- Store money as integers in minor units or as strings/decimals on the backend — never as floats.

**Dates and times.**
- Time zone: `Asia/Phnom_Penh` (UTC+7, no DST). Pass `timeZone` explicitly when formatting for Cambodian users, otherwise server-rendered dates use the server's zone.
- Use `Intl.DateTimeFormat("km-KH", …)` for month and day names: months មករា កុម្ភៈ មីនា មេសា ឧសភា មិថុនា កក្កដា សីហា កញ្ញា តុលា វិច្ឆិកា ធ្នូ; weekdays អាទិត្យ ច័ន្ទ អង្គារ ពុធ ព្រហស្បតិ៍ សុក្រ សៅរ៍.
- `km-KH` time formats may still print Latin "AM/PM". Many products prefer 24-hour time (`hourCycle: "h23"`) or the words ព្រឹក / ល្ងាច; choose once in the formatter.
- Relative time (`Intl.RelativeTimeFormat("km")`) works — e.g. "3 ថ្ងៃមុន".
- The Khmer lunar calendar (ចន្ទគតិ) and Buddhist Era year are **not** in `Intl`. If needed, use a dedicated, tested library and tell the user; never invent a conversion.
- Week starts on Monday in most Cambodian business contexts; set it explicitly in date pickers.

**Phone numbers.** Country code +855; local numbers start with 0 (e.g. 012 345 678). Accept spaces, dashes and Khmer digits on input, normalize to E.164 (`+85512345678`) for storage.

## 6. Strings: length, truncation, search, sort

- One visible Khmer syllable is often several code points (`"ស្ត្រី".length === 6` but it's one cluster). Never `slice()`/`substring()` by code units for display. Truncate by grapheme with `Intl.Segmenter(…, { granularity: "grapheme" })` (helper `truncateGraphemes()`), or simply use CSS `text-overflow: ellipsis` / `line-clamp`.
- `maxlength` on inputs counts UTF-16 units, not visible characters; set limits generously for Khmer fields and validate on the server by grapheme if it matters.
- Normalize stored and searched text with `normalize("NFC")` and strip ZWSP (U+200B) and ZWNJ (U+200C) before comparing. Note that NFC does **not** fix Khmer typed in a wrong vowel/subscript order; if matching quality matters, mention this limitation.
- Search: match on normalized, ZWSP-stripped strings. Substring search works better than word-boundary regex (`\b` does not understand Khmer).
- Sort with `Intl.Collator("km")`, never with default `.sort()` (code-point order is not Khmer dictionary order).
- Don't build slugs/URLs from Khmer text by stripping non-ASCII — the slug becomes empty. Either keep Unicode slugs (percent-encoded) or use an ID/English slug.

## 7. Native apps (React Native, Flutter)

Same principles: bundle a Khmer font file instead of relying on the OS, give `Text` enough `lineHeight` (≈1.6–1.8 × fontSize), avoid fixed heights, never set `letterSpacing` on Khmer, and use the platform/ICU formatters for numbers and dates. Details in `references/frameworks.md`.

## 8. Test strings and final checklist

Render these in every component that shows Khmer (they contain stacked subscripts, above- and below-vowels, and long unbroken runs):

```
ព្រះរាជាណាចក្រកម្ពុជា ជាតិ សាសនា ព្រះមហាក្សត្រ
ស្ត្រី ក្សត្រ ឆ្នាំ សង្ក្រាន្ត ព្រឹក្សា ថ្ងៃព្រហស្បតិ៍
ការអភិវឌ្ឍន៍ប្រព័ន្ធបច្ចេកវិទ្យាព័ត៌មានថ្នាក់ជាតិសម្រាប់ប្រជាពលរដ្ឋទាំងអស់
តម្លៃ ៤០.០០០៛ ឬ $10.00 · ថ្ងៃទី ៨ ខែតុលា ឆ្នាំ២០២៦
```

Before declaring the work done, confirm:

- [ ] A Khmer web font is loaded (with the weights used) and the stack has OS fallbacks.
- [ ] `lang="km"` is on the page or on every Khmer element.
- [ ] Body line-height ≥ 1.6; no subscript or above-vowel is clipped in buttons, inputs, tabs, badges, table cells, dropdowns or tooltips.
- [ ] No `letter-spacing`/`tracking-*`, faux bold, or faux italic on Khmer.
- [ ] The long test string wraps inside a 320px-wide container without horizontal overflow.
- [ ] Numbers, prices and dates go through one formatter; time zone is `Asia/Phnom_Penh`; Khmer digits are parsed on input.
- [ ] Truncation is grapheme-safe; search strips ZWSP and normalizes; sorting uses `Intl.Collator("km")`.
- [ ] The language switcher shows "ខ្មែរ / English" and the layout works in both languages.

## Files in this skill

- `assets/khmer-base.css` — drop-in base stylesheet (font stack, `:lang(km)` rules, safety nets). Read and copy for any web project.
- `assets/khmer-format.js` — framework-agnostic formatters and string helpers (digits, riel/USD, dates, segmentation, truncation, search normalization). Works in browsers and Node; port to TS by adding types.
- `references/frameworks.md` — setup snippets for Tailwind, Next.js, React, Vue/Nuxt, Svelte, Angular, plain HTML, React Native and Flutter. Read only the section for the project's stack.