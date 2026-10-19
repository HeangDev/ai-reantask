# AGENTS.md — Student Assignment Review AI (Frontend)

Instructions for AI coding agents (and humans) working in this repo. **Read the linked docs before changing code.** If code and docs disagree, stop and ask, or update the docs in the same PR.

## Project

Students submit assignments → AI produces a review → teachers verify, override and return the grade.
Roles: `student`, `teacher`, `admin`. AI output is **advisory**, never final without teacher action.

## Stack

React · TypeScript (strict) · Tailwind CSS · Zustand · TanStack Query · TanStack Table · React Hook Form · Zod · react-router (data router) · i18next · motion · Jest + React Testing Library + MSW

## Docs map (source of truth)

| When you are…                                  | Read                                                                                     |
|------------------------------------------------|------------------------------------------------------------------------------------------|
| Starting any task                              | [docs/README.md](./docs/README.md), [docs/requirements.md](./docs/requirements.md)       |
| Adding files / deciding where code goes        | [docs/architecture.md](./docs/architecture.md)                                           |
| Touching rules, statuses, permissions, grading | [docs/business-rules.md](./docs/business-rules.md)                                       |
| Deciding where state lives                     | [docs/state-management.md](./docs/state-management.md)                                   |
| Calling the backend                            | [docs/api-integration.md](./docs/api-integration.md)                                     |
| Building a form                                | [docs/forms-validation.md](./docs/forms-validation.md)                                   |
| Building UI / styling                          | [docs/ui-rules.md](./docs/ui-rules.md), [docs/accessibility.md](./docs/accessibility.md) |
| Adding a table                                 | [docs/tables.md](./docs/tables.md)                                                       |
| Adding routes / guards                         | [docs/routing.md](./docs/routing.md)                                                     |
| Adding text                                    | [docs/i18n.md](./docs/i18n.md)                                                           |
| Adding animation                               | [docs/animations.md](./docs/animations.md)                                               |
| Handling failures                              | [docs/error-handling.md](./docs/error-handling.md)                                       |
| Auth, uploads, rendering user content          | [docs/security.md](./docs/security.md)                                                   |
| Writing tests                                  | [docs/testing.md](./docs/testing.md)                                                     |
| Style, naming, lint                            | [docs/coding-standards.md](./docs/coding-standards.md)                                   |
| Opening a PR                                   | [docs/contributing.md](./docs/contributing.md)                                           |

## Commands

```bash
npm run dev          # start dev server
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Jest
npm run test:ci      # Jest with coverage (CI)
npm run build        # production build
npm run i18n:check   # locale key parity
```
Before finishing any task run: `lint`, `typecheck`, `test`. Fix all failures you caused.

## Architecture rules (see architecture.md)

- Feature-first: `src/features/<name>/{api,components,domain,schemas,store,pages}` + public `index.ts`.
- Dependencies flow `app → features → shared`. `shared` never imports from `features`/`app`.
- Import another feature **only** via its `index.ts`.
- `domain/` is pure TS: no React, Zustand or TanStack.
- Env vars only via `shared/config/env.ts`.
- Use alias `@/`; no deep relative imports.

## State rules (see state-management.md)

- Server data → **TanStack Query** only. Never copy it into Zustand.
- Zustand → global UI/session only (`authStore`, `uiStore`). Always use selectors.
- Table filters / sort / page / tab → **URL search params**.
- Form values → React Hook Form. Local UI → `useState`.
- On logout: clear stores **and** `queryClient.clear()`.

## API rules (see api-integration.md)

- One `*.api.ts` per resource; **parse every response with Zod**.
- Query keys come from `*.keys.ts` factories; no inline keys.
- Hooks return the raw query/mutation object; invalidate narrowly after mutations.
- Optimistic updates only for low-risk actions; never submit/grade/return.
- Poll while status is `queued` / `ai_reviewing`; stop on terminal status.
- Map errors to `ApiError` and i18n keys; never show raw server messages.

## Forms rules (see forms-validation.md)

- One Zod schema per form in `schemas/`; types via `z.infer`.
- Validation messages are **i18n keys**.
- Full `defaultValues`; `mode: 'onTouched'`; use shared field components.
- Map server 422 errors with `setError`. Warn on unsaved changes.
- Do not disable submit for invalid state.

