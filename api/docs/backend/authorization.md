# Authorization

**Project:** Student Assignment Review AI  
**Backend:** Laravel  
**Database:** MySQL  
**Authorization Tools:** Laravel Policies and Gates

---

## 1. Overview

This document defines who can do what in the Student Assignment Review AI API, and how those rules are enforced in code.

**Authentication** answers: *Who is this user?* (see `docs/backend/authentication.md`)  
**Authorization** answers: *What is this user allowed to do?*

Related documents:

- `docs/backend/architecture.md`
- `docs/backend/api.md`
- `docs/backend/authentication.md`
- `docs/backend/error-handling.md`
- `docs/backend/testing.md`
- `docs/database/relationships.md`

### Goals

- Every protected action is checked on the server.
- Students can see only their own work and the assignments they are enrolled in.
- Teachers can manage only their own assignments and the work submitted to them.
- Private data, such as Git tokens and reference solutions, is never exposed to the wrong user.
- Rules are defined once, in Policies, and reused everywhere.

---

## 2. Principles

1. **Deny by default.** If a Policy does not explicitly allow an action, it is denied.
2. **Check on the server.** Hiding a button in the frontend is not authorization.
3. **Check ownership, not just role.** Being a teacher does not give access to every assignment.
4. **Never trust client-provided ownership.** `teacher_id`, `student_id`, `created_by_user`, and similar fields are always set from the authenticated user.
5. **Hide what users should not know exists.** Return `404` for private resources and `403` for visible resources the user cannot act on.
6. **Filter lists, not just single records.** Index endpoints return only records the user is allowed to see.
7. **One place for each rule.** Access rules live in Policies; Controllers and Services call them instead of repeating the logic.

---

## 3. Roles

Each user has exactly one role through `users.role_id` (see `docs/database/relationships.md`).

| Role        | Summary                                                                                                   |
|-------------|-----------------------------------------------------------------------------------------------------------|
| **Admin**   | Manages users and roles, and can view and manage all academic data                                        |
| **Teacher** | Creates and manages their own assignments, enrolls students, and reviews submissions to their assignments |
| **Student** | Joins assignments, connects Git accounts, links repositories, and submits work                            |

Use the role names stored in the `roles` table. If they differ from the names above, update this document.

### 3.1 Role Enum

```php
// app/Enums/RoleName.php

namespace App\Enums;

enum RoleName: string
{
    case Admin = 'admin';
    case Teacher = 'teacher';
    case Student = 'student';
}
```

### 3.2 Role Helpers on the User Model

```php
// app/Models/User.php

use App\Enums\RoleName;

public function role(): BelongsTo
{
    return $this->belongsTo(Role::class);
}

public function hasRole(RoleName $role): bool
{
    return $this->role?->name === $role->value;
}

public function isAdmin(): bool
{
    return $this->hasRole(RoleName::Admin);
}

public function isTeacher(): bool
{
    return $this->hasRole(RoleName::Teacher);
}

public function isStudent(): bool
{
    return $this->hasRole(RoleName::Student);
}
```

Eager-load `role` on the authenticated user to avoid repeated queries.

**Rule:** Never compare role IDs directly, such as `$user->role_id === 2`. IDs can differ between environments.

---

## 4. Ownership Relationships

Authorization decisions are based on these relationships:

| Relationship             | Meaning                                                                    | Source                                 |
|--------------------------|----------------------------------------------------------------------------|----------------------------------------|
| Assignment owner         | `assignments.teacher_id = user.id`                                         | `Assignment::teacher`                  |
| Enrolled student         | A non-deleted `assignment_students` row exists for the assignment and user | `Assignment::assignmentStudents`       |
| Submission owner         | `submissions.student_id = user.id`                                         | `Submission::student`                  |
| Git connection owner     | `git_connections.user_id = user.id`                                        | `GitConnection::user`                  |
| Repository owner         | The repository's Git connection belongs to the user                        | `Repository::gitConnection`            |
| Student repository owner | `assignment_student_repositories.student_id = user.id`                     | `AssignmentStudentRepository::student` |

Most child resources inherit access from their parent:

```text
Assignment
├── AssignmentStudent           → access from Assignment
├── AssignmentRequirement       → access from Assignment
├── AssignmentStructure         → access from Assignment
│   └── AssignmentStructureRule → access from Assignment
├── AssignmentRepository        → access from Assignment (+ type rule)
├── AssignmentStudentRepository → access from Assignment + student owner
└── Submission                  → access from Assignment + student owner
    └── AnalysisRun             → access from Submission
        ├── AnalysisResult      → access from Submission
        └── AnalysisIssue       → access from Submission
```

