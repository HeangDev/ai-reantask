# Architecture: Feature-Based (Package by Feature)

Code is grouped by business **feature**. Each feature is a package that owns everything it needs: its API, business rules, persistence and tests. Inside a feature, classes are split into layer sub-packages. A small `common` package holds shared infrastructure.

Why: a feature's code lives together, features have explicit boundaries, and a change usually touches one package.

## 1. Package Structure

```text
com.<org>.<app>
├── <App>Application.java
│
├── common/                         shared kernel (depends on NO feature)
│   ├── config/                     ClockConfig, JpaAuditingConfig, OpenApiConfig
│   ├── entity/                     AuditableEntity (created/updated/deleted columns)
│   ├── exception/                  ErrorCode, AppException (+ NotFound/Conflict/BusinessRule/BadRequest), GlobalExceptionHandler
│   ├── response/                   ApiResponse, PageResponse, ErrorResponse
│   ├── security/                   CurrentUser (reads the SecurityContext only)
│   ├── converter/                  EncryptedStringConverter, RoleNameConverter
│   ├── validation/                 @SafeRelativePath, @ValidDateRange, @ValidTimezone
│   └── util/                       small stateless helpers
│
├── user/                           roles, users, user_settings
├── auth/                           login, register, Google sign-in, JWT, SecurityConfig
├── classroom/                      classes, subjects, class_subjects, class_students
├── assignment/                     assignments, assignment_students, requirements, structures, structure rules
├── git/                            git_connections, repositories, assignment_repositories,
│                                   assignment_student_repositories
├── submission/                     submissions
└── analysis/                       analysis_runs, analysis_results, analysis_issues, worker
```

Inside EVERY feature package (create only the sub-packages you need):

```text
<feature>/
├── controller/     REST controllers (HTTP only)
├── service/        service INTERFACES = the feature's public API
│   └── impl/       implementations (business rules, @Transactional)
├── repository/     Spring Data JPA repositories
├── entity/         JPA entities
├── enums/          status/type enums
├── dto/
│   ├── request/    request records
│   └── response/   response records
├── mapper/         MapStruct mappers
├── event/          events + listeners (optional)
├── client/         external API clients (optional, e.g. git/client)
├── worker/         async workers (optional, e.g. analysis/worker)
├── seeder/         idempotent seeders (optional, e.g. user/seeder)
└── config/ security/   feature-owned configuration (optional, e.g. auth/config, auth/security)
```

Example (`classroom`):

```text
classroom/
├── controller/  ClassController, SubjectController
├── service/     ClassService, SubjectService, ClassSubjectService, ClassStudentService
│   └── impl/    ClassServiceImpl, ...
├── repository/  ClassRoomRepository, SubjectRepository, ClassSubjectRepository, ClassStudentRepository
├── entity/      ClassRoom, Subject, ClassSubject, ClassStudent
├── enums/       ClassStatus, SubjectStatus, ClassSubjectStatus, ClassStudentStatus
├── dto/request|response/
└── mapper/      ClassMapper, SubjectMapper
```

Resources and tests:

```text
src/main/resources/
├── application.yml, application-dev.yml, application-prod.yml
└── db/migration/               V1__init_schema.sql, V2__... (Flyway, one shared history, NOT per feature)

src/test/java/com/<org>/<app>/  mirrors main: <feature>/controller, <feature>/service/impl, <feature>/repository
├── architecture/               ArchitectureTest
└── integration/                SchemaValidationIT and cross-feature flows
```

## 2. Dependency Rules

### 2.1 Inside a feature (layers)

```text
controller  ->  service (interface)  ->  service/impl  ->  repository  ->  entity
                      dto  <-  mapper  ->  entity
```

| Layer                 | Does                                                              | Must NOT                                                        |
|-----------------------|-------------------------------------------------------------------|-----------------------------------------------------------------|
| `controller`          | Map HTTP <-> DTO, `@Valid`, `@PreAuthorize`, return `ApiResponse` | Business logic, repositories, entities, `service.impl`          |
| `service` (interface) | Define operations with DTOs/ids                                   | Expose entities or HTTP types                                   |
| `service.impl`        | Business rules, transitions, ownership checks, `@Transactional`   | `HttpServletRequest`, `ResponseEntity`                          |
| `repository`          | Queries only                                                      | Business logic, depend on service/controller/dto                |
| `entity`              | Map tables, simple invariants                                     | Depend on service/controller/repository/dto/mapper, use `@Data` |
| `dto`                 | Data records + validation                                         | Contain entities                                                |
| `mapper`              | Entity <-> DTO                                                    | Hit the database, call services                                 |

