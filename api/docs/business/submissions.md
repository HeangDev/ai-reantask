# Submissions

**Project:** Student Assignment Review AI  
**Backend:** Laravel  
**Database:** MySQL

---

## 1. Overview

This document describes how students submit work, how a submission is validated and stored, how it connects to AI analysis, and how students and teachers view submissions.

Related documents:

- `docs/business/business-rules.md` (rules `BR-SUB-*`, `BR-SRP-*`, `BR-ANL-*`, `BR-GRD-*`)
- `docs/business/assignments.md`
- `docs/business/git-integration.md`
- `docs/business/ai-review.md`
- `docs/backend/api.md` (sections 16 to 18)
- `docs/backend/authorization.md`
- `docs/backend/error-handling.md`

If this document conflicts with `business-rules.md`, `business-rules.md` wins until the conflict is resolved.

### 1.1 What a Submission Is

A submission is a student's work **at one exact commit** of their linked repository, submitted to one assignment. It is a permanent record: it is never edited, and users cannot delete it.

```text
Student ──┐
          ├── Submission (assignment, repository, branch, commit_sha, is_late)
Assignment┘        │
                   └─< AnalysisRun ─< AnalysisResult
                                   └─< AnalysisIssue
```

---

## 2. Before a Student Can Submit

| # | Condition                                             | Rule        | Error if Missing                     |
|---|-------------------------------------------------------|-------------|--------------------------------------|
| 1 | The student is enrolled in the assignment             | `BR-SUB-01` | `404` (assignment hidden)            |
| 2 | The assignment is not deleted                         | `BR-ASG-14` | `404`                                |
| 3 | The assignment has at least one requirement           | `BR-SUB-07` | `422 ASSIGNMENT_HAS_NO_REQUIREMENTS` |
| 4 | The student has a Git connection                      | `BR-GIT-01` | — (needed for step 5)                |
| 5 | The student has linked a repository to the assignment | `BR-SUB-02` | `422 REPOSITORY_NOT_LINKED`          |
| 6 | The Git connection can still access the repository    | `BR-GIT-09` | `422 REPOSITORY_ACCESS_DENIED`       |

The frontend should show this as a checklist on the assignment page, so students know what to do before submitting. A read-only endpoint can support it:

```http
GET /api/v1/assignments/{assignment}/submission-readiness
```

```json
{
  "data": {
    "can_submit": false,
    "checks": {
      "enrolled": true,
      "assignment_has_requirements": true,
      "has_git_connection": true,
      "has_linked_repository": false
    }
  }
}
```

This endpoint is **proposed**. Add it to `docs/backend/api.md` when it is implemented. It does not call the Git provider; access is checked when the student actually submits.

---

## 3. Fields

| Field                                | Type        | Set By           | Description                                                     |
|--------------------------------------|-------------|------------------|-----------------------------------------------------------------|
| `id`                                 | bigint      | Server           |                                                                 |
| `assignment_id`                      | foreign key | Route            | The assignment in the URL                                       |
| `student_id`                         | foreign key | Server           | The authenticated student (`authorization.md`, section 10)      |
| `repository_id`                      | foreign key | Client           | Must be the student's linked repository (`BR-SUB-02`)           |
| `branch`                             | string(255) | Client           | Branch the commit was resolved from                             |
| `commit_sha`                         | char(40)    | Client or server | Exact commit (`BR-SUB-05`)                                      |
| `commit_message`                     | string(500) | Server           | First line of the commit message from the provider, for display |
| `committed_at`                       | datetime    | Server           | Commit date from the provider                                   |
| `submitted_at`                       | datetime    | Server           | Time the submission was accepted                                |
| `is_late`                            | boolean     | Server           | `submitted_at > assignment.due_at` (`BR-SUB-03`, `BR-SUB-04`)   |
| `created_by_user`, `deleted_by_user` | foreign key | Server           | Audit fields                                                    |

There is no `updated_by_user` change after creation, because submissions are never edited (`BR-SUB-13`).

Use the column names in `docs/database/database.md`. If `commit_message`, `committed_at`, `submitted_at`, or `is_late` do not exist yet, add them through a migration.

### 3.1 Indexes

