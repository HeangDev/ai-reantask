# Framework recipes: responsive & performance

Read only the section for the project's stack.

## Contents
1. Plain HTML
2. Tailwind CSS
3. Next.js (App Router)
4. React (Vite)
5. Vue 3 / Nuxt 3
6. SvelteKit
7. Angular
8. React Native / Expo
9. Flutter
10. Running Lighthouse CI

---

## 1. Plain HTML

```html
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="image" href="/img/hero-640.avif" fetchpriority="high"
        imagesrcset="/img/hero-640.avif 640w, /img/hero-1280.avif 1280w" imagesizes="100vw">
  <link rel="stylesheet" href="/css/app.css">
  <script src="/js/app.js" defer></script>
</head>

<!-- LCP image: eager, high priority, sized -->
<picture>
  <source type="image/avif" srcset="/img/hero-640.avif 640w, /img/hero-1280.avif 1280w" sizes="100vw">
  <source type="image/webp" srcset="/img/hero-640.webp 640w, /img/hero-1280.webp 1280w" sizes="100vw">
  <img src="/img/hero-1280.jpg" width="1280" height="720" alt="…" fetchpriority="high">
</picture>

<!-- Below the fold -->
<img src="/img/card-360.webp" srcset="/img/card-360.webp 360w, /img/card-720.webp 720w"
     sizes="(min-width: 768px) 33vw, 100vw" width="360" height="240"
     loading="lazy" decoding="async" alt="…">

<!-- Chat facade: a plain link costs zero JS -->
<a class="chat-btn" href="https://m.me/YOUR_PAGE" target="_blank" rel="noopener">Chat with us</a>
```

Generate image sizes at build time with `sharp` or an image CDN.

## 2. Tailwind CSS

- Unprefixed classes = mobile; add `sm:`, `md:`, `lg:` for larger screens. Never start with `lg:` styles and undo them.
- Use `min-h-dvh` instead of `h-screen`; `size-11` (44px) or `min-h-11 min-w-11` for touch targets.
- Container queries: `@container` on the parent, `@md:` variants on children (built into v4; plugin in v3).
- `motion-safe:` / `motion-reduce:` for animations; `hover:` is fine but don't hide essential actions behind it.
- Tailwind only ships classes you use — keep `content` paths (v3) correct; avoid building class names dynamically (`"bg-" + color`) which defeats purging.

## 3. Next.js (App Router)

```tsx
import Image from "next/image";
import dynamic from "next/dynamic";
import Script from "next/script";

// LCP image
<Image src="/hero.jpg" alt="…" width={1280} height={720} priority sizes="100vw" />

// Below fold: lazy by default; always give sizes for responsive layouts
<Image src={p.image} alt={p.name} width={360} height={240} sizes="(min-width: 768px) 33vw, 100vw" />

// Heavy client-only component loaded on demand
const Chart = dynamic(() => import("./Chart"), { ssr: false, loading: () => <div className="skeleton h-64" /> });

// Third-party script after everything else
<Script src="https://example.com/widget.js" strategy="lazyOnload" />
```

- Keep components as Server Components by default; add `"use client"` only to the interactive leaf, not to whole pages or layouts.
- Fonts: `next/font` (self-hosted, automatic fallback metrics). Load one variable font.
- Static/ISR for content pages (`export const revalidate = 3600`).
- Analyze: `@next/bundle-analyzer`. Watch the "First Load JS" column in `next build` output — keep shared + page under the budget.
- Image config: `images: { formats: ["image/avif", "image/webp"] }` in `next.config`.

## 4. React (Vite)

```jsx
import { lazy, Suspense } from "react";
const Editor = lazy(() => import("./Editor"));

<Suspense fallback={<div className="skeleton h-40" />}>
  {open && <Editor />}
</Suspense>
```

- Route-level splitting: lazy-load route components (React Router `lazy` option or `React.lazy`).
- Analyze: `rollup-plugin-visualizer`. Set `build.chunkSizeWarningLimit` lower (e.g. 200) to notice growth.
- Images: `vite-imagetools` to generate `srcset` variants at build time.
- Data: TanStack Query with `staleTime` to avoid refetching on every mount; `placeholderData` for instant pagination.
- Long lists: `@tanstack/react-virtual`.
- Pure client-side SPAs pay for everything in JS — for public content/SEO pages, prefer an SSR/SSG framework or prerendering.