### 4.1 Shared Helpers

Put common checks on the Models so every Policy uses the same logic:

```php
// app/Models/Assignment.php

public function isOwnedBy(User $user): bool
{
    return $this->teacher_id === $user->id;
}

public function hasStudent(User $user): bool
{
    return $this->assignmentStudents()
        ->where('student_id', $user->id)
        ->exists();
}
```

```php
// app/Models/Submission.php

public function isOwnedBy(User $user): bool
{
    return $this->student_id === $user->id;
}
```

Use the column names defined in `docs/database/database.md`.

---

## 5. Permission Matrix

**Legend**

- ✅ Allowed
- **Own** Allowed only for records the user owns
- **Enrolled** Allowed only for assignments the student is enrolled in
- **Assigned** Allowed only for records belonging to the teacher's own assignments
- ❌ Denied

### 5.1 Users and Roles

| Action                    | Admin             | Teacher   | Student   |
|---------------------------|-------------------|-----------|-----------|
| List roles                | ✅                 | ❌         | ❌         |
| List users                | ✅                 | ❌         | ❌         |
| Create user               | ✅                 | ❌         | ❌         |
| List pending students, approve a pending student | ✅ | ✅ | ❌ |
| View user                 | ✅                 | Own       | Own       |
| Update user profile       | ✅                 | Own       | Own       |
| View a user's login sessions | ✅               | Own       | Own       |
| Change a user's email     | ✅                 | ❌         | ❌         |
| Change a user's role      | ✅ (not their own) | ❌         | ❌         |
| Change a user's status    | ✅ (not their own) | ❌         | ❌         |
| Delete user               | ✅ (not their own) | ❌         | ❌         |
| Delete own account (`DELETE /auth/account`) | ❌ | ✅ | ✅ |

Response codes: listing roles or users, or creating a user, as a non-admin returns `403`. Viewing, updating, or deleting **another** user as a non-admin returns `404`, because the user must not learn that the account exists. A non-admin deleting their own account, an admin deleting their own account, and any attempt to change one's own role or status return `403`. Non-admins "update user profile" means `fullname` and `phone`.

### 5.2 Assignments and Assignment Content

| Action                      | Admin   | Teacher   | Student   |
|-----------------------------|---------|-----------|-----------|
| List assignments            | ✅       | Own       | Enrolled  |
| Create assignment           | ❌       | ✅         | ❌         |
| View assignment             | ✅       | Own       | Enrolled  |
| Update assignment           | ✅       | Own       | ❌         |
| Delete assignment           | ✅       | Own       | ❌         |
| List enrolled students      | ✅       | Own       | ❌         |
| Enroll / remove students    | ✅       | Own       | ❌         |
| View requirements           | ✅       | Own       | Enrolled  |
| Manage requirements         | ✅       | Own       | ❌         |
| View structures and rules   | ✅       | Own       | Enrolled  |
| Manage structures and rules | ✅       | Own       | ❌         |

Admins do not create assignments because every assignment needs a `teacher_id`. If admins should create assignments on behalf of teachers, add an explicit `teacher_id` input for admins only and document it here.

### 5.3 Git Connections and Repositories

| Action                                                 | Admin   | Teacher                              | Student   |
|--------------------------------------------------------|---------|--------------------------------------|-----------|
| List / create / view / update / delete Git connections | Own     | Own                                  | Own       |
| List / register / update / delete repositories         | Own     | Own                                  | Own       |
| View a repository                                      | ✅       | Own, or linked to an Assigned record | Own       |

Git connections are private to their owner, **including from admins**, because they hold access tokens.

### 5.4 Assignment Repositories

| Action                        | Admin   | Teacher                                     | Student   |
|-------------------------------|---------|---------------------------------------------|-----------|
| View `TEMPLATE` repositories  | ✅       | Own assignment                              | Enrolled  |
| View `REFERENCE` repositories | ✅       | Own assignment                              | ❌ (`404`) |
| Link / unlink repositories    | ✅       | Own assignment, using a repository they own | ❌         |

### 5.5 Student Repositories

| Action                                          | Admin   | Teacher        | Student                               |
|-------------------------------------------------|---------|----------------|---------------------------------------|
| List all student repositories for an assignment | ✅       | Own assignment | ❌                                     |
| View own student repository                     | —       | —              | Enrolled                              |
| Link a repository                               | ❌       | ❌              | Enrolled, using a repository they own |
| Unlink a repository                             | ✅       | Own assignment | Own                                   |

