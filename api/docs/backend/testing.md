# Testing Standards

**Project:** Student Assignment Review AI  
**Backend:** Laravel  
**Database:** MySQL  
**Test Framework:** PHPUnit or Pest, based on the project configuration

---

## 1. Overview

This document defines how backend tests are organized, written, and run for the Student Assignment Review AI project.

Related documents:

- `docs/backend/architecture.md`
- `docs/backend/api.md`
- `docs/backend/authorization.md`
- `docs/backend/error-handling.md`
- `docs/database/database.md`
- `docs/database/relationships.md`
- `docs/business/ai-review.md`

### Testing Goals

- Verify that every API endpoint behaves as documented in `docs/backend/api.md`.
- Prove that users can access only the data they are allowed to see.
- Protect the relationship and business rules defined in the documentation.
- Test AI and Git workflows without calling real external services.
- Catch regressions before code is merged.
- Keep tests fast, isolated, and repeatable.

---

## 2. Tools

| Tool                                     | Purpose                                              |
|------------------------------------------|------------------------------------------------------|
| PHPUnit or Pest                          | Test runner, based on the project configuration      |
| Laravel testing helpers                  | HTTP requests, JSON assertions, database assertions  |
| Model factories                          | Generate test data                                   |
| `RefreshDatabase`                        | Reset the database between tests                     |
| `Sanctum::actingAs()`                    | Authenticate users in API tests                      |
| `Queue::fake()` / `Bus::fake()`          | Assert that jobs are dispatched without running them |
| `Http::fake()`                           | Fake Git provider and AI provider HTTP calls         |
| `Event::fake()` / `Notification::fake()` | Assert events and notifications                      |
| `Storage::fake()`                        | Isolate temporary repository files                   |

Examples in this document use PHPUnit syntax. If the project uses Pest, write the equivalent Pest tests.

---

## 3. Test Database

Use a dedicated MySQL test database. Do not use SQLite as a substitute, because foreign keys, unique constraints, JSON columns, and enum behavior can differ from MySQL.

### 3.1 Environment

Create `.env.testing`:

```dotenv
APP_ENV=testing
APP_DEBUG=true

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=student_assignment_review_ai_test
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=sync
CACHE_STORE=array
SESSION_DRIVER=array
MAIL_MAILER=array

AI_PROVIDER_API_KEY=fake-test-key
```

Use the actual environment variable names defined in `.env.example`.

### 3.2 Rules

- Never run tests against a development, staging, or production database.
- Never put real API keys, Git tokens, or credentials in `.env.testing`.
- Every test that touches the database uses `RefreshDatabase`.
- Tests must not depend on data created by another test or on test execution order.

---

## 4. Directory Structure

```text
tests/
├── Feature/
│   └── Api/
│       └── V1/
│           ├── Auth/
│           │   ├── LoginTest.php
│           │   ├── LogoutTest.php
│           │   └── RegisterTest.php
│           ├── Users/
│           │   └── UserTest.php
│           ├── Assignments/
│           │   ├── AssignmentTest.php
│           │   ├── AssignmentStudentTest.php
│           │   ├── AssignmentRequirementTest.php
│           │   ├── AssignmentStructureTest.php
│           │   └── AssignmentStructureRuleTest.php
│           ├── Repositories/
│           │   ├── GitConnectionTest.php
│           │   ├── RepositoryTest.php
│           │   ├── AssignmentRepositoryTest.php
│           │   └── AssignmentStudentRepositoryTest.php
│           ├── Submissions/
│           │   └── SubmissionTest.php
│           └── Reviews/
│               ├── AnalysisRunTest.php
│               ├── AnalysisResultTest.php
│               └── AnalysisIssueTest.php
├── Unit/
│   ├── Services/
│   │   ├── AssignmentServiceTest.php
│   │   ├── SubmissionServiceTest.php
│   │   ├── GitRepositoryServiceTest.php
│   │   └── AIReviewServiceTest.php
│   ├── Jobs/
│   │   ├── CloneGitRepositoryJobTest.php
│   │   └── AnalyzeSubmissionJobTest.php
│   ├── Models/
│   │   └── RelationshipTest.php
│   └── Support/
└── TestCase.php
```

