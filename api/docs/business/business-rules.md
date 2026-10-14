# Business Rules

**Project:** Student Assignment Review AI  
**Backend:** Laravel  
**Database:** MySQL

---

## 1. Overview

This document is the central list of business rules for the Student Assignment Review AI system. It describes **what the system must do** from the point of view of teachers, students, and administrators, independent of how the code is written.

Detailed workflows are documented separately:

| Document                           | Covers                                         |
|------------------------------------|------------------------------------------------|
| `docs/business/assignments.md`     | Assignment setup workflow in detail            |
| `docs/business/submissions.md`     | Submission workflow in detail                  |
| `docs/business/git-integration.md` | Git provider and repository workflow in detail |
| `docs/business/ai-review.md`       | AI analysis workflow in detail                 |

Technical references:

- `docs/backend/api.md`
- `docs/backend/authentication.md`
- `docs/backend/authorization.md`
- `docs/backend/error-handling.md`
- `docs/database/relationships.md`

**If a detailed document conflicts with this one, this document wins until the conflict is resolved.**

### 1.1 Rule Format

Each rule has a stable ID, such as `BR-SUB-03`. Reference these IDs in code comments, pull requests, and tests:

```php
// BR-SUB-03: Submissions after the due date are accepted and marked late.
```

```php
public function test_br_sub_03_late_submission_is_accepted_and_marked_late(): void
```

Rule IDs are never reused. If a rule is removed, mark it as **Removed** instead of deleting it.

### 1.2 Configurable Values

Values marked **(configurable)** are defaults stored in `config/review.php` and environment variables, not hard-coded:

```php
// config/review.php

return [
    'max_active_analysis_runs_per_submission' => 1,
    'analysis_max_attempts' => env('REVIEW_ANALYSIS_MAX_ATTEMPTS', 3),
    'analysis_timeout_seconds' => env('REVIEW_ANALYSIS_TIMEOUT', 300),
    'repository_max_size_mb' => env('REVIEW_REPOSITORY_MAX_SIZE_MB', 100),
    'submission_rate_limit_per_minute' => env('REVIEW_SUBMISSION_RATE_LIMIT', 10),
];
```

---

## 2. Core Concepts

| Term                     | Meaning                                                                        |
|--------------------------|--------------------------------------------------------------------------------|
| **Assignment**           | A programming task created by a teacher                                        |
| **Requirement**          | A specific, gradable item the student's code must satisfy                      |
| **Project Structure**    | An expected layout of files and folders for an assignment                      |
| **Structure Rule**       | One check within a project structure, such as "this file must exist"           |
| **Template Repository**  | Starter code given to students                                                 |
| **Reference Repository** | The teacher's solution or reference code, never shown to students              |
| **Student Repository**   | The repository a student uses for an assignment                                |
| **Submission**           | A student's work at a specific commit, submitted for review                    |
| **Analysis Run**         | One AI review of one submission                                                |
| **Analysis Result**      | The AI's evaluation of one requirement within one run                          |
| **Analysis Issue**       | A specific problem found during a run, such as a missing file or security risk |

---

## 3. Users and Roles

