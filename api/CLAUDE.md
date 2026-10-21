# CLAUDE.md

Project rules for Claude Code. Follow these on every task in this repository.

## 1. Project Overview

A classroom code-assignment platform. Teachers create assignments with requirements and expected file structures, students submit a Git commit, and the system analyzes the repository and produces scores and issues. Teachers review and verify results.

- **Backend:** Spring Boot REST API (Java 21, Maven or Gradle: follow what the repo already uses)
- **Database:** PostgreSQL 15+
- **Roles:** `admin`, `teacher`, `student`
- **Default timezone:** `Asia/Phnom_Penh` (store everything in UTC, convert only at the edge)

## Rule Files

All rules live in `.claude/rules/`. Read the matching file before touching a module.

**Architecture and general**

@.claude/rules/architecture.md
@.claude/rules/general-rules.md

**Database**

@.claude/rules/database-schema.md
@.claude/rules/relationships.md
@.claude/rules/database-conventions.md

**Backend**

@.claude/rules/api-design.md
@.claude/rules/security-and-permissions.md
@.claude/rules/exception-and-error-codes.md
@.claude/rules/validation-dto-mapping.md
@.claude/rules/jpa-and-transactions.md
@.claude/rules/testing.md
@.claude/rules/code-style.md

Database migrations live in `src/main/resources/db/migration` (one global Flyway history, see `database-conventions.md`).

## 2. Tech Stack

| Concern          | Choice                                                               |
|------------------|----------------------------------------------------------------------|
| Framework        | Spring Boot 3.x, Spring Web, Spring Data JPA (Hibernate 6)           |
| Security         | Spring Security, JWT access + refresh tokens, Google OAuth2 sign-in  |
| Validation       | Jakarta Bean Validation (`@Valid`)                                   |
| Migrations       | Flyway (`src/main/resources/db/migration`)                           |
| Mapping          | MapStruct for entity <-> DTO                                         |
| Boilerplate      | Lombok (no `@Data` on entities)                                      |
| API docs         | springdoc-openapi                                                    |
| Testing          | JUnit 5, Mockito, Testcontainers (PostgreSQL)                        |

## 3. Architecture: Layer-Based (Package by Layer)

Classes are grouped by technical layer, not by feature. Full rules, dependency directions, naming and the table-to-class map are in `.claude/rules/architecture.md`.

```text
com.<org>.<app>
├── controller/    REST controllers (HTTP only)
├── service/       service interfaces
│   └── impl/      business rules, @Transactional
├── repository/    Spring Data JPA repositories
├── entity/        JPA entities (+ entity/base/AuditableEntity)
├── enums/         status and type enums
├── dto/           request/, response/, common/
├── mapper/        entity <-> DTO mappers (MapStruct once added)
├── exception/     ErrorCode, custom exceptions + GlobalExceptionHandler
├── security/      CurrentUser, JwtService, error handlers, Google verifier
├── config/        Security, Jwt, JPA auditing, async, CORS, OpenAPI, Clock
├── client/        Git provider clients (GitHub, GitLab)
├── worker/        async analysis worker
├── event/         application events + listeners
├── converter/     JPA AttributeConverters (role name, encrypted tokens)
├── validation/    custom Bean Validation constraints
├── seeder/        RoleSeeder and other seeders
└── util/          small stateless helpers
```

Base package: `com.reantask.api`. Never create per-feature packages.

Dependency direction: `controller -> service -> repository -> entity`. Never upward. Controllers use service interfaces only. Entities never leave the service layer.

## 4. PostgreSQL Rules (the source schema was written for MySQL)

Translate MySQL types to PostgreSQL. Never write MySQL-only syntax.