### 5.6 Submissions and Analysis

| Action                                  | Admin   | Teacher        | Student   |
|-----------------------------------------|---------|----------------|-----------|
| List submissions for an assignment      | ✅       | Own assignment | ❌         |
| List own submissions                    | —       | —              | ✅         |
| Create submission                       | ❌       | ❌              | Enrolled  |
| View submission                         | ✅       | Assigned       | Own       |
| Delete submission                       | ✅       | ❌              | ❌         |
| View analysis runs, results, and issues | ✅       | Assigned       | Own       |
| Start a new analysis run                | ✅       | Assigned       | ❌         |
| Resolve / reopen analysis issues        | ✅       | Assigned       | ❌         |

Students cannot start new analysis runs because each run consumes AI provider capacity. If students should be allowed to request re-analysis, add the rule here with a rate limit.

---

## 6. Policies

One Policy per Model, in `app/Policies/`. Laravel discovers Policies automatically when they follow the `{Model}Policy` naming convention.

| Policy                              | Model                         |
|-------------------------------------|-------------------------------|
| `UserPolicy`                        | `User`                        |
| `AssignmentPolicy`                  | `Assignment`                  |
| `AssignmentStudentPolicy`           | `AssignmentStudent`           |
| `AssignmentRequirementPolicy`       | `AssignmentRequirement`       |
| `AssignmentStructurePolicy`         | `AssignmentStructure`         |
| `AssignmentStructureRulePolicy`     | `AssignmentStructureRule`     |
| `GitConnectionPolicy`               | `GitConnection`               |
| `RepositoryPolicy`                  | `Repository`                  |
| `AssignmentRepositoryPolicy`        | `AssignmentRepository`        |
| `AssignmentStudentRepositoryPolicy` | `AssignmentStudentRepository` |
| `SubmissionPolicy`                  | `Submission`                  |
| `AnalysisRunPolicy`                 | `AnalysisRun`                 |
| `AnalysisResultPolicy`              | `AnalysisResult`              |
| `AnalysisIssuePolicy`               | `AnalysisIssue`               |

### 6.1 Admin Access

Do **not** use a global `Gate::before()` that allows admins everything. Some rules apply to admins too, such as Git connection privacy and not deleting their own account.

Each Policy checks `isAdmin()` explicitly where admins are allowed.

### 6.2 Example: AssignmentPolicy

```php
// app/Policies/AssignmentPolicy.php

namespace App\Policies;

use App\Models\Assignment;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class AssignmentPolicy
{
    public function viewAny(User $user): bool
    {
        // Results are filtered by the visibleTo() scope (section 8).
        return true;
    }

    public function view(User $user, Assignment $assignment): Response
    {
        if ($user->isAdmin()
            || $assignment->isOwnedBy($user)
            || ($user->isStudent() && $assignment->hasStudent($user))) {
            return Response::allow();
        }

        return Response::denyAsNotFound();
    }

    public function create(User $user): bool
    {
        return $user->isTeacher();
    }

    public function update(User $user, Assignment $assignment): Response
    {
        return $this->manage($user, $assignment);
    }

    public function delete(User $user, Assignment $assignment): Response
    {
        return $this->manage($user, $assignment);
    }

    public function manageStudents(User $user, Assignment $assignment): Response
    {
        return $this->manage($user, $assignment);
    }

    public function manageContent(User $user, Assignment $assignment): Response
    {
        // Requirements, structures, structure rules, and assignment repositories.
        return $this->manage($user, $assignment);
    }

    public function submit(User $user, Assignment $assignment): Response
    {
        if (! $user->isStudent()) {
            return Response::deny();
        }

        return $assignment->hasStudent($user)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    private function manage(User $user, Assignment $assignment): Response
    {
        if ($user->isAdmin() || $assignment->isOwnedBy($user)) {
            return Response::allow();
        }

        // Enrolled students can see the assignment, so a 403 does not leak anything.
        if ($user->isStudent() && $assignment->hasStudent($user)) {
            return Response::deny();
        }

        return Response::denyAsNotFound();
    }
}
```

### 6.3 Example: SubmissionPolicy

