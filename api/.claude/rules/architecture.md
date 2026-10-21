# Architecture: Layer-Based (Package by Layer)

Code is grouped by technical **layer**. Each layer is one top-level package under the base package. A class goes in the package that matches what it *is* (controller, service, repository, ...), not which business area it belongs to.

Why: one familiar Spring layout, trivial to navigate, and the layering rules below are easy to enforce with `ArchitectureTest`.

## 1. Package Structure

```text
com.reantask.api
├── ApiApplication.java
├── controller/     REST controllers (HTTP only)
├── service/        service INTERFACES
│   └── impl/       implementations: business rules, ownership checks, @Transactional
├── repository/     Spring Data JPA repositories + Specifications (queries only)
├── entity/         JPA entities
│   └── base/       @MappedSuperclass: TimestampedEntity, AuditableEntity
├── enums/          status and type enums
├── dto/
│   ├── request/    request records
│   ├── response/   response records
│   └── common/     ApiResponse, PageResponse, ErrorResponse
├── mapper/         entity <-> DTO mappers
├── exception/      ErrorCode, AppException (+ subtypes), GlobalExceptionHandler
├── security/       CurrentUser, JwtService, SecurityErrorHandlers (JWT, filters, user details, Google verifier)
├── config/         SecurityConfig, JwtConfig, JwtProperties, ClockConfig, JpaAuditingConfig, PasswordEncoderConfig, CORS, OpenAPI, async
├── converter/      JPA AttributeConverters (EncryptedStringConverter)
├── validation/     custom Bean Validation constraints and validators (@SafeRelativePath, @ValidDateRange)
├── seeder/         idempotent seeders (RoleSeeder)
├── client/         Git provider clients (GitHub, GitLab)            (create when needed)
├── worker/         async analysis worker                             (create when needed)
├── event/          application events + listeners                    (create when needed)
└── util/           small stateless helpers                           (create when needed)
```

Create a package only when it has a class to hold. Do not add other top-level packages and **never create per-feature packages** (`user/`, `assignment/`, ...). Package names are lowercase, singular nouns (`enums` is the one exception: `enum` is a Java keyword).

Resources and tests:

```text
src/main/resources/
├── application.yaml (+ application-dev.yaml, application-prod.yaml)
└── db/migration/               V1__..., V2__... (Flyway, one global ordered history)

src/test/java/com/reantask/api/  mirrors main by layer
├── controller/                 <Resource>ControllerTest        (@WebMvcTest)
├── service/impl/               <Resource>ServiceImplTest       (Mockito)
├── repository/                 <Entity>RepositoryTest          (@DataJpaTest, Testcontainers)
├── mapper/                     <Resource>MapperTest
├── config/                     security policy tests (SecurityPolicyTest)
├── exception/                  GlobalExceptionHandlerTest
├── converter/ validation/ ...  one test package per layer that has logic
├── testdata/                   object-mother builders (UserTestData, ...)
├── support/                    AbstractIntegrationTest, PostgresContainerConfig, TestClockConfig
├── architecture/               ArchitectureTest (ArchUnit)
└── integration/                SchemaValidationIT and end-to-end flows
```

## 2. Dependency Rules

```text
controller  ->  service (interface)  ->  service/impl  ->  repository  ->  entity
                     dto  <-  mapper  ->  entity
```

Arrows mean "may depend on". Dependencies never point upward.

| Layer                 | Does                                                              | Must NOT                                                                 |
|-----------------------|-------------------------------------------------------------------|--------------------------------------------------------------------------|
| `controller`          | Map HTTP <-> DTO, `@Valid`, return `ApiResponse` | Business logic, use repositories, entities or `service.impl`             |
| `service` (interface) | Define operations with DTOs and ids, Javadoc the contract         | Expose entities or HTTP types                                            |
| `service.impl`        | Business rules, transitions, ownership checks, `@Transactional`   | Use `HttpServletRequest`, `ResponseEntity`; depend on `controller`       |
| `repository`          | Queries only                                                      | Business logic; depend on `service`, `controller`, `dto`                 |
| `entity`              | Map tables, simple invariants                                     | Depend on `service`, `controller`, `repository`, `dto`, `mapper`; `@Data` |
| `dto`                 | Immutable records + validation annotations                        | Contain entities                                                         |
| `mapper`              | Entity <-> DTO                                                    | Hit the database, call services                                          |
| `exception`           | Error codes, exception types, global handler                      | Depend on `service`, `repository`, `controller`                          |
| `security`, `config`  | Wiring and cross-cutting infrastructure                           | Contain business rules                                                   |