| Schema type             | PostgreSQL / JPA                                                               |
|-------------------------|--------------------------------------------------------------------------------|
| `BIGINT AUTO_INCREMENT` | `BIGINT GENERATED ALWAYS AS IDENTITY` + `@GeneratedValue(strategy = IDENTITY)` |
| `LONGTEXT`              | `TEXT`                                                                         |
| `JSON`                  | `JSONB` + `@JdbcTypeCode(SqlTypes.JSON)`                                       |
| `TIMESTAMP`             | `TIMESTAMPTZ` + `Instant` (or `OffsetDateTime`)                                |
| `DATE`                  | `DATE` + `LocalDate`                                                           |
| `DECIMAL(5,2)`          | `NUMERIC(5,2)` + `BigDecimal`                                                  |
| `BOOLEAN`               | `BOOLEAN` + `boolean`/`Boolean`                                                |
| `CHAR(6)`               | `CHAR(6)`                                                                      |
| `ENUM`                  | `VARCHAR(30)` + `CHECK` constraint + `@Enumerated(EnumType.STRING)`            |

Conventions:

- Table and column names: `snake_case`, plural table names (match the schema exactly).
- Use `VARCHAR + CHECK` for enums, not native PG enum types, so migrations stay simple.
- Index every foreign key column. Add composite indexes for frequent filters (e.g. `(assignment_id, student_id)`, `(status, deleted_at)`).
- Never use `ddl-auto=update` or `create`. Set `spring.jpa.hibernate.ddl-auto=validate`.
- Every schema change is a new Flyway file: `V{n}__{description}.sql`. Never edit an applied migration.
- Use `timestamptz` and set `hibernate.jdbc.time_zone=UTC`.
- Foreign keys: audit columns use `ON DELETE SET NULL`. `users.role_id` uses `ON DELETE RESTRICT`.
- Add unique constraints noted in the schema: `(class_id, subject_id)` on `class_subjects`, `(class_id, student_id)` on `class_students`. Also add `(assignment_id, student_id)` on `assignment_students` and `(user_id)` on `user_settings`.

## 5. Common Columns and Soft Delete

Most tables share audit and soft-delete columns:

```text
created_at, created_by_user, updated_at, updated_by_user, deleted_at, deleted_by_user
```

