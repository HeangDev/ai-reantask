---
name: responsive-performance
description: Mobile-first responsive layout and web performance rules for any frontend (plain HTML/CSS, Tailwind, React, Next.js, Vue, Nuxt, Svelte, Angular, React Native, Flutter), tuned for users in Cambodia and similar markets who are mostly on mid- and low-end Android phones over mobile data. Covers breakpoints and test widths, fluid layout and type, touch targets, viewport units and safe areas, responsive images, web-font loading (including large Khmer fonts), JavaScript budgets, code splitting, third-party scripts (Facebook, chat widgets, analytics), caching, slow/offline networks, long lists, and Core Web Vitals (LCP, INP, CLS). Use this skill whenever you build, refactor or review any page, layout, component or app screen, when the user mentions mobile, phone, responsive, slow, speed, loading, Lighthouse, PageSpeed, bundle size, images or Core Web Vitals, and whenever choosing libraries or adding third-party scripts — even if the user doesn't ask about performance explicitly.
---

# Responsive & Performance

Most users in Cambodia reach the web on a phone — often a mid-range or budget Android device — over 4G that can be fast in central Phnom Penh and much slower in provinces, buildings and at peak hours. Data is prepaid and people notice heavy pages. A page that feels fine on a developer's laptop on office Wi-Fi can take many seconds on these devices, mainly because of JavaScript parse/execute time and large fonts and images.

So: design for a ~360px-wide phone first, treat every kilobyte of JavaScript as expensive, and measure on throttled mobile, not on desktop.

Framework-specific code is in `references/frameworks.md`. Base CSS is in `assets/responsive-base.css`. A Lighthouse CI config with budgets is in `assets/lighthouserc.json`.

## Workflow

1. Build the smallest layout first (360px), then add breakpoints upward (section 1).
2. Apply the base CSS and touch/viewport rules (section 2).
3. Handle images and fonts (sections 3–4) — these are usually the biggest wins.
4. Keep JavaScript within budget; defer or remove third parties (sections 5–6).
5. Handle slow and failing networks gracefully (section 7).
6. Measure against the budgets and checklist (sections 8–9) before calling the work done.

## 1. Mobile-first layout