| Index                                            | Purpose                                                         |
|--------------------------------------------------|-----------------------------------------------------------------|
| Unique `(assignment_id, student_id, commit_sha)` | Prevents duplicate submissions of the same commit (`BR-SUB-10`) |
| `(assignment_id, student_id, submitted_at)`      | Finds a student's latest submission quickly                     |
| `(assignment_id, submitted_at)`                  | Teacher list sorted by time                                     |

The unique index also includes soft-deleted rows. If an admin soft-deletes a submission, the same commit cannot be submitted again; the admin restores the original instead.

---

## 4. Creating a Submission

### 4.1 Request

```http
POST /api/v1/assignments/{assignment}/submissions
Authorization: Bearer {token}
```

```json
{
  "repository_id": 41,
  "branch": "main",
  "commit_sha": "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4"
}
```

| Field           | Rules                                                                                 |
|-----------------|---------------------------------------------------------------------------------------|
| `repository_id` | Required; integer; must be the student's active linked repository for this assignment |
| `branch`        | Required; 1 to 255 characters; valid Git branch name (`GIT-SUB-01`)                   |
| `commit_sha`    | Optional; exactly 40 lowercase hexadecimal characters                                 |

If `commit_sha` is omitted, the server uses the latest commit on `branch` at the time of submission.

Uppercase SHAs are converted to lowercase. Short SHAs (for example, 7 characters) are not accepted, because they can be ambiguous.

### 4.2 Processing Steps

```text
 1. Authenticate                          auth:sanctum
 2. Authorize: enrolled student           Gate::authorize('submit', $assignment)
 3. Validate input                        StoreSubmissionRequest
 4. Rate limit                            10 per minute per student (BR-SUB-08)
 5. Check assignment has requirements     ASSIGNMENT_HAS_NO_REQUIREMENTS
 6. Resolve or confirm the commit         Git provider (outside the transaction)
 7. Begin transaction
 8.   Lock the student's enrollment row   prevents parallel duplicates
 9.   Check for the same commit           DUPLICATE_SUBMISSION
10.   Create submission                   is_late calculated by the server
11.   Create analysis run (queued)        BR-ANL-01
12.   Dispatch AnalyzeSubmissionJob       afterCommit()
13. Commit transaction
14. Return 201 with submission and run
```

Calling the Git provider (step 6) happens **before** the transaction, so a slow provider does not hold database locks (`error-handling.md`, section 13).

### 4.3 Service Example

```php
// app/Services/Submissions/SubmissionService.php

public function create(User $student, Assignment $assignment, array $data): Submission
{
    if (! $assignment->requirements()->exists()) {
        throw new AssignmentHasNoRequirementsException();
    }

    $link = $assignment->assignmentStudentRepositories()
        ->where('student_id', $student->id)
        ->where('repository_id', $data['repository_id'])
        ->with('repository.gitConnection')
        ->first();

    if (! $link) {
        throw new RepositoryNotLinkedException();
    }

    $commit = $this->git->resolveCommit(
        $link->repository,
        $data['commit_sha'] ?? $data['branch']
    );

    return DB::transaction(function () use ($student, $assignment, $data, $link, $commit) {
        $assignment->assignmentStudents()
            ->where('student_id', $student->id)
            ->lockForUpdate()
            ->firstOrFail();

        $exists = $assignment->submissions()
            ->withTrashed()
            ->where('student_id', $student->id)
            ->where('commit_sha', $commit->sha)
            ->exists();

        if ($exists) {
            throw new DuplicateSubmissionException();
        }

        $now = now();

        $submission = $assignment->submissions()->create([
            'student_id' => $student->id,
            'repository_id' => $link->repository_id,
            'branch' => $data['branch'],
            'commit_sha' => $commit->sha,
            'commit_message' => Str::limit($commit->messageFirstLine, 500, ''),
            'committed_at' => $commit->committedAt,
            'submitted_at' => $now,
            'is_late' => $assignment->due_at !== null && $now->greaterThan($assignment->due_at),
            'created_by_user' => $student->id,
        ]);

        $this->analysisRuns->createForSubmission($submission);

        return $submission;
    });
}
```

`AnalysisRunService::createForSubmission()` creates the `queued` run and dispatches the job with `afterCommit()` (`ai-review.md`, section 4).

If two requests still collide (for example, the lock is bypassed by a code change), the unique index rejects the second insert. Catch MySQL error `1062` in the Service and throw `DuplicateSubmissionException`.

