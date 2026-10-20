---
paths:
  - "**/*.java"
---

# Backend Rules - Code Style and Conventions

## 1. Java

- Java 21. Use `record` for DTOs/value objects, `var` only when the type is obvious, `switch` expressions, text blocks for SQL/JSON.
- Formatting: Google Java Style or the repo's formatter (Spotless). 4-space or 2-space as already configured; do not mix. Max line 120.
- Package names lowercase singular (`controller`, `service`). Classes `PascalCase`, methods/fields `camelCase`, constants `UPPER_SNAKE_CASE`, enum values `UPPER_SNAKE_CASE`.
- Imports: no wildcards, no unused. Order: java, jakarta, org, com, project.
- Methods <= ~40 lines, classes <= ~400 lines, <= 4 parameters (else a request object). Single responsibility.
- `final` for fields; constructor injection with Lombok `@RequiredArgsConstructor`. No field injection, no setter injection.
- Prefer composition over inheritance (exception: `AuditableEntity`, `AppException`).
- No magic numbers or strings: constants, enums, or config properties.
- `Optional` only as a return type, never as a field or parameter.
- Collections: return empty collections, never `null`.
- Use `Objects.requireNonNull` / guard clauses at method start.
- Use `BigDecimal` for scores/weights (`RoundingMode.HALF_UP`, scale 2). Never `double`.

## 2. Lombok

- Allowed: `@Getter`, `@Setter` (entities, selectively), `@Builder`, `@RequiredArgsConstructor`, `@NoArgsConstructor(access = PROTECTED)`, `@Slf4j`, `@ToString(exclude=...)`.
- Not allowed on entities: `@Data`, `@EqualsAndHashCode` on all fields, `@AllArgsConstructor` public.

## 3. Layer Discipline (see `architecture.md`)

- `controller`: parse + delegate + wrap response. No `if` on business state.
- `service/impl`: all business rules. Public methods take DTOs/ids, return DTOs.
- `repository`: queries only.
- Never use `@Autowired` on fields; never access `repository` from `controller`.
- Cross-module data: call that module's service interface.

## 4. Comments and Docs

- Code explains itself with names. Comment the WHY (non-obvious rule, workaround), not the WHAT.
- Javadoc on public service interfaces (contract, exceptions thrown, transaction behavior).
- Reference rules in code comments as `// Rule: submissions window (05-submissions-analysis.md #1)` when helpful.
- No commented-out code. No TODO without a ticket id.

## 4b. Null Safety and Immutability

- Annotate nullable params/returns (`@Nullable` from Spring) where they exist.
- Prefer immutable DTOs and unmodifiable collections.

## 5. Git and Workflow

- Branches: `feature/<ticket>-short-name`, `fix/...`, `chore/...`. Main branch protected.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `db:`).
- PR: small, one concern, description + test evidence, migrations called out. Needs 1 review and green CI.
- Never commit secrets, `.env`, build output, IDE files. Maintain `.gitignore` and `.env.example`.

## 6. Definition of Done

A change is done when:
1. Migration (if DB change) + entity + repository + service + DTOs + mapper + controller + OpenAPI annotations exist in their layers.
2. Validation, authorization (role + ownership) and error codes are implemented.
3. Unit + slice/integration tests pass; new rules have tests.
4. Rules docs in `.claude/rules/` updated if behavior or schema changed.
5. No new warnings from Checkstyle/Spotless/SpotBugs; logs contain no sensitive data.

## 7. Claude Working Rules

- Read `CLAUDE.md`, `architecture.md` and the module file before coding.
- If the schema/spec is ambiguous or conflicts with these rules, ask or state the assumption; do not guess silently.
- Do not change status-transition rules, permissions matrix or unique-key behavior without explicit instruction.
- Any DB change = new Flyway migration (never edit an applied one) + entity update + tests + docs.
- Prefer minimal, reviewable diffs; do not refactor unrelated code.
- Do not add dependencies, endpoints or tables beyond the request without saying why.
- After finishing, summarize what changed, what was tested, and any open questions.