`@Transactional` only in `service/impl`. Entities never leave `service/impl`.

### 2.2 Between features (boundaries)

1. **Public API of a feature = its `service` interfaces**, plus the `dto.response`/`dto.request` records and `enums` that appear in those signatures. Nothing else is visible to other features.
2. Another feature must NEVER import this feature's `repository`, `entity`, `mapper`, `controller` or `service.impl`.
3. **Reference other features by id.** No `@ManyToOne`/`@OneToMany` across features. Store `Long classId`, `Long teacherId`, etc. (like the audit columns already do). `@ManyToOne` is allowed only inside the same feature.
4. Features may depend only in this direction (arrow = "may call"). No cycles.

```text
common  <-  user  <-  auth
                 <-  classroom  <-  assignment  <-  git  <-  submission  <-  analysis
```

| Feature      | May depend on (besides `common` and itself)   |
|--------------|-----------------------------------------------|
| `user`       | nothing                                       |
| `auth`       | `user`                                        |
| `classroom`  | `user`                                        |
| `assignment` | `user`, `classroom`                           |
| `git`        | `user`, `assignment`                          |
| `submission` | `user`, `assignment`, `git`                   |
| `analysis`   | `user`, `assignment`, `git`, `submission`     |

5. **Events go upward only.** A feature publishes an event (`<feature>/event`) and any feature that is allowed to depend on it may listen. Example: `submission` publishes `SubmissionCreatedEvent`, `analysis` listens. A lower feature never listens to a higher one's events.
6. `common` depends on no feature. Features never put feature-specific code in `common`.
7. Cross-feature reads: call the other feature's service. For heavy list/report screens, a read-only projection query (native SQL/JPQL by table name, no foreign entity imports) may live in the feature that owns the use case. Record such exceptions in the feature's rule file.
8. A new feature needs an entry in the dependency table above and in `ArchitectureTest`.

### 2.3 Shared infrastructure

- `ErrorCode` is one central enum in `common/exception` (single catalogue).
- `AuditableEntity`, `ApiResponse`, `PageResponse`, `CurrentUser`, `Clock` come from `common`.
- Security wiring (`SecurityConfig`, JWT filter, `JwtService`, Google verifier) is owned by `auth`. Other features only use `@PreAuthorize` and `CurrentUser`.

## 3. Naming Conventions

| Item            | Pattern                                           | Example                                      |
|-----------------|---------------------------------------------------|----------------------------------------------|
| Feature package | lowercase, one word                               | `classroom`, `assignment`                    |
| Controller      | `<Resource>Controller`                            | `SubjectController`                          |
| Service         | `<Resource>Service` / `<Resource>ServiceImpl`     | `SubmissionService`, `SubmissionServiceImpl` |
| Repository      | `<Entity>Repository`                              | `UserRepository`                             |
| Entity          | singular PascalCase of the table                  | `ClassSubject` (`class_subjects`)            |
| Request DTO     | `<Verb><Resource>Request`                         | `CreateAssignmentRequest`                    |
| Response DTO    | `<Resource>Response` / `<Resource>DetailResponse` | `UserResponse`                               |
| Mapper          | `<Resource>Mapper`                                | `AssignmentMapper`                           |
| Enum            | `<Resource><Field>`                               | `UserStatus`, `IssueSeverity`                |
| Event           | past tense                                        | `SubmissionCreatedEvent`                     |
| Test            | `<Class>Test` / `<Class>IT`                       | `UserServiceImplTest`                        |

Name clashes: table `classes` -> entity `ClassRoom`; table `repositories` -> `GitRepository`; table `assignment_repositories` -> `AssignmentRepositoryLink`; table `assignment_student_repositories` -> `AssignmentStudentRepositoryLink`.

## 4. Table -> Feature Map