Rules:

1. Controllers inject **service interfaces only**.
2. **Entities never leave `service/impl`.** Public service methods and controllers use DTOs.
3. `@Transactional` only in `service/impl`.
4. Services may call other services **through their interface** (e.g. `AuthServiceImpl` calls `UserAccountService`). A service never injects another service's repository.
5. A service that must not be reachable from controllers (internal contract, such as `UserAccountService`, which returns password hashes) is documented as internal in its Javadoc and is never injected into a controller. Its DTO overrides `toString` to hide secrets.
6. Relations between entities use `@ManyToOne(fetch = LAZY)`; audit columns (`created_by_user`, ...) are plain `Long`.
7. `exception`, `dto/common`, `entity/base`, `converter`, `validation` and `util` depend on no business layer (`service`, `repository`, `controller`). Exception: `converter` may depend on `enums`.
8. Security wiring (`SecurityConfig`, `JwtConfig`, `JwtService`, Google verifier) lives in `config` and `security`. Role rules live in `SecurityConfig` (URL matchers); controllers only use `CurrentUser`.
9. Events (`event/`): a service publishes, a listener reacts after commit. A listener never calls a controller.
10. Heavy list/report screens may use a read-only projection query in `repository`. Record such exceptions in `database-conventions.md`.

## 3. Naming Conventions

| Item         | Pattern                                           | Example                                      |
|--------------|---------------------------------------------------|----------------------------------------------|
| Controller   | `<Resource>Controller`                            | `SubjectController`                          |
| Service      | `<Resource>Service` / `<Resource>ServiceImpl`     | `SubmissionService`, `SubmissionServiceImpl` |
| Repository   | `<Entity>Repository`                              | `UserRepository`                             |
| Entity       | singular PascalCase of the table                  | `ClassSubject` (`class_subjects`)            |
| Request DTO  | `<Verb><Resource>Request`                         | `CreateAssignmentRequest`                    |
| Response DTO | `<Resource>Response` / `<Resource>DetailResponse` | `UserResponse`                               |
| Mapper       | `<Resource>Mapper`                                | `UserMapper`                                 |
| Enum         | `<Resource><Field>`                               | `UserStatus`, `IssueSeverity`                |
| Config       | `<Thing>Config`                                   | `SecurityConfig`, `ClockConfig`              |
| Event        | past tense                                        | `SubmissionCreatedEvent`                     |
| Test         | `<Class>Test` / `<Class>IT`                       | `UserServiceImplTest`                        |

Because all classes share one package per layer, names must be unique across the whole app: prefix with the resource (`UserSettingService`, not `SettingService`).

Name clashes with Java/Spring: table `classes` -> entity `ClassRoom`; table `repositories` -> `GitRepository`; table `assignment_repositories` -> `AssignmentRepositoryLink`; table `assignment_student_repositories` -> `AssignmentStudentRepositoryLink`.

## 4. Table -> Class Map

