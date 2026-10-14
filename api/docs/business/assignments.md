# Assignments

**Project:** Student Assignment Review AI  
**Backend:** Laravel  
**Database:** MySQL

---

## 1. Overview

This document describes how teachers create and manage assignments: the assignment itself, its requirements, project structures, linked repositories, and enrolled students.

Related documents:

- `docs/business/business-rules.md` (rules `BR-ASG-*`, `BR-ENR-*`, `BR-REQ-*`, `BR-STR-*`, `BR-ARP-*`)
- `docs/business/submissions.md`
- `docs/business/git-integration.md`
- `docs/business/ai-review.md`
- `docs/backend/api.md` (sections 9 to 12 and 15)
- `docs/backend/authorization.md`

If this document conflicts with `business-rules.md`, `business-rules.md` wins until the conflict is resolved.

### 1.1 What an Assignment Contains

```text
Assignment
├── Details               title, description, due date, settings
├── Requirements          what the AI evaluates and scores
├── Project Structures    expected files and folders, checked by code
│   └── Structure Rules
├── Repositories          TEMPLATE (starter code) and REFERENCE (solution)
└── Enrolled Students     who can see the assignment and submit
```

---

## 2. Lifecycle

```text
 Teacher creates assignment
          │
          ▼
 ┌──────────────────┐
 │  Setup           │  Add requirements, structures, repositories
 └────────┬─────────┘
          │  Enroll students
          ▼
 ┌──────────────────┐
 │  Open            │  Students can submit (at least one requirement exists)
 └────────┬─────────┘
          │  Due date passes
          ▼
 ┌──────────────────┐
 │  Past due        │  Submissions still accepted, marked late
 └────────┬─────────┘
          │  Teacher or admin deletes (optional)
          ▼
 ┌──────────────────┐
 │  Deleted         │  Hidden; history kept for owners of past work
 └──────────────────┘
```

These stages are **derived**, not stored as a status column:

| Stage    | Condition                                                            |
|----------|----------------------------------------------------------------------|
| Setup    | No requirements yet                                                  |
| Open     | At least one requirement, and the due date is empty or in the future |
| Past due | At least one requirement, and the due date has passed                |
| Deleted  | `deleted_at` is set                                                  |

The API may return the derived stage as a read-only `stage` field on the assignment resource.

**Note:** There is no draft or published status in the current version. Students can see an assignment as soon as they are enrolled. If teachers need to prepare assignments privately after enrolling students, add a `published_at` field and a rule to `business-rules.md`.

---

## 3. Assignment Details

### 3.1 Fields

| Field                     | Type           | Required   | Rules                                                                                    |
|---------------------------|----------------|------------|------------------------------------------------------------------------------------------|
| `title`                   | string         | Yes        | 1 to 255 characters (`BR-ASG-04`)                                                        |
| `description`             | text           | No         | Maximum 20,000 characters. Plain text or Markdown. Shown to students and sent to the AI. |
| `due_at`                  | datetime (UTC) | No         | Must be in the future when created (`BR-ASG-05`)                                         |
| `use_reference_in_review` | boolean        | No         | Default `false`. Allows the AI to use `REFERENCE` repositories as context (`AI-REF-01`). |

Set by the server only:

| Field                                                   | Value                                   |
|---------------------------------------------------------|-----------------------------------------|
| `teacher_id`                                            | The authenticated teacher (`BR-ASG-01`) |
| `created_by_user`, `updated_by_user`, `deleted_by_user` | The acting user                         |

Use the column names in `docs/database/database.md`. If a field above does not exist yet, add it through a migration.

### 3.2 Create

```http
POST /api/v1/assignments
```

```json
{
  "title": "Laravel CRUD Project",
  "description": "Build a CRUD application for managing books. Use Form Requests for validation and Eloquent for persistence.",
  "due_at": "2026-11-30T16:59:00Z",
  "use_reference_in_review": false
}
```

Only teachers can create assignments (`authorization.md`, section 5.2).

### 3.3 Update

| Field                     | Can Change After Submissions Exist?   | Effect                                                                        |
|---------------------------|---------------------------------------|-------------------------------------------------------------------------------|
| `title`, `description`    | Yes                                   | New analysis runs use the new text. Past runs are unchanged.                  |
| `due_at`                  | Yes, to any value including the past  | Late status of past submissions does not change (`BR-ASG-12`).                |
| `use_reference_in_review` | Yes                                   | Applies to new runs only.                                                     |
| `teacher_id`              | No                                    | Ownership transfer is admin-only and not part of this endpoint (`BR-ASG-03`). |