The folder structure mirrors `app/Http/Controllers/Api/V1/` and `app/Services/`. Add files as features are built.

---

## 5. Feature Tests vs Unit Tests

| Type    | Location         | What It Tests                                                                               | Uses Database    |
|---------|------------------|---------------------------------------------------------------------------------------------|------------------|
| Feature | `tests/Feature/` | Full HTTP request through routes, middleware, validation, policies, services, and resources | Yes              |
| Unit    | `tests/Unit/`    | A single Service, Job, Model, Enum, or helper in isolation                                  | Only when needed |

**Guideline:** Most behavior in this project should be covered by feature tests, because authorization, validation, and response format are only verified through the full request lifecycle. Use unit tests for complex service logic, AI output parsing, and job behavior.

---

## 6. Naming Conventions

- Test classes end with `Test`, such as `SubmissionTest`.
- Test methods describe the behavior in plain language:

```php
public function test_teacher_can_create_assignment(): void
public function test_student_cannot_view_another_students_submission(): void
public function test_submission_requires_student_to_be_enrolled(): void
public function test_retrying_analysis_does_not_delete_previous_runs(): void
```

- Pest tests use the same wording:

```php
it('prevents a student from viewing another student\'s submission');
```

---

## 7. Factories

Every model has a factory in `database/factories/`.

| Factory                              | Notes                                                      |
|--------------------------------------|------------------------------------------------------------|
| `RoleFactory`                        | States: `admin()`, `teacher()`, `student()`                |
| `UserFactory`                        | States: `admin()`, `teacher()`, `student()`                |
| `AssignmentFactory`                  | Belongs to a teacher                                       |
| `AssignmentStudentFactory`           | Links a student to an assignment                           |
| `AssignmentRequirementFactory`       | Belongs to an assignment                                   |
| `AssignmentStructureFactory`         | Belongs to an assignment                                   |
| `AssignmentStructureRuleFactory`     | Belongs to a structure                                     |
| `GitConnectionFactory`               | Uses a fake token, never a real one                        |
| `RepositoryFactory`                  | Belongs to a Git connection                                |
| `AssignmentRepositoryFactory`        | States: `template()`, `reference()`                        |
| `AssignmentStudentRepositoryFactory` | Student must be enrolled                                   |
| `SubmissionFactory`                  | Uses a valid fake 40-character `commit_sha`                |
| `AnalysisRunFactory`                 | States: `queued()`, `running()`, `completed()`, `failed()` |
| `AnalysisResultFactory`              | Requirement must belong to the run's assignment            |
| `AnalysisIssueFactory`               | States: `resolved()`, `unresolved()`                       |

### 7.1 Rules

- Factories must produce data that satisfies the relationship rules in `docs/database/relationships.md`.
- Use factory states instead of repeating attribute overrides across tests.
- Factories must never contain real emails, tokens, or repository URLs belonging to real people.

### 7.2 Example State

```php
// database/factories/UserFactory.php

public function teacher(): static
{
    return $this->state(fn () => [
        'role_id' => Role::where('name', 'teacher')->value('id')
            ?? Role::factory()->teacher(),
    ]);
}
```

Adjust to match how roles are seeded in the project.

---

## 8. Base Test Helpers

Shared helpers belong in `tests/TestCase.php` to keep tests short and consistent.

```php
// tests/TestCase.php

namespace Tests;

use App\Models\Assignment;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    protected function actingAsTeacher(): User
    {
        $teacher = User::factory()->teacher()->create();
        Sanctum::actingAs($teacher);

        return $teacher;
    }

    protected function actingAsStudent(): User
    {
        $student = User::factory()->student()->create();
        Sanctum::actingAs($student);

        return $student;
    }

    protected function actingAsAdmin(): User
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        return $admin;
    }

    protected function enroll(User $student, Assignment $assignment): void
    {
        $assignment->assignmentStudents()->create([
            'student_id' => $student->id,
        ]);
    }
}
```

