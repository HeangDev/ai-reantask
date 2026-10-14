# Laravel Backend Architecture

## 1. Overview

### Project

Student Assignment Review AI

### Technology Stack

- Backend Framework: Laravel
- Programming Language: PHP
- Database: MySQL
- ORM: Laravel Eloquent
- API: RESTful API
- Authentication: Follow the project's configured authentication system.
- Authorization: Laravel Policies and Gates
- Validation: Laravel Form Requests
- Background Processing: Laravel Queues
- Testing: PHPUnit or Pest, based on the project configuration.

### Architecture Goals

- Maintain clean and readable code.
- Separate responsibilities between layers.
- Make features easy to maintain and extend.
- Reuse business logic without duplication.
- Protect data through authentication and authorization.
- Support asynchronous AI reviews and Git operations.
- Make the application easy for AI coding agents to understand.

---

## 2. Architecture Pattern

Use a feature-oriented organization with Laravel's standard application layers.

The main responsibilities are:

- Controllers: Handle HTTP requests and responses.
- Form Requests: Validate incoming requests.
- Models: Represent database entities and relationships.
- Services: Coordinate business logic and application operations.
- Policies: Control resource access.
- Jobs: Execute asynchronous tasks.
- API Resources: Format API responses.
- Events and Listeners: Handle decoupled application events when needed.

Do not introduce unnecessary abstractions. Follow existing project conventions and introduce additional layers only when they provide clear value.

---

## 3. Recommended Project Structure

```text
project-root/
├── app/
│   ├── Console/
│   ├── Enums/
│   ├── Events/
│   ├── Exceptions/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   │           ├── Auth/
│   │   │           ├── Assignments/
│   │   │           ├── Submissions/
│   │   │           ├── Repositories/
│   │   │           ├── Reviews/
│   │   │           └── Users/
│   │   ├── Middleware/
│   │   ├── Requests/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   └── Resources/
│   │       └── Api/
│   │           └── V1/
│   ├── Jobs/
│   │   ├── Git/
│   │   └── AI/
│   ├── Listeners/
│   ├── Models/
│   ├── Policies/
│   ├── Providers/
│   ├── Services/
│   │   ├── Assignments/
│   │   ├── Submissions/
│   │   ├── Git/
│   │   └── AI/
│   └── Support/
├── bootstrap/
├── config/
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── docs/
│   ├── backend/
│   │   ├── architecture.md
│   │   ├── api.md
│   │   ├── authentication.md
│   │   ├── authorization.md
│   │   ├── error-handling.md
│   │   └── testing.md
│   ├── database/
│   │   ├── database.md
│   │   ├── database-performance.md
│   │   ├── database-rules.md
│   │   └── relationships.md
│   └── business/
│       ├── business-rules.md
│       ├── assignments.md
│       ├── submissions.md
│       ├── git-integration.md
│       └── ai-review.md
├── resources/
├── routes/
│   ├── api.php
│   ├── console.php
│   └── web.php
├── storage/
├── tests/
│   ├── Feature/
│   └── Unit/
├── .env.example
├── AGENTS.md
├── CLAUDE.md
├── composer.json
└── README.md
```

Note: This is a recommended structure, not a list of folders that Laravel creates automatically. Add folders as features require them.

---

## 4. Layer Responsibilities

### 4.1 Controllers

Location:

`app/Http/Controllers/Api/V1/`

Responsibilities:

- Receive HTTP requests.
- Invoke authorization and application operations.
- Call the appropriate Service when business logic requires it.
- Return API Resources or appropriate HTTP responses.

Rules:

- Keep controllers small.
- Do not put complex business logic in controllers.
- Do not write raw database operations directly in controllers when a Model or Service is appropriate.
- Do not duplicate validation already handled by Form Requests.

### 4.2 Form Requests

Location:

`app/Http/Requests/Api/V1/`

Responsibilities:

- Validate request input.
- Define authorization checks when appropriate.
- Provide validated data to the application layer.

Rules:

- Use Form Requests for non-trivial request validation.
- Validate IDs, formats, lengths, quantities, and required fields.
- Never trust client-provided ownership or permission values.
- Keep business authorization rules in Policies or the appropriate application layer.

### 4.3 Models

Location:

`app/Models/`

Responsibilities:

- Represent database tables.
- Define Eloquent relationships.
- Define casts and appropriate model-level behavior.
- Support querying and persistence.

Rules:

- Follow `docs/database/database.md`.
- Follow `docs/database/relationships.md`.
- Follow `docs/database/database-rules.md`.
- Do not create relationships that conflict with the documented schema.
- Avoid putting large application workflows inside Models.

### 4.4 Services

Location:

`app/Services/`

Responsibilities:

- Coordinate business operations.
- Apply business rules.
- Coordinate multiple Models or external integrations.
- Manage transactions where required.
- Return results or raise appropriate application exceptions.

Examples:

- `AssignmentService`
- `SubmissionService`
- `GitRepositoryService`
- `AIReviewService`

Rules:

- Create a Service when logic is complex, reused, or spans multiple responsibilities.
- Avoid creating a Service for every simple CRUD operation without a clear need.
- Keep database transactions around operations that must succeed or fail together.
- Do not duplicate business rules across Controllers and Services.

