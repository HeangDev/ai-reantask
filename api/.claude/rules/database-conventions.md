---
paths:
  - "src/main/resources/db/**"
  - "**/entity/**"
  - "**/repository/**"
  - "**/converter/**"
---

# Database Rules (PostgreSQL) - Conventions

Full DDL: `src/main/resources/db/migration/V1__init_schema.sql` (generated from the module rule files). Module DDL and status meanings live in `01` to `05`.

## 1. Engine and Settings

- PostgreSQL 15+. Encoding `UTF8`. Collation `en_US.UTF-8` (or `C.UTF-8`).
- Store all time as `TIMESTAMPTZ` in UTC. `hibernate.jdbc.time_zone=UTC`. The API returns UTC; there is no per-user timezone setting.
- One schema (`public`) unless the team decides otherwise. App connects with a least-privilege role (no superuser, no DDL rights in production; Flyway uses a separate migration role).
- `spring.jpa.hibernate.ddl-auto=validate`. Hibernate never changes the schema.

## 2. Naming

| Object                 | Rule                                                                    | Example                  |
|------------------------|-------------------------------------------------------------------------|--------------------------|
| Table                  | plural `snake_case`                                                     | `class_subjects`         |
| Column                 | singular `snake_case`                                                   | `deadline_at`            |
| PK                     | `id`                                                                    | `id`                     |
| FK column              | `<singular_table>_id` (or the role name)                                | `class_id`, `teacher_id` |
| Audit user FK          | `<action>_by_user`                                                      | `created_by_user`        |
| Boolean                | `is_` prefix                                                            | `is_required`            |
| Timestamp              | `_at` suffix                                                            | `submitted_at`           |
| Date                   | `_date` or `_at` per schema (`classes.start_at`, `end_date` keep as-is) |                          |
| Unique constraint      | `uq_<table>_<cols>`                                                     | `uq_class_students`      |
| Check constraint       | `chk_<table>_<rule>`                                                    | `chk_assignments_dates`  |
| Index                  | `idx_<table>_<cols>`                                                    | `idx_submissions_status` |
| Unique index (partial) | `uq_<table>_<rule>`                                                     | `uq_runs_one_inflight`   |
| FK constraint          | `fk_<table>_<ref>`                                                      | `fk_users_role`          |

Do not use reserved words as column names without need (`type`, `path`, `name` exist in the schema: they are legal in PostgreSQL but never unquote-alias them in native queries).

## 3. Type Mapping (MySQL source -> PostgreSQL)

| Schema                  | PostgreSQL                            | Java                                          |
|-------------------------|---------------------------------------|-----------------------------------------------|
| `BIGINT AUTO_INCREMENT` | `BIGINT GENERATED ALWAYS AS IDENTITY` | `Long`                                        |
| `VARCHAR(n)`            | `VARCHAR(n)`                          | `String`                                      |
| `CHAR(6)`               | `CHAR(6)`                             | `String`                                      |
| `LONGTEXT`              | `TEXT`                                | `String`                                      |
| `TIMESTAMP`             | `TIMESTAMPTZ`                         | `Instant`                                     |
| `DATE`                  | `DATE`                                | `LocalDate`                                   |
| `DECIMAL(5,2)`          | `NUMERIC(5,2)`                        | `BigDecimal`                                  |
| `BOOLEAN`               | `BOOLEAN`                             | `boolean`                                     |
| `INT`                   | `INTEGER`                             | `Integer`                                     |
| `JSON`                  | `JSONB`                               | `Map`/POJO via `@JdbcTypeCode(SqlTypes.JSON)` |
| `ENUM`                  | `VARCHAR(n)` + `CHECK`                | Java enum, `EnumType.STRING`                  |

Never use: `AUTO_INCREMENT`, backticks, `TINYINT`, `ENGINE=`, `ON UPDATE CURRENT_TIMESTAMP`, `LONGTEXT`, `DATETIME`.

## 4. Keys and Constraints

