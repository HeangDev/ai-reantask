# Error Handling

**Project:** Student Assignment Review AI  
**Backend:** Laravel  
**Database:** MySQL  
**API Style:** RESTful JSON API

---

## 1. Overview

This document defines how the backend detects, reports, logs, and returns errors for the Student Assignment Review AI API.

Related documents:

- `docs/backend/architecture.md`
- `docs/backend/api.md`
- `docs/backend/authorization.md`
- `docs/backend/testing.md`
- `docs/business/ai-review.md`

### Goals

- Return predictable, consistent JSON errors for every API endpoint.
- Give clients enough information to react correctly.
- Never expose secrets, stack traces, SQL, file paths, or private data.
- Log enough context for developers to diagnose problems.
- Handle AI provider and Git failures safely without losing submission history.

---

## 2. Principles

1. **Every API error is JSON.** Requests to `/api/*` never return an HTML error page.
2. **Use the correct HTTP status code.** The status code tells the client what kind of error occurred.
3. **Safe messages for clients, detailed logs for developers.** The response explains what went wrong in plain language; the log records the technical cause.
4. **Fail closed.** If authorization cannot be confirmed, deny access.
5. **Do not leak existence.** When revealing that a resource exists would expose private data, return `404` instead of `403`.
6. **Keep data consistent.** Operations that change several records use transactions, so a failure leaves no partial data.
7. **Throw, do not return error arrays.** Services throw exceptions; the exception handler converts them into HTTP responses.

---

## 3. Error Response Format

### 3.1 General Error

```json
{
  "message": "Analysis is already in progress for this submission.",
  "code": "ANALYSIS_ALREADY_RUNNING"
}
```

| Field     | Type   | Required   | Description                                                                 |
|-----------|--------|------------|-----------------------------------------------------------------------------|
| `message` | string | Yes        | Human-readable explanation, safe to show to users                           |
| `code`    | string | No         | Machine-readable error code from section 9; included for application errors |

### 3.2 Validation Error `422`

Validation errors use Laravel's standard format:

```json
{
  "message": "The repository id field is required. (and 1 more error)",
  "errors": {
    "repository_id": [
      "The repository id field is required."
    ],
    "commit_sha": [
      "The commit sha field must be 40 characters."
    ]
  }
}
```

| Field     | Type   | Description                                    |
|-----------|--------|------------------------------------------------|
| `message` | string | Summary of the first error                     |
| `errors`  | object | Field names mapped to arrays of error messages |

Field names in `errors` match the request field names, which use `snake_case`.

### 3.3 Rate Limit Error `429`

```json
{
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMITED"
}
```

The response includes a `Retry-After` header with the number of seconds to wait.

### 3.4 Server Error `500`

```json
{
  "message": "An unexpected error occurred. Please try again later.",
  "code": "SERVER_ERROR"
}
```

The response never includes the exception class, message, trace, file, or line in production.

---

## 4. HTTP Status Codes

| Code   | Name                  | When to Use                                                                                               |
|--------|-----------------------|-----------------------------------------------------------------------------------------------------------|
| `400`  | Bad Request           | Malformed request that is not a field validation error, such as invalid JSON                              |
| `401`  | Unauthorized          | Missing, invalid, or expired authentication token                                                         |
| `403`  | Forbidden             | Authenticated, but the user's role or ownership does not allow the action                                 |
| `404`  | Not Found             | Resource does not exist, is soft-deleted, or must not be revealed to this user                            |
| `405`  | Method Not Allowed    | HTTP method is not supported on the route                                                                 |
| `409`  | Conflict              | The request conflicts with the current state, such as a duplicate enrollment or a run already in progress |
| `422`  | Unprocessable Content | Request validation failed, or a business rule rejected the input                                          |
| `429`  | Too Many Requests     | Rate limit exceeded                                                                                       |
| `500`  | Internal Server Error | Unexpected server failure                                                                                 |
| `502`  | Bad Gateway           | An external provider (AI or Git) returned an invalid response during a synchronous request                |
| `503`  | Service Unavailable   | Maintenance mode or a required dependency is temporarily unavailable                                      |