```php
// app/Policies/SubmissionPolicy.php

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SubmissionPolicy
{
    public function view(User $user, Submission $submission): Response
    {
        if ($user->isAdmin()
            || $submission->isOwnedBy($user)
            || $submission->assignment->isOwnedBy($user)) {
            return Response::allow();
        }

        return Response::denyAsNotFound();
    }

    public function analyze(User $user, Submission $submission): Response
    {
        if ($user->isAdmin() || $submission->assignment->isOwnedBy($user)) {
            return Response::allow();
        }

        // The owning student can see the submission but cannot start runs.
        return $submission->isOwnedBy($user)
            ? Response::deny()
            : Response::denyAsNotFound();
    }

    public function delete(User $user, Submission $submission): bool
    {
        return $user->isAdmin();
    }
}
```

### 6.4 Child Policies Delegate to the Parent

Child resources reuse the parent Policy instead of repeating rules:

```php
// app/Policies/AnalysisIssuePolicy.php

namespace App\Policies;

use App\Models\AnalysisIssue;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

class AnalysisIssuePolicy
{
    public function view(User $user, AnalysisIssue $issue): Response
    {
        return Gate::forUser($user)->inspect('view', $issue->analysisRun->submission);
    }

    public function resolve(User $user, AnalysisIssue $issue): Response
    {
        return Gate::forUser($user)->inspect('analyze', $issue->analysisRun->submission);
    }
}
```

### 6.5 Example: GitConnectionPolicy

```php
// app/Policies/GitConnectionPolicy.php

class GitConnectionPolicy
{
    public function view(User $user, GitConnection $connection): Response
    {
        return $connection->user_id === $user->id
            ? Response::allow()
            : Response::denyAsNotFound(); // Admins included.
    }

    public function update(User $user, GitConnection $connection): Response
    {
        return $this->view($user, $connection);
    }

    public function delete(User $user, GitConnection $connection): Response
    {
        return $this->view($user, $connection);
    }
}
```

---

## 7. Where Authorization Happens

| Layer            | Responsibility                                                                  |
|------------------|---------------------------------------------------------------------------------|
| Route middleware | `auth:sanctum` confirms the user is logged in                                   |
| Controller       | Calls `Gate::authorize()` for the action and resource                           |
| Form Request     | Validates that referenced IDs belong to the user (for example, `repository_id`) |
| Query scopes     | Filter list endpoints to records the user can see                               |
| API Resources    | Hide fields and nested data the user must not see                               |
| Services         | Re-check business rules that depend on current state                            |

### 7.1 Controllers

Authorize at the start of every controller action that touches a protected resource:

```php
// app/Http/Controllers/Api/V1/Submissions/SubmissionController.php

use Illuminate\Support\Facades\Gate;

public function store(StoreSubmissionRequest $request, Assignment $assignment): JsonResponse
{
    Gate::authorize('submit', $assignment);

    $submission = $this->submissions->create(
        $request->user(),
        $assignment,
        $request->validated()
    );

    return (new SubmissionResource($submission))
        ->response()
        ->setStatusCode(201);
}

public function show(Submission $submission): SubmissionResource
{
    Gate::authorize('view', $submission);

    return new SubmissionResource($submission->load(['student', 'repository']));
}
```

**Convention:** Use `Gate::authorize()` in Controllers. Form Request `authorize()` methods return `true`, so that every access rule is visible in one place. If the project already uses a different convention consistently, follow it and update this section.

### 7.2 Form Requests: Validating Referenced IDs

A valid ID is not enough. The referenced record must belong to the user:

```php
// app/Http/Requests/Api/V1/StoreSubmissionRequest.php

use Illuminate\Validation\Rule;

public function rules(): array
{
    $assignment = $this->route('assignment');

    return [
        'repository_id' => [
            'required',
            'integer',
            Rule::exists('assignment_student_repositories', 'repository_id')
                ->where('assignment_id', $assignment->id)
                ->where('student_id', $this->user()->id)
                ->whereNull('deleted_at'),
        ],
        'branch' => ['required', 'string', 'max:255'],
        'commit_sha' => ['nullable', 'string', 'regex:/^[0-9a-f]{40}$/'],
    ];
}
```

Use a generic message such as "The selected repository is invalid." Do not reveal who owns the record.

### 7.3 Nested Route Binding

Make sure a child actually belongs to the parent in the URL:

```php
// routes/api.php

Route::apiResource('assignments.requirements', AssignmentRequirementController::class)
    ->shallow()
    ->scoped();
```

For non-shallow nested routes, `scopeBindings()` makes Laravel return `404` when the child does not belong to the parent.

---

## 8. Filtering Lists

A Policy check on `viewAny` is not enough for list endpoints. Each list must be filtered with a query scope.

