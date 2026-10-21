---
paths:
  - "src/test/**"
---

# Backend Rules - Testing

Tests follow the layer-based architecture (`architecture.md`): test packages mirror `main` by layer, business logic is tested through the **service interfaces**, and the architecture itself is tested by `ArchitectureTest`.

## 1. Test Layout

```text
src/test/java/com/reantask/api/
├── controller/                 <Resource>ControllerTest   (@WebMvcTest)
├── service/impl/               <Resource>ServiceImplTest  (Mockito)
├── repository/                 <Entity>RepositoryTest     (@DataJpaTest)
├── mapper/                     <Resource>MapperTest
├── config/                     SecurityPolicyTest (401/403 matrix), config wiring tests
├── security/                   JwtServiceTest, CurrentUserTest
├── exception/                  GlobalExceptionHandlerTest
├── converter/                  RoleNameConverterTest, EncryptedStringConverterTest
├── validation/                 ValidTimezoneValidatorTest, SafeRelativePathValidatorTest, ValidDateRangeValidatorTest
├── seeder/                     RoleSeederTest (idempotent)
├── event/ client/ worker/      tests for those packages once they exist
├── testdata/                   object-mother builders: UserTestData, AssignmentTestData, ...
├── support/                    AbstractIntegrationTest, PostgresContainerConfig (singleton Testcontainers), TestClockConfig, WireMock/Awaitility helpers
├── architecture/               ArchitectureTest (ArchUnit)
└── integration/                SchemaValidationIT and end-to-end flows
```

One test class per production class. Name the file after the class under test and put it in the same layer package.

## 2. Pyramid and Tools

| Level              | Scope                                                                   | Tools                                                         |
|--------------------|-------------------------------------------------------------------------|---------------------------------------------------------------|
| Architecture       | Package/dependency rules, layering, naming                              | JUnit 5, ArchUnit                                             |
| Unit               | `service/impl`, mappers, validators, util, enums (state machines)       | JUnit 5, Mockito, AssertJ                                     |
| Slice              | Controllers (`@WebMvcTest`), repositories (`@DataJpaTest`)              | Spring Test, MockMvc, Testcontainers PostgreSQL               |
| Integration        | Full flow with real DB, including events                                | `@SpringBootTest`, Testcontainers, WireMock for Git providers |
| Contract/Migration | Flyway applies cleanly to an empty DB; Hibernate `validate` passes      | Testcontainers                                                |

- Use PostgreSQL via Testcontainers everywhere a DB is needed. No H2 (JSONB, partial indexes, CHECK constraints behave differently).
- Use a single reusable container (`@ServiceConnection`, singleton in `support`) to keep tests fast.
- Fixed `Clock` bean in tests for deadline logic.
- Flyway runs the single shared history in every DB test.

## 3. Architecture Tests (`architecture/ArchitectureTest`)

`ArchitectureTest` is the executable version of `architecture.md` section 2. A new layer package or a changed dependency rule is not done until this test is updated.

Must verify:

- `controller` does not depend on `repository`, `entity` or `service.impl`.
- `service` (interfaces) exposes no entities, `HttpServletRequest` or `ResponseEntity`.
- `service.impl` does not use `HttpServletRequest` / `ResponseEntity`.
- `repository` does not depend on `service`, `controller` or `dto`.
- `entity` does not depend on `service`, `controller`, `repository`, `dto` or `mapper`; entities do not use Lombok `@Data`.
- `dto` contains no entities; `mapper` does not depend on `repository` or `service`.
- `exception`, `dto.common`, `entity.base`, `validation` do not depend on `service`, `repository` or `controller`.
- `@Transactional` is used only in `service.impl`. Entities do not leave `service.impl` (no entity in `controller` or in public `service` signatures).
- Every `service` interface has an `impl`; nothing injects an `impl` type directly.
- Naming: classes in `controller` end with `Controller`, in `service.impl` with `ServiceImpl`, in `repository` with `Repository`, in `mapper` with `Mapper`, in `event` with `Event` / `Listener`.
- No top-level package other than those listed in `architecture.md` section 1 (in particular no business-area packages such as `user` or `assignment`).
- Package names are lowercase.

## 4. Conventions per Layer

**Service impl unit tests** (`service/impl`)
- Mock the repositories, the mapper and any **other service interfaces** the class calls. Never mock another service's `impl` or reach into its repository.
- Cover every status transition (valid and invalid), every rejection path and every ownership check.
- Verify calls to other services by id: when a service receives a `classId` / `teacherId`, test the "referenced id not found" path (404) and the "not allowed" path (409/422).
- Assert published events with a mock `ApplicationEventPublisher` and `ArgumentCaptor`.
- Use `Clock.fixed(...)` for anything time based.

**Controller slice tests** (`controller`)
- `@WebMvcTest(<Controller>.class)` with the `service` interfaces as `@MockitoBean`. No repositories or impls.
- Pure controller tests use `@AutoConfigureMockMvc(addFilters = false)`. Authorization tests use `SecurityPolicyTest`-style setup: `@Import` of `SecurityConfig`, `SecurityErrorHandlers`, `JwtConfig`, `ClockConfig`, `JwtService`, `GlobalExceptionHandler` plus a throwaway `app.security.jwt.secret` (32+ chars), and `jwt()` / real tokens from `JwtService`.
- Assert the `ApiResponse` / `ErrorResponse` shape and the `ErrorCode` returned by `GlobalExceptionHandler`.

