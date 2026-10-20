---
paths:
  - "**/exception/**"
  - "**/service/**"
---

# Backend Rules - Exceptions and Error Codes

## 1. Exception Types (`exception/`)

| Exception                  | HTTP   | Use                                                     |
|----------------------------|--------|---------------------------------------------------------|
| `BadRequestException`      | 400    | Malformed or invalid input not caught by validation     |
| `UnauthorizedException`    | 401    | Bad credentials, invalid/expired token                  |
| `ForbiddenException`       | 403    | Authenticated but not allowed                           |
| `NotFoundException`        | 404    | Missing or invisible record                             |
| `ConflictException`        | 409    | Duplicate, wrong current state, concurrent update       |
| `BusinessRuleException`    | 422    | Rule violated (deadline, publish requirements, weights) |
| `TooManyRequestsException` | 429    | Rate limit                                              |
| `ExternalServiceException` | 502    | Git provider failure                                    |
| (unhandled)                | 500    | `INTERNAL_ERROR`, log with trace id                     |

All extend `AppException(ErrorCode code, String message, HttpStatus status)`. Services throw them; controllers never catch.

## 2. GlobalExceptionHandler

One `@RestControllerAdvice` maps:
- `AppException` -> its status + `ErrorResponse`
- `MethodArgumentNotValidException`, `ConstraintViolationException` -> 400 `VALIDATION_ERROR` with `errors[]` (field + message)
- `HttpMessageNotReadableException` -> 400 `MALFORMED_REQUEST`
- `MethodArgumentTypeMismatchException` -> 400 `INVALID_PARAMETER`
- `AccessDeniedException` -> 403 `FORBIDDEN`; `AuthenticationException` -> 401
- `DataIntegrityViolationException` -> 409 (map known constraint names `uq_*` to specific codes, e.g. `uq_class_students` -> `ALREADY_ENROLLED`); never leak SQL text
- `ObjectOptimisticLockingFailureException` -> 409 `CONCURRENT_UPDATE`
- `Exception` -> 500 `INTERNAL_ERROR` with a `traceId`; log the stack trace server-side

## 3. ErrorCode Catalogue (`exception/ErrorCode`)

Format: `UPPER_SNAKE_CASE`. Add new codes here and in the enum together.

```text
Generic
  VALIDATION_ERROR, MALFORMED_REQUEST, INVALID_PARAMETER, INVALID_SORT_FIELD,
  UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, CONCURRENT_UPDATE,
  TOO_MANY_REQUESTS, INTERNAL_ERROR

Auth / Users
  INVALID_CREDENTIALS, TOKEN_EXPIRED, TOKEN_INVALID, REFRESH_TOKEN_REVOKED,
  ACCOUNT_PENDING, ACCOUNT_INACTIVE, ACCOUNT_SUSPENDED, ACCOUNT_DELETED,
  ROLE_INACTIVE, EMAIL_TAKEN, PHONE_TAKEN, GOOGLE_TOKEN_INVALID,
  INVALID_STATUS_TRANSITION, CANNOT_MODIFY_SELF, LAST_ADMIN

Classes
  CLASS_NOT_FOUND, CLASS_INACTIVE, CLASS_CODE_GENERATION_FAILED, INVALID_DATE_RANGE,
  SUBJECT_NOT_FOUND, SUBJECT_INACTIVE, ALREADY_IN_CLASS, ALREADY_ENROLLED,
  TEACHER_INVALID, STUDENT_INVALID

Assignments
  ASSIGNMENT_NOT_FOUND, ASSIGNMENT_NOT_PUBLISHED, ASSIGNMENT_NOT_EDITABLE,
  INVALID_ASSIGNMENT_DATES, PUBLISH_REQUIREMENTS_MISSING, WEIGHT_EXCEEDS_100,
  STUDENT_NOT_ASSIGNED, STUDENT_NOT_IN_CLASS, REQUIREMENT_IN_USE, INVALID_STRUCTURE_PATH

Git / Repositories
  GIT_CONNECTION_NOT_FOUND, GIT_TOKEN_INVALID, GIT_PROVIDER_ERROR,
  REPOSITORY_NOT_FOUND, REPOSITORY_NOT_OWNED, BRANCH_NOT_FOUND, REPOSITORY_NOT_LINKED

Submissions / Analysis
  SUBMISSION_NOT_FOUND, SUBMISSION_WINDOW_CLOSED, DEADLINE_PASSED, NOT_STARTED_YET,
  INVALID_COMMIT, RESUBMISSION_NOT_ALLOWED, ANALYSIS_IN_PROGRESS,
  SUBMISSION_NOT_ANALYZED, CRITICAL_ISSUES_OPEN, SUBMISSION_FINAL,
  ANALYSIS_RUN_NOT_FOUND, ISSUE_NOT_FOUND
```

Keep a mapping `ErrorCode -> HttpStatus + default message key` in one place; messages live in `messages_en.properties`, `messages_km.properties`, `messages_ko.properties` (matching `Language` EN/KH/KO).

## 4. Rules

- Never return `null`; use `Optional` + `orElseThrow(() -> new NotFoundException(...))`.
- Throw early (guard clauses) with the most specific `ErrorCode`.
- Do not swallow exceptions. Catch only to translate or add context, and rethrow.
- No `catch (Exception)` except at boundaries (worker top-level, global handler).
- Messages must not contain secrets, SQL, stack traces or other users' data.
- Log: 4xx at DEBUG/INFO (no stack), 5xx at ERROR with stack and `traceId`. Include `traceId` in the 500 response body so users can report it.
