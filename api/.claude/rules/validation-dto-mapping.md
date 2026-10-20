---
paths:
  - "**/dto/**"
  - "**/mapper/**"
  - "**/validation/**"
---

# Backend Rules - Validation, DTOs, Mapping

## 1. DTO Rules

- Request/response DTOs are Java `record`s in `dto/request` and `dto/response`. Immutable.
- Never expose entities. Never accept entities.
- Request DTO per operation: `CreateXRequest`, `UpdateXRequest`, `ChangeXStatusRequest`. Do not reuse one DTO for create and update when fields differ.
- Response DTOs: `XResponse` (list/summary), `XDetailResponse` (with nested data). Nest only what the screen needs; use ids for the rest.
- Sensitive fields never in responses: `password`, `access_token`, `refresh_token`, `google_id` (admin only if needed), `deleted_by_user` (admin only).
- Enums in DTOs are Java enums (Jackson serializes the name).

## 2. Validation (Jakarta Bean Validation)

Apply on request DTOs; controllers use `@Valid` / `@Validated`. Mirror DB limits:

| Field                         | Rule                                                                                                                 |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------|
| `email`                       | `@NotBlank @Email @Size(max=150)`, lowercase + trim before save                                                      |
| `fullname`                    | `@NotBlank @Size(max=255)`                                                                                           |
| `phone`                       | `@Pattern(^\+?[0-9]{8,15}$)` `@Size(max=20)` (required for password sign-up)                                         |
| `password`                    | `@NotBlank @Size(min=8,max=72)` + letter and digit                                                                   |
| `title`, `name`               | `@NotBlank @Size(max=255)`                                                                                           |
| `description`, `instructions` | `@Size(max=50000)` (application cap; DB is TEXT)                                                                     |
| `path` (structure rule)       | `@NotBlank @Size(max=255)` + custom `@SafeRelativePath`                                                              |
| `code` (class)                | server generated, 6 chars `[A-Z0-9]`; request accepts it only when validating a join code: `@Pattern(^[A-Z0-9]{6}$)` |
| `weight`                      | `@DecimalMin("0.00") @DecimalMax("100.00") @Digits(integer=3,fraction=2)`                                            |
| `score`/`overall_score`       | `@Digits(integer=3,fraction=2)` and 0-100                                                                            |
| `commit_sha`                  | `@Pattern(^[a-fA-F0-9]{7,64}$)`                                                                                      |
| `branch`                      | `@NotBlank @Size(max=255)` + no whitespace/control chars                                                             |
| `line_number`                 | `@Min(1)`                                                                                                            |
| `start_at`, `deadline_at`     | `@NotNull`; cross-field `@ValidDateRange` (`deadline_at > start_at`)                                                 |
| `theme_mode`, `language`      | enum types                                                                                                           |
| `timezone`                    | valid IANA id (`ZoneId.of`) via custom validator                                                                     |

Rules:
- Bean Validation checks shape; the service checks business rules (state, ownership, uniqueness).
- Trim strings; normalize email to lowercase; reject blank-only strings.
- Validate path/query params (`@Min(1)` for ids, `@Max(100)` for size).
- Custom validators live in `validation/` (`@SafeRelativePath`, `@ValidDateRange`, `@ValidTimezone`). If you add this package, document it in `architecture.md`.

## 3. Mapping (MapStruct)

- One mapper per feature in `mapper/`: `@Mapper(componentModel = "spring")`.
- `unmappedTargetPolicy = ReportingPolicy.ERROR` so new fields are not forgotten.
- Mappers do not call repositories or services. Resolve related entities in the service, then map.
- Update mappers use `@MappingTarget` + `@BeanMapping(nullValuePropertyMappingStrategy = IGNORE)` for PATCH-like updates.
- Mapper tests for non-trivial mappings.
- Server-controlled fields (`id`, audit, `status` on create, `deleted_*`) are `ignore = true` in request->entity mappings.

## 4. Jackson

- `spring.jackson.property-naming-strategy=LOWER_CAMEL_CASE` (default).
- `default-property-inclusion=non_null` for responses.
- Dates as ISO-8601 (`WRITE_DATES_AS_TIMESTAMPS=false`); `Instant` for timestamps, `LocalDate` for dates.
- `FAIL_ON_UNKNOWN_PROPERTIES=true` for requests.