| Table                           | Feature      | Entity                            | Service (interface)            | Controller                              |
|---------------------------------|--------------|-----------------------------------|--------------------------------|-----------------------------------------|
| roles                           | `user`       | `Role`                            | `RoleService`                  | `RoleController`                        |
| users                           | `user`       | `User`                            | `UserService`                  | `UserController`                        |
| user_settings                   | `user`       | `UserSetting`                     | `UserSettingService`           | `UserController` (`/users/me/settings`) |
| (auth, no table)                | `auth`       |                                   | `AuthService`, `JwtService`    | `AuthController`                        |
| classes                         | `classroom`  | `ClassRoom`                       | `ClassService`                 | `ClassController`                       |
| subjects                        | `classroom`  | `Subject`                         | `SubjectService`               | `SubjectController`                     |
| class_subjects                  | `classroom`  | `ClassSubject`                    | `ClassSubjectService`          | `ClassController`                       |
| class_students                  | `classroom`  | `ClassStudent`                    | `ClassStudentService`          | `ClassController`                       |
| assignments                     | `assignment` | `Assignment`                      | `AssignmentService`            | `AssignmentController`                  |
| assignment_students             | `assignment` | `AssignmentStudent`               | `AssignmentStudentService`     | `AssignmentController`                  |
| assignment_requirements         | `assignment` | `AssignmentRequirement`           | `AssignmentRequirementService` | `AssignmentController`                  |
| assignment_structures           | `assignment` | `AssignmentStructure`             | `AssignmentStructureService`   | `AssignmentController`                  |
| assignment_structure_rules      | `assignment` | `AssignmentStructureRule`         | `AssignmentStructureService`   | `AssignmentController`                  |
| git_connections                 | `git`        | `GitConnection`                   | `GitConnectionService`         | `GitController`                         |
| repositories                    | `git`        | `GitRepository`                   | `GitRepositoryService`         | `GitController`                         |
| assignment_repositories         | `git`        | `AssignmentRepositoryLink`        | `AssignmentRepositoryService`  | `GitController`                         |
| assignment_student_repositories | `git`        | `AssignmentStudentRepositoryLink` | `StudentRepositoryService`     | `GitController`                         |
| submissions                     | `submission` | `Submission`                      | `SubmissionService`            | `SubmissionController`                  |
| analysis_runs                   | `analysis`   | `AnalysisRun`                     | `AnalysisService`              | `AnalysisController`                    |
| analysis_results                | `analysis`   | `AnalysisResult`                  | `AnalysisService`              | `AnalysisController`                    |
| analysis_issues                 | `analysis`   | `AnalysisIssue`                   | `AnalysisIssueService`         | `AnalysisController`                    |

## 5. Request Flow Example (Submit Assignment)

```text
POST /api/v1/assignments/{id}/submissions
 -> submission.controller.SubmissionController.submit()      @PreAuthorize("hasRole('STUDENT')")
 -> submission.service.SubmissionService                     (interface)
 -> submission.service.impl.SubmissionServiceImpl            @Transactional
      calls by interface only:
        assignment.service.AssignmentService      -> published? window? student assigned+ACTIVE?
        git.service.StudentRepositoryService      -> active repository link
        git.service.GitRepositoryService          -> resolve commit sha (git.client behind it)
      saves Submission(SUBMITTED) via submission.repository, publishes SubmissionCreatedEvent
 <- ApiResponse<SubmissionResponse> 201

After commit: analysis.event.SubmissionCreatedListener -> analysis.worker.AnalysisWorker (@Async)
```

## 6. Coding Rules for This Architecture

- Put a class in the feature that owns the data it works on. If two features both need it, it belongs to the lower feature in the dependency order, or in `common` if it is feature-agnostic.
- Every service has an interface + `impl`. Other features inject the interface only.
- Controllers stay thin. A controller of feature A never calls feature B directly; the service of A does.
- New table = migration + (feature) entity + repository + service (interface + impl) + DTOs + mapper + controller + tests, all inside the owning feature.
- Do not create new top-level packages other than features and `common`.
- When a feature grows past ~25 classes or a clear sub-domain appears, split it, update the dependency table and `ArchitectureTest`.
- Flyway migrations are shared and ordered globally. Never one history per feature.
- Package names are lowercase, singular nouns.