```php
// app/Models/Assignment.php

use Illuminate\Database\Eloquent\Builder;

public function scopeVisibleTo(Builder $query, User $user): Builder
{
    if ($user->isAdmin()) {
        return $query;
    }

    if ($user->isTeacher()) {
        return $query->where('teacher_id', $user->id);
    }

    return $query->whereHas('assignmentStudents', fn (Builder $q) =>
        $q->where('student_id', $user->id)
    );
}
```

```php
// app/Models/Submission.php

public function scopeVisibleTo(Builder $query, User $user): Builder
{
    if ($user->isAdmin()) {
        return $query;
    }

    if ($user->isTeacher()) {
        return $query->whereHas('assignment', fn (Builder $q) =>
            $q->where('teacher_id', $user->id)
        );
    }

    return $query->where('student_id', $user->id);
}
```

```php
// Controller
public function index(Request $request): AnonymousResourceCollection
{
    $assignments = Assignment::query()
        ->visibleTo($request->user())
        ->latest()
        ->paginate($request->integer('per_page', 15));

    return AssignmentResource::collection($assignments);
}
```

**Rules**

- Every list endpoint applies a `visibleTo()` scope or an equivalent ownership filter.
- `include` parameters must not load related records the user cannot see. For example, a student including `repositories` on an assignment receives `TEMPLATE` repositories only.
- Search and filter parameters are applied **after** the visibility filter, never instead of it.

---

## 9. Field-Level Visibility

Some users can see a record but not every field on it. API Resources control this.

| Resource                       | Rule                                                                                        |
|--------------------------------|---------------------------------------------------------------------------------------------|
| `UserResource`                 | Never includes `password`, `remember_token`, or tokens                                      |
| `GitConnectionResource`        | Never includes `access_token`; shows `has_token` instead                                    |
| `AssignmentRepositoryResource` | `REFERENCE` entries are excluded for students                                               |
| `SubmissionResource`           | Student details shown to the owning teacher and admins; students see their own details only |
| `AnalysisIssueResource`        | `resolution_note` is visible to students on their own submissions                           |

```php
// app/Http/Resources/Api/V1/AssignmentResource.php

public function toArray(Request $request): array
{
    $user = $request->user();

    return [
        'id' => $this->id,
        'title' => $this->title,
        'description' => $this->description,
        'due_at' => $this->due_at?->toIso8601String(),
        'teacher' => new UserSummaryResource($this->whenLoaded('teacher')),
        'repositories' => AssignmentRepositoryResource::collection(
            $this->whenLoaded('assignmentRepositories', fn () =>
                $user->isStudent()
                    ? $this->assignmentRepositories->where('type', 'TEMPLATE')
                    : $this->assignmentRepositories
            )
        ),
    ];
}
```

Filter in the query when possible, and use the Resource as a second line of defense.

---

## 10. Protecting Ownership Fields

Ownership and audit fields must never be filled from request data.

```php
// app/Models/Submission.php

protected $guarded = [
    'id',
    'student_id',
    'created_by_user',
    'updated_by_user',
    'deleted_by_user',
];
```

Or use `$fillable` with only the fields the client may set. Then set ownership explicitly in the Service:

```php
$assignment->submissions()->create([
    ...$data,                         // validated client fields only
    'student_id' => $student->id,     // from the authenticated user
    'created_by_user' => $student->id,
]);
```

**Rules**

- Use `$request->validated()`, never `$request->all()`.
- Never include `teacher_id`, `student_id`, `user_id`, `role_id`, `resolved_by_user`, or audit fields in Form Request rules for regular users.

---

## 11. Special Rules

### 11.1 Admins and Their Own Accounts

An admin cannot change their own role or delete their own account. This prevents a system with no admins.

```php
// app/Policies/UserPolicy.php

public function changeRole(User $user, User $target): bool
{
    return $user->isAdmin() && $user->id !== $target->id;
}

public function delete(User $user, User $target): bool
{
    return $user->isAdmin() && $user->id !== $target->id;
}
```

### 11.2 Removed Enrollment

When a student's enrollment is soft-deleted:

- The student loses access to the assignment and its requirements.
- The student keeps access to their own past submissions and analysis results, because those belong to them.
- The teacher keeps access to the student's past submissions for that assignment.

### 11.3 Soft-Deleted Assignments

- Soft-deleted assignments return `404` to teachers and students.
- Students keep access to their own submissions for a soft-deleted assignment if `docs/business/business-rules.md` allows it; otherwise these return `404` as well. Confirm the rule there.