| ID          | Rule                                                                                                                                                                            |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-USR-01` | Every user has exactly one role: admin, teacher, or student.                                                                                                                    |
| `BR-USR-02` | Public registration creates student accounts only. They start `PENDING` and cannot log in until approved (`BR-USR-09`). |
| `BR-USR-03` | Only admins can create teacher and admin accounts or change a user's role.                                                                                                      |
| `BR-USR-04` | An admin cannot change their own role or delete their own account.                                                                                                              |
| `BR-USR-05` | Email addresses are unique across all users, including soft-deleted users.                                                                                                      |
| `BR-USR-06` | A soft-deleted user cannot log in, and all of their tokens are revoked.                                                                                                         |
| `BR-USR-07` | Soft-deleting a user does not delete their assignments, submissions, or analysis history.                                                                                       |
| `BR-USR-08` | A user's role cannot change from teacher to student, or student to teacher, while they own active assignments or have active enrollments. They must be closed or removed first. |
| `BR-USR-09` | A `PENDING` student account becomes `ACTIVE` when an admin or a teacher approves it. Until then the student cannot log in. |
| `BR-USR-10` | Only users with status `ACTIVE` can log in. `PENDING`, `INACTIVE`, `SUSPENDED`, and `DELETED` users cannot. A user who is not `ACTIVE` is also blocked from every protected endpoint, and their tokens are revoked when an admin changes their status. |

---

## 4. Assignments

### 4.1 Ownership

| ID          | Rule                                                                                                                          |
|-------------|-------------------------------------------------------------------------------------------------------------------------------|
| `BR-ASG-01` | Every assignment is owned by exactly one teacher (`teacher_id`).                                                              |
| `BR-ASG-02` | Only the owning teacher and admins can update or delete an assignment.                                                        |
| `BR-ASG-03` | Assignment ownership cannot be transferred through the regular update endpoint. Transfer, if needed, is an admin-only action. |

### 4.2 Content

| ID          | Rule                                                                                                 |
|-------------|------------------------------------------------------------------------------------------------------|
| `BR-ASG-04` | An assignment must have a title.                                                                     |
| `BR-ASG-05` | An assignment may have a due date. If set, it must be in the future when the assignment is created.  |
| `BR-ASG-06` | An assignment must have at least one requirement before students can submit to it.                   |
| `BR-ASG-07` | An assignment can have multiple project structures and multiple linked repositories.                 |
| `BR-ASG-08` | An assignment can have at most one `TEMPLATE` repository and any number of `REFERENCE` repositories. |

### 4.3 Changes After Submissions Exist

| ID          | Rule                                                                                                                                                      |
|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-ASG-09` | Once an assignment has submissions, its requirements, structures, and structure rules can still be edited, but existing analysis results are not changed. |
| `BR-ASG-10` | New analysis runs always use the requirements as they are at the time the run starts.                                                                     |
| `BR-ASG-11` | Deleting a requirement that has analysis results soft-deletes it. Past results keep their reference to it.                                                |
| `BR-ASG-12` | Changing a due date does not change the late status of submissions already made.                                                                          |

### 4.4 Deletion

| ID          | Rule                                                                                                                                                       |
|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-ASG-13` | Deleting an assignment is a soft delete.                                                                                                                   |
| `BR-ASG-14` | A soft-deleted assignment is hidden from teachers and students and accepts no new enrollments or submissions.                                              |
| `BR-ASG-15` | Students keep read access to their own past submissions and analysis results for a soft-deleted assignment. The owning teacher keeps the same read access. |
| `BR-ASG-16` | Soft-deleting an assignment never removes submissions, analysis runs, analysis results, or analysis issues.                                                |

---

## 5. Enrollment

| ID          | Rule                                                                                                                                                         |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-ENR-01` | Only the owning teacher or an admin can enroll students in an assignment.                                                                                    |
| `BR-ENR-02` | Only users with the student role can be enrolled.                                                                                                            |
| `BR-ENR-03` | A student can be enrolled in the same assignment only once. Re-enrolling a removed student restores the existing enrollment instead of creating a duplicate. |
| `BR-ENR-04` | Students cannot enroll themselves in the current version.                                                                                                    |
| `BR-ENR-05` | An enrolled student can view the assignment, its requirements, its project structures, and its `TEMPLATE` repository.                                        |
| `BR-ENR-06` | Removing an enrollment is a soft delete. The student loses access to the assignment but keeps access to their own past submissions and analysis results.     |
| `BR-ENR-07` | A student whose enrollment is removed cannot create new submissions or link repositories for that assignment.                                                |

---

## 6. Requirements and Project Structures

### 6.1 Requirements

| ID          | Rule                                                                                    |
|-------------|-----------------------------------------------------------------------------------------|
| `BR-REQ-01` | Every requirement belongs to exactly one assignment.                                    |
| `BR-REQ-02` | Every requirement has a title and a description clear enough for the AI to evaluate.    |
| `BR-REQ-03` | Every requirement has a positive maximum score (weight).                                |
| `BR-REQ-04` | The total score of an assignment is the sum of its active requirements' maximum scores. |
| `BR-REQ-05` | Requirements are shown to students in a defined order (`sort_order`).                   |

### 6.2 Project Structures