**Note:** AI analysis runs in background jobs, so provider failures normally appear as a `failed` analysis run, not as an HTTP `502` or `503` error. See section 8.

### 4.1 Choosing Between `403` and `404`

| Situation                                                                                     | Response   |
|-----------------------------------------------------------------------------------------------|------------|
| A student requests another student's submission                                               | `404`      |
| A student requests an assignment they are not enrolled in                                     | `404`      |
| A student requests a `REFERENCE` repository                                                   | `404`      |
| A user requests another user's Git connection                                                 | `404`      |
| A student tries to create an assignment                                                       | `403`      |
| A teacher tries to edit another teacher's assignment they can see as an admin-shared resource | `403`      |
| A student tries to resolve an analysis issue on their own submission                          | `403`      |

**Rule of thumb:** If the user should not know the resource exists, return `404`. If the user can already see the resource but cannot perform the action, return `403`.

In policies, use `Response::denyAsNotFound()` for the `404` cases:

```php
// app/Policies/SubmissionPolicy.php

use Illuminate\Auth\Access\Response;

public function view(User $user, Submission $submission): Response
{
    if ($user->isAdmin()
        || $submission->student_id === $user->id
        || $submission->assignment->teacher_id === $user->id) {
        return Response::allow();
    }

    return Response::denyAsNotFound();
}
```

---

## 5. Laravel Exception Mapping

The exception handler converts framework exceptions into the formats in section 3.

| Exception                                                              | Status                      | `code`                      |
|------------------------------------------------------------------------|-----------------------------|-----------------------------|
| `Illuminate\Validation\ValidationException`                            | `422`                       | — (uses `errors` object)    |
| `Illuminate\Auth\AuthenticationException`                              | `401`                       | `UNAUTHENTICATED`           |
| `Illuminate\Auth\Access\AuthorizationException`                        | `403`                       | `FORBIDDEN`                 |
| `Illuminate\Database\Eloquent\ModelNotFoundException`                  | `404`                       | `NOT_FOUND`                 |
| `Symfony\Component\HttpKernel\Exception\NotFoundHttpException`         | `404`                       | `NOT_FOUND`                 |
| `Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException` | `405`                       | `METHOD_NOT_ALLOWED`        |
| `Illuminate\Http\Exceptions\ThrottleRequestsException`                 | `429`                       | `RATE_LIMITED`              |
| `Illuminate\Database\QueryException`                                   | `500`                       | `SERVER_ERROR`              |
| `App\Exceptions\ApplicationException` (and subclasses)                 | As defined by the exception | As defined by the exception |
| Any other `Throwable`                                                  | `500`                       | `SERVER_ERROR`              |

### 5.1 Model Not Found Messages

Do not reveal model class names or IDs:

```json
{
  "message": "Resource not found.",
  "code": "NOT_FOUND"
}
```

Not:

```json
{
  "message": "No query results for model [App\\Models\\Submission] 88"
}
```

### 5.2 Database Exceptions

`QueryException` messages contain SQL and must never be returned to clients. Expected database conflicts, such as a duplicate unique key, should be prevented by validation or caught in the Service and converted to a `409` application exception.

---

## 6. Application Exceptions

Business rule failures are represented by custom exceptions in `app/Exceptions/`.

### 6.1 Base Exception

```php
// app/Exceptions/ApplicationException.php

namespace App\Exceptions;

use Exception;

abstract class ApplicationException extends Exception
{
    abstract public function status(): int;

    abstract public function errorCode(): string;

    public function context(): array
    {
        return [];
    }
}
```

### 6.2 Example Exceptions

```php
// app/Exceptions/AnalysisAlreadyRunningException.php

namespace App\Exceptions;

class AnalysisAlreadyRunningException extends ApplicationException
{
    public function __construct(private int $submissionId)
    {
        parent::__construct('Analysis is already in progress for this submission.');
    }

    public function status(): int
    {
        return 409;
    }

    public function errorCode(): string
    {
        return 'ANALYSIS_ALREADY_RUNNING';
    }

    public function context(): array
    {
        return ['submission_id' => $this->submissionId];
    }
}
```

Suggested exceptions:

| Exception                         | Status   | `code`                                    |
|-----------------------------------|----------|-------------------------------------------|
| `StudentNotEnrolledException`     | `422`    | `STUDENT_NOT_ENROLLED`                    |
| `DuplicateEnrollmentException`    | `409`    | `DUPLICATE_ENROLLMENT`                    |
| `RepositoryNotLinkedException`    | `422`    | `REPOSITORY_NOT_LINKED`                   |
| `RepositoryAccessDeniedException` | `422`    | `REPOSITORY_ACCESS_DENIED`                |
| `UnsafeRepositoryUrlException`    | `422`    | `UNSAFE_REPOSITORY_URL`                   |
| `GitConnectionInvalidException`   | `422`    | `GIT_CONNECTION_INVALID`                  |
| `CommitNotFoundException`         | `422`    | `COMMIT_NOT_FOUND`                        |
| `AnalysisAlreadyRunningException` | `409`    | `ANALYSIS_ALREADY_RUNNING`                |
| `InvalidAnalysisResultException`  | —        | Used inside jobs; never returned directly |
| `AIProviderException`             | —        | Used inside jobs; never returned directly |

Create an exception only when the error needs specific handling. Do not create an exception class for every possible failure.

### 6.3 Throwing from Services

```php
// app/Services/Submissions/SubmissionService.php

public function create(User $student, Assignment $assignment, array $data): Submission
{
    if (! $assignment->isStudentEnrolled($student)) {
        throw new StudentNotEnrolledException($student->id, $assignment->id);
    }

    return DB::transaction(function () use ($student, $assignment, $data) {
        $submission = $assignment->submissions()->create([
            'student_id' => $student->id,
            'repository_id' => $data['repository_id'],
            'branch' => $data['branch'],
            'commit_sha' => $data['commit_sha'],
            'created_by_user' => $student->id,
        ]);

        $run = $submission->analysisRuns()->create([
            'status' => AnalysisRunStatus::Queued,
            'commit_sha' => $submission->commit_sha,
        ]);

        AnalyzeSubmissionJob::dispatch($run->id)->afterCommit();

        return $submission;
    });
}
```

Controllers do not catch these exceptions. The handler converts them into responses.

---

## 7. Exception Handler Configuration

For Laravel 11 and later, configure exception rendering in `bootstrap/app.php`. For earlier versions, use `app/Exceptions/Handler.php` with the same logic.

```php
// bootstrap/app.php

use App\Exceptions\ApplicationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;

->withExceptions(function (Exceptions $exceptions) {

    // Always render JSON for API routes.
    $exceptions->shouldRenderJsonWhen(
        fn (Request $request) => $request->is('api/*') || $request->expectsJson()
    );

    // Application exceptions.
    $exceptions->render(function (ApplicationException $e, Request $request) {
        return response()->json([
            'message' => $e->getMessage(),
            'code' => $e->errorCode(),
        ], $e->status());
    });

    $exceptions->context(fn (Throwable $e) => $e instanceof ApplicationException
        ? $e->context()
        : []);

    // Authentication.
    $exceptions->render(function (AuthenticationException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'code' => 'UNAUTHENTICATED',
            ], 401);
        }
    });

    // Authorization and not found, including Model binding and denyAsNotFound().
    // Match on the status code: Response::denyAsNotFound() becomes a plain HttpException
    // with status 404, not a NotFoundHttpException, so a NotFoundHttpException handler
    // alone would miss it.
    $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
        if (! $request->is('api/*')) {
            return null;
        }

        return match ($e->getStatusCode()) {
            403 => response()->json([
                'message' => 'You do not have permission to perform this action.',
                'code' => 'FORBIDDEN',
            ], 403),
            404 => response()->json([
                'message' => 'Resource not found.',
                'code' => 'NOT_FOUND',
            ], 404),
            default => null,
        };
    });

    $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'message' => 'Method not allowed.',
                'code' => 'METHOD_NOT_ALLOWED',
            ], 405);
        }
    });

    $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'message' => 'Too many requests. Please try again later.',
                'code' => 'RATE_LIMITED',
            ], 429, $e->getHeaders());
        }
    });

    // Never report expected client errors as server errors.
    $exceptions->dontReport([
        ApplicationException::class,
    ]);
})
```

**Notes:**