- Write base styles for the smallest screen with no media query, then add `min-width` queries. Never design desktop first and squeeze down.
- Default breakpoints (match Tailwind so teams don't argue): `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px`. Add breakpoints where the *content* breaks, not for specific devices.
- Test widths: **360×800** (most common Android size), **390×844** (iPhone), **768** (tablet portrait), **1280** (laptop). Also check **320px** doesn't overflow horizontally.
- Use flexbox/grid with `gap`, `minmax()`, `auto-fit`, `min()`, `max()` and `clamp()` instead of fixed pixel widths.
  - Responsive card grid without media queries: `grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));`
- Use container queries (`container-type: inline-size` + `@container`) for components reused in different column widths (cards, sidebars, widgets).
- Content width for reading: `max-width: 65ch` (Khmer text: ~40–45em reads well).
- Tables: on small screens, wrap in a horizontally scrolling container (`overflow-x: auto`) or switch to stacked cards. The page body itself must never scroll sideways.
- Navigation: bottom tab bar or a simple menu button on mobile; keep primary actions within thumb reach (lower half of screen).
- Don't hide important content on mobile; reorganize it instead.

## 2. Viewport, touch and input

- `<meta name="viewport" content="width=device-width, initial-scale=1">`. Never disable zoom (`user-scalable=no`, `maximum-scale=1`) — it's an accessibility failure.
- Full-height sections: use `100dvh` (with `100vh` fallback), not plain `100vh`, which is wrong on mobile when browser bars show/hide.
- Respect notches/home indicators on fixed headers and bottom bars: `padding-bottom: env(safe-area-inset-bottom)` with `viewport-fit=cover`.
- Touch targets at least **44×44px** (48px preferred), with ≥8px between adjacent targets. Small icons get extra padding, not a bigger icon.
- Don't rely on hover to reveal actions or information; mobile has no hover. Use `@media (hover: hover)` for hover-only enhancements.
- Form inputs: `font-size` ≥ 16px (iOS zooms in on smaller inputs), correct `type` and `inputmode` (`tel`, `email`, `numeric`, `decimal`), `autocomplete` attributes, and labels outside the input rather than placeholder-only.
- Fluid type: `font-size: clamp(1rem, 0.95rem + 0.3vw, 1.125rem)` for body; headings can scale more. Never let body text go below 16px (Khmer needs it more than Latin).
- Respect `prefers-reduced-motion`; keep animations to `transform` and `opacity` (GPU-friendly, no layout).

## 3. Images and media

Images are usually the largest bytes on a page and the most common LCP element.

- Always set `width` and `height` attributes (or CSS `aspect-ratio`) so the browser reserves space — prevents layout shift (CLS).
- Serve responsive sizes with `srcset` + `sizes`; never ship a 2000px image to a 360px phone. Generate widths like 360, 640, 960, 1280, 1920.
- Formats: AVIF or WebP with JPEG fallback via `<picture>`, or let the framework/CDN negotiate. PNG only for images that need it (screenshots, transparency with sharp edges); SVG for icons and logos.
- The LCP image (hero, main product photo): **not** lazy-loaded, `fetchpriority="high"`, and preloaded if it's a CSS background or discovered late.
- Everything below the fold: `loading="lazy"` and `decoding="async"`.
- Targets: hero/LCP image ≤ 150–200 KB, thumbnails ≤ 30 KB. Compress at quality ~70–80.
- Icons: an SVG sprite or a tree-shaken icon library — never a whole icon font for a few icons.
- Video: never autoplay large video on mobile data. Use `preload="none"` with a poster image; for YouTube/Facebook embeds, show a lightweight facade (thumbnail + play button) and load the iframe on click.
- User-uploaded images: resize and compress on upload (server or client), don't serve originals.

## 4. Web fonts

Khmer fonts are much larger than Latin ones (hundreds of glyphs and ligatures), so font loading matters more here than in Latin-only sites.

- Use WOFF2 only. Load the fewest families and weights possible — ideally one variable font (e.g. Kantumruy Pro) instead of several static weights. Two families maximum.
- `font-display: swap` so text appears immediately in a fallback font.
- Self-host or use the framework's font optimizer (`next/font`, `@nuxt/fonts`) to avoid an extra connection to a third-party domain. If using Google Fonts directly, add `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com`.
- Rely on `unicode-range` subsets (Google Fonts does this automatically) so English-only pages don't download Khmer glyphs and vice versa.
- Preload at most the one font file used for above-the-fold text; preloading many fonts delays everything else.
- Reduce layout shift when the font swaps by tuning the fallback (`size-adjust`, `ascent-override`) — framework font tools do this automatically.
- Decorative display fonts (e.g. Moul) only for a few headings; consider an SVG/image for a logo-style title instead of loading a whole font for it.

## 5. JavaScript budget

On budget Android phones, the main cost of JavaScript is parsing and executing it, not downloading it. JavaScript directly hurts INP (responsiveness) and LCP.

- Budget for a typical page: **≤ 170 KB compressed JS on initial load** (aim lower for landing/content pages: ≤ 100 KB). Adjust in `assets/lighthouserc.json`.
- Prefer server rendering / static generation for content pages; hydrate only interactive parts (islands, React Server Components, `client:visible` etc.). A marketing page or blog should not need a big client bundle.
- Split code by route; lazy-load heavy, non-critical parts (charts, maps, rich-text editors, modals, date pickers) with dynamic `import()` when the user needs them.
- Before adding a dependency, check its size (bundlephobia / pkg-size) and prefer platform features:
  - Dates and numbers: `Intl` APIs or `date-fns`/`dayjs` — never Moment.js.
  - Utilities: native array/object methods or per-function imports — never the whole `lodash`.
  - Animations: CSS transitions before animation libraries.
  - Carousels: CSS `scroll-snap` before a slider library.
- Long lists (100+ rows): paginate or virtualize; for long pages of sections use `content-visibility: auto` with `contain-intrinsic-size`.
- Keep event handlers fast: debounce search inputs (~250–300 ms), move heavy work off the main thread (Web Worker) or break it up (`scheduler.yield()`/`setTimeout`), and give instant visual feedback on tap.
- Avoid layout thrashing: don't read layout (`offsetHeight`, `getBoundingClientRect`) and write styles in the same loop.
- Run a bundle analyzer when adding features; remove unused code and polyfills for browsers you don't support.

## 6. Third-party scripts

Third parties (analytics, ads, chat widgets, social plugins, tag managers) are often the single largest performance cost. Facebook and Telegram are central to how Cambodian businesses talk to customers, so Messenger chat plugins, Facebook Pixel and embeds are very common — and heavy.

- Ask whether each script is truly needed. Every one needs an owner and a reason.
- Load with `defer`/`async`, or after the page is interactive (on idle), never render-blocking in `<head>`.
- Chat widgets (Messenger, Telegram, Tawk, Intercom…): show a lightweight button that loads the real widget only when tapped. Often a plain link (`https://m.me/<page>` or `https://t.me/<username>`) is enough and costs nothing.
- Social embeds and maps: facade/placeholder first, real iframe on click; static map image instead of an interactive map when interaction isn't needed.
- Prefer one lightweight analytics tool over several overlapping ones.
- Use the framework's script component (`next/script` with `strategy="lazyOnload"`, etc.) where available.

## 7. Slow, flaky and offline networks

- Show content progressively: skeletons sized like the real content (no layout jump when data arrives), not full-screen spinners.
- Set request timeouts and show a clear retry option on failure; never leave an infinite spinner.
- Paginate API results; request only the fields the screen needs; compress responses (gzip/brotli).
- Make taps feel instant: optimistic UI for likes, carts and toggles, with rollback on failure.
- Detect offline (`navigator.onLine` + `online`/`offline` events) and tell the user; keep drafts of forms so typed input isn't lost.
- For apps used repeatedly, consider a service worker (PWA) to cache the app shell and static assets.
- Respect data saver where available (`navigator.connection?.saveData`, `Save-Data` request header — Chromium only): skip autoplay, load lower-quality images, defer non-essential content.

## 8. Caching and delivery

- Hashed static assets (JS, CSS, fonts, images with content hashes): `Cache-Control: public, max-age=31536000, immutable`.
- HTML: `Cache-Control: no-cache` (revalidate) or short `s-maxage` with stale-while-revalidate on a CDN.
- Serve through a CDN with HTTP/2 or HTTP/3 and Brotli compression.
- `preconnect` only to the 1–2 origins needed for above-the-fold content; too many preconnects compete for bandwidth.
- API data: cache on the client (SWR/React Query/TanStack Query, Nuxt `useFetch`) to avoid refetching on every navigation.

## 9. Measure: budgets and Core Web Vitals

Targets (Google's "good" thresholds at the 75th percentile of real users):

| Metric | Good | Measures |
|---|---|---|
| LCP | ≤ 2.5 s | main content visible |
| INP | ≤ 200 ms | tap/typing responsiveness |
| CLS | ≤ 0.1 | layout stability |

Lab proxies: Lighthouse **mobile** performance score ≥ 90, Total Blocking Time ≤ 200 ms.

Page weight budgets (initial load, compressed): JS ≤ 170 KB, CSS ≤ 50 KB, fonts ≤ 150 KB, total ≤ 1 MB.

How to measure:
- Chrome DevTools → Performance/Network with **"Slow 4G"** network and **4× CPU slowdown** to approximate a budget phone. Lighthouse mobile does similar throttling by default.
- PageSpeed Insights for real-user (CrUX) data on public sites.
- Lighthouse CI in the pipeline with `assets/lighthouserc.json` to fail builds that exceed budgets.
- Real-user monitoring with the `web-vitals` library if the project has analytics.
- Test on at least one real mid-range Android phone before launch.

## 10. Final checklist

- [ ] Layout works at 320, 360, 390, 768 and 1280px; no horizontal page scroll anywhere.
- [ ] Zoom not disabled; inputs ≥ 16px with correct `type`/`inputmode`/`autocomplete`.
- [ ] Touch targets ≥ 44px; nothing depends on hover.
- [ ] Every image has dimensions, responsive `srcset`/`sizes`, modern format; LCP image is eager + `fetchpriority="high"`, others lazy.
- [ ] One or two WOFF2 font families, `font-display: swap`, subsets, ≤ 1 font preloaded.
- [ ] Initial JS within budget; heavy components lazy-loaded; no Moment.js or full lodash.
- [ ] Third-party scripts deferred; chat widgets and embeds behind facades.
- [ ] Skeletons instead of spinners; timeouts, retry and offline message in place.
- [ ] Static assets have long immutable cache headers; HTML revalidates.
- [ ] Lighthouse mobile ≥ 90, LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms under throttling.

## Files in this skill

- `assets/responsive-base.css` — mobile-first base: box-sizing, fluid type, media defaults, safe areas, touch targets, reduced motion, scroll containers.
- `assets/lighthouserc.json` — Lighthouse CI config asserting the budgets above. Edit `collect.url` for the project.
- `references/frameworks.md` — images, fonts, lazy loading, scripts and budgets for Next.js, React (Vite), Vue/Nuxt, SvelteKit, Angular, plain HTML, Tailwind, React Native and Flutter. Read only the relevant section.