| ID          | Rule                                                                                                                                                   |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-STR-01` | Every project structure belongs to exactly one assignment.                                                                                             |
| `BR-STR-02` | Every structure rule belongs to exactly one project structure.                                                                                         |
| `BR-STR-03` | Structure rule paths are relative to the repository root and cannot contain `..` or start with `/`.                                                    |
| `BR-STR-04` | Structure rule types are limited to the values defined in `app/Enums/`.                                                                                |
| `BR-STR-05` | Structure rule violations are reported as analysis issues. They do not change requirement scores unless a requirement explicitly covers the structure. |

---

## 7. Git Connections and Repositories

| ID          | Rule                                                                                                                                         |
|-------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-GIT-01` | A user can have multiple Git connections.                                                                                                    |
| `BR-GIT-02` | A Git connection is private to its owner. No other user, including admins, can view it or use its token.                                     |
| `BR-GIT-03` | Git access tokens are encrypted at rest and never returned by the API, written to logs, or sent to the AI provider.                          |
| `BR-GIT-04` | A token is verified with the Git provider before a connection is saved, when the provider supports verification.                             |
| `BR-GIT-05` | Only repositories from supported Git providers over HTTPS can be registered.                                                                 |
| `BR-GIT-06` | Repository URLs pointing to local, private-network, or metadata addresses are rejected.                                                      |
| `BR-GIT-07` | A repository is registered through a Git connection that has access to it.                                                                   |
| `BR-GIT-08` | Deleting a Git connection or repository is a soft delete and does not remove past submissions that reference it.                             |
| `BR-GIT-09` | If a token is revoked or expires at the provider, new analysis runs that need it fail with `REPOSITORY_ACCESS_REVOKED`. Past results remain. |

### 7.1 Assignment Repositories

| ID          | Rule                                                                                                                                    |
|-------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| `BR-ARP-01` | An assignment repository has a type of `TEMPLATE` or `REFERENCE`.                                                                       |
| `BR-ARP-02` | A teacher can link only repositories registered through their own Git connections.                                                      |
| `BR-ARP-03` | `REFERENCE` repositories are never visible to students through any endpoint, include, or notification.                                  |
| `BR-ARP-04` | `REFERENCE` repositories may be used by the AI as context for comparison, but their code is never quoted in feedback shown to students. |

### 7.2 Student Repositories

| ID          | Rule                                                                                                                            |
|-------------|---------------------------------------------------------------------------------------------------------------------------------|
| `BR-SRP-01` | A student can link a repository only to an assignment they are enrolled in.                                                     |
| `BR-SRP-02` | A student can link only repositories registered through their own Git connections.                                              |
| `BR-SRP-03` | A student has at most one active linked repository per assignment. Linking a new one replaces (soft-deletes) the previous link. |
| `BR-SRP-04` | The same repository cannot be linked by two different students to the same assignment.                                          |
| `BR-SRP-05` | Changing the linked repository does not affect past submissions, which keep the repository they were made from.                 |

---

## 8. Submissions

### 8.1 Creating Submissions