- Laravel converts `AuthorizationException` and `ModelNotFoundException` into HTTP exceptions before these callbacks run (a plain denial becomes `AccessDeniedHttpException`, a missing model becomes `NotFoundHttpException`, and `denyAsNotFound()` becomes a generic `HttpException` with status `404`). The status-based handler above covers all of them.
- `ValidationException` already renders the format in section 3.2 and needs no custom handler.
- Unhandled exceptions fall through to Laravel's default JSON rendering. With `APP_DEBUG=false`, this returns only a generic message. If you add a `Throwable` handler for `500` responses, add the `code` field and never include `$e->getMessage()`.

---

## 8. Background Job Errors

AI analysis and repository cloning run in queued jobs. Their errors cannot be returned as HTTP responses, so they are recorded on the `analysis_runs` record.

### 8.1 Run Failure Fields

| Field           | Description                            |
|-----------------|----------------------------------------|
| `status`        | Set to `failed`                        |
| `error_code`    | Machine-readable code from section 9.2 |
| `error_message` | Safe, user-facing message              |
| `completed_at`  | Time the run stopped                   |

Use the column names defined in `docs/database/database.md`. If these fields do not exist yet, add them through a migration.

**Example API representation:**

```json
{
  "data": {
    "id": 56,
    "submission_id": 88,
    "status": "failed",
    "error_code": "REPOSITORY_CLONE_FAILED",
    "error_message": "The repository could not be retrieved. Check that it exists and that access is granted.",
    "commit_sha": "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4",
    "completed_at": "2026-10-14T09:05:00Z"
  }
}
```

### 8.2 Retry Rules

| Error Type               | Retry?                  | Example                                              |
|--------------------------|-------------------------|------------------------------------------------------|
| Temporary provider error | Yes, with backoff       | AI provider `500`, `503`, network timeout            |
| Rate limit               | Yes, release with delay | AI provider `429`                                    |
| Invalid AI output        | Yes, limited attempts   | Malformed JSON, missing fields                       |
| Permanent input error    | No                      | Repository deleted, commit not found, access revoked |
| Configuration error      | No                      | Missing or invalid API key                           |

### 8.3 Job Example

```php
// app/Jobs/AI/AnalyzeSubmissionJob.php

class AnalyzeSubmissionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 300;

    public function __construct(public int $analysisRunId) {}

    public function backoff(): array
    {
        return [30, 120, 300];
    }

    public function handle(AIReviewService $reviews): void
    {
        $run = AnalysisRun::findOrFail($this->analysisRunId);

        if ($run->status === AnalysisRunStatus::Completed) {
            return; // Idempotency: never process a completed run twice.
        }

        try {
            $reviews->analyze($run);
        } catch (AIRateLimitedException $e) {
            $this->release($e->retryAfter ?? 60);
        } catch (RepositoryNotFoundException $e) {
            $this->markFailed($run, 'REPOSITORY_NOT_FOUND');
            $this->delete();
        }
    }

    public function failed(Throwable $e): void
    {
        $run = AnalysisRun::find($this->analysisRunId);

        $run?->update([
            'status' => AnalysisRunStatus::Failed,
            'error_code' => $e instanceof ApplicationException
                ? $e->errorCode()
                : 'ANALYSIS_FAILED',
            'error_message' => 'The analysis could not be completed. Please try again later.',
            'completed_at' => now(),
        ]);
    }

    private function markFailed(AnalysisRun $run, string $code): void
    {
        $run->update([
            'status' => AnalysisRunStatus::Failed,
            'error_code' => $code,
            'error_message' => ErrorMessages::for($code),
            'completed_at' => now(),
        ]);
    }
}
```

Class and helper names are examples. Follow the actual job and service implementations.

### 8.4 Job Rules

- A failed run is never deleted; it stays as part of the submission's history.
- A failed job never leaves partial results. Store results and issues inside one transaction.
- Retrying a job must not create duplicate results.
- Provider error bodies, prompts, and repository contents are logged only when safe and never stored in `error_message`.
- Temporary repository files are removed in both success and failure paths, using `finally`.

---

## 9. Error Code Catalog

Codes are uppercase `SNAKE_CASE`. Once published, a code must not be renamed, because clients may depend on it.

