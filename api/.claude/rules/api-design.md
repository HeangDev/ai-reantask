---
paths:
  - "**/controller/**"
  - "**/dto/**"
---

# Backend Rules - API Design

## 1. URLs and Versioning

- Base path `/api/v1`. Breaking change = `/api/v2`, keep v1 until clients migrate.
- Plural, kebab-case nouns. Nest at most one level: `/assignments/{id}/requirements`. Prefer flat routes for items: `/class-students/{id}`.
- Actions that are state transitions use `PATCH /{resource}/{id}/{action}` (`/publish`, `/approve`, `/verify`) or `PATCH /{resource}/{id}/status`.
- No verbs in collection URLs (`/getUsers` is wrong).
- IDs in paths are numeric `Long`. Validate and return 404 if not found or not visible to the caller (do not leak existence: use 404, not 403, for other users' private records).

## 2. HTTP Methods and Status Codes

| Action                      | Method   | Success                 |
|-----------------------------|----------|-------------------------|
| List                        | GET      | 200                     |
| Detail                      | GET      | 200                     |
| Create                      | POST     | 201 + `Location` header |
| Full update                 | PUT      | 200                     |
| Partial update / transition | PATCH    | 200                     |
| Delete (soft)               | DELETE   | 204                     |

Errors: 400 bad input/validation, 401 not authenticated, 403 not allowed, 404 not found, 409 conflict/duplicate/invalid state, 422 business rule violated, 429 rate limited, 500 unexpected, 502 external provider (Git) failure.

## 3. Response Envelope

Success:

```json
{ "success": true, "message": "OK", "data": { }, "timestamp": "2026-01-01T00:00:00Z" }
```

Paged:

```json
{ "success": true, "data": { "items": [], "page": 0, "size": 10, "totalItems": 0, "totalPages": 0 } }
```

Error:

```json
{ "success": false, "code": "SUBMISSION_DEADLINE_PASSED", "message": "Deadline has passed",
  "errors": [ { "field": "title", "message": "must not be blank" } ],
  "path": "/api/v1/assignments/1/submissions", "timestamp": "2026-01-01T00:00:00Z" }
```

- `code` is a stable machine-readable value from `ErrorCode`. `message` is human text (i18n by `user_settings.language` EN/KH/KO where feasible).
- Use `ApiResponse<T>` and `PageResponse<T>` from `dto/common`. Do not return raw entities or `Map`.

## 4. Pagination, Sorting, Filtering

- Query params: `page` (0-based, default 0), `size` (default 10, max 100), `sort=field,asc|desc` (whitelist allowed fields), plus filters: `status`, `q` (search), `classId`, `assignmentId`, `from`, `to`.
- Whitelist sortable/filterable fields. Reject unknown sort fields with 400 `INVALID_SORT_FIELD`.
- Use Spring `Pageable` + Specifications (or QueryDSL) for filters. Default sort `createdAt desc`.
- Soft-deleted rows excluded by default.

## 4b. Formats

- JSON, UTF-8, `camelCase` properties. Timestamps ISO-8601 UTC (`2026-01-01T08:00:00Z`). Dates `yyyy-MM-dd`.
- Enums as their uppercase string name (`ACTIVE`). Role names are returned as the enum name (`TEACHER`).
- `BigDecimal` scores serialized as numbers with 2 decimals.
- IDs as numbers. Never return internal-only columns (`password`, tokens, `deleted_by_user` to non-admins).

## 5. Idempotency and Concurrency

- PUT/DELETE/status PATCH are idempotent. Re-applying the same transition returns 200/204, not 500.
- `POST /assignments/{id}/submissions` supports an `Idempotency-Key` header (store key + response for 24h) to avoid duplicate submissions on retry.
- Optimistic locking (`@Version`) on `submissions`, `analysis_runs`, `assignments` to detect concurrent edits; map `ObjectOptimisticLockingFailureException` to 409 `CONCURRENT_UPDATE`.

## 6. Documentation

- springdoc-openapi at `/swagger-ui.html`, spec at `/v3/api-docs`. Enabled in dev/staging; protected or disabled in prod.
- Annotate controllers with `@Tag`, operations with `@Operation`, responses with `@ApiResponse`, bearer auth with `@SecurityRequirement`.
- Document error codes per endpoint.

## 7. Endpoint Catalogue (summary)

```text
/auth:        POST register, login, google, refresh, logout
/users:       GET list, POST create, GET/PUT /{id}, PATCH /{id}/approve, /{id}/reject, DELETE /{id}, PATCH /me/deactivate
              GET/PUT /me, GET/PUT /me/settings
/roles:               GET
/classes:             CRUD, GET/POST /{id}/subjects, GET/POST /{id}/students
/subjects:            CRUD
/class-subjects/{id}: PATCH status, DELETE
/class-students/{id}: PATCH status, DELETE
/assignments:         CRUD, PATCH /{id}/publish, /{id}/students, /{id}/requirements, /{id}/structures, /{id}/repositories, GET/PUT/DELETE /{id}/my-repository, POST/GET /{id}/submissions
/assignment-students/{id}: PATCH status, DELETE
/structures/{id}/rules: CRUD
/git:         GET connections, POST connections/{provider}, DELETE connections/{id}, GET repositories, POST repositories/sync
/submissions: GET /{id}, POST /{id}/reanalyze, PATCH /{id}/verify, /{id}/reject, GET /{id}/analysis
/analysis-runs/{id}/issues, /analysis-issues/{id}/status
```
Details per module: see `database-rules.md`.