When updating `due_at`, the "must be in the future" rule applies only if the value is changing and the assignment has no submissions. After submissions exist, the teacher may set any date, for example to close an assignment early.

### 3.4 Due Dates and Time Zones

- `due_at` is stored and returned in UTC.
- The frontend converts to the user's local time for display. For this project, many users are in Cambodia (`Asia/Phnom_Penh`, UTC+7). A due date of "30 November 2026, 23:59 in Phnom Penh" is stored as `2026-11-30T16:59:00Z`.
- A submission is late if `submitted_at > due_at` (`BR-SUB-03`). There is no grace period in the current version.

---

## 4. Requirements

Requirements are what the AI evaluates and scores. Their quality directly affects the quality of the review.

### 4.1 Fields

| Field         | Type         | Required   | Rules                                       |
|---------------|--------------|------------|---------------------------------------------|
| `title`       | string       | Yes        | 1 to 255 characters                         |
| `description` | text         | Yes        | 1 to 5,000 characters (`BR-REQ-02`)         |
| `max_score`   | decimal(6,2) | Yes        | Greater than 0, at most 1,000 (`BR-REQ-03`) |
| `sort_order`  | integer      | No         | Defaults to the next position (`BR-REQ-05`) |

### 4.2 Scoring

- The assignment's total possible score is the sum of its active requirements' `max_score` values (`BR-REQ-04`).
- There is no required total, such as 100. Teachers choose values that make sense for the assignment.
- The AI scores each requirement between 0 and its `max_score`, following the rules in `ai-review.md`, section 9.2.

### 4.3 Writing Good Requirements

The AI can evaluate only what is described clearly. Each requirement should describe **one** observable outcome in the code.

| Good                                                                                                                                             | Why                                               |
|--------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| "Store and update requests for books use Form Request classes. Title and author are required; ISBN is required and unique in the `books` table." | Specific, checkable, names the expected technique |
| "`BookController` has `index`, `store`, `show`, `update`, and `destroy` methods registered with `Route::apiResource`."                           | Names files, methods, and routes the AI can find  |
| "Feature tests cover creating a book with valid data and rejecting a book with a missing title."                                                 | Clear test expectations                           |

| Avoid                                            | Problem                                                                       |
|--------------------------------------------------|-------------------------------------------------------------------------------|
| "Good code quality."                             | Too vague to score consistently                                               |
| "Validation, tests, and security are done well." | Several requirements in one; split them                                       |
| "The app works correctly."                       | The AI does not run code (`BR-ANL-13`), so it cannot observe runtime behavior |
| "Matches the reference solution."                | Encourages copying; describe the expected behavior instead                    |

**Guidance for teachers (shown in the frontend):**

- Write one requirement per skill or feature.
- Mention file names, class names, or routes when you expect specific ones.
- Describe what you will accept, not just what is missing.
- Put general expectations (naming, formatting) in the assignment description instead of a scored requirement, unless you want them scored.

### 4.4 Changes and Deletion

| Action               | Effect on Past Runs                                                                  |
|----------------------|--------------------------------------------------------------------------------------|
| Edit a requirement   | None. Past results keep their feedback and their `max_score` at the time of the run. |
| Add a requirement    | None. New runs include it.                                                           |
| Delete a requirement | Soft delete. Past results keep their reference (`BR-ASG-11`). New runs exclude it.   |
| Reorder requirements | None.                                                                                |

When a requirement changes after submissions exist, the teacher can start new analysis runs for affected submissions (`BR-ANL-05`). The system does not re-run analyses automatically.

**Rule:** Deleting the last active requirement is allowed, but the assignment returns to the **Setup** stage and accepts no new submissions until a requirement is added (`BR-ASG-06`, `BR-SUB-07`).

### 4.5 Bulk Reorder (Optional)

To reorder several requirements at once:

```http
PUT /api/v1/assignments/{assignment}/requirements/order
```

```json
{
  "requirement_ids": [14, 12, 13, 15]
}
```

The list must contain every active requirement of the assignment exactly once. If this endpoint is added, document it in `docs/backend/api.md`.