### 9.1 API Error Codes

| Code                       | Status   | Message (example)                                           |
|----------------------------|----------|-------------------------------------------------------------|
| `UNAUTHENTICATED`          | `401`    | Unauthenticated.                                            |
| `INVALID_CREDENTIALS`      | `401`    | The provided credentials are incorrect.                     |
| `FORBIDDEN`                | `403`    | You do not have permission to perform this action.          |
| `NOT_FOUND`                | `404`    | Resource not found.                                         |
| `METHOD_NOT_ALLOWED`       | `405`    | Method not allowed.                                         |
| `DUPLICATE_ENROLLMENT`     | `409`    | The student is already enrolled in this assignment.         |
| `ANALYSIS_ALREADY_RUNNING` | `409`    | Analysis is already in progress for this submission.        |
| `STUDENT_NOT_ENROLLED`     | `422`    | You are not enrolled in this assignment.                    |
| `REPOSITORY_NOT_LINKED`    | `422`    | This repository is not linked to your assignment.           |
| `REPOSITORY_ACCESS_DENIED` | `422`    | The Git connection does not have access to this repository. |
| `UNSAFE_REPOSITORY_URL`    | `422`    | This repository URL is not allowed.                         |
| `GIT_CONNECTION_INVALID`   | `422`    | The Git connection could not be verified.                   |
| `COMMIT_NOT_FOUND`         | `422`    | The commit could not be found on this branch.               |
| `RATE_LIMITED`             | `429`    | Too many requests. Please try again later.                  |
| `SERVER_ERROR`             | `500`    | An unexpected error occurred. Please try again later.       |
| `SERVICE_UNAVAILABLE`      | `503`    | The service is temporarily unavailable.                     |

### 9.2 Analysis Run Error Codes

| Code                        | Meaning                                           |
|-----------------------------|---------------------------------------------------|
| `REPOSITORY_NOT_FOUND`      | The repository no longer exists                   |
| `REPOSITORY_ACCESS_REVOKED` | The Git token no longer has access                |
| `REPOSITORY_CLONE_FAILED`   | The repository could not be retrieved             |
| `REPOSITORY_TOO_LARGE`      | The repository exceeds the configured size limit  |
| `COMMIT_NOT_FOUND`          | The analyzed commit no longer exists              |
| `AI_PROVIDER_UNAVAILABLE`   | The AI provider failed after all retries          |
| `AI_INVALID_RESPONSE`       | The AI output failed validation after all retries |
| `ANALYSIS_TIMEOUT`          | The analysis exceeded the time limit              |
| `ANALYSIS_FAILED`           | Any other analysis failure                        |

---

## 10. Validation Errors

- Use Form Requests for request validation. They throw `ValidationException` automatically.
- Write clear custom messages for rules that are confusing by default.
- Use business-rule validation inside the Form Request when the check is about input, such as "the repository must belong to the current user."
- Use application exceptions in Services for rules that depend on state at execution time, such as "an analysis is already running."

```php
// app/Http/Requests/Api/V1/StoreSubmissionRequest.php

public function rules(): array
{
    return [
        'repository_id' => ['required', 'integer', 'exists:repositories,id'],
        'branch' => ['required', 'string', 'max:255'],
        'commit_sha' => ['nullable', 'string', 'size:40', 'regex:/^[0-9a-f]{40}$/'],
    ];
}

public function messages(): array
{
    return [
        'commit_sha.regex' => 'The commit SHA must be a 40-character hexadecimal value.',
    ];
}
```

Validation messages must not reveal whether a record belongs to another user. For example, use "The selected repository is invalid." instead of "This repository belongs to another student."

---

## 11. Logging

### 11.1 What to Log

| Level     | Use For                                                     |
|-----------|-------------------------------------------------------------|
| `error`   | Unexpected exceptions, failed jobs after all retries        |
| `warning` | Provider rate limits, retries, rejected AI output           |
| `info`    | Analysis run started and completed, important state changes |
| `debug`   | Development diagnostics only; disabled in production        |

Include context that helps diagnose the problem:

