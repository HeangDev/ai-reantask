---
name: react-conventions
description: Component and code conventions for large-scale React projects organized by feature/domain (feature-sliced folders under src/features). Defines the folder structure, dependency rules between app/features/shared code, file and symbol naming, component patterns, props, hooks, state management (TanStack Query, Zustand, URL state, react-hook-form + zod), the API layer, routing with lazy routes, i18n namespaces per feature, styling with Tailwind + cva, error handling, imports and TypeScript rules, plus a scaffolding script for new features and an ESLint config that enforces the boundaries. Use this skill whenever you create, move, refactor or review any file in a React (Vite/CRA/React Router) codebase — new feature, page, component, hook, store, API call, form or route — when deciding where code should live, when the user mentions folder structure, architecture, conventions, "feature-based", "domain", "bulletproof", or asks to set up or clean up a React project, even for a single small component.
---

# React Component & Code Conventions (feature-based)

The codebase is organized **by feature/domain**, not by file type. Everything a feature needs — its components, API calls, hooks, state, types, translations and tests — lives in one folder. This keeps large projects navigable: to change "orders" you open `src/features/orders`, and deleting a feature means deleting one folder.

**If the existing project already follows different conventions, follow the project and point out the difference — don't mix two styles in one codebase.**

## Default stack

Assumed unless the project shows otherwise: Vite · React 19 · TypeScript (strict) · React Router (data router, lazy routes) · TanStack Query (server state) · Zustand (global client state) · react-hook-form + zod (forms/validation) · Tailwind CSS + `cva` + `cn()` · react-i18next (`km` default, `en`) · Vitest + Testing Library + MSW · Playwright.

Pair with the skills `khmer-typography-i18n`, `responsive-performance` and `frontend-testing-review` when installed.

## 1. Folder structure

```
src/
├── app/                      # application layer: wiring only, no business logic
│   ├── main.tsx              # entry: createRoot, imports app.tsx
│   ├── app.tsx               # <AppProvider><AppRouter/></AppProvider>
│   ├── provider.tsx          # QueryClient, i18n, ErrorBoundary, Suspense, toasts
│   ├── i18n.ts               # i18next init; registers each feature's namespace
│   ├── router.tsx            # createBrowserRouter with lazy routes
│   └── routes/               # one file per page; composes features
│       ├── app/              # authenticated area
│       │   ├── dashboard.tsx
│       │   └── products/
│       │       ├── products.tsx
│       │       └── product.tsx
│       ├── auth/
│       │   └── login.tsx
│       └── not-found.tsx
├── features/                 # ← most code lives here, one folder per domain
│   └── products/
│       ├── api/              # requests + query/mutation hooks
│       ├── components/       # UI used only by this feature
│       ├── hooks/            # non-API hooks for this feature
│       ├── stores/           # Zustand stores scoped to this feature (optional)
│       ├── locales/          # km.json, en.json  (i18n namespace "products")
│       ├── types/            # domain types and zod schemas
│       └── utils/            # pure helpers for this feature
├── components/               # shared, feature-agnostic UI
│   ├── ui/                   # design-system primitives: button, input, dialog…
│   ├── layouts/              # app-layout, auth-layout
│   ├── errors/               # error fallbacks
│   └── seo/                  # head/meta helpers
├── hooks/                    # shared hooks (use-disclosure, use-debounce…)
├── lib/                      # configured libraries: api-client, query-client, khmer-format, cn
├── locales/common/           # km.json, en.json for shared strings
├── stores/                   # truly global client state (e.g. notifications, theme)
├── config/                   # env.ts (validated), paths.ts (route paths)
├── types/                    # shared types (api.ts: Paginated<T>, ApiError…)
├── utils/                    # shared pure helpers
├── testing/                  # test utils, MSW handlers/server, data factories
└── assets/                   # images, icons, fonts
```

Only create sub-folders a feature actually needs. A small feature may have just `api/` and `components/`.

**What is a feature?** A business domain or user capability: `auth`, `products`, `cart`, `checkout`, `orders`, `users`, `notifications`, `reports`. Not a UI type (`modals`, `tables`) and not a page (`home-page`). One page may use several features; one feature may appear on several pages.

## 2. Dependency rules (most important)

Code flows one way: **shared → features → app**.

| Folder | May import from | Must NOT import from |
|---|---|---|
| `app/` | everything | — |
| `features/x/` | shared folders, its own feature | `app/`, **other features** |
| shared (`components/`, `hooks/`, `lib/`, `stores/`, `config/`, `types/`, `utils/`) | other shared folders | `features/`, `app/` |

