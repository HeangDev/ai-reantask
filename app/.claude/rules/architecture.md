# Architecture

## 1. Principles

1. **Feature-first structure** — code is grouped by business feature, not by file type.
2. **Server state ≠ client state** — TanStack Query owns server data; Zustand owns UI/session state only.
3. **Unidirectional dependencies** — `app → features → shared`. Never the reverse; features never import other features' internals.
4. **Types at the boundary** — every API response is parsed with Zod; inside the app we trust the types.
5. **Presentational vs container** — components render, hooks fetch and orchestrate.
6. **Colocation** — tests, styles, schemas and types live next to the code they serve.

## 2. Folder structure

```
src/
├── app/                      # App shell (no business logic)
│   ├── providers/            # QueryClientProvider, I18nProvider, ThemeProvider
│   ├── router/               # routes, guards, lazy imports
│   ├── layouts/              # AuthLayout, StudentLayout, TeacherLayout, AdminLayout
│   ├── styles/               # tailwind.css, tokens
│   └── main.tsx
│
├── features/
│   ├── auth/
│   ├── assignments/
│   ├── student-dashboard/    # student Dashboard widgets
│   ├── classes/              # class list, join-by-code dialog, class detail
│   ├── teams/                # create/join/leave team, team panel
│   ├── submissions/          # project upload, GitHub push status, attempts
│   ├── ai-review/
│   ├── teacher-review/
│   ├── rubrics/
│   ├── users/
│   └── notifications/
│       ├── api/              # request functions + query/mutation hooks
│       │   ├── submissions.api.ts
│       │   ├── submissions.keys.ts
│       │   └── useSubmissions.ts
│       ├── components/       # feature-specific UI
│       ├── domain/           # pure TS: rules, mappers, status machine
│       ├── schemas/          # Zod schemas (API + form)
│       ├── store/            # Zustand slice (only if needed)
│       ├── pages/            # route-level components
│       ├── types.ts
│       └── index.ts          # PUBLIC API of the feature
│
├── shared/
│   ├── api/                  # http client, error normalization, interceptors
│   ├── components/           # ui kit: Button, Input, Modal, DataTable ...
│   ├── hooks/                # useDebounce, useMediaQuery ...
│   ├── lib/                  # date, format, file helpers, cn()
│   ├── i18n/                 # i18n config + locales/
│   ├── motion/               # shared variants & presets
│   ├── config/               # env, constants
│   └── types/
│
├── test/                     # setup, MSW handlers, factories, render helpers
└── vite-env.d.ts
```

## 3. Layers inside a feature

```
Page ──► Components ──► Hooks (api/) ──► API fn ──► http client ──► Backend
                │              │
                │              └── Zod parse → typed domain object
                └── pure rules from domain/
```

| Layer         | Responsibility                                                | May import                    |
|---------------|---------------------------------------------------------------|-------------------------------|
| `pages/`      | Route entry, compose components, read route params            | components, api hooks, domain |
| `components/` | Render UI, local state, call hooks passed in or feature hooks | shared, domain, schemas       |
| `api/`        | HTTP calls, query keys, TanStack hooks                        | shared/api, schemas           |
| `domain/`     | Pure functions: status transitions, score math, permissions   | schemas/types only            |
| `schemas/`    | Zod schemas and inferred types                                | zod                           |
| `store/`      | Zustand slice                                                 | zustand, types                |

## 4. Dependency rules (enforced by ESLint `import/no-restricted-paths`)

- `shared/*` **cannot** import from `features/*` or `app/*`.
- `features/a` **cannot** import `features/b/**` except through `features/b/index.ts`.
- `domain/` **cannot** import React, Zustand, or TanStack.
- Cross-feature composition happens in `pages/` or `app/`.

## 5. Data flow

### Read
1. Page mounts → `useSubmission(id)` (TanStack Query).
2. Query fn calls `submissionsApi.get(id)` → `http.get()`.
3. Response validated with `submissionSchema.parse()`.
4. Component renders `data`, `isPending`, `error`.

### Write
1. Form submit (React Hook Form + Zod resolver).
2. `useMutation` → API → on success `invalidateQueries` for affected keys.
3. Toast + navigation.

### Project upload → GitHub → AI review
1. Student finalizes the ZIP upload (progress via XHR/fetch, cancelable).
2. Status `pushing_to_github` → `pushed` (or `push_failed`) — polled, see [github-integration.md](./github-integration.md).
3. Backend queues AI review on the pushed commit.

### AI review progress
1. After submit, status = `queued`.
2. `useSubmission` uses `refetchInterval` while status ∈ {`queued`, `ai_reviewing`}; stops on terminal status.
3. When `ai_reviewed`, UI animates in the review panel.
   (If backend supports SSE/WebSocket later, replace polling inside the hook only.)

## 5.1 Student scope

Student UI is limited to `student-dashboard`, `classes`, and what nests under a class (`assignments` overview, `teams`, `submissions`). Student layout renders **two nav items only** (Dashboard, Classes). See [student-flow.md](./student-flow.md).

## 6. State ownership summary

| Data                                              | Owner                                                      |
|---------------------------------------------------|------------------------------------------------------------|
| Submissions, assignments, classes, users, reviews | TanStack Query                                             |
| Auth session (user, role, tokens in memory)       | Zustand `authStore`                                        |
| Theme, sidebar collapsed, locale                  | Zustand `uiStore` (persisted)                              |
| Table filters/sort/pagination                     | URL search params                                          |
| Upload progress / cancel handle                   | Local hook state (`useProjectUpload`)                      |
| Self-checklist ticks on assignment requirements   | `localStorage` per user+assignment (private, non-critical) |
| Form values                                       | React Hook Form                                            |
| Modal open / hover / tab                          | `useState`                                                 |

See [state-management.md](./state-management.md).

## 7. Routing & code splitting

- Each role area is a lazy-loaded route tree.
- Heavy widgets (rich editor, PDF viewer, charts) are `React.lazy` + `Suspense`.
- See [routing.md](./routing.md).

## 8. Environment & config

```
VITE_API_BASE_URL=
VITE_APP_ENV=development|staging|production
VITE_SENTRY_DSN=
```
Read only through `shared/config/env.ts`, validated by Zod at startup. No `import.meta.env` elsewhere.

## 9. Key decisions (ADR summary)

| # | Decision                                | Reason                                           |
|---|-----------------------------------------|--------------------------------------------------|
| 1 | Feature-first folders                   | Scales with team; clear ownership                |
| 2 | TanStack Query for all server data      | Caching, retries, polling out of the box         |
| 3 | Zustand only for global client state    | Minimal boilerplate, no provider tree            |
| 4 | Filters in URL                          | Shareable, back-button friendly                  |
| 5 | Zod for API + forms                     | Single source of truth for types                 |
| 6 | Polling first, streaming later          | Simpler; hidden behind hook                      |
| 7 | Backend pushes to GitHub                | No tokens in browser; validation & audit         |
| 8 | Student area = Dashboard + Classes only | Simple mental model; everything nests in a class |

New decisions: add a short ADR to `docs/adr/NNN-title.md`.