| ID          | Rule                                                                                                                                                                          |
|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-SUB-01` | Only enrolled students can submit to an assignment.                                                                                                                           |
| `BR-SUB-02` | A submission must use the student's currently linked repository for that assignment.                                                                                          |
| `BR-SUB-03` | Submissions after the due date are accepted and marked late (`is_late = true`).                                                                                               |
| `BR-SUB-04` | Late status is calculated by the server at the time of submission and never accepted from the client.                                                                         |
| `BR-SUB-05` | Every submission records an exact 40-character commit SHA. If the student does not provide one, the server resolves the latest commit on the given branch at submission time. |
| `BR-SUB-06` | The commit must exist in the repository. Otherwise the submission is rejected with `COMMIT_NOT_FOUND`.                                                                        |
| `BR-SUB-07` | Submissions cannot be made to an assignment without at least one requirement (`BR-ASG-06`).                                                                                   |
| `BR-SUB-08` | Students are limited to a number of submissions per minute (configurable, default 10).                                                                                        |

**Note:** If teachers need to block late submissions entirely, add an assignment setting such as `accept_late_submissions` and update `BR-SUB-03`.

### 8.2 Attempts

| ID          | Rule                                                                                                                             |
|-------------|----------------------------------------------------------------------------------------------------------------------------------|
| `BR-SUB-09` | A student can submit multiple times to the same assignment. Each submission is a separate record.                                |
| `BR-SUB-10` | Submitting the same commit SHA again to the same assignment is rejected with `409`, because the result would be identical.       |
| `BR-SUB-11` | The **latest** submission is the student's current submission for the assignment. Earlier submissions remain visible as history. |
| `BR-SUB-12` | There is no limit on the number of submissions in the current version.                                                           |

### 8.3 Changes and Deletion

| ID          | Rule                                                                                                                        |
|-------------|-----------------------------------------------------------------------------------------------------------------------------|
| `BR-SUB-13` | A submission cannot be edited after it is created. A new attempt creates a new submission.                                  |
| `BR-SUB-14` | Students and teachers cannot delete submissions. Only admins can soft-delete a submission, for example for data correction. |
| `BR-SUB-15` | A soft-deleted submission keeps its analysis runs, results, and issues.                                                     |

---

## 9. AI Analysis

### 9.1 Analysis Runs

| ID          | Rule                                                                                                                                           |
|-------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-ANL-01` | Creating a submission automatically starts one analysis run.                                                                                   |
| `BR-ANL-02` | Analysis runs in a background job. The submission request returns before the analysis finishes.                                                |
| `BR-ANL-03` | A submission can have at most one run with status `queued` or `running` at a time. Another request returns `409` (`ANALYSIS_ALREADY_RUNNING`). |
| `BR-ANL-04` | Every run records the exact commit SHA it analyzed, which is always the submission's commit SHA.                                               |
| `BR-ANL-05` | The owning teacher and admins can start a new run for a submission, for example after changing requirements or after a failure.                |
| `BR-ANL-06` | Students cannot start new runs in the current version.                                                                                         |
| `BR-ANL-07` | Starting a new run never changes or deletes earlier runs.                                                                                      |
| `BR-ANL-08` | The **current analysis** of a submission is its most recent run with status `completed`.                                                       |

### 9.2 Run Status

| Status      | Meaning                     | Can Move To           |
|-------------|-----------------------------|-----------------------|
| `queued`    | Waiting for a worker        | `running`, `failed`   |
| `running`   | Analysis in progress        | `completed`, `failed` |
| `completed` | Results stored successfully | — (final)             |
| `failed`    | Analysis did not complete   | — (final)             |

| ID          | Rule                                                                                                    |
|-------------|---------------------------------------------------------------------------------------------------------|
| `BR-ANL-09` | Run status only moves forward as shown above. A `completed` or `failed` run never changes status again. |
| `BR-ANL-10` | A failed run records a safe `error_code` and `error_message`.                                           |

### 9.3 Analysis Process

| ID          | Rule                                                                                                                        |
|-------------|-----------------------------------------------------------------------------------------------------------------------------|
| `BR-ANL-11` | The repository is retrieved at the submission's exact commit SHA.                                                           |
| `BR-ANL-12` | Repositories larger than the configured size limit (configurable, default 100 MB) fail with `REPOSITORY_TOO_LARGE`.         |
| `BR-ANL-13` | Submitted code is never executed on the application server. If code execution is added, it must run in an isolated sandbox. |
| `BR-ANL-14` | Scripts, hooks, and build steps in the repository are never run automatically.                                              |
| `BR-ANL-15` | Git tokens, API keys, and other students' data are never included in requests to the AI provider.                           |
| `BR-ANL-16` | Temporary repository files are deleted after every run, whether it succeeds or fails.                                       |
| `BR-ANL-17` | A run that exceeds the time limit (configurable, default 300 seconds) fails with `ANALYSIS_TIMEOUT`.                        |
| `BR-ANL-18` | Temporary failures are retried up to the configured limit (default 3 attempts). Permanent failures are not retried.         |

### 9.4 Results