### 11.4 Role Changes

When an admin changes a user's role, the user's tokens are revoked (see `docs/backend/authentication.md`). Access is always evaluated against the user's current role, never a cached one.

### 11.5 Background Jobs

Jobs do not have an authenticated user. Authorization happens **before** dispatch, in the Controller or Service. Jobs must:

- Accept IDs, not user-provided data.
- Verify data consistency, such as "the requirement belongs to the submission's assignment," before storing results.
- Never widen access, such as notifying users who are not authorized to see the result.

---

## 12. Error Responses

Follow `docs/backend/error-handling.md`.

| Situation                                               | Status   | `code`            |
|---------------------------------------------------------|----------|-------------------|
| No valid token                                          | `401`    | `UNAUTHENTICATED` |
| User can see the resource but cannot perform the action | `403`    | `FORBIDDEN`       |
| User should not know the resource exists                | `404`    | `NOT_FOUND`       |

Use `Response::denyAsNotFound()` in Policies for `404` cases.

**Do not reveal the reason for denial in a way that leaks data.** For example, use "Resource not found." instead of "This submission belongs to another student."

---

## 13. Testing

Follow `docs/backend/testing.md`. Authorization is the highest-priority test area.

### 13.1 Required Tests

For every Policy method, test at least:

- The allowed role and owner → allowed.
- The same role but a different owner → `403` or `404`, as documented.
- Each other role → `403` or `404`, as documented.

And these specific rules:

| Test                                                   | Expected                                             |
|--------------------------------------------------------|------------------------------------------------------|
| Teacher views another teacher's assignment             | `404`                                                |
| Student views an assignment they are not enrolled in   | `404`                                                |
| Enrolled student updates the assignment                | `403`                                                |
| Student views another student's submission             | `404`                                                |
| Student views another student's analysis results       | `404`                                                |
| Student requests a `REFERENCE` repository              | `404`                                                |
| Student includes `repositories` on an assignment       | Only `TEMPLATE` entries returned                     |
| Student starts an analysis run on their own submission | `403`                                                |
| Admin views another user's Git connection              | `404`                                                |
| Admin changes their own role                           | `403`                                                |
| Student submits with another student's repository      | `422`                                                |
| Request includes `teacher_id` or `student_id`          | Value ignored                                        |
| Assignment list as a teacher                           | Only own assignments                                 |
| Assignment list as a student                           | Only enrolled assignments                            |
| Removed enrollment                                     | Assignment `404`, own past submissions still visible |

### 13.2 Example

```php
public function test_student_only_sees_template_repositories(): void
{
    $student = $this->actingAsStudent();
    $assignment = Assignment::factory()->create();
    $this->enroll($student, $assignment);

    AssignmentRepository::factory()->for($assignment)->template()->create();
    AssignmentRepository::factory()->for($assignment)->reference()->create();

    $this->getJson("/api/v1/assignments/{$assignment->id}/repositories")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'TEMPLATE');
}
```

### 13.3 Policy Unit Tests

Policies can also be tested directly:

```php
public function test_teacher_cannot_update_another_teachers_assignment(): void
{
    $teacher = User::factory()->teacher()->create();
    $assignment = Assignment::factory()->create();

    $this->assertTrue(
        Gate::forUser($teacher)->inspect('update', $assignment)->denied()
    );
}
```

---

## 14. Rules for AI Coding Agents

1. Read the permission matrix (section 5) before adding or changing an endpoint.
2. Add a Policy method for every new protected action, and call `Gate::authorize()` in the Controller.
3. Apply a `visibleTo()` scope or equivalent to every list endpoint.
4. Validate that referenced IDs belong to the user, not only that they exist.
5. Never accept ownership, role, or audit fields from the request.
6. Do not add a global admin bypass.
7. Use `denyAsNotFound()` when the user should not know the resource exists.
8. Do not invent new access rules. If a rule is missing, ask, or document the assumption clearly.
9. Update the permission matrix in this document when access rules change.
10. Add authorization tests for every change and report actual test results.

---

## 15. Summary

- Three roles: admin, teacher, and student. Access depends on both role and ownership.
- Teachers manage only their own assignments; students see only enrolled assignments and their own work.
- Git connections are private to their owner, even from admins.
- `REFERENCE` repositories are never visible to students.
- Policies hold every rule; Controllers call `Gate::authorize()`; list endpoints use `visibleTo()` scopes.
- Ownership and audit fields are always set by the server.
- Private resources return `404`; visible but restricted actions return `403`.