Use the actual relationship and column names from the Models.

---

## 9. What Every Endpoint Must Test

Each endpoint documented in `docs/backend/api.md` needs tests for these scenarios:

| Scenario                                        | Expected Result                                      |
|-------------------------------------------------|------------------------------------------------------|
| Unauthenticated request                         | `401`                                                |
| Authenticated but wrong role                    | `403`                                                |
| Authenticated but not the owner or not enrolled | `403` or `404`, as documented                        |
| Invalid input                                   | `422` with errors for the correct fields             |
| Valid request                                   | Correct status code and response structure           |
| Database effect                                 | Record created, updated, or soft-deleted as expected |
| Sensitive fields                                | Not present in the response                          |

### 9.1 Example Feature Test

```php
// tests/Feature/Api/V1/Assignments/AssignmentTest.php

namespace Tests\Feature\Api\V1\Assignments;

use App\Models\Assignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_create_assignment(): void
    {
        $this->postJson('/api/v1/assignments', [])
            ->assertUnauthorized();
    }

    public function test_student_cannot_create_assignment(): void
    {
        $this->actingAsStudent();

        $this->postJson('/api/v1/assignments', [
            'title' => 'Laravel CRUD Project',
        ])->assertForbidden();
    }

    public function test_assignment_requires_title(): void
    {
        $this->actingAsTeacher();

        $this->postJson('/api/v1/assignments', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_teacher_can_create_assignment(): void
    {
        $teacher = $this->actingAsTeacher();

        $this->postJson('/api/v1/assignments', [
            'title' => 'Laravel CRUD Project',
            'description' => 'Build a CRUD application for managing books.',
            'due_at' => now()->addMonth()->toIso8601String(),
        ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Laravel CRUD Project')
            ->assertJsonPath('data.teacher.id', $teacher->id);

        $this->assertDatabaseHas('assignments', [
            'title' => 'Laravel CRUD Project',
            'teacher_id' => $teacher->id,
            'created_by_user' => $teacher->id,
        ]);
    }

    public function test_teacher_id_from_request_is_ignored(): void
    {
        $teacher = $this->actingAsTeacher();
        $otherTeacher = User::factory()->teacher()->create();

        $this->postJson('/api/v1/assignments', [
            'title' => 'Laravel CRUD Project',
            'teacher_id' => $otherTeacher->id,
        ])->assertCreated();

        $this->assertDatabaseHas('assignments', [
            'title' => 'Laravel CRUD Project',
            'teacher_id' => $teacher->id,
        ]);
    }

    public function test_teacher_cannot_update_another_teachers_assignment(): void
    {
        $this->actingAsTeacher();
        $assignment = Assignment::factory()->create();

        $this->patchJson("/api/v1/assignments/{$assignment->id}", [
            'title' => 'Changed',
        ])->assertForbidden();
    }
}
```

---

## 10. Authorization Tests

Authorization is the highest-risk area of the application. Every rule below must have at least one test.

| Rule                                              | Example Test                                                 |
|---------------------------------------------------|--------------------------------------------------------------|
| A teacher manages only their own assignments      | `test_teacher_cannot_update_another_teachers_assignment`     |
| A student sees only enrolled assignments          | `test_student_cannot_view_unenrolled_assignment`             |
| A student sees only their own submissions         | `test_student_cannot_view_another_students_submission`       |
| A student sees only their own analysis results    | `test_student_cannot_view_another_students_analysis_results` |
| `REFERENCE` repositories are hidden from students | `test_student_cannot_see_reference_repository`               |
| A student submits only to enrolled assignments    | `test_unenrolled_student_cannot_submit`                      |
| Only owner teachers or admins resolve issues      | `test_student_cannot_resolve_analysis_issue`                 |
| Users cannot change their own role                | `test_user_cannot_change_own_role`                           |
| Git connections are private to their owner        | `test_user_cannot_view_another_users_git_connection`         |

