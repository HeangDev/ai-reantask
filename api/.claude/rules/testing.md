---
paths:
  - "src/test/**"
---

# Backend Rules - Testing

Tests follow the feature-based architecture: each feature's tests live in the feature's own test package, features are tested through their **public API (service interfaces)**, and the architecture itself is tested by `ArchitectureTest`.

## 1. Test Layout

Test packages mirror `main`. Same feature names, same layer sub-packages.

```text
src/test/java/com/<org>/<app>/
├── common/                         tests for the shared kernel
│   ├── exception/                  GlobalExceptionHandlerTest
│   ├── converter/                  EncryptedStringConverterTest, RoleNameConverterTest
│   ├── validation/                 SafeRelativePathValidatorTest, ValidDateRangeValidatorTest, ...
│   ├── security/                   CurrentUserTest
│   ├── entity/                     AuditableEntity audit/soft-delete behavior (via @DataJpaTest)
│   └── support/                    shared test infrastructure (NO feature code)
│       ├── AbstractIntegrationTest, PostgresContainerConfig (singleton Testcontainers)
│       ├── TestClockConfig (fixed Clock)
│       └── WireMock / Awaitility helpers
│
├── <feature>/
│   ├── controller/                 <Resource>ControllerTest   (@WebMvcTest)
│   ├── service/impl/               <Resource>ServiceImplTest  (Mockito)
│   ├── repository/                 <Entity>RepositoryTest     (@DataJpaTest)
│   ├── mapper/                     <Resource>MapperTest
│   ├── event/                      listener/publisher tests (if the feature has events)
│   ├── client/ worker/ seeder/     tests for optional packages (if present)
│   └── testdata/                   <Feature>TestData builders (object mothers)
│
├── architecture/                   ArchitectureTest (ArchUnit)
└── integration/                    SchemaValidationIT and cross-feature flows
```

## 2. Pyramid and Tools

| Level              | Scope                                                                   | Tools                                                         |
|--------------------|-------------------------------------------------------------------------|---------------------------------------------------------------|
| Architecture       | Package/dependency rules, layering, naming                              | JUnit 5, ArchUnit                                             |
| Unit               | `service/impl`, mappers, validators, util, enums (state machines)       | JUnit 5, Mockito, AssertJ                                     |
| Slice              | Controllers (`@WebMvcTest`), repositories (`@DataJpaTest`)              | Spring Test, MockMvc, Testcontainers PostgreSQL               |
| Integration        | Full flow with real DB, incl. cross-feature flows and events            | `@SpringBootTest`, Testcontainers, WireMock for Git providers |
| Contract/Migration | Flyway applies cleanly to an empty DB; Hibernate `validate` passes      | Testcontainers                                                |

- Use PostgreSQL via Testcontainers everywhere a DB is needed. No H2 (JSONB, partial indexes, CHECK constraints behave differently).
- Use a single reusable container (`@ServiceConnection`, singleton in `common/support`) to keep tests fast.
- Fixed `Clock` bean in tests for deadline logic.
- Flyway runs the single shared history in every DB test. Never one schema per feature.

## 3. Architecture Tests (`architecture/ArchitectureTest`)

`ArchitectureTest` is the executable version of the architecture rules. A new feature or a changed dependency is not done until this test is updated (see architecture rule 2.2.8).

Must verify:

**Feature boundaries**
- Another feature never imports a feature's `repository`, `entity`, `mapper`, `controller` or `service.impl`.
- Allowed feature dependencies match the table exactly:

| Feature      | May depend on (besides `common` and itself)   |
|--------------|-----------------------------------------------|
| `user`       | nothing                                       |
| `auth`       | `user`                                        |
| `classroom`  | `user`                                        |
| `assignment` | `user`, `classroom`                           |
| `git`        | `user`, `assignment`                          |
| `submission` | `user`, `assignment`, `git`                   |
| `analysis`   | `user`, `assignment`, `git`, `submission`     |

- No cycles between features (`slices().matching("..<feature>..").should().beFreeOfCycles()`).
- `common` depends on no feature.
- No new top-level package other than `common` and the feature packages.
- Events go upward only: a feature's `event` listeners only listen to events of features it is allowed to depend on.
- No `@ManyToOne` / `@OneToMany` / `@OneToOne` / `@ManyToMany` to an entity of another feature (reference by `Long` id).