```php
Log::warning('AI provider returned invalid output.', [
    'analysis_run_id' => $run->id,
    'submission_id' => $run->submission_id,
    'attempt' => $this->attempts(),
    'error_code' => 'AI_INVALID_RESPONSE',
]);
```

### 11.2 What Never to Log

- Passwords or password hashes
- Authentication tokens or Sanctum tokens
- Git access tokens or credentials embedded in URLs
- AI provider API keys
- Full request bodies for authentication or Git connection endpoints
- Full repository contents or student source code

### 11.3 Redaction

- Strip credentials from repository URLs before logging, such as `https://token@github.com/...` to `https://github.com/...`.
- Mark sensitive request fields as hidden from exception reports:

```php
// bootstrap/app.php

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->dontFlash([
        'password',
        'password_confirmation',
        'current_password',
        'access_token',
        'token',
    ]);
})
```

---

## 12. Environment Settings

| Setting     | Local   | Testing   | Production           |
|-------------|---------|-----------|----------------------|
| `APP_DEBUG` | `true`  | `true`    | **`false`**          |
| `APP_ENV`   | `local` | `testing` | `production`         |
| `LOG_LEVEL` | `debug` | `debug`   | `warning` or `error` |

**Never set `APP_DEBUG=true` in production.** Debug mode exposes stack traces, environment values, and queries in error responses.

---

## 13. Transactions and Consistency

- Wrap operations that create or update several related records in `DB::transaction()`.
- Dispatch jobs with `afterCommit()` so a job never runs for data that was rolled back.
- Do not catch an exception inside a transaction and continue as if the operation succeeded.
- External calls (AI provider, Git provider) should happen outside long-running database transactions.

---

## 14. Testing Error Handling

Follow `docs/backend/testing.md`. Every endpoint needs tests for its error responses.

```php
public function test_cannot_start_analysis_while_one_is_running(): void
{
    $this->actingAsAdmin();
    $run = AnalysisRun::factory()->running()->create();

    $this->postJson("/api/v1/submissions/{$run->submission_id}/analysis-runs")
        ->assertConflict()
        ->assertJson([
            'message' => 'Analysis is already in progress for this submission.',
            'code' => 'ANALYSIS_ALREADY_RUNNING',
        ]);
}

public function test_missing_submission_returns_safe_not_found(): void
{
    $this->actingAsStudent();

    $this->getJson('/api/v1/submissions/999999')
        ->assertNotFound()
        ->assertJson(['code' => 'NOT_FOUND'])
        ->assertDontSee('App\\Models');
}

public function test_server_error_hides_details_in_production(): void
{
    config(['app.debug' => false]);
    // Trigger an unexpected exception through a test route or mocked service.
    // Assert status 500, the generic message, and no 'exception' or 'trace' keys.
}
```

Required error tests:

- `401` for every protected endpoint without a token.
- `403` and `404` according to section 4.1.
- `422` with the correct field keys for invalid input.
- `409` for conflicts.
- `429` for rate-limited endpoints.
- `500` responses contain no stack trace, SQL, or class names when `APP_DEBUG=false`.
- Failed analysis runs record `error_code` and a safe `error_message`.

---

## 15. Rules for AI Coding Agents

1. Throw exceptions from Services; do not return error arrays or `false`.
2. Do not catch exceptions in Controllers unless the controller must react differently.
3. Reuse an existing exception or error code before creating a new one.
4. Add every new error code to section 9 in the same change.
5. Never put `$e->getMessage()` from a framework, database, or provider exception into an API response.
6. Never log secrets, tokens, or student source code.
7. Return `404` instead of `403` when the user should not know the resource exists.
8. Add tests for every new error path.
9. Keep `docs/backend/api.md` examples consistent with the formats in this document.

---

## 16. Summary

- All API errors are JSON with a safe `message` and, for application errors, a stable `code`.
- Validation errors use Laravel's `message` and `errors` format with status `422`.
- Use `404` to hide private resources and `403` for visible resources the user cannot act on.
- Business rule failures are custom exceptions thrown from Services and rendered centrally.
- Background job failures are recorded on the analysis run, never deleted, and never leave partial results.
- Logs contain diagnostic context but never secrets or student code.
- `APP_DEBUG` is always `false` in production.
