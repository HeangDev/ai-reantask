---
name: create-api
description: Scaffold a complete, production-style Spring Boot REST API for a named feature, invoked as `create-api [feature-name]` (e.g. `create-api product`, `create-api order-item`). Generates entity, repository, DTOs, mapper, service, controller, exception handling, validation, database migration, and tests that follow the project's existing conventions. Use this skill whenever the user says "create-api", asks to create/generate/scaffold/add a REST API, CRUD endpoints, controller/service/repository, or a new module/feature in a Spring Boot (Java or Kotlin) project, even if they don't say "skill" or give the exact command syntax.
---

# create-api [feature-name]

Generate a full vertical slice of a Spring Boot REST API for one feature. The goal is code that looks like a teammate wrote it in this specific project, not generic boilerplate. That means reading the project first, then matching its conventions.

## Invocation

```
create-api <feature-name> [optional field list or options]
```

Examples:
- `create-api product`
- `create-api order-item name:String price:BigDecimal quantity:Integer`
- `create-api customer --no-tests --package com.acme.crm`

If `<feature-name>` is missing, ask for it (one question only). Normalize it:

| Form       | Example (`order-item`)   | Used for                                                                    |
|------------|--------------------------|-----------------------------------------------------------------------------|
| kebab-case | `order-item`             | URL path (`/api/v1/order-items`, pluralized), package segment (`orderitem`) |
| PascalCase | `OrderItem`              | Class names                                                                 |
| camelCase  | `orderItem`              | Variables, fields                                                           |
| snake_case | `order_items`            | Table name (pluralized)                                                     |

## Workflow

### 1. Inspect the project (do not skip)

Before writing anything, find out:

- **Build tool**: `pom.xml` or `build.gradle(.kts)`.
- **Spring Boot version**: 3.x uses `jakarta.*`; 2.x uses `javax.*`. Getting this wrong breaks compilation.
- **Java/Kotlin version**: if Java 17+, use `record` for DTOs; otherwise use classes.
- **Base package**: locate the `@SpringBootApplication` class.
- **Package layout**: layer-first (`controller/`, `service/`, `repository/`) or feature-first (`product/controller/...`). Mirror what exists, and follow `.claude/rules/architecture.md` when the project has one (this project is layer-based). If the project is empty and has no such rule, default to feature-first.
- **Existing conventions**: look at one existing feature, if any, and copy its style: Lombok or not, MapStruct or manual mapper, `ResponseEntity` vs plain return, API prefix and versioning, ID type (`Long`, `UUID`), auditing base class, existing exception handler, existing error response shape.
- **Persistence**: Spring Data JPA, JDBC, R2DBC, or Mongo. Default to JPA if unclear.
- **Migrations**: Flyway (`db/migration`), Liquibase, or none.
- **Dependencies present**: `spring-boot-starter-validation`, `springdoc-openapi`, Lombok, MapStruct, Testcontainers. Note any that are missing.

If the project already has a global exception handler, error DTO, or base entity, **reuse them**. Creating duplicates is the most common way this kind of scaffold goes wrong.

### 2. Decide the fields

If the user gave fields, use them. If not, infer sensible ones from the feature name (e.g. `product` -> `name`, `description`, `price`, `active`) and state the assumption in the final summary so they can adjust. Don't interrogate the user about fields; a reasonable draft they can edit beats a questionnaire.

### 3. Generate the files

Generate the slice below. See `references/templates.md` for full Java templates (Spring Boot 3, JPA) to adapt. Keep each file small and single-purpose.

```
<feature>/
├── controller/   <Feature>Controller
├── service/      <Feature>Service (+ impl only if the project uses interface/impl)
├── repository/   <Feature>Repository
├── entity/       <Feature>
├── dto/          Create<Feature>Request, Update<Feature>Request, <Feature>Response
├── mapper/       <Feature>Mapper
└── exception/    <Feature>NotFoundException   (only if no shared one exists)
```

Plus, when applicable:
- Migration `V<next>__create_<table>.sql` (Flyway) or changelog (Liquibase). Pick the next version number by listing the existing migrations.
- Tests (see step 5).
- Shared infrastructure **only if missing**: `GlobalExceptionHandler`, `ApiError`/`ProblemDetail` setup, `PageResponse<T>`.

### 4. Apply these design rules

These exist for reasons; follow them unless the project's conventions say otherwise.