### 10.1 Example: Cross-Student Access

```php
public function test_student_cannot_view_another_students_submission(): void
{
    $owner = User::factory()->student()->create();
    $submission = Submission::factory()->for($owner, 'student')->create();

    $this->actingAsStudent();

    $this->getJson("/api/v1/submissions/{$submission->id}")
        ->assertNotFound();
}
```

Use `assertForbidden()` or `assertNotFound()` according to the rule in `docs/backend/api.md`.

---

## 11. Relationship and Business Rule Tests

The rules in `docs/database/relationships.md` must be enforced by the application and covered by tests.

| Relationship Rule                                                       | Test                                                                                                    |
|-------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| A user has exactly one role                                             | `users.role_id` is required and references `roles`                                                      |
| An assignment can have multiple structures                              | Creating a second structure succeeds                                                                    |
| An assignment can have multiple repositories                            | Linking both a `TEMPLATE` and a `REFERENCE` succeeds                                                    |
| A submission can have multiple analysis runs                            | A retry creates a new run and keeps the old one                                                         |
| An analysis result's requirement belongs to the submission's assignment | Storing a result with a requirement from another assignment fails                                       |
| A student repository belongs to an enrolled student                     | Linking a repository for an unenrolled student returns `422` or `403`                                   |
| Audit fields use the correct foreign keys                               | `created_by_user`, `updated_by_user`, `deleted_by_user` are set from the authenticated user             |
| Soft deletion keeps history                                             | Soft-deleting an assignment, repository, or requirement does not remove submissions or analysis results |

### 11.1 Example: Requirement Must Match the Assignment

```php
public function test_analysis_result_rejects_requirement_from_another_assignment(): void
{
    $run = AnalysisRun::factory()->create();
    $foreignRequirement = AssignmentRequirement::factory()->create();

    $this->expectException(InvalidAnalysisResultException::class);

    app(AIReviewService::class)->storeResults($run, [
        [
            'requirement_id' => $foreignRequirement->id,
            'status' => 'MET',
            'score' => 10,
        ],
    ]);
}
```

The exception and method names are examples. Use the names defined in the service.

### 11.2 Example: Soft Deletion Keeps History

```php
public function test_soft_deleting_assignment_keeps_submissions_and_results(): void
{
    $admin = $this->actingAsAdmin();
    $run = AnalysisRun::factory()->completed()->hasResults(2)->create();
    $assignment = $run->submission->assignment;

    $this->deleteJson("/api/v1/assignments/{$assignment->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('assignments', [
        'id' => $assignment->id,
        'deleted_by_user' => $admin->id,
    ]);
    $this->assertDatabaseHas('submissions', ['id' => $run->submission_id]);
    $this->assertDatabaseCount('analysis_results', 2);
}
```

---

## 12. Validation Tests

For each Form Request, test:

- Required fields are enforced.
- Field types, formats, and lengths are enforced.
- IDs must exist and must be accessible to the current user.
- Enum fields accept only defined values, such as `TEMPLATE` and `REFERENCE`.
- Client-provided values for `teacher_id`, `student_id`, `created_by_user`, `updated_by_user`, `deleted_by_user`, and `resolved_by_user` are ignored.

Use data providers to cover many invalid inputs without duplicating tests:

```php
/**
 * @dataProvider invalidRepositoryUrls
 */
public function test_repository_url_is_rejected(string $url): void
{
    $student = $this->actingAsStudent();
    $connection = GitConnection::factory()->for($student)->create();

    $this->postJson("/api/v1/git-connections/{$connection->id}/repositories", [
        'url' => $url,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['url']);
}

public static function invalidRepositoryUrls(): array
{
    return [
        'not a url' => ['not-a-url'],
        'http instead of https' => ['http://github.com/user/repo.git'],
        'file scheme' => ['file:///etc/passwd'],
        'localhost' => ['https://localhost/repo.git'],
        'private network' => ['https://192.168.1.10/repo.git'],
        'cloud metadata address' => ['https://169.254.169.254/latest'],
        'unsupported host' => ['https://unknown-git-host.example/repo.git'],
    ];
}
```