**Layers inside a feature**
- `controller` does not depend on `repository`, `entity` or `service.impl`.
- `service` (interfaces) exposes no entities, `HttpServletRequest` or `ResponseEntity`.
- `service.impl` does not use `HttpServletRequest` / `ResponseEntity`.
- `repository` does not depend on `service`, `controller` or `dto`.
- `entity` does not depend on `service`, `controller`, `repository`, `dto` or `mapper`; entities do not use Lombok `@Data`.
- `dto` does not contain entities; `mapper` does not depend on `repository` or `service`.
- `@Transactional` is used only in `service.impl`. Entities do not leave `service.impl` (no entity in `controller` or in public `service` signatures).
- Every `service` interface has an `impl`; other features depend on the interface only.

**Naming and packaging**
- Classes in `controller` end with `Controller`, in `service.impl` with `ServiceImpl`, in `repository` with `Repository`, in `mapper` with `Mapper`, in `event` with `Event` / `Listener`.
- Package names are lowercase.

**Documented exceptions**
- Read-only projection queries (architecture rule 2.2.7) are the only allowed cross-table reads. They live in the owning feature's `repository`, use native SQL/JPQL by table name, and are listed in that feature's rule file. `ArchitectureTest` must not need an exception for them (no foreign entity imports).

## 4. Conventions per Layer

**Service impl unit tests** (`<feature>/service/impl`)
- Mock the feature's own `repository` and `mapper`.
- Mock **other features only through their `service` interface** (e.g. `submission` tests mock `AssignmentService`, `StudentRepositoryService`, `GitRepositoryService`). Never mock another feature's repository or `service.impl`.
- Verify cross-feature calls by id: when a service receives a `classId` / `teacherId`, test the "referenced id not found" path (404) and the "referenced item not allowed" path (409/422).
- Assert published events with `ArgumentCaptor<ApplicationEventPublisher>` or a mock publisher.

**Controller slice tests** (`<feature>/controller`)
- `@WebMvcTest(<Controller>.class)` with the feature's `service` interfaces as `@MockitoBean`. No repositories or impls.
- `SecurityConfig` is owned by `auth`. Other features' controller tests import a shared test security setup (`@Import` of a test config in `common/support`) or use `@WithMockUser` / a custom `@WithCurrentUser` annotation so `@PreAuthorize` and `CurrentUser` work.
- Assert the `ApiResponse` / `ErrorResponse` shape and the `ErrorCode` returned by `GlobalExceptionHandler`.

**Repository slice tests** (`<feature>/repository`)
- `@DataJpaTest` + `@AutoConfigureTestDatabase(replace = NONE)` against Testcontainers PostgreSQL with Flyway.
- Test only the feature's own repositories, including soft-delete filters, partial unique indexes and read-only projection queries.
- `@ManyToOne` is tested only inside the same feature.

**Mapper tests** (`<feature>/mapper`)
- Pure unit tests, no Spring context unless the mapper needs it. No database, no services.

**Event tests**
- Publisher (`submission`): test with `@RecordApplicationEvents` that `SubmissionCreatedEvent` is published once per successful submit and not on failure.
- Listener (`analysis`): unit test the listener with a mocked worker. Test the full after-commit flow in an integration test **without** wrapping the test in a rolled-back transaction (`@TransactionalEventListener` fires only on commit). Use Awaitility for async.
- A lower feature must never have a listener for a higher feature's event (enforced in `ArchitectureTest`).

## 5. Test Data

- Each feature owns its builders in `<feature>/testdata` (`UserTestData.activeStudent()`, `ClassTestData.activeClass()`, `AssignmentTestData.published()`).
- A feature's builders may use only that feature's entities/DTOs plus ids of other features. Cross-feature setup in integration tests goes through service interfaces or the HTTP API, not other features' repositories.
- Builders in `common/support` must be feature-agnostic.
- No copy-pasted setup.

## 6. What Must Be Tested (by feature)