- **Never expose entities from controllers.** Separate request and response DTOs keep the DB schema from leaking into the public contract and prevent mass-assignment bugs.
- **Separate Create and Update requests.** Their validation rules usually diverge, and ID/audit fields must not be client-settable.
- **Validate at the boundary.** `@Valid` on `@RequestBody`, Bean Validation annotations on request DTOs (`@NotBlank`, `@Size`, `@Positive`, ...). Use `@Validated` on the controller for path/query params.
- **Constructor injection only**, never field `@Autowired`. With Lombok use `@RequiredArgsConstructor`.
- **Transactions live in the service.** `@Transactional(readOnly = true)` at class level, `@Transactional` on write methods.
- **Controllers stay thin**: parse input, call service, shape the HTTP response. No business logic, no repository access.
- **Standard REST semantics**:

  | Operation   | Method + path                  | Success                          | Notes                                            |
    |-------------|--------------------------------|----------------------------------|--------------------------------------------------|
  | Create      | `POST /api/v1/<plural>`        | `201` + `Location` header + body |                                                  |
  | Get one     | `GET /api/v1/<plural>/{id}`    | `200`                            | `404` if missing                                 |
  | List        | `GET /api/v1/<plural>`         | `200`                            | Paginated: `page`, `size`, `sort` via `Pageable` |
  | Update      | `PUT /api/v1/<plural>/{id}`    | `200`                            | Full replacement. Use `PATCH` only if asked      |
  | Delete      | `DELETE /api/v1/<plural>/{id}` | `204`                            | `404` if missing                                 |

- **Pagination by default** on list endpoints; unbounded lists become production incidents. Cap `size` (e.g. 100).
- **Consistent errors.** Map exceptions to a single error shape in `@RestControllerAdvice` (prefer RFC 7807 `ProblemDetail` on Spring Boot 3): `404` not found, `400` validation (with per-field details), `409` conflict/unique violations.
- **Don't use `@Data` on JPA entities** (breaks `equals/hashCode` with lazy proxies). Use `@Getter/@Setter` and an ID-based `equals/hashCode`, or write them by hand.
- **Prefer `LocalDate/Instant/OffsetDateTime`** and `BigDecimal` for money. Never `double` for currency.
- **Don't hardcode secrets, URLs, or magic numbers.**
- **OpenAPI annotations** (`@Operation`, `@Tag`) only if springdoc is already a dependency. Don't add dependencies silently; list them in the summary.

### 5. Tests

Unless the user passed `--no-tests`, generate:

- **Service unit tests**: JUnit 5 + Mockito. Cover create, get (found / not found), update, delete (found / not found).
- **Controller slice tests**: `@WebMvcTest` + `MockMvc`. Cover status codes, validation failures (`400`), and not-found (`404`).
- **Repository/integration test** (when Testcontainers or H2 is already configured): `@DataJpaTest` or `@SpringBootTest`.

Use the project's existing assertion library (AssertJ is the default). See `references/templates.md` for examples.

### 6. Verify

If a shell is available, compile and run the new tests:

```bash
./mvnw -q -DskipTests=false test -Dtest='<Feature>*'     # Maven
./gradlew test --tests '*<Feature>*'                      # Gradle
```

Fix compile errors you introduced (wrong `jakarta`/`javax` import, missing dependency, package mismatch). If you cannot run the build, say so explicitly rather than implying it passed.

### 7. Report

End with a short summary:

1. Files created (tree or list, grouped by layer).
2. Endpoints table (method, path, purpose).
3. Assumptions made (fields, ID type, pagination, API prefix).
4. Dependencies or config the user must add, if any.
5. How to run the tests, and a sample `curl` for the create endpoint.

Keep it concise; the code is the deliverable.

## Options

Honor these when passed after the feature name:

| Option            | Effect                                                             |
|-------------------|--------------------------------------------------------------------|
| `--no-tests`      | Skip test generation                                               |
| `--package <pkg>` | Override base package                                              |
| `--soft-delete`   | Add `deleted_at`/`deleted` flag; delete sets it; queries filter it |
| `--uuid`          | Use `UUID` IDs instead of `Long`                                   |
| `--patch`         | Also generate `PATCH` with partial update DTO                      |
| `--readonly`      | Only GET endpoints                                                 |
| `--kotlin`        | Generate Kotlin (data classes for DTOs, no Lombok)                 |
| `--mapstruct`     | Use MapStruct mapper instead of a manual one                       |

## Edge cases

- **Feature already exists**: do not overwrite. Tell the user which files exist and ask whether to skip, merge, or choose a different name.
- **Reserved or awkward names** (`user`, `order`, `group` are reserved SQL words): use a plural table name (`users`, `orders`) or `@Table(name = "app_user")`, and mention it.
- **Relationships** (`create-api order-item orderId:Long`): model as `@ManyToOne(fetch = LAZY)` to the other entity only if it exists; otherwise store the foreign key as a plain column and flag it in the summary. Avoid bidirectional mappings unless asked.
- **Not a Spring Boot project**: say so and ask whether to bootstrap one (Spring Initializr dependencies: Web, Validation, Data JPA, a DB driver, Flyway, Lombok, Actuator).
- **Reactive stack** (`spring-boot-starter-webflux`): return `Mono`/`Flux`, use R2DBC or reactive Mongo, and test with `WebTestClient`. The templates in this skill assume MVC.
- **Security present** (Spring Security): don't invent roles. Follow existing `@PreAuthorize` patterns, or leave a clearly marked `// TODO: secure` and mention it.

## Reference

- `references/templates.md`: complete Java templates for every layer (Spring Boot 3, JPA, Lombok-optional) plus test templates. Read it before generating code, then adapt to the project's conventions.