| ID          | Rule                                                                                                                                                  |
|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-RES-01` | A completed run has exactly one result for each requirement that was active when the run started.                                                     |
| `BR-RES-02` | Every result references a requirement that belongs to the same assignment as the run's submission.                                                    |
| `BR-RES-03` | A result's score is between 0 and the requirement's maximum score, inclusive.                                                                         |
| `BR-RES-04` | AI output that is malformed, incomplete, references unknown requirements, or has out-of-range scores is rejected. Scores are never silently adjusted. |
| `BR-RES-05` | If AI output is rejected, the attempt is retried. If all attempts fail, the run fails with `AI_INVALID_RESPONSE`.                                     |
| `BR-RES-06` | All results and issues for a run are stored together in one transaction. A run never has partial results.                                             |
| `BR-RES-07` | Results are never edited after they are stored. A different evaluation requires a new run.                                                            |
| `BR-RES-08` | Every result has a status (`MET`, `PARTIALLY_MET`, or `NOT_MET`), a score, and written feedback.                                                      |
| `BR-RES-09` | Feedback should point to evidence (files and line ranges) where possible.                                                                             |

### 9.5 Issues

| ID          | Rule                                                                                                                                         |
|-------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-ISS-01` | Every issue belongs to exactly one analysis run.                                                                                             |
| `BR-ISS-02` | Every issue has a severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and a category (such as `STRUCTURE`, `SECURITY`, `QUALITY`, `REQUIREMENT`). |
| `BR-ISS-03` | Only the owning teacher and admins can resolve or reopen issues.                                                                             |
| `BR-ISS-04` | Resolving an issue records who resolved it (`resolved_by_user`), when, and an optional note.                                                 |
| `BR-ISS-05` | Resolving an issue does not change any analysis result or score.                                                                             |
| `BR-ISS-06` | Students can see issues on their own submissions, including whether they were resolved and the resolution note.                              |

Use the enum values defined in `app/Enums/`. If they differ from the values above, update this document.

---

## 10. Scores and Grading

| ID          | Rule                                                                                                                                                                               |
|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-GRD-01` | A submission's AI score is the sum of the result scores in its current analysis (`BR-ANL-08`).                                                                                     |
| `BR-GRD-02` | A submission with no completed run has no score. It is shown as "pending" or "failed", never as zero.                                                                              |
| `BR-GRD-03` | AI scores and feedback are **advisory**. The teacher is the final authority on grades.                                                                                             |
| `BR-GRD-04` | The system does not publish official grades in the current version. If final grading is added, it must be a separate teacher-controlled record that does not overwrite AI results. |
| `BR-GRD-05` | Being late (`BR-SUB-03`) does not change the AI score. Any late penalty is applied by the teacher.                                                                                 |

---

## 11. Visibility Summary

| Data                                   | Student (own)   | Student (other students)   | Owning Teacher   | Admin   |
|----------------------------------------|-----------------|----------------------------|------------------|---------|
| Assignment details and requirements    | Enrolled only   | —                          | ✅                | ✅       |
| `TEMPLATE` repository                  | Enrolled only   | —                          | ✅                | ✅       |
| `REFERENCE` repository                 | ❌               | ❌                          | ✅                | ✅       |
| Submissions                            | ✅               | ❌                          | ✅                | ✅       |
| Analysis runs, results, and issues     | ✅               | ❌                          | ✅                | ✅       |
| Git connections                        | ✅               | ❌                          | ❌                | ❌       |
| Other students' names in an assignment | ❌               | ❌                          | ✅                | ✅       |

Full access rules are in `docs/backend/authorization.md`.

---

## 12. Data Retention and Audit

| ID          | Rule                                                                                                                                                                 |
|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BR-DAT-01` | Records are soft-deleted, not permanently deleted, through the API.                                                                                                  |
| `BR-DAT-02` | Soft deletion never cascades to submissions, analysis runs, analysis results, or analysis issues.                                                                    |
| `BR-DAT-03` | Every create, update, and delete records the acting user in `created_by_user`, `updated_by_user`, or `deleted_by_user`.                                              |
| `BR-DAT-04` | Audit fields are set by the server only.                                                                                                                             |
| `BR-DAT-05` | Permanent deletion (for example, for a data-removal request) is an admin-only maintenance operation outside the public API, and must be documented when it is built. |
| `BR-DAT-06` | Student source code is not stored in the database. Only analysis output, evidence references, and short code excerpts needed for feedback are stored.                |

---

## 13. Notifications

| ID          | Rule                                                                                                                                |
|-------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `BR-NOT-01` | When an analysis run completes, the submitting student and the owning teacher are notified.                                         |
| `BR-NOT-02` | When an analysis run fails after all retries, the owning teacher is notified. The student sees the failed status on the submission. |
| `BR-NOT-03` | Notifications never contain Git tokens, `REFERENCE` repository content, or other students' data.                                    |

Notification channels (in-app, email) are defined when notifications are implemented.

---

## 14. Rule-to-Error Mapping