### 4.5 Policies

Location:

`app/Policies/`

Responsibilities:

- Determine whether a user can perform an action on a resource.
- Enforce ownership and access restrictions.

Examples:

- A teacher can manage assignments they own.
- A student can access only assignments they are authorized to join.
- A student cannot view another student's private submission.
- Only authorized users can view AI review results.

Rules:

- Enforce authorization on the server.
- Never rely only on frontend permissions.
- Check resource ownership and relationships before sensitive operations.

### 4.6 API Resources

Location:

`app/Http/Resources/Api/V1/`

Responsibilities:

- Format API responses consistently.
- Control which fields are exposed.
- Format relationships and nested data.

Rules:

- Do not expose passwords, private tokens, or sensitive Git credentials.
- Avoid returning unrestricted Model data directly.
- Use consistent field names and response structures.

### 4.7 Jobs

Location:

`app/Jobs/`

Responsibilities:

- Execute long-running tasks asynchronously.
- Retry recoverable failures when appropriate.
- Avoid blocking ordinary HTTP requests.

Examples:

- `CloneGitRepositoryJob`
- `AnalyzeSubmissionJob`
- `GenerateAIReviewJob`

Rules:

- Use queues for long-running AI analysis and repository operations when appropriate.
- Configure retries, timeouts, and failure handling.
- Ensure repeated job execution does not create duplicate results or unsafe side effects.
- Track job status when users need to monitor progress.

### 4.8 Events and Listeners

Locations:

- `app/Events/`
- `app/Listeners/`

Responsibilities:

- Decouple actions from secondary reactions.
- Handle notifications and other event-driven behavior when useful.

Examples:

- Submission received.
- AI review completed.
- AI review failed.

Do not introduce events where a direct method call is simpler and clearer.

---

## 5. Feature Organization

Organize files by responsibility while grouping related code under consistent feature names.

### Assignments

- Controller: `AssignmentController`
- Form Requests: `StoreAssignmentRequest`, `UpdateAssignmentRequest`
- Model: `Assignment`
- Service: `AssignmentService`
- Policy: `AssignmentPolicy`
- Resource: `AssignmentResource`

### Submissions

- Controller: `SubmissionController`
- Form Requests: `StoreSubmissionRequest`
- Model: `Submission`
- Service: `SubmissionService`
- Policy: `SubmissionPolicy`
- Resource: `SubmissionResource`

### AI Reviews

- Controller: `AIReviewController`
- Model: `AIReview`
- Service: `AIReviewService`
- Jobs: `AnalyzeSubmissionJob`, `GenerateAIReviewJob`
- Resource: `AIReviewResource`

The names above are examples. Use the actual table names and existing domain model names defined by the project.

---

## 6. Request Lifecycle

A typical API request follows this flow:

```text
Client
  |
  v
API Route
  |
  v
Authentication Middleware
  |
  v
Form Request Validation
  |
  v
Controller
  |
  v
Policy / Authorization
  |
  v
Service
  |
  v
Model / Database
  |
  v
API Resource
  |
  v
JSON Response
```

Some requests may authorize access through Form Requests, middleware, or policies at different points. Always ensure authorization occurs before protected data is modified or exposed.

---

## 7. API Versioning

Use versioned routes for public API endpoints.

Example:

```php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Assignments\AssignmentController;

Route::prefix('v1')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource(
            'assignments',
            AssignmentController::class
        );
    });
});
```

The actual authentication middleware must match the authentication system configured in the project.

Rules:

- Keep API routes organized and readable.
- Use appropriate HTTP methods and status codes.
- Do not place complex business logic in route definitions.
- Document public endpoints in `docs/backend/api.md`.
- Introduce a new API version when incompatible changes require it.

---

## 8. Database Architecture

MySQL is the primary relational database.

Rules:

- Use Laravel migrations to manage schema changes.
- Define foreign keys and indexes where appropriate.
- Use Eloquent relationships consistently.
- Apply transactions to operations requiring atomicity.
- Avoid N+1 queries through eager loading where appropriate.
- Use pagination for large collections.
- Follow documented naming, timestamp, audit-field, and soft-delete conventions.

The following documents are the database references:

- `docs/database/database.md`
- `docs/database/database-rules.md`
- `docs/database/relationships.md`

Do not independently redesign the schema while implementing an unrelated feature.

---

## 9. AI Review Architecture

The AI review process should be separated from the ordinary request lifecycle.

Recommended workflow:

```text
Student Submission
        |
        v
Validate Submission
        |
        v
Authorize Access
        |
        v
Create Review Record
        |
        v
Dispatch Background Job
        |
        v
Retrieve Repository Safely
        |
        v
Inspect Files and Requirements
        |
        v
Run AI Analysis
        |
        v
Validate and Store Results
        |
        v
Update Review Status
        |
        v
Notify Authorized Users
```

Rules:

- Store the submission and review status.
- Associate each review with the exact submission and analyzed commit SHA.
- Keep review history instead of silently overwriting previous results.
- Handle provider timeouts, rate limits, and failures.
- Do not trust AI-generated output without validating its structure.
- Do not execute submitted code on the application server without an isolated execution environment.
- Protect API keys and repository credentials.
- Use idempotency or equivalent safeguards where retries could create duplicate results.

Refer to `docs/business/ai-review.md` for detailed workflow rules.

---

## 10. Git Integration Architecture

Responsibilities should be separated from submission handling when Git operations become complex.

Suggested components:

- `GitRepositoryService`: Coordinates repository operations.
- `CloneGitRepositoryJob`: Retrieves repository content asynchronously.
- Git configuration or provider-specific clients: Encapsulate Git hosting integrations.

Rules:

- Validate repository URLs and access permissions.
- Protect credentials and tokens.
- Avoid exposing private repository contents to unauthorized users.
- Use timeouts and isolated temporary storage.
- Clean up temporary files after processing.
- Prevent unsafe repository URLs and server-side request forgery.
- Do not execute repository scripts automatically.

---

## 11. Error Handling

Use consistent HTTP status codes and response formats.

Examples:

- `200 OK`: Successful read or update.
- `201 Created`: Resource created.
- `204 No Content`: Successful operation without a response body.
- `401 Unauthorized`: Authentication is required or invalid.
- `403 Forbidden`: The user lacks permission.
- `404 Not Found`: The resource does not exist or should not be disclosed.
- `422 Unprocessable Content`: Validation failed.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unexpected server failure.

Rules:

- Do not expose stack traces or internal secrets in production responses.
- Log useful diagnostic information without logging sensitive credentials.
- Follow `docs/backend/error-handling.md` for the actual API error format.

---

## 12. Testing Architecture

Organize tests under:

- `tests/Feature/`
- `tests/Unit/`

Feature tests should cover:

- Authentication.
- Authorization and resource ownership.
- Assignment creation and management.
- Student enrollment.
- Submission validation.
- AI review lifecycle.
- API response formats.
- Database constraints and transaction behavior.

Unit tests should cover isolated business logic where appropriate.

Rules:

- Use factories for test data where practical.
- Test both successful and failed scenarios.
- Test permission boundaries.
- Use the testing tools already configured in the project.
- Do not claim tests passed unless they were executed successfully.

---

## 13. Security Standards

- Validate all incoming data.
- Enforce authorization on the server.
- Protect secrets through environment configuration.
- Never commit real credentials.
- Rate-limit sensitive endpoints where appropriate.
- Validate uploaded files and repository contents.
- Use safe storage and isolated processing for untrusted files.
- Protect against SQL injection, insecure direct object references, and server-side request forgery.
- Keep production debugging disabled.
- Do not expose sensitive information through API Resources or logs.

---

## 14. Code Quality Rules

- Follow Laravel and PHP conventions.
- Use clear, descriptive names.
- Keep methods focused on one responsibility.
- Avoid duplicated business logic.
- Avoid unnecessary design patterns and abstractions.
- Use dependency injection for replaceable services and external integrations.
- Add tests for meaningful business behavior changes.
- Keep API documentation synchronized with implementation.
- Follow the repository's configured formatter and static-analysis tools.

---

## 15. Documentation References

Before implementing a feature, consult the relevant documents:

| Document | Purpose |
|---|---|
| `CLAUDE.md` | AI coding instructions |
| `AGENTS.md` | Coding, security, and testing rules |
| `docs/backend/architecture.md` | Backend architecture |
| `docs/backend/api.md` | API endpoints and contracts |
| `docs/backend/authentication.md` | Authentication rules |
| `docs/backend/authorization.md` | Permissions and access control |
| `docs/backend/error-handling.md` | API error conventions |
| `docs/backend/testing.md` | Testing standards |
| `docs/database/database.md` | Database schema |
| `docs/database/database-rules.md` | Database design standards |
| `docs/database/relationships.md` | Entity relationships |
| `docs/business/business-rules.md` | Business rules |
| `docs/business/ai-review.md` | AI review workflow |

---

## 16. Rules for AI Coding Agents

Before making changes:

1. Read the relevant documentation.
2. Inspect the existing implementation.
3. Confirm the affected tables, Models, and relationships.
4. Identify authorization and validation requirements.
5. Determine whether database changes or background jobs are required.

During implementation:

1. Follow the existing architecture.
2. Reuse existing components where appropriate.
3. Avoid unrelated modifications.
4. Create migrations for database schema changes.
5. Add or update tests.

After implementation:

1. Run relevant tests and quality checks.
2. Review security and authorization behavior.
3. Update affected documentation.
4. Report modified files and actual test results.
5. Document any remaining limitations.

Do not invent undocumented business rules or change database relationships without justification.

---

## 17. Final Architecture Principles

- Keep controllers thin.
- Keep business operations in appropriate application services.
- Use Form Requests for request validation.
- Use Policies and Gates for authorization.
- Use Eloquent Models for persistence and relationships.
- Use Jobs for long-running asynchronous tasks.
- Use API Resources for consistent responses.
- Keep AI and Git integrations isolated behind clear interfaces.
- Treat database documentation and business rules as project references.
- Prefer simple, maintainable solutions over unnecessary complexity.