- Every table has a surrogate `BIGINT` identity PK.
- Every FK is declared with an explicit `ON DELETE` rule:
  - audit columns (`*_by_user`, `resolved_by_user`): `ON DELETE SET NULL`
  - `users.role_id`: `ON DELETE RESTRICT`
  - `user_settings.user_id`: `ON DELETE CASCADE` (only hard-delete case; users are soft-deleted)
  - all others: default `NO ACTION` (rows are soft-deleted, never hard-deleted)
- `NOT NULL` wherever the schema says so. Defaults exactly as the schema.
- Enum-like columns get a `CHECK (col IN (...))`. Adding a value = new migration that drops/recreates the check + updates the Java enum.
- Money-like/score columns: `NUMERIC(5,2)`; add `CHECK (score >= 0 AND score <= 100)` for `overall_score` and `analysis_results.score` if the team confirms the 0-100 scale.

## 5. Unique Constraints (reserved even after soft delete)

| Table               | Unique                                                             |
|---------------------|--------------------------------------------------------------------|
| roles               | `name`                                                             |
| users               | `email`, `google_id`, `phone` (plain unique; include deleted rows) |
| classes             | `code`                                                             |
| class_subjects      | `(class_id, subject_id)`                                           |
| class_students      | `(class_id, student_id)`                                           |
| assignment_students | `(assignment_id, student_id)`                                      |
| user_settings       | `user_id`                                                          |
| git_connections     | `(user_id, provider)` (recommended)                                |
| repositories        | `(provider, external_id)` (recommended)                            |
| analysis_results    | `(analysis_run_id, requirement_id)`                                |

Partial unique indexes (state guards):
- `assignment_student_repositories (assignment_id, student_id) WHERE status='ACTIVE' AND deleted_at IS NULL`
- `analysis_runs (submission_id) WHERE status IN ('PENDING','RUNNING')`

Because unique keys include soft-deleted rows, the backend must RESTORE instead of INSERT (see `00-general.md`).

## 6. Soft Delete

- Soft delete = set `deleted_at`, `deleted_by_user` (+ `status='DELETED'` when the table has status).
- Queries for normal use always filter `deleted_at IS NULL` (`@SQLRestriction`).
- Never `DELETE FROM` the soft-delete tables. Retention/purging is a separate, approved migration or job.
- Soft-deleted parents do not cascade; children are kept for history (e.g. assignment `DELETED` keeps submissions and analysis).

## 7. Indexing

- Index every FK column.
- Add composite indexes for the real query patterns:
  - `submissions (assignment_id, student_id)`, `submissions (status)`
  - `analysis_issues (analysis_run_id, status, severity)`
  - `assignments (teacher_id)`, `assignments (status)`
  - `class_subjects (teacher_id)`, `class_students (student_id)`, `assignment_students (student_id)`
  - `users (role_id)`, `users (status)`
- Do not index low-selectivity booleans alone. Use partial indexes (`WHERE deleted_at IS NULL`) for hot list queries if profiling shows need.
- JSONB (`analysis_results.evidence`): add a GIN index only if you query inside it.
- Every new index needs a reason (query + `EXPLAIN` evidence).

## 8. Migrations (Flyway)

- Location `src/main/resources/db/migration`. Files `V{n}__{snake_case_description}.sql`. Versions strictly increasing; never reuse or edit applied files.
- One concern per migration (create table, add column, add index, seed).
- Seed data (`roles`) is a migration (`V2__seed_roles.sql`) using `INSERT ... ON CONFLICT (name) DO NOTHING`.
- Backward-compatible changes first (expand), remove later (contract):
  1. add nullable column / new table
  2. deploy code that writes both
  3. backfill
  4. add `NOT NULL` / constraint
  5. drop old column in a later release
- Add columns with defaults carefully on large tables. Create big indexes with `CREATE INDEX CONCURRENTLY` (needs `flyway` non-transactional migration: `-- flyway:executeInTransaction=false` equivalent config).
- Every migration is tested against a fresh Testcontainers PostgreSQL in CI.
- No data-changing scripts in `V` migrations without a rollback plan documented in the PR.