### 4.4 Response `201 Created`

```json
{
  "data": {
    "id": 88,
    "assignment_id": 10,
    "student": { "id": 3, "name": "Chan Sreyneang" },
    "repository": {
      "id": 41,
      "url": "https://github.com/sreyneang-dev/laravel-books"
    },
    "branch": "main",
    "commit_sha": "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4",
    "commit_message": "Add ISBN validation",
    "committed_at": "2026-10-14T08:52:10Z",
    "submitted_at": "2026-10-14T09:00:00Z",
    "is_late": false,
    "attempt_number": 2,
    "is_latest": true,
    "review_status": "analyzing",
    "latest_analysis_run": {
      "id": 55,
      "status": "queued"
    },
    "current_analysis": null
  }
}
```

### 4.5 Errors

| Situation                                | Status   | `code`                           |
|------------------------------------------|----------|----------------------------------|
| Not logged in                            | `401`    | `UNAUTHENTICATED`                |
| Not enrolled, or assignment deleted      | `404`    | `NOT_FOUND`                      |
| Teacher or admin tries to submit         | `403`    | `FORBIDDEN`                      |
| Invalid input                            | `422`    | (validation `errors`)            |
| Assignment has no requirements           | `422`    | `ASSIGNMENT_HAS_NO_REQUIREMENTS` |
| Repository is not the linked one         | `422`    | `REPOSITORY_NOT_LINKED`          |
| Connection lost access to the repository | `422`    | `REPOSITORY_ACCESS_DENIED`       |
| Commit or branch not found               | `422`    | `COMMIT_NOT_FOUND`               |
| Same commit already submitted            | `409`    | `DUPLICATE_SUBMISSION`           |
| Too many submissions                     | `429`    | `RATE_LIMITED`                   |
| Git provider unavailable                 | `503`    | `SERVICE_UNAVAILABLE`            |

---

## 5. Late Submissions

| ID            | Rule                                                                                                  |
|---------------|-------------------------------------------------------------------------------------------------------|
| `BR-SUB-03`   | Submissions after the due date are accepted and marked late.                                          |
| `BR-SUB-04`   | `is_late` is calculated by the server from `submitted_at`, never from `committed_at` or client input. |
| `BR-ASG-12`   | Changing the due date later does not recalculate `is_late` for existing submissions.                  |
| `BR-GRD-05`   | Being late does not change the AI score. Any penalty is the teacher's decision.                       |
| `SUB-LATE-01` | An assignment without a due date never has late submissions.                                          |
| `SUB-LATE-02` | The comparison uses the exact due time with no grace period.                                          |

`committed_at` is shown for information only. Commit dates are set by the student's computer and can be changed, so they are never used to decide lateness.

---

## 6. Attempts