- **No cross-feature imports.** If `orders` needs to show a product card, compose them in the route (`app/routes/...`) and pass data/elements as props or `children`. If two features genuinely share logic, move it to a shared folder.
- No barrel files (`index.ts` re-exporting a folder). Import the exact file. Barrels slow Vite dev servers and tests, and hide circular imports.
- Enforced by `assets/eslint.config.js` (`import/no-restricted-paths`), which reads the feature list from disk.

## 3. Naming

| Thing | Convention | Example |
|---|---|---|
| Files & folders | `kebab-case` | `product-card.tsx`, `use-cart-total.ts` |
| Components | `PascalCase`, named export | `export function ProductCard()` |
| Hooks | `useCamelCase`, file `use-*.ts` | `useCartTotal` in `use-cart-total.ts` |
| Props type | `<Component>Props` | `ProductCardProps` |
| Event props / handlers | `onX` props, `handleX` functions | `onSelect`, `handleSelect` |
| Booleans | `is/has/can/should` | `isOpen`, `hasError` |
| API functions | verb + noun | `getProducts`, `createOrder`, `updateUser` |
| Query hooks | `use` + noun / verb | `useProducts`, `useProduct`, `useCreateOrder` |
| Zustand stores | `use<Name>Store` | `useCartStore` |
| zod schemas | `<name>Schema`, inferred type `<Name>Input` | `createProductSchema`, `CreateProductInput` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_MB` |
| Tests | next to the file, `.test.ts(x)` | `product-card.test.tsx` |

kebab-case files avoid case-sensitivity bugs between macOS/Windows and Linux CI.

## 4. Components

- **Function declarations with named exports.** No default exports — named exports keep names consistent across imports and refactors, and lazy routes work with them (section 8).
- One exported component per file; small private sub-components in the same file are fine.
- Props: a `type` named `XxxProps`, destructured in the signature, defaults in the destructuring. Extend native element props for wrappers: `type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>`.
- React 19: `ref` is a regular prop — don't use `forwardRef` in new code.
- Keep components focused: if a component exceeds ~150–200 lines, mixes data fetching with large markup, or has many `useState`s, split it (extract sub-components or a custom hook).
- **Composition over configuration:** prefer `children` and slot props over long lists of boolean props (`showHeader`, `showFooter`, `compact`…). More than ~2 levels of prop drilling → composition, context, or a store.
- Data-fetching components call feature query hooks; presentational components receive data via props. Don't fetch in `useEffect`.
- Render all states: loading (skeleton), error (with retry), empty, success.
- No business logic in JSX: compute values above the `return`, or in a hook/util.
- Lists: stable `key` from data ids, never array index for reorderable lists.
- Accessibility is part of the component: semantic elements, labels, focus states, `alt`.
- Order inside a component: hooks → derived values → handlers → early returns (loading/error/empty) → JSX.

## 5. State: choose the right home

| State | Where |
|---|---|
| Server data (anything from an API) | **TanStack Query** in `features/x/api/` — never copied into Zustand or `useState` |
| Local UI state (open/closed, input value) | `useState` / `useReducer` in the component |
| Shareable UI state (filters, search, page, tab, sort) | **URL search params** (`useSearchParams`) so links and refresh work |
| Form state | **react-hook-form** + **zod** schema |
| Cross-component client state within a feature | Zustand store in `features/x/stores/` |
| App-wide client state (theme, toasts, auth session flag) | Zustand store in `src/stores/` |

Derived values are computed, not stored. Select narrowly from Zustand (`useCartStore((s) => s.items)`) to avoid re-renders.

## 6. API layer

- `lib/api-client.ts`: one configured client (fetch wrapper or axios) that sets base URL from `config/env.ts`, attaches auth, parses JSON, normalizes errors into an `ApiError` type, and handles 401 (redirect to login).
- One file per endpoint in `features/x/api/`, containing three things: the request function, its `queryOptions`, and the hook. Example in `references/examples.md`.
- Query keys come from a per-feature key factory (`productKeys.all`, `productKeys.list(params)`, `productKeys.detail(id)`) so invalidation is consistent.
- Mutations invalidate or update the relevant keys in `onSuccess`; show toasts via the shared notifications store.
- Validate responses at the boundary with zod for critical data (payments, auth), or at least type them from a single source.
- Never call `fetch` directly from components.

## 7. Forms

- Schema first: `features/x/types/` or next to the form, using zod; infer types with `z.infer`.
- react-hook-form with `zodResolver`; shared `Form`/`Field`/`Input` primitives from `components/ui/`.
- Validation messages come from i18n keys, not hard-coded strings.
- Disable submit while pending; show server errors (map API field errors to `setError`); keep user input on failure.
- Phone, money and date inputs use the shared helpers (`toLatinDigits`, `normalizeKhPhone`) so Khmer digits work.

## 8. Routing

- Route paths defined once in `config/paths.ts` (`paths.app.product.getHref(id)`) — no hard-coded path strings in components.
- `app/router.tsx` uses `createBrowserRouter` with **lazy** route modules so each page is its own chunk:
  `lazy: async () => ({ Component: (await import("./routes/app/products/products")).ProductsRoute })`.
- Route files are thin: read params, compose feature components, set page title. Optional `clientLoader`-style prefetch with `queryClient.ensureQueryData(...)`.
- Each route gets an `errorElement`/ErrorBoundary; auth-protected areas wrapped in a `ProtectedRoute`.

## 9. Styling

- Tailwind utility classes in JSX; `cn()` (`clsx` + `tailwind-merge`) from `lib/cn.ts` for conditional classes and to let callers override via `className`.
- Variants with `cva` in `components/ui/*` (size, intent) — not ad-hoc ternaries repeated across files.
- Design tokens (colors, radius, spacing) live in the Tailwind theme/CSS variables; no raw hex values in components.
- Khmer rules apply: no fixed heights on text containers, no `tracking-*` on Khmer, line-height ≥ 1.6.

## 10. i18n

- One namespace per feature: `features/products/locales/km.json` + `en.json`, registered in `app/i18n.ts`. Shared strings in a `common` namespace.
- Components use `const { t } = useTranslation("products")`.
- Keys are semantic and nested: `products.list.emptyTitle`, not the English sentence.
- Every key exists in both `km` and `en` (a test checks this — see `frontend-testing-review`).

## 11. TypeScript, imports and code style

- `strict: true`, `noUncheckedIndexedAccess: true`. No `any` (use `unknown` + narrowing); no non-null `!` without a comment saying why it's safe.
- `type` for props and unions; `interface` only when extension/merging is needed. Avoid TS `enum`; use `as const` objects or string unions.
- Absolute imports via `@/` alias (`@/features/products/api/get-products`). Relative imports only within the same folder (`./product-card`).
- Import order (auto-sorted by ESLint): external packages → `@/` aliases → relative → styles.
- Environment variables only through `config/env.ts` (zod-validated, `VITE_` prefix). Never read `import.meta.env` elsewhere. Nothing secret in `VITE_*` — it ships to the browser.
- Pure functions in `utils/`; side effects in hooks or `lib/`.
- Comments explain *why*. Remove dead code and `console.log` before committing.
- Prettier formats; ESLint enforces rules; don't hand-argue formatting in reviews.

## 12. Errors

- `react-error-boundary` at the app level (provider) and per route; feature components may add local boundaries around risky widgets.
- API errors normalized in `api-client`; user-facing messages translated; technical details logged (Sentry or similar) — not shown.

## 13. Tests

- Colocated: `product-card.test.tsx` next to `product-card.tsx`; hook tests next to hooks.
- Shared helpers in `src/testing/` (`render-with-providers.tsx`, MSW `handlers/` per feature, data `factories/`).
- E2E tests in `/e2e` at the repo root, one spec per user journey.

## Workflow for common tasks

**New feature:** run `node scripts/new-feature.mjs <name>` (copy the script from this skill into the repo's `scripts/` folder first), or create the folders by hand per section 1. Add the i18n namespace to `app/i18n.ts`, add paths to `config/paths.ts`, add lazy routes in `app/router.tsx`. ESLint picks up the new feature boundary automatically.

**New component:** decide its home: used by one feature → `features/x/components/`; generic and used (or clearly reusable) by 2+ features → `components/ui/` or `components/`. Write the component, its test, and translations.

**New API call:** create `features/x/api/<verb>-<noun>.ts` with request function + `queryOptions` + hook; add keys to the feature's key factory; add an MSW handler in `src/testing/handlers/`.

**Code needed by two features:** move it down to a shared folder; never import across features.

Before finishing any change, check: correct folder, no cross-feature or upward imports, kebab-case filenames, named exports, all UI strings translated (km + en), loading/error/empty states, test added.

## Files in this skill

- `references/examples.md` — a complete example feature (`products`): api-client, key factory, query + mutation files, component with all states, form with zod, Zustand store, route file, router, paths, env, `cn`, Button with cva, locales, and a test. Read when creating any of these for the first time in a project.
- `assets/eslint.config.js` — flat ESLint config enforcing the dependency rules, kebab-case filenames, import order and React hooks rules.
- `assets/tsconfig.app.json` — strict TS config with the `@/` alias (pair with the Vite alias shown in examples).
- `scripts/new-feature.mjs` — scaffolds `src/features/<name>` with api/components/locales/types folders and starter files. No dependencies; run with Node 18+.