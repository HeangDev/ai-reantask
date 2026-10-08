# Framework setup for Khmer

Read only the section for the project's stack. Every section assumes the rules in SKILL.md.

## Contents
1. Plain HTML / CSS
2. Tailwind CSS (v3 and v4)
3. Next.js (App Router)
4. React (Vite / CRA) with react-i18next
5. Vue 3 / Nuxt 3 with vue-i18n
6. Svelte / SvelteKit
7. Angular
8. React Native / Expo
9. Flutter

---

## 1. Plain HTML / CSS

```html
<!doctype html>
<html lang="km">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/khmer-base.css"> <!-- from assets/ -->
</head>
<body>
  <h1>ព្រះរាជាណាចក្រកម្ពុជា</h1>
  <p>Mixed text: <span lang="en">Dashboard</span> ផ្ទាំងគ្រប់គ្រង</p>
</body>
</html>
```

## 2. Tailwind CSS

Tailwind's `tracking-*` and `leading-none/tight` classes are the most common sources of broken Khmer. Don't use them on Khmer text, or override under `:lang(km)`.

**v4 (CSS-first config):**

```css
@import "tailwindcss";

@theme {
  --font-khmer: "Kantumruy Pro", "Noto Sans Khmer", "Khmer UI", "Khmer Sangam MN", "Khmer OS", sans-serif;
  --font-khmer-display: "Moul", "Kantumruy Pro", serif;
}

@layer base {
  :lang(km) {
    font-family: var(--font-khmer);
    line-height: 1.7;
    letter-spacing: 0 !important; /* beats tracking-* utilities */
    overflow-wrap: anywhere;
    font-synthesis: none;
  }
}
```
Use `font-khmer`, `leading-relaxed` (1.625) or `leading-loose` (2) in markup; avoid `leading-none`, `leading-tight`, `h-8 overflow-hidden` on text.

**v3 (`tailwind.config.js`):**

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        khmer: ['"Kantumruy Pro"', '"Noto Sans Khmer"', '"Khmer UI"', '"Khmer Sangam MN"', '"Khmer OS"', "sans-serif"],
        "khmer-display": ["Moul", '"Kantumruy Pro"', "serif"],
      },
      lineHeight: { khmer: "1.7" },
    },
  },
};
```
Then add the same `@layer base { :lang(km) { … } }` block to the main CSS.

Buttons: prefer `inline-flex items-center min-h-10 px-4 py-2` over `h-10`.

## 3. Next.js (App Router)

`next/font` self-hosts Google Fonts (no layout shift, no external request). Kantumruy Pro supports the `khmer` subset.

```tsx
// app/layout.tsx
import { Kantumruy_Pro } from "next/font/google";
import "./khmer-base.css";

const kantumruy = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-khmer-loaded",
});

export default function RootLayout({ children, params }: { children: React.ReactNode; params: { locale?: string } }) {
  const lang = params?.locale ?? "km";
  return (
    <html lang={lang} className={kantumruy.variable}>
      <body>{children}</body>
    </html>
  );
}
```
In CSS, put `var(--font-khmer-loaded)` first in `--font-khmer`.

i18n: `next-intl` works well — locales `["km", "en"]`, default `km`. Format via its `useFormatter()` (pass `timeZone: "Asia/Phnom_Penh"` in the provider) or via `khmer-format.js`.

Server components render dates on the server: always pass `timeZone: "Asia/Phnom_Penh"`, otherwise the server's UTC is used and dates shift by 7 hours.

## 4. React (Vite) with react-i18next

```js
// i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import km from "./locales/km.json";
import en from "./locales/en.json";