- Create `@MappedSuperclass AuditableEntity` with these fields. Use Spring Data JPA auditing (`@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, `@LastModifiedBy`).
- Soft delete means setting `deleted_at` + `deleted_by_user` and the status to `DELETED` where the table has a status. Never hard delete these tables.
- Hide deleted rows with `@SQLRestriction("deleted_at IS NULL")` on entities. Provide explicit repository queries when a deleted row must be found (for restore).
- **Restore, don't insert:** when re-adding something that was soft-deleted (`class_subjects`, `class_students`, `assignment_students`, `assignment_student_repositories`), find the deleted row, clear `deleted_at`/`deleted_by_user`, and set status `ACTIVE`. Inserting a duplicate violates the unique key.
- Tables without audit/soft-delete columns: `roles`, `analysis_runs`, `analysis_results`, `analysis_issues`, `user_settings` (they only have `created_at`/`updated_at`).
- `created_by_user` is `NULL` for public self-registration and seeded accounts.

## 6. Entities, Enums, and Status Rules

Create one Java enum per status/type. Store as strings.

```text
RoleName:            ADMIN, TEACHER, STUDENT   (DB values are lowercase: admin, teacher, student)
RoleStatus:          ACTIVE, INACTIVE
UserStatus:          PENDING, ACTIVE, INACTIVE, SUSPENDED, DELETED
AssignmentStatus:    PUBLISHED, DRAFT, DELETED
AssignmentStudentStatus / AssignmentStudentRepositoryStatus / ClassSubjectStatus / ClassStudentStatus: ACTIVE, INACTIVE, DELETED
ClassStatus / SubjectStatus: ACTIVE, INACTIVE
RequirementType:     FEATURE, TECHNOLOGY, DATABASE, API, UI, SECURITY, TEST, DOCUMENTATION
StructureRuleType:   FILE, DIRECTORY
SubmissionStatus:    SUBMITTED, ANALYZING, ANALYZED, VERIFIED, REJECTED
AnalysisRunStatus:   PENDING, RUNNING, COMPLETED, FAILED
AnalysisResultStatus: PASS, PARTIAL, FAIL, NOT_CHECKED
IssueStatus:         OPEN, RESOLVED, IGNORED
IssueSeverity:       LOW, MEDIUM, HIGH, CRITICAL
IssueCategory:       STRUCTURE, REQUIREMENT, CODE, SECURITY, DEPENDENCY, DATABASE, API, TEST, UI
ThemeMode:           LIGHT, DARK, SYSTEM
Language:            EN, KH, KO
```

Roles are lowercase in the DB. Use a JPA `AttributeConverter` (or `@Column` mapping) so `RoleName.ADMIN` <-> `"admin"`. `roles` is seeded by `RoleSeeder` (idempotent, runs on startup).

### Users

- Login allowed only when `status = ACTIVE`, the role is `ACTIVE`, and `deleted_at IS NULL`.
- `PENDING`: public student registration. Cannot log in. Approve -> `ACTIVE`, reject -> `DELETED`. Only admin or teacher can approve.
- `INACTIVE`: cannot log in, history kept, admin can reactivate.
- `SUSPENDED`: cannot log in, keep all data. Admin restores to `ACTIVE` or sets `DELETED`.
- `DELETED`: soft delete. Email and phone stay reserved (unique indexes include deleted rows, do not make them partial).
- Public self-registration always creates role `student` with status `PENDING`. Ignore any role sent by the client.
- Password sign-up requires `phone`. Google sign-in may leave `phone` NULL and sets `google_id`.
- Block admins from assigning an `INACTIVE` role to a user.
- Hash passwords with BCrypt. Never store plain text.

### Assignments

- `DRAFT`: invisible to students, no submissions. Publish -> `PUBLISHED`.
- `PUBLISHED`: visible to assigned students, submissions allowed only when `start_at <= now <= deadline_at`.
- `DELETED`: hidden, but keep submissions and analysis results.
- Validate `deadline_at > start_at`.
- Creating an assignment requires an `ACTIVE` `class_subjects` row owned by that teacher, and an `ACTIVE` class.
- Requirement `weight` is `NUMERIC(5,2)`. Validate that the sum of required requirement weights per assignment does not exceed 100.

### Classes, Subjects, Enrollment

- `classes.code` is a unique 6-character code. Generate it server-side, retry on collision.
- `INACTIVE` class: no new assignments or enrollments. `end_date` must be on or after `start_at`.
- `INACTIVE` subject cannot be added to new classes. Existing rows stay.
- `INACTIVE` class_subject: teacher cannot create new assignments, old ones are kept.
- `INACTIVE` class_student: cannot see new work, history kept.

> Note: `classes` has `start_at` and `end_date` (inconsistent naming in the source schema). Keep the DB names as given unless the team agrees to rename in a migration.

### Git Connections and Repositories

- `access_token` and `refresh_token` must be encrypted at rest (AES-GCM via a JPA `AttributeConverter`, key from environment). Never log them.
- Handle token expiry with `token_expires_at` and refresh before calling the provider.
- `assignment_repositories.type` defaults to `TEMPLATE`, `branch` defaults to `main`.
- `assignment_student_repositories`: only one `ACTIVE` link per `(assignment_id, student_id)`. Replacing one sets the old row to `INACTIVE`.

### Submissions and Analysis (state machine)

```text
Submission:  SUBMITTED -> ANALYZING -> ANALYZED -> VERIFIED
                  \________________________________-> REJECTED
AnalysisRun: PENDING -> RUNNING -> COMPLETED | FAILED
```

- Student submits only if: assignment `PUBLISHED`, within `start_at`/`deadline_at`, student has `ACTIVE` `assignment_students` row, and uses their `ACTIVE` repository link. Otherwise reject with a clear error.
- On `SUBMITTED`, create an `analysis_runs` row (`PENDING`). Run analysis asynchronously (`@Async` or a queue worker), never in the request thread.
- `RUNNING`: set `started_at`, set submission `ANALYZING`. Do not start another run for the same submission while one is `PENDING` or `RUNNING`.
- `COMPLETED`: set `completed_at`, `overall_score`, `summary`, and the submission to `ANALYZED`.
- `FAILED`: store the error in `summary`. Retry means creating a **new** run.
- `VERIFIED` is final. Only a teacher/admin can set it, and not while any `OPEN` issue has severity `CRITICAL`. It is the official grade.
- `REJECTED`: wrong repository, invalid commit, or late submission. The student may resubmit if the assignment allows it.
- Result scoring: `PASS` = full weight, `PARTIAL` = partial score with explanation, `FAIL` = 0 or very low. `NOT_CHECKED` is excluded from the score or reviewed manually.
- `IGNORED` issues are kept for history but never count against the score.
- `RESOLVED` issues must set `resolved_at` and `resolved_by_user`.
- `analysis_results.evidence` is JSONB.

## 7. API Conventions

- Base path: `/api/v1`. Resource names are plural, kebab-case (`/api/v1/class-subjects`).
- Use proper verbs and status codes: `201` on create, `204` on delete, `400` validation, `401` unauthenticated, `403` forbidden, `404` missing, `409` conflict.
- Success wrapper (keep consistent across all endpoints):

```json
{ "success": true, "message": "OK", "data": {}, "timestamp": "2026-01-01T00:00:00Z" }
```

- Error wrapper: `{ "success": false, "code": "SUBMISSION_DEADLINE_PASSED", "message": "...", "errors": [] }`.
- Handle all errors in one `@RestControllerAdvice`. Use custom exceptions (`NotFoundException`, `ConflictException`, `BusinessRuleException`, `ForbiddenException`).
- Paginate every list endpoint (`page`, `size`, `sort`). Cap `size` at 100.
- Return timestamps as ISO-8601 UTC. Return enums as strings.
- Soft-deleted rows never appear in list or detail responses.

## 8. Security and Authorization

- Stateless JWT. Short-lived access token, rotating refresh token.
- Use `@PreAuthorize` with roles `ADMIN`, `TEACHER`, `STUDENT`.
- Ownership checks live in services, not only in annotations:
    - Teachers only manage assignments for subjects they teach (`class_subjects.teacher_id`).
    - Students only see assignments assigned to them (`assignment_students`) in classes where they are `ACTIVE`.
    - Students only see their own submissions, results and issues.
- Admin: manage users, roles, classes, subjects, class_subjects, enrollment.
- Teacher: approve `PENDING` students, manage own assignments, verify/reject submissions, mark issues `IGNORED`.
- Student: view assigned work, link a repository, submit, view results.
- Validate all input. Use parameterized queries only (JPA/JPQL, never string-concatenated SQL).
- CORS: explicit allowed origins from config. Rate limit login and registration.
- Secrets (JWT key, Google client secret, token encryption key, DB password) come from environment variables. Never commit them.

## 9. Coding Standards

- Java 21. Constructor injection only (`@RequiredArgsConstructor`), no field `@Autowired`.
- Entities: no `@Data`. Implement `equals`/`hashCode` on id only. Use `LAZY` fetching everywhere. Fix N+1 with `@EntityGraph` or fetch-join queries.
- Do not put business logic in entities or controllers.
- Use `Optional` and throw `NotFoundException`, never return null from services.
- Use `Instant` for timestamps. Inject a `Clock` so time-based rules (deadlines) are testable.
- Request DTOs are Java `record`s with validation annotations. Response DTOs never contain sensitive fields.
- Log with SLF4J. No `System.out`. Never log passwords, tokens or full request bodies.
- Keep methods small, name things after the domain (`submission`, `analysisRun`, `classSubject`).

## 10. Testing

- Unit tests for services (Mockito) covering every status transition and rejection path.
- Integration tests with Testcontainers PostgreSQL. Do not use H2.
- Cover at minimum: login blocked per user status, submission window checks, soft-delete restore, one-active-repository rule, `VERIFIED` blocked by `CRITICAL` open issues, authorization per role.
- Run migrations in tests with Flyway so the schema matches production.

## 11. Commands

```bash
./mvnw spring-boot:run              # run the API
./mvnw test                         # unit + integration tests
./mvnw flyway:migrate               # apply migrations (if plugin configured)
docker compose up -d postgres       # local PostgreSQL
```

(Replace with `./gradlew` equivalents if the project uses Gradle.)

## 12. Working Agreement for Claude

- Before writing code, check this file and the existing package for conventions. Match them.
- When the schema is unclear or inconsistent, say so and propose a fix instead of guessing silently.
- Any DB change = new Flyway migration + entity update + tests.
- Do not add dependencies without saying why.
- Do not change status-transition rules in section 6 without explicit instruction.
- Prefer small, reviewable changes. Explain trade-offs briefly after each task.