# General Rules (DB + Backend)

## DB (PostgreSQL)

- Names: `snake_case`, plural tables, exactly as in the schema.
- IDs: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`.
- Time: `TIMESTAMPTZ` (stored UTC). `DATE` only for `classes.start_at` / `end_date`.
- Text: `LONGTEXT` -> `TEXT`. JSON -> `JSONB`. Decimal -> `NUMERIC(p,s)`.
- Enums: `VARCHAR` + `CHECK (col IN (...))`. No native PG enum types.
- Every FK column gets an index.
- Migrations: Flyway only, `V{n}__{description}.sql`. Never edit an applied file. `ddl-auto=validate`.

Audit + soft-delete columns (on tables that have them):

```sql
created_at       TIMESTAMPTZ,
created_by_user  BIGINT REFERENCES users(id) ON DELETE SET NULL,
updated_at       TIMESTAMPTZ,
updated_by_user  BIGINT REFERENCES users(id) ON DELETE SET NULL,
deleted_at       TIMESTAMPTZ,
deleted_by_user  BIGINT REFERENCES users(id) ON DELETE SET NULL
```

Tables WITHOUT audit/soft-delete columns: `roles`, `user_settings`, `analysis_runs`, `analysis_results`, `analysis_issues` (only `created_at`/`updated_at`).

## Backend (Spring Boot)

- Layer-based packaging (see `architecture.md`): `controller` (HTTP only) -> `service` interface + `service/impl` (rules + `@Transactional`) -> `repository` (queries only). Never create feature packages.
- Entities never leave the service layer. Use request/response DTOs (`record`) + MapStruct.
- `@MappedSuperclass AuditableEntity` holds the audit + soft-delete fields; use JPA auditing (`@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy`).
- Soft delete: set `deleted_at`, `deleted_by_user` (+ status `DELETED` if the table has status). Entities use `@SQLRestriction("deleted_at IS NULL")`.
- Restore, don't duplicate: if a soft-deleted row exists for a unique key, clear `deleted_at`/`deleted_by_user` and set `ACTIVE`. Provide a repository method that ignores the restriction (native query) to find it.
- Enums: Java enum + `@Enumerated(EnumType.STRING)`.
- API base `/api/v1`, plural kebab-case. Paginate all lists (max size 100).
- Response wrapper `{ success, message, data, timestamp }`; errors via one `@RestControllerAdvice` with `code`, `message`, `errors[]`.
- Status codes: 201 create, 204 delete, 400 validation, 401, 403, 404, 409 conflict.
- Constructor injection only. `LAZY` fetch. No `@Data` on entities. Inject `Clock` for time rules.
- Never log or return passwords or Git tokens.
- Tests: unit (Mockito) for every status transition, integration with Testcontainers PostgreSQL (no H2).