| Rule                     | Error Code                       | Status      |
|--------------------------|----------------------------------|-------------|
| `BR-SUB-01`, `BR-SRP-01` | `STUDENT_NOT_ENROLLED`           | `422`       |
| `BR-ENR-03`              | `DUPLICATE_ENROLLMENT`           | `409`       |
| `BR-SUB-02`              | `REPOSITORY_NOT_LINKED`          | `422`       |
| `BR-SUB-06`              | `COMMIT_NOT_FOUND`               | `422`       |
| `BR-SUB-07`              | `ASSIGNMENT_HAS_NO_REQUIREMENTS` | `422`       |
| `BR-SUB-10`              | `DUPLICATE_SUBMISSION`           | `409`       |
| `BR-ANL-03`              | `ANALYSIS_ALREADY_RUNNING`       | `409`       |
| `BR-GIT-06`              | `UNSAFE_REPOSITORY_URL`          | `422`       |
| `BR-ARP-02`, `BR-SRP-02` | `REPOSITORY_ACCESS_DENIED`       | `422`       |
| `BR-ANL-12`              | `REPOSITORY_TOO_LARGE`           | Run failure |
| `BR-ANL-17`              | `ANALYSIS_TIMEOUT`               | Run failure |
| `BR-RES-05`              | `AI_INVALID_RESPONSE`            | Run failure |

Add new codes to the catalog in `docs/backend/error-handling.md`.

---

## 15. Open Decisions

These rules are the current defaults. Confirm or change them with the product owner, then update this table.

| Topic                           | Current Rule                             | Alternative                          |
|---------------------------------|------------------------------------------|--------------------------------------|
| Late submissions                | Accepted and marked late (`BR-SUB-03`)   | Per-assignment setting to block them |
| Submission limit                | Unlimited (`BR-SUB-12`)                  | Maximum attempts per assignment      |
| Student re-analysis             | Not allowed (`BR-ANL-06`)                | Allowed with a rate limit            |
| Self-enrollment                 | Not allowed (`BR-ENR-04`)                | Join with an assignment code         |
| Template repositories           | At most one per assignment (`BR-ASG-08`) | Multiple templates                   |
| Official grading                | Not included (`BR-GRD-04`)               | Teacher-controlled grade record      |
| Soft-deleted assignment history | Students keep read access (`BR-ASG-15`)  | Hidden from students                 |

---

## 16. Schema Notes

Some rules need columns that may not yet exist in `docs/database/database.md`. Confirm and add them through migrations if needed:

| Rule                     | Column                                                                           |
|--------------------------|----------------------------------------------------------------------------------|
| `BR-SUB-03`              | `submissions.is_late`                                                            |
| `BR-SUB-05`              | `submissions.commit_sha`, `submissions.branch`                                   |
| `BR-REQ-03`, `BR-REQ-05` | `assignment_requirements.max_score`, `assignment_requirements.sort_order`        |
| `BR-ANL-04`              | `analysis_runs.commit_sha`                                                       |
| `BR-ANL-10`              | `analysis_runs.error_code`, `analysis_runs.error_message`                        |
| `BR-RES-08`              | `analysis_results.status`, `analysis_results.score`, `analysis_results.feedback` |
| `BR-ISS-04`              | `analysis_issues.resolved_at`, `analysis_issues.resolution_note`                 |
| `BR-SUB-10`, `BR-SRP-04` | Unique indexes that respect soft deletes                                         |

---

## 17. Rules for AI Coding Agents

1. Read the relevant section of this document before implementing a feature.
2. Reference rule IDs in tests and in pull request descriptions.
3. Enforce rules on the server, in Services or Form Requests, never only in the frontend.
4. Do not invent business rules. If a rule is missing or unclear, ask, or add it to section 15 as an open decision.
5. When a rule changes, update this document, the detailed business document, `docs/backend/api.md`, and the tests in the same change.
6. Never remove a rule ID; mark it as **Removed**.
7. Add a test for every rule you implement and report actual test results.

---

## 18. Summary

- Teachers own assignments; students work only on assignments they are enrolled in.
- Every submission is fixed to an exact commit and is never edited or deleted by users.
- Late submissions are accepted and marked late.
- Each submission automatically gets an AI analysis; history is kept and never overwritten.
- AI output is validated strictly; invalid output is rejected, never adjusted.
- AI scores are advisory; the teacher has the final say.
- `REFERENCE` repositories and Git tokens are never exposed to students.
- Nothing is permanently deleted through the API, and soft deletion never removes history.