i18n.use(initReactI18next).init({
  resources: { km: { translation: km }, en: { translation: en } },
  lng: "km",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng; // keeps :lang(km) CSS and line breaking correct
});
export default i18n;
```

Component for long Khmer headings in narrow cards:

```jsx
import { insertBreakOpportunities } from "./lib/khmer-format";
export function KhmerText({ children, as: Tag = "span", ...rest }) {
  return <Tag lang="km" {...rest}>{insertBreakOpportunities(String(children))}</Tag>;
}
```

## 5. Vue 3 / Nuxt 3 with vue-i18n

```js
// i18n.config.ts (Nuxt @nuxtjs/i18n) or createI18n in Vue
export default {
  legacy: false,
  locale: "km",
  fallbackLocale: "en",
  numberFormats: {
    km: {
      riel: { style: "currency", currency: "KHR", maximumFractionDigits: 0 },
      usd:  { style: "currency", currency: "USD" },
    },
  },
  datetimeFormats: {
    km: {
      long: { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Phnom_Penh" },
    },
  },
};
```
Usage: `$n(40000, "riel")`, `$d(date, "long")`. Check the output matches the house style (symbol position, digits); if not, use `khmer-format.js` helpers instead.

Nuxt: set `htmlAttrs: { lang: "km" }` in `app.head`, or let `@nuxtjs/i18n` manage `lang` via `useLocaleHead()`. Load fonts with `@nuxt/fonts` or a `<link>` in `app.head`.

## 6. Svelte / SvelteKit

`src/app.html`: `<html lang="%lang%">`, and in `hooks.server.js` replace `%lang%` with the user's locale via `transformPageChunk`. Import `khmer-base.css` in the root `+layout.svelte`. Use `svelte-i18n` or `paraglide`; route formatting through `khmer-format.js`.

## 7. Angular

```ts
// app.config.ts
import { registerLocaleData } from "@angular/common";
import localeKm from "@angular/common/locales/km";
registerLocaleData(localeKm);
// providers: [{ provide: LOCALE_ID, useValue: "km" }]
```
Pipes: `{{ amount | currency:'KHR':'symbol':'1.0-0' }}`, `{{ date | date:'longDate':'+0700' }}`. Add `khmer-base.css` to `styles` in `angular.json`, and set `lang` in `index.html`.

## 8. React Native / Expo

Bundle the font; system Khmer fonts differ per device.

```js
// Expo
import { useFonts, KantumruyPro_400Regular, KantumruyPro_700Bold } from "@expo-google-fonts/kantumruy-pro";

const styles = StyleSheet.create({
  km: {
    fontFamily: "KantumruyPro_400Regular",
    fontSize: 16,
    lineHeight: 27,      // ≈ 1.7 × fontSize — RN needs an absolute number
    letterSpacing: 0,
  },
  kmBold: { fontFamily: "KantumruyPro_700Bold" }, // use the bold file, not fontWeight
});
```
- Android: on `Text`, keep `includeFontPadding` default (true) for Khmer; setting it false often clips subscripts.
- Never give `Text`/`TextInput` a fixed `height`; use `minHeight` + `paddingVertical`.
- Hermes supports `Intl.NumberFormat`/`DateTimeFormat`; `Intl.Segmenter` may be missing — the helpers in `khmer-format.js` fall back gracefully, but test grapheme truncation on device.

## 9. Flutter

```yaml
# pubspec.yaml
dependencies:
  google_fonts: ^6.0.0
  intl: ^0.19.0
  flutter_localizations:
    sdk: flutter
```

```dart
MaterialApp(
  locale: const Locale('km'),
  supportedLocales: const [Locale('km'), Locale('en')],
  localizationsDelegates: GlobalMaterialLocalizations.delegates,
  theme: ThemeData(
    textTheme: GoogleFonts.kantumruyProTextTheme().apply(
      bodyColor: Colors.black87,
    ).copyWith(
      bodyMedium: GoogleFonts.kantumruyPro(fontSize: 16, height: 1.7, letterSpacing: 0),
    ),
  ),
);
```
- `height` in `TextStyle` is the line-height multiplier — keep ≥ 1.6 for Khmer.
- Numbers/dates: `NumberFormat.currency(locale: 'km', symbol: '៛', decimalDigits: 0)`, `DateFormat.yMMMMd('km')` after `initializeDateFormatting('km')`.
- For release builds, bundle the font as an asset instead of fetching at runtime (`GoogleFonts.config.allowRuntimeFetching = false`).
- Truncation: `Text(overflow: TextOverflow.ellipsis)` is cluster-safe; for manual cuts use the `characters` package (`text.characters.take(n)`).