**Repository slice tests** (`repository`)
- `@DataJpaTest` + `@AutoConfigureTestDatabase(replace = NONE)` against Testcontainers PostgreSQL with Flyway.
- Test derived/`@Query` methods, soft-delete filters (`@SQLRestriction`), restore lookups (native, ignoring deleted rows), partial unique indexes and projections.

**Mapper tests** (`mapper`)
- Pure unit tests, no Spring context, no database, no services.

**Event tests**
- Publisher: `@RecordApplicationEvents` shows the event is published once per success and not on failure.
- Listener: unit test with a mocked worker. Test the full after-commit flow in an integration test **without** wrapping it in a rolled-back transaction (`@TransactionalEventListener` fires only on commit). Use Awaitility for async.

## 5. Test Data

- Builders live in `testdata/` (`UserTestData.activeStudent()`, `ClassTestData.activeClass()`, `AssignmentTestData.published()`).
- Builders in `support/` stay domain-agnostic.
- Integration tests set up data through service interfaces or the HTTP API, not by calling repositories of unrelated tables directly.
- No copy-pasted setup.

## 6. What Must Be Tested (by area)

**Shared infrastructure**
- `GlobalExceptionHandler` maps every `AppException` subtype and validation errors to the right `ErrorCode`/HTTP status.
- `EncryptedStringConverter` round-trips and never stores plain text; `RoleNameConverter` maps both ways.
- Validators `@SafeRelativePath`, `@ValidDateRange`, `@ValidTimezone` (valid, invalid, null, boundary).
- `AuditableEntity`: created/updated populated, soft delete hides rows.
- `CurrentUser` reads the SecurityContext only.

**Users and roles**
- Roles/users/settings CRUD; email/phone reserved after soft delete (409 on reuse).
- Approve/reject transitions; invalid transitions -> 409; teacher limited to PENDING students.
- Seeders are idempotent (run twice, no duplicates).

**Auth**
- Login allowed only for `ACTIVE` user with `ACTIVE` role; each other status returns the correct error code, only after the password matched.
- Unknown email and wrong password are indistinguishable.
- Public register creates `student` + `PENDING`, ignores client role/status.
- JWT issue/validate/expire/tamper; Google sign-in verifier mocked at the boundary.

**Classes**
- Code generation unique; `end_date >= start_at`.
- Enroll/add subject blocked for `INACTIVE` class/subject; soft-deleted rows restored, not duplicated.
- Student and teacher ids are validated (role, status).

**Assignments**
- Deadline > start; publish requires requirements + students; weights <= 100.
- Student sees only assigned + `PUBLISHED` + `ACTIVE`; teacher only own.

**Git / repositories**
- Tokens encrypted at rest (DB value != plain), never in responses/logs.
- Only one `ACTIVE` repository link per student per assignment (service + partial index).
- `client/` tested with WireMock; services mock `GitProviderClient` (not Spring internals).

**Submissions**
- Submit window (before start, after deadline, boundary instants), enrollment, active repo link.
- Publishes `SubmissionCreatedEvent` after a successful submit.

**Analysis**
- Run created `PENDING`; no second in-flight run (unique index).
- State machine transitions (all valid + invalid).
- `VERIFIED` blocked by open `CRITICAL` issue; `VERIFIED` is final.
- Score calculation (`PASS/PARTIAL/FAIL/NOT_CHECKED`, `IGNORED` issues excluded).
- Listener starts the worker; worker failure path -> `FAILED`, retry creates a new run.

**Security (every controller)**
- Each endpoint: unauthenticated -> 401, wrong role -> 403, other user's record -> 404.
- Mass assignment (client sends `role`/`status`) ignored.

**Persistence / Integration (`integration/`)**
- `SchemaValidationIT`: Flyway applies from scratch to an empty DB and Hibernate `validate` passes.
- End-to-end flows, for example submit assignment (`POST /api/v1/assignments/{id}/submissions` -> Submission saved -> event -> analysis run `PENDING`).
- Soft delete hides rows; audit columns populated.

## 7. General Conventions

- Name tests `methodName_condition_expected` or `shouldDoXWhenY()`. One behavior per test; Arrange-Act-Assert.
- Do not mock what you do not own beyond the boundary (mock `GitProviderClient`, not Spring internals).
- No `Thread.sleep`; use Awaitility for async worker and event tests.
- Tests are independent and repeatable; clean DB per test (transaction rollback or truncate). After-commit event tests use truncate, not rollback.
- Mockito strict stubs are on: remove unused stubbings instead of loosening them.
- Coverage targets: services >= 80% lines, state machines and security paths 100% branches. `ArchitectureTest` must always pass. Coverage is a floor, not a goal.
- CI fails on test failure; flaky tests are fixed or quarantined with a ticket, not ignored.

## 8. Checklist for New Code

- New table -> migration + `SchemaValidationIT` still green + repository test + service impl test + controller test + mapper test, each in its layer's test package.
- New layer package -> test package for it and an update to `ArchitectureTest` and `architecture.md`.
- New service-to-service call -> a service-impl test that mocks the other service's interface, and an integration test if it is part of a user-facing flow.
- New event -> publisher test, listener test, and an after-commit integration test.