**common**
- `GlobalExceptionHandler` maps every `AppException` subtype and validation errors to the right `ErrorCode`/HTTP status.
- `EncryptedStringConverter` round-trips and never stores plain text; `RoleNameConverter` maps both ways.
- Validators `@SafeRelativePath`, `@ValidDateRange`, `@ValidTimezone` (valid, invalid, null, boundary).
- `AuditableEntity`: created/updated populated, soft delete hides rows.
- `CurrentUser` reads the SecurityContext only.

**user** (`user/`)
- Roles/users/settings CRUD; email/phone reserved after soft delete (409 on reuse).
- Approve/reject transitions; invalid transitions -> 409.
- Seeders are idempotent (run twice, no duplicates).

**auth** (`auth/`)
- Login allowed only for `ACTIVE` user with `ACTIVE` role; each other status returns the correct error code.
- Public register creates `student` + `PENDING`, ignores client role.
- JWT issue/validate/expire; Google sign-in verifier mocked at the boundary.
- Mass assignment (client sends `role`/`status`) ignored.

**classroom** (`classroom/`)
- Code generation unique; `end_date >= start_at`.
- Enroll/add subject blocked for `INACTIVE` class/subject; soft-deleted rows restored, not duplicated.
- Student ids and teacher ids are validated through `UserService`.

**assignment** (`assignment/`)
- Deadline > start; publish requires requirements + students; weights <= 100.
- Student sees only assigned + `PUBLISHED` + `ACTIVE`; teacher only own.
- Class and student references validated through `ClassService` / `ClassStudentService`.

**git** (`git/`)
- Tokens encrypted at rest (DB value != plain), never in responses/logs.
- Only one `ACTIVE` repository link per student per assignment (service + partial index).
- `git.client` tested with WireMock; services mock `GitProviderClient` (not Spring internals).

**submission** (`submission/`)
- Submit window (before start, after deadline, boundary instants), enrollment, active repo link.
- Calls `AssignmentService`, `StudentRepositoryService`, `GitRepositoryService` by interface only.
- Publishes `SubmissionCreatedEvent` after a successful submit.

**analysis** (`analysis/`)
- Run created `PENDING`; no second in-flight run (unique index).
- State machine transitions (all valid + invalid).
- `VERIFIED` blocked by open `CRITICAL` issue; `VERIFIED` is final.
- Score calculation (`PASS/PARTIAL/FAIL/NOT_CHECKED`, `IGNORED` issues excluded).
- `SubmissionCreatedListener` starts the worker; worker failure path -> `FAILED`, retry creates a new run.

**Security (every feature's controller)**
- Each endpoint: unauthenticated -> 401, wrong role -> 403, other user's record -> 404.
- Mass assignment (client sends `role`/`status`) ignored.

**Persistence / Integration (`integration/`)**
- `SchemaValidationIT`: Flyway applies from scratch to an empty DB and Hibernate `validate` passes.
- Cross-feature flows: for example, submit assignment end to end (`POST /api/v1/assignments/{id}/submissions` -> Submission saved -> event -> analysis run `PENDING`).
- Soft delete hides rows; audit columns populated.

## 7. General Conventions

- Name tests `shouldDoXWhenY()` or `methodName_condition_expected`. One behavior per test; Arrange-Act-Assert.
- Do not mock what you do not own beyond the boundary (mock `GitProviderClient`, not Spring internals). Do not mock what another feature owns below its `service` interface.
- No `Thread.sleep`; use Awaitility for async worker and event tests.
- Tests are independent and repeatable; clean DB per test (transaction rollback or truncate). Event-after-commit tests use truncate, not rollback.
- Coverage targets: services >= 80% lines, state machines and security paths 100% branches. `ArchitectureTest` must always pass. Coverage is a floor, not a goal.
- CI fails on test failure; flaky tests are fixed or quarantined with a ticket, not ignored.

## 8. Checklist for New Code

- New table -> migration + `SchemaValidationIT` still green + repository slice test + service impl test + controller test + mapper test, all in the owning feature's test package.
- New feature -> new `<feature>/...` test packages, a `testdata` package, and an entry in the dependency table and `ArchitectureTest`.
- New cross-feature call -> verify it respects the dependency table, add a service-impl test that mocks the other feature's `service` interface, and add an integration test if it is part of a user-facing flow.
- New event -> publisher test, listener test, and an after-commit integration test.