---

## 13. Testing Queued Jobs

### 13.1 Dispatching

Feature tests confirm that jobs are dispatched, without running them.

```php
public function test_creating_submission_dispatches_analysis_job(): void
{
    Queue::fake();

    $student = $this->actingAsStudent();
    $assignment = Assignment::factory()->create();
    $this->enroll($student, $assignment);
    $studentRepository = AssignmentStudentRepository::factory()
        ->for($assignment)
        ->for($student, 'student')
        ->create();

    $this->postJson("/api/v1/assignments/{$assignment->id}/submissions", [
        'repository_id' => $studentRepository->repository_id,
        'branch' => 'main',
        'commit_sha' => str_repeat('a', 40),
    ])->assertCreated();

    Queue::assertPushed(AnalyzeSubmissionJob::class);
}
```

### 13.2 Job Behavior

Unit tests run the job directly and cover:

- Successful execution updates the analysis run to `completed` and stores results.
- A provider failure marks the run as `failed` with a safe error message.
- Running the same job twice does not create duplicate results.
- Timeouts and retries are configured as expected (`$tries`, `$timeout`, `backoff()`).
- The `failed()` method updates the run status after the final retry.
- Temporary repository files are removed after success and after failure.

### 13.3 Concurrent Runs

```php
public function test_cannot_start_analysis_while_one_is_running(): void
{
    $this->actingAsAdmin();
    $run = AnalysisRun::factory()->running()->create();

    $this->postJson("/api/v1/submissions/{$run->submission_id}/analysis-runs")
        ->assertConflict();
}
```

---

## 14. Testing AI Integration

Tests must never call a real AI provider.

### 14.1 Faking the Provider

```php
Http::fake([
    'api.ai-provider.example/*' => Http::response([
        'results' => [
            [
                'requirement_id' => $requirement->id,
                'status' => 'PARTIALLY_MET',
                'score' => 12,
                'feedback' => 'ISBN uniqueness is not enforced.',
            ],
        ],
        'issues' => [],
    ], 200),
]);
```

Replace the URL pattern with the provider endpoint used by the project. If the AI client is injected as an interface, bind a fake implementation in the test instead.

### 14.2 Required AI Test Cases

| Case                      | Expected Behavior                                               |
|---------------------------|-----------------------------------------------------------------|
| Valid structured response | Results and issues are stored                                   |
| Malformed JSON            | Run is marked `failed`; nothing partial is stored               |
| Missing required fields   | Response is rejected by validation                              |
| Unknown `requirement_id`  | Result is rejected                                              |
| Score above maximum       | Result is rejected or clamped, per `docs/business/ai-review.md` |
| Provider timeout          | Run is marked `failed` or retried                               |
| Provider `429` rate limit | Job is released back to the queue with a delay                  |
| Provider `500` error      | Job retries, then fails safely                                  |
| Retry after success       | No duplicate results                                            |

### 14.3 Rules

- AI output is treated as untrusted input and is validated before it is stored.
- Assert that the request sent to the provider does not include secrets or Git tokens.
- Assert that submitted code is never executed during analysis outside an isolated environment.

---

## 15. Testing Git Integration

Tests must never clone real repositories or call real Git providers.

- Fake provider APIs with `Http::fake()`.
- Fake or mock the Git client used by `GitRepositoryService`.
- Use `Storage::fake()` or a temporary directory for cloned files.

Required cases:

- A valid repository URL is accepted.
- Unsafe URLs are rejected (see section 12).
- A token without repository access is rejected.
- Clone timeout is handled.
- Temporary files are cleaned up after success and failure.
- Repository scripts and hooks are not executed.
- Git tokens never appear in responses, logs, exceptions, or job payloads.

---

## 16. Response Format and Security Tests

