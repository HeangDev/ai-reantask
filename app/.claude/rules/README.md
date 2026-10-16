# Student Assignment Review AI — Frontend Docs

Frontend for a platform where **students submit assignments**, an **AI produces a review** (feedback, rubric scores, suggestions), and **teachers verify, edit and finalize** the result.

> Some domain details (statuses, roles, rubric shape) are **assumptions**. Items marked `ASSUMPTION` should be confirmed with the product owner / backend team and then updated here.

## Tech stack

| Concern         | Tool                               |
|-----------------|------------------------------------|
| UI              | React + TypeScript (strict)        |
| Styling         | Tailwind CSS                       |
| Client/UI state | Zustand                            |
| Server state    | TanStack Query                     |
| Tables          | TanStack Table                     |
| Forms           | React Hook Form + Zod              |
| Routing         | react-router                       |
| i18n            | i18next + react-i18next            |
| Animation       | motion                             |
| Testing         | Jest + React Testing Library + MSW |

## Document index

| File                                         | Purpose                                                 |
|----------------------------------------------|---------------------------------------------------------|
| [requirements.md](./requirements.md)         | Product & functional / non-functional requirements      |
| [architecture.md](./architecture.md)         | Folder structure, layers, data flow, dependency rules   |
| [business-rules.md](./business-rules.md)     | Roles, permissions, assignment lifecycle, grading rules |
| [forms-validation.md](./forms-validation.md) | React Hook Form + Zod conventions and schemas           |
| [ui-rules.md](./ui-rules.md)                 | Design tokens, Tailwind rules, components, a11y basics  |
| [testing.md](./testing.md)                   | Test strategy, tooling, patterns, coverage              |
| [state-management.md](./state-management.md) | Zustand vs TanStack Query vs local state                |
| [api-integration.md](./api-integration.md)   | API client, query keys, mutations, errors, polling      |
| [routing.md](./routing.md)                   | Route map, guards, lazy loading                         |
| [tables.md](./tables.md)                     | TanStack Table conventions                              |
| [i18n.md](./i18n.md)                         | Translation keys, namespaces, formatting                |
| [animations.md](./animations.md)             | `motion` usage rules                                    |
| [error-handling.md](./error-handling.md)     | Error boundaries, toasts, empty/error states            |
| [accessibility.md](./accessibility.md)       | WCAG checklist and patterns                             |
| [security.md](./security.md)                 | Auth, XSS, file upload, PII                             |
| [coding-standards.md](./coding-standards.md) | TypeScript, naming, lint, imports                       |
| [contributing.md](./contributing.md)         | Git flow, PR checklist, Definition of Done              |

## Reading order for new developers

1. `requirements.md` → what we build
2. `architecture.md` → where code lives
3. `business-rules.md` → why the app behaves as it does
4. `state-management.md` + `api-integration.md` → how data moves
5. `ui-rules.md`, `forms-validation.md`, `testing.md` → how we build and verify