| ID           | Rule                                                                                                                                                                      |
|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-SUB-09`  | A student can submit many times; each submission is a new record.                                                                                                         |
| `BR-SUB-10`  | The same commit cannot be submitted twice to the same assignment.                                                                                                         |
| `BR-SUB-11`  | The latest submission is the student's current submission.                                                                                                                |
| `BR-SUB-12`  | There is no attempt limit in the current version.                                                                                                                         |
| `SUB-ATT-01` | `attempt_number` is the submission's position among the student's submissions for the assignment, ordered by `submitted_at`, starting at 1. It is calculated, not stored. |
| `SUB-ATT-02` | `is_latest` is `true` only for the student's most recent submission for the assignment.                                                                                   |
| `SUB-ATT-03` | Soft-deleted submissions are not counted as latest.                                                                                                                       |

A new submission does not cancel analysis of an earlier one. Both runs complete independently.

---

## 7. Review Status

Each submission has a derived `review_status`, based on its analysis runs. It is calculated for the response, not stored.

| `review_status`   | Condition                               |
|-------------------|-----------------------------------------|
| `analyzing`       | The latest run is `queued` or `running` |
| `reviewed`        | The latest run is `completed`           |
| `analysis_failed` | The latest run is `failed`              |

Separately:

- `latest_analysis_run` is the most recent run of any status.
- `current_analysis` is the most recent `completed` run (`BR-ANL-08`), with `total_score` and `max_score`.

**Example:** a teacher starts a re-analysis on a submission that was already reviewed. While the new run is `queued`, `review_status` is `analyzing`, but `current_analysis` still shows the earlier completed result, so the score does not disappear during re-analysis.

```json
"review_status": "analyzing",
"latest_analysis_run": { "id": 61, "status": "queued" },
"current_analysis": {
  "analysis_run_id": 55,
  "total_score": 72,
  "max_score": 100,
  "completed_at": "2026-10-14T09:03:12Z"
}
```

A submission with no completed run has `current_analysis: null`. It is never shown as a score of zero (`BR-GRD-02`).

---

## 8. Viewing Submissions

### 8.1 Student

```http
GET /api/v1/me/submissions?assignment_id=10
```

- Returns only the student's own submissions (`authorization.md`, section 8).
- Includes submissions for assignments the student is no longer enrolled in, and for soft-deleted assignments (`BR-ENR-06`, `BR-ASG-15`).
- Default sort: `-submitted_at`.

```http
GET /api/v1/submissions/{submission}?include=latest_analysis_run
```

The student sees their own analysis runs, results, and issues, including resolution notes (`BR-ISS-06`).

### 8.2 Teacher

```http
GET /api/v1/assignments/{assignment}/submissions
```

| Filter          | Example                         | Description                           |
|-----------------|---------------------------------|---------------------------------------|
| `student_id`    | `student_id=3`                  | One student's submissions             |
| `latest_only`   | `latest_only=true`              | Only each student's latest submission |
| `is_late`       | `is_late=true`                  | Only late submissions                 |
| `review_status` | `review_status=analysis_failed` | Filter by derived status              |
| `sort`          | `sort=-submitted_at`            | `submitted_at`, `student_name`        |

- Access: owning teacher and admins.
- Includes submissions from students whose enrollment was removed, marked with `student_enrolled: false`.
- Uses eager loading for `student`, `repository`, and the latest and current runs to avoid N+1 queries.

For a per-student summary, including students who have not submitted, see the proposed progress endpoint in `assignments.md`, section 8.

---

## 9. Re-analysis

| ID          | Rule                                                                             |
|-------------|----------------------------------------------------------------------------------|
| `BR-ANL-05` | The owning teacher or an admin can start a new run for a submission.             |
| `BR-ANL-06` | Students cannot start runs. To get a new review, a student submits a new commit. |
| `BR-ANL-03` | Only one active run per submission.                                              |
| `BR-ANL-07` | Earlier runs are kept.                                                           |

Typical reasons for re-analysis:

- The previous run failed (for example, the AI provider was unavailable).
- The teacher changed requirements and wants the submission evaluated against them.
- The teacher wants a second opinion on a result.

```http
POST /api/v1/submissions/{submission}/analysis-runs
```

See `ai-review.md` for the analysis workflow.

### 9.1 Bulk Re-analysis (Optional)

After changing requirements, a teacher may want to re-analyze every student's latest submission:

```http
POST /api/v1/assignments/{assignment}/analysis-runs
```

```json
{
  "scope": "latest_submissions"
}
```

- Creates one run per latest submission that has no active run.
- Returns `202 Accepted` with the number of runs queued and skipped.
- Rate-limited per teacher, because it can create many AI calls (`AI-CAP-*`).

This endpoint is **proposed**. Add it to `docs/backend/api.md` and `authorization.md` when it is implemented.

---

## 10. Changes to Linked Data After Submission

A submission records what was submitted at that moment. Later changes do not alter it.

| Change                                             | Effect on Existing Submissions                                                                 |
|----------------------------------------------------|------------------------------------------------------------------------------------------------|
| Student links a different repository (`BR-SRP-03`) | None. Each submission keeps its own `repository_id` (`BR-SRP-05`).                             |
| Student pushes new commits                         | None. Each submission is pinned to its `commit_sha`.                                           |
| Student force-pushes and the commit disappears     | Past results remain. New runs on that submission fail with `COMMIT_NOT_FOUND`.                 |
| Student deletes the repository or revokes access   | Past results remain. New runs fail with `REPOSITORY_NOT_FOUND` or `REPOSITORY_ACCESS_REVOKED`. |
| Teacher changes the due date                       | `is_late` is not recalculated (`BR-ASG-12`).                                                   |
| Teacher edits requirements                         | Past results are unchanged; new runs use the new requirements.                                 |
| Student's enrollment is removed                    | Student and teacher keep read access; no new submissions (`BR-ENR-06`, `BR-ENR-07`).           |
| Assignment is soft-deleted                         | Read access is kept for the student and owning teacher (`BR-ASG-15`).                          |

Students should be told not to rewrite history (force-push) on commits they have submitted.

---

## 11. Deletion

| ID           | Rule                                                                                                                        |
|--------------|-----------------------------------------------------------------------------------------------------------------------------|
| `BR-SUB-13`  | Submissions cannot be edited.                                                                                               |
| `BR-SUB-14`  | Only admins can soft-delete a submission, for data correction.                                                              |
| `BR-SUB-15`  | Soft-deleting a submission keeps its runs, results, and issues.                                                             |
| `SUB-DEL-01` | A soft-deleted submission is hidden from students and teachers. Admins can view and restore it.                             |
| `SUB-DEL-02` | Active analysis runs on a deleted submission fail with `ANALYSIS_FAILED` when the job next checks (`ai-review.md`, step 1). |
| `SUB-DEL-03` | Deletion requires a reason, stored for audit (for example, `deletion_reason`).                                              |

---

## 12. Notifications

| Event                         | Recipient                  | Rule        |
|-------------------------------|----------------------------|-------------|
| Analysis completed            | Student and owning teacher | `BR-NOT-01` |
| Analysis failed after retries | Owning teacher             | `BR-NOT-02` |

Submitting does not send a notification, because the student receives the response immediately. Teachers see new submissions in their list and the progress overview.

---

## 13. Testing

Follow `docs/backend/testing.md`. Required tests include:

| Area          | Test                                                                                      |
|---------------|-------------------------------------------------------------------------------------------|
| Access        | Unenrolled student gets `404`; teacher and admin get `403` when submitting                |
| Access        | Student cannot view another student's submission (`404`)                                  |
| Access        | Teacher sees only submissions to their own assignments                                    |
| Prerequisites | No requirements → `422 ASSIGNMENT_HAS_NO_REQUIREMENTS`                                    |
| Prerequisites | Unlinked or another student's repository → `422 REPOSITORY_NOT_LINKED`                    |
| Commit        | Branch resolves to an exact SHA; given SHA is confirmed                                   |
| Commit        | Unknown commit → `422 COMMIT_NOT_FOUND`; short SHA → `422`                                |
| Duplicate     | Same commit twice → `409 DUPLICATE_SUBMISSION`, including when the first was soft-deleted |
| Duplicate     | Two parallel requests with the same commit create only one submission                     |
| Late          | `is_late` uses server time, ignores client input and `committed_at`                       |
| Late          | Changing `due_at` does not change past `is_late` values                                   |
| Analysis      | Submission creates one `queued` run and dispatches the job after commit                   |
| Analysis      | If the transaction fails, no job is dispatched                                            |
| Attempts      | `attempt_number` and `is_latest` are correct across several submissions                   |
| Status        | `review_status` and `current_analysis` are correct during re-analysis                     |
| History       | Removed enrollment keeps student and teacher read access                                  |
| Rate limit    | 11th submission in a minute → `429`                                                       |
| Deletion      | Only admins can delete; runs and results remain                                           |

---

## 14. Rules for AI Coding Agents

1. Never accept `student_id`, `is_late`, `submitted_at`, or `commit_message` from the request.
2. Call the Git provider outside the database transaction.
3. Create the submission and its first analysis run in the same transaction, and dispatch the job with `afterCommit()`.
4. Never update a submission after creation. Never let users delete it.
5. Calculate `attempt_number`, `is_latest`, and `review_status`; do not store them.
6. Use `current_analysis` (latest completed run) for scores, never the latest run of any status.
7. Mark proposed endpoints (sections 2 and 9.1) as implemented in `api.md` only when they are built.
8. Add tests for every rule you implement, and report actual results.

---

## 15. Summary

- A submission is a permanent record of one exact commit, created only by an enrolled student from their linked repository.
- The server sets ownership, time, and lateness; late work is accepted and marked.
- The same commit cannot be submitted twice; there is no attempt limit.
- Every submission automatically gets an AI analysis; re-analysis is for teachers and admins.
- `review_status` shows analysis progress; `current_analysis` always shows the last completed score.
- Later changes to repositories, assignments, or enrollment never alter past submissions or results.