### 16.1 Response Structure

Use `assertJsonStructure()` to lock the documented response shape:

```php
$this->getJson("/api/v1/submissions/{$submission->id}")
    ->assertOk()
    ->assertJsonStructure([
        'data' => [
            'id',
            'assignment_id',
            'student' => ['id', 'name'],
            'repository' => ['id', 'url'],
            'branch',
            'commit_sha',
            'submitted_at',
        ],
    ]);
```

Paginated lists must include `data`, `links`, and `meta`.

### 16.2 Sensitive Data

```php
public function test_git_connection_response_never_contains_token(): void
{
    $user = $this->actingAsStudent();
    $connection = GitConnection::factory()->for($user)->create([
        'access_token' => 'ghp_secret_value',
    ]);

    $this->getJson("/api/v1/git-connections/{$connection->id}")
        ->assertOk()
        ->assertJsonMissingPath('data.access_token')
        ->assertDontSee('ghp_secret_value');
}
```

Also test that:

- User responses never include `password` or `remember_token`.
- Error responses never include stack traces when `APP_DEBUG=false`.
- Rate-limited endpoints return `429` after the limit is exceeded.

---

## 17. Running Tests

```bash
# Run the full test suite
php artisan test

# Run in parallel
php artisan test --parallel

# Run one file
php artisan test tests/Feature/Api/V1/Submissions/SubmissionTest.php

# Run tests matching a name
php artisan test --filter=test_student_cannot_view_another_students_submission

# Run with coverage (requires Xdebug or PCOV)
php artisan test --coverage --min=80
```

Before running tests for the first time:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS student_assignment_review_ai_test;"
php artisan migrate --env=testing
```

---

## 18. Coverage Targets

| Area                               | Target                                          |
|------------------------------------|-------------------------------------------------|
| Policies and authorization         | Every rule tested                               |
| API endpoints                      | Every documented endpoint tested                |
| Services                           | 80% line coverage or higher                     |
| AI response parsing and validation | 90% line coverage or higher                     |
| Jobs                               | Success, failure, retry, and idempotency tested |
| Overall                            | 80% line coverage or higher                     |

Coverage numbers are a guide. A tested permission boundary is worth more than a covered getter.

---

## 19. Continuous Integration

The CI pipeline should run on every pull request:

1. Install dependencies with `composer install`.
2. Start a MySQL service using the same major version as production.
3. Run migrations against the test database.
4. Run the formatter check, such as `./vendor/bin/pint --test`.
5. Run static analysis if configured, such as Larastan.
6. Run `php artisan test --parallel`.
7. Fail the build if any test fails or coverage drops below the target.

CI must use fake credentials only. Real secrets are never needed to run the test suite.

---

## 20. Rules for AI Coding Agents

Before writing tests:

1. Read `docs/backend/api.md` for the endpoint's documented behavior and access rules.
2. Read `docs/database/relationships.md` for the rules the data must satisfy.
3. Check existing tests and factories and reuse them.

While writing tests:

1. Cover success, validation failure, unauthenticated, and unauthorized cases.
2. Fake all queues, AI providers, Git providers, mail, and storage.
3. Never use real credentials, tokens, or external URLs belonging to real people.
4. Do not weaken or delete an existing test to make new code pass.
5. Do not mark tests as skipped without a documented reason.

After writing tests:

1. Run the relevant tests with `php artisan test`.
2. Report the actual command run and the actual result.
3. **Never claim tests passed unless they were executed and passed.**
4. If tests could not be run, say so clearly and explain why.

---

## 21. Summary

- Test every endpoint for success, validation, authentication, and authorization.
- Use a real MySQL test database, never a shared or production one.
- Use factories that respect the documented relationships.
- Fake every external service: AI providers, Git providers, queues, mail, and storage.
- Treat authorization and data isolation between students as the highest-priority tests.
- Confirm that history is preserved: retries create new runs and soft deletion keeps results.
- Never expose or commit secrets in tests.
- Report real test results only.
