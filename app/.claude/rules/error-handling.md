# Error Handling

## 1. Layers

| Layer                  | Catches                         | Result                            |
|------------------------|---------------------------------|-----------------------------------|
| Field/form             | Validation (client + 422)       | Inline messages                   |
| Query/mutation         | API errors                      | Component error state / toast     |
| Route `errorElement`   | Render/loader errors in a route | Route-level error page with retry |
| Global `ErrorBoundary` | Anything uncaught               | Full-page fallback + report       |
| `window` handlers      | `error`, `unhandledrejection`   | Report to monitoring              |

## 2. Rules

- Every error shown to users has: **what happened**, **what they can do**, optionally **request ID** for support.
- Never show stack traces, raw server messages, or Zod issues.
- Errors are normalized into `ApiError` (see [api-integration.md](./api-integration.md)); UI maps `code` → i18n message.
- Don't swallow errors: either handle, rethrow, or report.
- Distinguish **offline** (banner "You're offline", mutations paused/queued) from server errors.
- Retry affordance for all idempotent failures.
- Report to monitoring with context: route, user id (hashed), role, `requestId`, feature. **No PII or submission content.**

## 3. Specific scenarios

| Scenario                           | Handling                                                                                                                |
|------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| Join class errors                  | Map to field: invalid / already joined / full; `429` countdown                                                          |
| GitHub push failed                 | Show mapped reason + **Try again** (no re-upload while staged); see [github-integration.md](./github-integration.md) §6 |
| Upload cancelled / network drop    | Keep selected file, offer "Resume / Try again"                                                                          |
| AI review failed (`ai_failed`)     | Show category message + "Retry" (if allowed by R-AI5); teacher can re-run                                               |
| Upload fails                       | Per-file error + retry; keep other files                                                                                |
| Draft autosave fails               | Non-blocking "Not saved — retrying" indicator; keep local copy in memory; warn on leave                                 |
| Submit conflict (409)              | Dialog explaining status changed; refetch                                                                               |
| Session expired                    | Save draft if possible → redirect login with `returnTo`                                                                 |
| Schema mismatch (invalid response) | Generic error state + report as `INVALID_RESPONSE`                                                                      |
| Chunk load failure (new deploy)    | Prompt "New version available — Reload"                                                                                 |

## 4. Components

`ErrorBoundary`, `RouteError`, `ErrorState` (title, description, retry), `InlineError`, `OfflineBanner`, `ForbiddenPage`, `NotFoundPage`.