## 9. Security of Data

- Passwords: BCrypt hash only (`users.password`). Google-only users get a random hash.
- `git_connections.access_token` / `refresh_token`: encrypted by the application (AES-GCM) before saving. DB stores ciphertext.
- Do not store raw student source code in the DB; store `commit_sha` + `repository_id` and fetch on demand. `analysis_results.evidence` holds short snippets/paths only (limit size).
- No PII in logs. Email/phone are only returned to the user themselves, admins and teachers of that student.
- Backups: daily full + WAL (PITR), encrypted, restore-tested monthly.

## 10. Performance Rules

- Always paginate lists; no unbounded `SELECT *`.
- Select only needed columns for list screens (DTO projections).
- Prevent N+1: `@EntityGraph`, `JOIN FETCH`, or batch fetch (`hibernate.default_batch_fetch_size=50`).
- Use `EXPLAIN (ANALYZE, BUFFERS)` for any query touching `submissions`, `analysis_*` with large data.
- Keep transactions short. No external HTTP calls (Git provider) inside a DB transaction that holds locks.
- Row locking for state changes: `SELECT ... FOR UPDATE` (`@Lock(PESSIMISTIC_WRITE)`) when picking a `PENDING` run or changing a submission status concurrently; or use optimistic `@Version` on `submissions` and `analysis_runs`.
- Connection pool (HikariCP): `maximum-pool-size` 10-20 per instance, `connection-timeout` 30s.

## 11. Entity Relationship Summary

```text
roles 1---* users 1---1 user_settings
users 1---* git_connections 1---* repositories
classes 1---* class_subjects *---1 subjects        (class_subjects.teacher_id -> users)
classes 1---* class_students *---1 users(student)
users(teacher) 1---* assignments
assignments 1---* assignment_students *---1 users(student)
assignments 1---* assignment_requirements
assignments 1---* assignment_structures 1---* assignment_structure_rules
assignments 1---* assignment_repositories *---1 repositories          (template repo)
assignments + users(student) 1---* assignment_student_repositories *---1 repositories
assignments + users(student) + repositories 1---* submissions
submissions 1---* analysis_runs 1---* analysis_results *---1 assignment_requirements
analysis_runs 1---* analysis_issues
(every audited table) *---1 users via created_by_user / updated_by_user / deleted_by_user
```

## 12. Enum Reference (CHECK values)

```text
roles.status                          ACTIVE, INACTIVE
users.status                          PENDING, ACTIVE, INACTIVE, SUSPENDED, DELETED
assignments.status                    PUBLISHED, DRAFT, DELETED
assignment_students.status            ACTIVE, INACTIVE, DELETED
assignment_requirements.type          FEATURE, TECHNOLOGY, DATABASE, API, UI, SECURITY, TEST, DOCUMENTATION
assignment_structure_rules.type       FILE, DIRECTORY
assignment_student_repositories.status ACTIVE, INACTIVE, DELETED
submissions.status                    SUBMITTED, ANALYZING, ANALYZED, VERIFIED, REJECTED
analysis_runs.status                  PENDING, RUNNING, COMPLETED, FAILED
analysis_results.status               PASS, PARTIAL, FAIL, NOT_CHECKED
analysis_issues.status                OPEN, RESOLVED, IGNORED
analysis_issues.severity              LOW, MEDIUM, HIGH, CRITICAL
analysis_issues.category              STRUCTURE, REQUIREMENT, CODE, SECURITY, DEPENDENCY, DATABASE, API, TEST, UI
classes.status / subjects.status      ACTIVE, INACTIVE
class_subjects.status / class_students.status   ACTIVE, INACTIVE, DELETED
user_settings.theme_mode              LIGHT, DARK, SYSTEM
user_settings.language                EN, KH, KO
roles.name                            ADMIN, TEACHER, STUDENT
```