## 5. Vue 3 / Nuxt 3

```vue
<!-- Nuxt Image (@nuxt/image) -->
<NuxtImg src="/hero.jpg" width="1280" height="720" sizes="100vw" format="avif,webp" preload fetchpriority="high" />
<NuxtImg :src="p.image" width="360" height="240" sizes="sm:100vw md:33vw" loading="lazy" />

<!-- Lazy components: prefix with Lazy -->
<LazyChartPanel v-if="showChart" />
```

- Nuxt: `@nuxt/fonts` for self-hosted fonts; `routeRules` for prerender/ISR/caching per route; `useFetch`/`useAsyncData` with `lazy: true` + skeleton for non-critical data.
- Vue + Vite: `defineAsyncComponent(() => import("./Heavy.vue"))` and lazy route components in vue-router.
- Third parties: Nuxt Scripts (`useScript` with a trigger such as `"onNuxtReady"` or a manual trigger on click).
- Long lists: `vue-virtual-scroller`.

## 6. SvelteKit

- Svelte ships very little runtime; keep it that way by avoiding heavy UI kits.
- `export const prerender = true` for static pages; `+page.server.js` load functions keep data fetching off the client.
- Lazy component: `{#await import('./Chart.svelte') then { default: Chart }}<Chart />{/await}`.
- Images: `@sveltejs/enhanced-img` (`<enhanced:img src="./hero.jpg" fetchpriority="high" />`).

## 7. Angular

- Standalone components + lazy routes (`loadComponent: () => import(...)`).
- `@defer (on viewport) { <heavy-cmp/> } @placeholder { <div class="skeleton"></div> }` for below-the-fold blocks.
- `NgOptimizedImage`: `<img ngSrc="hero.jpg" width="1280" height="720" priority>`; lazy by default for others.
- Set `budgets` in `angular.json` (e.g. `initial` maximumWarning 500kb / maximumError 1mb raw — Angular budgets measure uncompressed size, so they're higher than the compressed budgets in SKILL.md).
- Use SSR with hydration (`@angular/ssr`) for public pages.

## 8. React Native / Expo

- Lists: `FlatList`/`FlashList` with `keyExtractor`, `getItemLayout` when rows are fixed height, `initialNumToRender` ~10, `windowSize` small; never `ScrollView` + `.map()` for long data.
- Images: request server-resized images that match the display size; use `expo-image` (caching, placeholders, blurhash).
- Layout: `useWindowDimensions()` for breakpoints; `react-native-safe-area-context` for notches; `minHeight: 44` on touchables; `hitSlop` for small icons.
- Performance: enable Hermes; memoize list items (`React.memo`); avoid inline functions in hot lists; run animations on the UI thread (Reanimated).
- Ship smaller APKs: enable Proguard/R8 and `enableSeparateBuildPerCPUArchitecture` or use AAB on Play Store.
- Test release builds on a budget Android device — dev builds are much slower and misleading.

## 9. Flutter

- Responsive: `LayoutBuilder` / `MediaQuery.sizeOf(context)` with breakpoints matching section 1; `SafeArea` for notches; touch targets via `MaterialTapTargetSize.padded` (48dp default).
- Lists: `ListView.builder` / `SliverList` (lazy), never `Column` with hundreds of children.
- Images: `cached_network_image`; set `cacheWidth`/`cacheHeight` to decode at display size and save memory.
- Use `const` constructors; avoid rebuilding large subtrees (split widgets, `ValueListenableBuilder`, selective state).
- Build: `flutter build appbundle` (per-ABI splits), `--split-debug-info`, `--obfuscate`; profile in `--profile` mode on a real budget device with DevTools.
- Flutter Web: initial download is large; for public content sites prefer an HTML framework and keep Flutter Web for app-like tools.

## 10. Running Lighthouse CI

```bash
npm i -D @lhci/cli
# build and start the app, then:
npx lhci autorun --config=./lighthouserc.json
```
GitHub Actions: run after the build step with the server started in the background. Edit `collect.url` to list the key pages (home, a listing page, a detail page, checkout). Budgets in the config are bytes, compressed transfer size.