## UI rules (see ui-rules.md, accessibility.md)

- Tailwind tokens + shared components only; no raw hex, no `@apply` (except base), use `cn()` / `cva`.
- Mobile-first; support light and dark.
- Every data view implements **loading (skeleton), empty, error, and refetching** states.
- AI content always shows `AiBadge` + confidence; status never by color alone (use `StatusBadge`).
- Destructive actions need a confirmation dialog (not `window.confirm`).
- Semantic HTML, labelled inputs, visible focus, keyboard operable, WCAG AA.

## Business rules (see business-rules.md)

- Status transitions go through `submissions/domain/statusMachine.ts`; UI actions come from `getAllowedActions(status, role)`. **Do not hard-code status checks in components.**
- Permissions go through `can(user, action, resource)`.
- Scoring through `calculateOverall`; overriding an AI score **requires a reason** (R-G3).
- Reference rule IDs in comments and test names (e.g. `R-G3`).
- Frontend checks are UX only; the backend is authoritative.

## Tables, routing, i18n, motion

- **Tables:** shared `DataTable`, server-side pagination/sort/filter, memoized `columns.tsx` (tables.md).
- **Routing:** `createBrowserRouter`; typed `paths.ts`; lazy pages; `RequireAuth` / `RequireRole`; validate params with Zod (routing.md).
- **i18n:** no hardcoded user-facing strings (JSX, `aria-*`, `placeholder`, toasts, Zod); add keys to `en` first; no string concatenation (i18n.md).
- **Motion:** import from `motion/react`; use presets in `shared/motion`; animate `opacity`/`transform` only; honor reduced motion (animations.md).

## Security (see security.md)

- No tokens in `localStorage`/`sessionStorage`.
- Never `dangerouslySetInnerHTML` without DOMPurify + review.
- Treat student text and AI output as **untrusted**.
- No PII or submission content in logs, URLs, or error reports.
- Validate file type/size client-side; server is authoritative.

## Testing (see testing.md)

- Colocated `*.test.ts(x)`; use `renderWithProviders`, MSW for network, factories for data.
- Query by role/label first; `userEvent`, not `fireEvent`.
- Add tests with every behavior change: domain (unit), forms, hooks, tables, guards, a11y (`jest-axe`).
- Don't mock React Query, RHF or Zod. No `.only` / `.skip`.
- Coverage targets: domain/lib ≥ 90 %, global ≥ 80 %.

## Code standards (see coding-standards.md)

- No `any`; no `!` outside tests; discriminated unions + exhaustive switches; `as const` over `enum`.
- Function components, named exports, files < ~200 lines, stable `key`s.
- Avoid `useEffect` for derived state or fetching.
- Naming: components `PascalCase`, hooks `useX`, files `camelCase` / `name.api.ts`, folders `kebab-case`.
- Conventional Commits.

## Agent workflow

1. Read the relevant docs from the map above.
2. Check for an existing component, hook or util in `shared/` before creating one.
3. Make the smallest change that satisfies the task; keep to the existing patterns.
4. Add or update tests, i18n keys, and MSW handlers/factories.
5. Run `lint`, `typecheck`, `test`.
6. Update docs if behavior, rules, or conventions changed.
7. Summarize: what changed, which docs/rules apply, anything unverified.

## Do / Don't

| Do                                                        | Don't                                  |
|-----------------------------------------------------------|----------------------------------------|
| Follow the docs; cite rule IDs                            | Invent new patterns without an ADR     |
| Parse API data with Zod                                   | Trust raw API responses                |
| Use shared components and tokens                          | Duplicate UI or hardcode styles        |
| Ask when requirements conflict or are marked `ASSUMPTION` | Guess business rules                   |
| Keep changes focused                                      | Refactor unrelated code                |
| Add dependencies only when necessary and justified        | Add libraries that duplicate the stack |

## Ask a human before

- Changing the status machine, grading formula, or permissions matrix
- Adding a dependency or a new global store
- Changing auth/session handling or security headers
- Altering API contracts or Zod schemas in a breaking way
- Resolving any `ASSUMPTION` or open question in the docs