| Table                           | Entity                            | Service (interface)            | Controller                              |
|---------------------------------|-----------------------------------|--------------------------------|-----------------------------------------|
| roles                           | `Role`                            | `RoleService`                  | `RoleController`                        |
| users                           | `User`                            | `UserService`, `UserAccountService` (internal, for auth) | `UserController`          |
| user_settings                   | `UserSetting`                     | `UserSettingService`           | `UserController` (`/users/me/settings`) |
| (auth, no table)                |                                   | `AuthService` (+ `JwtService` in `security`) | `AuthController`          |
| classes                         | `ClassRoom`                       | `ClassService`                 | `ClassController`                       |
| subjects                        | `Subject`                         | `SubjectService`               | `SubjectController`                     |
| class_subjects                  | `ClassSubject`                    | `ClassSubjectService`          | `ClassController`                       |
| class_students                  | `ClassStudent`                    | `ClassStudentService`          | `ClassController`                       |
| assignments                     | `Assignment`                      | `AssignmentService`            | `AssignmentController`                  |
| assignment_students             | `AssignmentStudent`               | `AssignmentStudentService`     | `AssignmentController`                  |
| assignment_requirements         | `AssignmentRequirement`           | `AssignmentRequirementService` | `AssignmentController`                  |
| assignment_structures           | `AssignmentStructure`             | `AssignmentStructureService`   | `AssignmentController`                  |
| assignment_structure_rules      | `AssignmentStructureRule`         | `AssignmentStructureService`   | `AssignmentController`                  |
| git_connections                 | `GitConnection`                   | `GitConnectionService`         | `GitController`                         |
| repositories                    | `GitRepository`                   | `GitRepositoryService`         | `GitController`                         |
| assignment_repositories         | `AssignmentRepositoryLink`        | `AssignmentRepositoryService`  | `GitController`                         |
| assignment_student_repositories | `AssignmentStudentRepositoryLink` | `StudentRepositoryService`     | `GitController`                         |
| submissions                     | `Submission`                      | `SubmissionService`            | `SubmissionController`                  |
| analysis_runs                   | `AnalysisRun`                     | `AnalysisService`              | `AnalysisController`                    |
| analysis_results                | `AnalysisResult`                  | `AnalysisService`              | `AnalysisController`                    |
| analysis_issues                 | `AnalysisIssue`                   | `AnalysisIssueService`         | `AnalysisController`                    |

Repositories follow `<Entity>Repository`; mappers are one per resource group (`UserMapper`, `AssignmentMapper`, ...).

## 5. Request Flow Example (Submit Assignment)

```text
POST /api/v1/assignments/{id}/submissions
 -> controller.SubmissionController.submit()
 -> service.SubmissionService                       (interface)
 -> service.impl.SubmissionServiceImpl              @Transactional
      calls by interface only:
        AssignmentService          -> published? window? student assigned + ACTIVE?
        StudentRepositoryService   -> active repository link
        GitRepositoryService       -> resolve commit sha (client/ behind it)
      saves Submission(SUBMITTED) via repository.SubmissionRepository, publishes SubmissionCreatedEvent
 <- ApiResponse<SubmissionResponse> 201

After commit: event.SubmissionCreatedListener -> worker.AnalysisWorker (@Async)
```

## 6. Coding Rules for This Architecture

- Put a class in the package of its layer. Do not create a package per business area.
- Every service has an interface + `impl`. Inject the interface, never the impl.
- Controllers stay thin and never touch repositories or entities.
- New table = migration + entity + repository + service (interface + impl) + request/response DTOs + mapper + controller + tests, each in its layer package.
- When one layer package grows past ~30 classes, group by sub-package **inside that layer only** (e.g. `service/impl/assignment/`) and update `ArchitectureTest`. Do not introduce top-level feature packages.
- Cross-cutting infrastructure belongs in `config`, `security`, `exception` or `util`, never in a service.
- Flyway migrations are one global ordered history.

## 7. Enforcing It (`ArchitectureTest`)

`ArchitectureTest` (ArchUnit) is the executable version of section 2. It must verify:

- `controller` does not depend on `repository`, `entity` or `service.impl`.
- `service` interfaces expose no entities, `HttpServletRequest` or `ResponseEntity`.
- `service.impl` does not use `HttpServletRequest` / `ResponseEntity`; nothing depends on `service.impl` except Spring wiring and tests.
- `repository` does not depend on `service`, `controller` or `dto`.
- `entity` does not depend on `service`, `controller`, `repository`, `dto` or `mapper`, and does not use Lombok `@Data`.
- `dto` contains no entities; `mapper` does not depend on `repository` or `service`.
- `@Transactional` appears only in `service.impl`.
- Naming: `controller` -> `*Controller`, `service.impl` -> `*ServiceImpl`, `repository` -> `*Repository`, `mapper` -> `*Mapper`, `event` -> `*Event` / `*Listener`.
- Every `service` interface has exactly one `impl`.
- No top-level package other than the ones in section 1, and no package named after a business area.
- No dependency cycles between top-level layer packages other than the allowed direction in section 2.