---

## 5. Project Structures

Project structures describe the expected layout of a student's repository. Structure rules are checked by code, not by the AI (`ai-review.md`, section 5.5), so they are exact and consistent.

### 5.1 Structures

| Field         | Type   | Required   | Rules                                              |
|---------------|--------|------------|----------------------------------------------------|
| `name`        | string | Yes        | 1 to 255 characters, such as "Laravel application" |
| `description` | text   | No         | Maximum 2,000 characters                           |

An assignment can have several structures (`BR-ASG-07`), for example one for the backend and one for documentation. Each structure groups related rules.

### 5.2 Structure Rules

| Field         | Type   | Required   | Rules                                                                         |
|---------------|--------|------------|-------------------------------------------------------------------------------|
| `rule_type`   | enum   | Yes        | See section 5.3                                                               |
| `path`        | string | Yes        | 1 to 500 characters; relative; no `..`; does not start with `/` (`BR-STR-03`) |
| `description` | string | No         | Maximum 1,000 characters; shown to students when the rule fails               |
| `severity`    | enum   | No         | Severity of the issue created when the rule fails; default `MEDIUM`           |

### 5.3 Rule Types

| Type                 | Passes When                                         | `path` Example                                 |
|----------------------|-----------------------------------------------------|------------------------------------------------|
| `FILE_REQUIRED`      | The file exists                                     | `app/Http/Controllers/BookController.php`      |
| `DIRECTORY_REQUIRED` | The directory exists and contains at least one file | `tests/Feature`                                |
| `FILE_FORBIDDEN`     | The file does not exist                             | `.env`                                         |
| `PATTERN_REQUIRED`   | At least one path matches the glob                  | `database/migrations/*_create_books_table.php` |

Use the values defined in `app/Enums/`. If the enum differs, update this table, `business-rules.md`, and `ai-review.md`.

### 5.4 Path Matching

- Paths are matched against the repository root after the archive's top-level folder is removed (`git-integration.md`, `GIT-EX-07`).
- Matching is case-sensitive.
- Globs support `*` (any characters except `/`), `**` (any characters including `/`), and `?` (one character).
- Structure rules are checked against **all** paths in the repository, including paths excluded from AI review, such as `vendor/` (`GIT-AI-01`).

### 5.5 Results

- Each failed rule creates one `AnalysisIssue` with category `STRUCTURE` and the rule's severity (`BR-STR-05`).
- Structure results do not change requirement scores directly. If structure matters for the score, write a requirement that covers it.

### 5.6 Example

```json
{
  "name": "Laravel application",
  "rules": [
    { "rule_type": "FILE_REQUIRED", "path": "app/Models/Book.php", "description": "A Book model is required." },
    { "rule_type": "FILE_REQUIRED", "path": "app/Http/Controllers/BookController.php" },
    { "rule_type": "PATTERN_REQUIRED", "path": "database/migrations/*_create_books_table.php" },
    { "rule_type": "DIRECTORY_REQUIRED", "path": "tests/Feature" },
    { "rule_type": "FILE_FORBIDDEN", "path": ".env", "severity": "HIGH", "description": "Do not commit your .env file." }
  ]
}
```

---

## 6. Repositories

Teachers link repositories to an assignment through `assignment_repositories`.

| Type        | Purpose                            | Visible to Students     | Limit                                    |
|-------------|------------------------------------|-------------------------|------------------------------------------|
| `TEMPLATE`  | Starter code students begin from   | Yes, when enrolled      | At most one per assignment (`BR-ASG-08`) |
| `REFERENCE` | Teacher's solution or example code | **Never** (`BR-ARP-03`) | Any number                               |

### 6.1 Linking

```http
POST /api/v1/assignments/{assignment}/repositories
```

```json
{
  "repository_id": 30,
  "type": "TEMPLATE"
}
```

| ID           | Rule                                                                                                                                                               |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-ARP-02`  | The teacher can link only repositories registered through their own Git connections.                                                                               |
| `ASG-REP-01` | Before linking, the system confirms the connection still has access to the repository.                                                                             |
| `ASG-REP-02` | The same repository cannot be linked twice to the same assignment.                                                                                                 |
| `ASG-REP-03` | Linking a second `TEMPLATE` returns `409`. Unlink the current one first.                                                                                           |
| `ASG-REP-04` | A repository linked as `REFERENCE` should be private. If the provider reports it as public, the API returns a warning in the response `meta`, but still allows it. |

### 6.2 How Students Use the Template

In the current version, the system does not create student repositories. The teacher shares the template, and each student:

1. Creates their own repository from the template on the Git provider (for example, GitHub's "Use this template" button, or a fork).
2. Connects their Git account in the application.
3. Registers their repository and links it to the assignment (`BR-SRP-01`, `BR-SRP-02`).

The `TEMPLATE` repository's URL is shown to enrolled students. Students cannot use the teacher's Git connection to access it, so the template must be public or shared with students on the provider.

### 6.3 How the Reference Is Used

- Used by the AI only if `use_reference_in_review` is `true` (`AI-REF-01`).
- Retrieved with the teacher's token only.
- Never quoted in feedback (`AI-REF-04`).

### 6.4 Unlinking

Unlinking is a soft delete. Past analysis runs that used a reference repository are not changed.

---

## 7. Enrollment

### 7.1 Enrolling Students

```http
POST /api/v1/assignments/{assignment}/students
```

```json
{
  "student_ids": [3, 4, 5]
}
```

| ID           | Rule                                                                                                          |
|--------------|---------------------------------------------------------------------------------------------------------------|
| `BR-ENR-01`  | Only the owning teacher or an admin can enroll students.                                                      |
| `BR-ENR-02`  | Every ID must belong to a user with the student role.                                                         |
| `BR-ENR-03`  | Enrolling an already-enrolled student is skipped; re-enrolling a removed student restores the old enrollment. |
| `ASG-ENR-01` | A request can enroll at most 200 students.                                                                    |
| `ASG-ENR-02` | The request is atomic: if any ID is invalid, no one is enrolled and the response lists the invalid IDs.       |

**Response `201 Created`** includes all enrollments that now exist for the requested students, and a `meta` summary:

```json
{
  "data": [ ... ],
  "meta": {
    "enrolled": 2,
    "restored": 1,
    "already_enrolled": 0
  }
}
```

### 7.2 Finding Students to Enroll

Teachers need to search students by name or email to enroll them. Use the existing user search with a role filter, limited for teachers to students only:

```http
GET /api/v1/users?role=student&search=sreyneang
```

This requires the `UserPolicy::viewAny` rule to allow teachers to search students (returning only `id`, `name`, and `email`). If this is added, update `authorization.md` section 5.1 and `api.md` section 8.

### 7.3 Removing Students

Removing an enrollment is a soft delete (`BR-ENR-06`):

- The student loses access to the assignment.
- The student keeps access to their own past submissions and results.
- The teacher keeps access to the student's past submissions.
- The student's linked repository for the assignment is unlinked (soft-deleted).

### 7.4 Future: Join Codes

Self-enrollment with a join code is not supported (`BR-ENR-04`). It is listed as an open decision in `business-rules.md`, section 15.

---

## 8. Teacher Overview

Teachers need to see the progress of every enrolled student. The assignment's submission list (`GET /assignments/{assignment}/submissions`) returns submissions. A per-student summary is also useful:

```http
GET /api/v1/assignments/{assignment}/progress
```

```json
{
  "data": [
    {
      "student": { "id": 3, "name": "Chan Sreyneang" },
      "has_linked_repository": true,
      "submission_count": 2,
      "latest_submission": {
        "id": 88,
        "submitted_at": "2026-10-14T09:00:00Z",
        "is_late": false
      },
      "current_analysis": {
        "status": "completed",
        "total_score": 72,
        "max_score": 100,
        "open_issue_count": 3
      }
    },
    {
      "student": { "id": 4, "name": "Kim Visal" },
      "has_linked_repository": false,
      "submission_count": 0,
      "latest_submission": null,
      "current_analysis": null
    }
  ]
}
```

- Access: owning teacher and admins only.
- Paginated, with the same parameters as other list endpoints.
- Built with eager loading and aggregate queries to avoid N+1 queries.

This endpoint is **proposed**. Add it to `docs/backend/api.md` when it is implemented.

---

## 9. Student View

An enrolled student sees:

| Item                                                  | Visible   |
|-------------------------------------------------------|-----------|
| Title, description, due date, stage                   | Yes       |
| Requirements (title, description, `max_score`)        | Yes       |
| Project structures and rules                          | Yes       |
| `TEMPLATE` repository URL                             | Yes       |
| `REFERENCE` repositories                              | No        |
| `use_reference_in_review` setting                     | No        |
| Other enrolled students                               | No        |
| Their own linked repository, submissions, and results | Yes       |

The `AssignmentResource` hides fields based on the user (`authorization.md`, section 9).

---

## 10. Deletion

| ID           | Rule                                                                                                                            |
|--------------|---------------------------------------------------------------------------------------------------------------------------------|
| `BR-ASG-13`  | Deleting an assignment is a soft delete.                                                                                        |
| `BR-ASG-14`  | The assignment is hidden and accepts no new enrollments or submissions.                                                         |
| `BR-ASG-15`  | Students and the owning teacher keep read access to past submissions and results.                                               |
| `BR-ASG-16`  | Nothing related is removed: requirements, structures, repositories, enrollments, submissions, runs, results, and issues remain. |
| `ASG-DEL-01` | Queued or running analysis runs for the assignment are allowed to finish.                                                       |
| `ASG-DEL-02` | Restoring a deleted assignment is an admin-only action.                                                                         |

---

## 11. Copying an Assignment (Future)

Teachers often reuse assignments across classes. A future endpoint may copy an assignment's details, requirements, structures, and repository links, but **not** enrollments, submissions, or analysis data. Not part of the current version.

---

## 12. Validation Summary

| Rule                                             | Error                                |
|--------------------------------------------------|--------------------------------------|
| Missing or too-long title                        | `422`                                |
| `due_at` in the past on create                   | `422`                                |
| `max_score` ≤ 0 or > 1,000                       | `422`                                |
| Structure rule path with `..` or leading `/`     | `422`                                |
| Unknown `rule_type` or `type`                    | `422`                                |
| Repository not owned by the teacher              | `422 REPOSITORY_ACCESS_DENIED`       |
| Second `TEMPLATE` repository                     | `409`                                |
| Enrolling a non-student                          | `422`                                |
| Submitting to an assignment with no requirements | `422 ASSIGNMENT_HAS_NO_REQUIREMENTS` |

Error formats follow `docs/backend/error-handling.md`.

---

## 13. Testing

Follow `docs/backend/testing.md`. Required tests include:

| Area         | Test                                                                       |
|--------------|----------------------------------------------------------------------------|
| Create       | Teacher creates; `teacher_id` comes from the token, not the request        |
| Create       | Student and admin cannot create                                            |
| Update       | `due_at` change does not change past `is_late` values                      |
| Stage        | Assignment with no requirements is in Setup and rejects submissions        |
| Requirements | Editing a requirement does not change past results or their `max_score`    |
| Requirements | Deleting a requirement keeps past results linked to it                     |
| Structures   | Each rule type passes and fails as documented                              |
| Structures   | Unsafe paths are rejected                                                  |
| Repositories | Second `TEMPLATE` returns `409`                                            |
| Repositories | Students never see `REFERENCE` repositories, directly or through `include` |
| Enrollment   | Bulk enroll is atomic and reports invalid IDs                              |
| Enrollment   | Re-enrolling restores the previous enrollment                              |
| Enrollment   | Removing a student unlinks their repository and keeps their history        |
| Deletion     | Soft delete keeps all related records and history access                   |

---

## 14. Rules for AI Coding Agents

1. Treat the lifecycle stage as derived. Do not add a `status` column without updating `business-rules.md`.
2. Never let edits to an assignment or its requirements change existing analysis results.
3. Never expose `REFERENCE` repositories or `use_reference_in_review` to students.
4. Keep structure rule checks in code, not in AI prompts.
5. Mark proposed endpoints (sections 4.5, 7.2, 8) as implemented in `api.md` only when they are built.
6. Add tests for every rule you implement, and report actual results.

---

## 15. Summary

- A teacher creates an assignment, adds requirements, structures, and repositories, and enrolls students.
- Stages (Setup, Open, Past due, Deleted) are derived from data, not stored.
- Clear, single-outcome requirements produce better AI reviews.
- Structure rules are exact file checks done by code.
- One `TEMPLATE` per assignment, visible to students; `REFERENCE` repositories are never visible to them.
- Changes never alter past analysis results; deletion never removes history.
