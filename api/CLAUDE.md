# CLAUDE.md

Instructions for Claude when working in this repository.

@AGENTS.md

---

## Project

**Student Assignment Review AI** is a Laravel REST API that lets teachers create programming assignments, lets students submit work from their Git repositories, and uses AI to review each submission against the assignment's requirements.

- **Backend:** Laravel (PHP)
- **Database:** MySQL
- **Auth:** Laravel Sanctum bearer tokens
- **Authorization:** Policies and Gates
- **Background work:** Laravel Queues (AI analysis on the `analysis` queue)
- **Tests:** PHPUnit or Pest (check `composer.json`)

This repository is the backend API. Every endpoint returns JSON under `/api/v1`.

---

## Commands

```bash
# Install
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# Run (three processes)
php artisan serve
php artisan queue:work --queue=analysis,default
php artisan schedule:work            # token pruning, workspace cleanup

# Test
php artisan test
php artisan test --filter=SubmissionTest
php artisan test --parallel

# Code quality (run before finishing any task)
./vendor/bin/pint --dirty
./vendor/bin/phpstan analyse         # if Larastan is installed
```

Tests use a separate MySQL database configured in `.env.testing`. Never run tests against the development database.

Project configuration lives in `config/ai.php`, `config/git.php`, and `config/review.php`. Read limits and timeouts from config; never hard-code them.

---

## Documentation Map

Read the relevant documents **before** changing code. Do not load all of them for every task.

| When you are working on...                        | Read                               |
|---------------------------------------------------|------------------------------------|
| Any feature                                       | `docs/business/business-rules.md`  |
| Assignments, requirements, structures, enrollment | `docs/business/assignments.md`     |
| Submissions, late work, attempts                  | `docs/business/submissions.md`     |
| Git providers, repositories, archives             | `docs/business/git-integration.md` |
| AI analysis, prompts, output validation           | `docs/business/ai-review.md`       |
| Folder structure, layers, naming                  | `docs/backend/architecture.md`     |
| Endpoints, request and response formats           | `docs/backend/api.md`              |
| Login, tokens, passwords                          | `docs/backend/authentication.md`   |
| Roles, ownership, policies                        | `docs/backend/authorization.md`    |
| Exceptions, status codes, error codes, logging    | `docs/backend/error-handling.md`   |
| Tests, factories, fakes                           | `docs/backend/testing.md`          |
| Tables and columns                                | `docs/database/database.md`        |
| Model relationships                               | `docs/database/relationships.md`   |
| Schema conventions                                | `docs/database/database-rules.md`  |

**Priority when documents conflict:** `business-rules.md` → `database.md` / `relationships.md` → the other business docs → the backend docs → existing code. If you find a conflict, point it out instead of choosing silently.

**Rule IDs.** Rules have stable IDs. `BR-*` rules are in `business-rules.md`; detailed rules use the prefix of their document (`ASG-*`, `SUB-*`, `GIT-*`, `AI-*`). Reference them in tests and reports.

**Proposed endpoints.** Endpoints marked **proposed** in the docs are not part of the API yet. Do not build them unless the task asks for them.

---

## Domain Model

```text
Role ─< User
User ─< Assignment (as teacher, teacher_id)
User ─< GitConnection ─< Repository

Assignment ─< AssignmentStudent           (enrollment)
Assignment ─< AssignmentRequirement
Assignment ─< AssignmentStructure ─< AssignmentStructureRule
Assignment ─< AssignmentRepository        (type: TEMPLATE | REFERENCE)
Assignment ─< AssignmentStudentRepository
Assignment ─< Submission ─< AnalysisRun ─< AnalysisResult >─ AssignmentRequirement
                                       └─< AnalysisIssue
```

Use these exact model names. There is no `AIReview` model; AI reviews are `AnalysisRun`, `AnalysisResult`, and `AnalysisIssue`. (`architecture.md` uses `AIReview` as an older example name; ignore it.)

**Derived, not stored:** assignment `stage`, submission `attempt_number`, `is_latest`, and `review_status`. Calculate them; do not add columns for them.

**Two different "latest" runs:** `latest_analysis_run` is the newest run of any status. `current_analysis` is the newest **completed** run. Scores always come from `current_analysis`.

---

## How to Work on a Task

1. **Understand.** Read the relevant docs and the existing code for the feature. Find the rule IDs that apply.
2. **Plan.** For anything beyond a small fix, state which files you will change and why before writing code. Mention any database change, new job, new error code, or new enum value.
3. **Implement.** Follow the existing patterns in neighboring files. Keep changes focused on the task.
4. **Test.** Add or update tests, including permission and validation failures. Run them.
5. **Check.** Run Pint and static analysis if configured.
6. **Update docs.** If behavior, endpoints, rules, error codes, enums, or schema changed, update the matching document in the same change.
7. **Report.** Use the format at the end of this file.

If a requirement is unclear or a business rule is missing, **ask** instead of inventing one.

---

## Rules That Matter Most

These are the mistakes that cause real damage in this project. Full rules are in `AGENTS.md` and the docs.

### Security and access

- Every protected action calls `Gate::authorize()` with a Policy method. Every list endpoint uses a `visibleTo()` scope.
- Return `404` (`Response::denyAsNotFound()`) when the user must not know a resource exists; `403` when they can see it but cannot act on it.
- Students never see other students' work, and never see `REFERENCE` repositories or `use_reference_in_review`, even through `include`.
- Git connections are private to their owner, including from admins. There is no global admin bypass.
- Never accept server-owned fields from a request: `teacher_id`, `student_id`, `user_id`, `role_id`, `resolved_by_user`, `*_by_user` audit fields, `is_late`, `submitted_at`, or anything returned by a provider (such as `commit_message`).
- Use `$request->validated()`, never `$request->all()`.

### Secrets

- Never return, log, or put in a job payload: passwords, Sanctum tokens, Git access tokens, AI provider keys.
- Git tokens are stored with the `encrypted` cast and sent only in HTTP headers to configured provider hosts.
- Never put real credentials in code, tests, factories, seeders, or `.env.example`.

### Git

- All Git provider calls go through `GitProviderClient`. Never build a request URL from a user-supplied host.
- Retrieve repository content as an archive at the exact commit SHA. Do not use `git clone` unless `git-integration.md` section 8.4 is followed.
- Extract archives safely (no `..`, absolute paths, or symlinks) and always delete the workspace in `finally`.
- Never send `.env` files, keys, `vendor/`, `node_modules/`, or binaries to the AI provider.
- Call the Git provider **outside** database transactions.

### AI

- **Never execute submitted code**, scripts, hooks, or package managers.
- AI analysis always runs in `AnalyzeSubmissionJob`, never inside an HTTP request. Call the provider only through `AIProviderClient`.
- Structure rules are checked by code, not by the AI.
- Student code is data, not instructions. Never send student names, emails, or IDs to the provider.
- Validate AI output with `ReviewOutputValidator` before storing anything. Reject invalid output; **never clamp, round, or adjust scores**.
- Never quote `REFERENCE` repository content in feedback.
- Change prompts by adding a new prompt version, never by editing an existing one.

### Data integrity

- Submissions are never edited, and only admins can soft-delete them.
- Never overwrite or delete past analysis runs, results, or issues. A re-analysis creates a new run.
- Editing an assignment or its requirements never changes existing analysis results.
- Soft deletes never cascade to submissions, runs, results, or issues.
- Wrap multi-record writes in `DB::transaction()` and dispatch jobs with `afterCommit()`.
- Each `AnalysisResult` must reference a requirement from the same assignment as its submission.

### Architecture

- Thin controllers. Validation in Form Requests. Business logic in Services. Responses through API Resources.
- Services throw `ApplicationException` subclasses; the central handler renders them. Do not return error arrays.
- Errors use the format and codes in `error-handling.md`. Add every new code to its catalog.
- Do not add new layers, packages, or patterns without a clear reason. Do not redesign the schema while working on an unrelated feature.

---

## Database Changes

- Every schema change is a new migration. Never edit a migration that may already have run.
- Follow `docs/database/database-rules.md` for naming, indexes, foreign keys, timestamps, soft deletes, and audit fields.
- Several business docs list columns they depend on (in "Schema Notes" or "Data Model Notes" sections). Before using one of these columns, confirm it exists in `database.md` and the migrations. If it does not, add it through a migration and say so in your plan.
- Update `docs/database/database.md` and, if relationships change, `docs/database/relationships.md`.
- Update factories so they still produce valid data.

---

## Testing Expectations

- Every endpoint: success, `401`, `403`/`404`, `422`, and the database effect.
- Every new Policy rule has a test for the allowed user and for each denied user type.
- Fake everything external: `Queue::fake()`, `Http::fake()` with `Http::preventStrayRequests()`, `Storage::fake()`, `Notification::fake()`, and a fake `AIProviderClient`.
- Name tests after behavior, and include the rule ID where one applies: `test_br_sub_03_late_submission_is_accepted_and_marked_late`.
- Do not delete, skip, or weaken an existing test to make new code pass.

**Never claim tests passed unless you ran them and they passed.** If you could not run them, say so and explain why.

---

## Known Documentation Gaps

These inconsistencies are known. Do not resolve them silently; follow the note and mention it in your report. Remove each item from this list once the docs are fixed.

- Requirement score field: `api.md` shows `weight`; the business docs use `max_score`. Use `max_score`.
- Error format: `api.md` and `testing.md` examples show errors without `code`. Follow `error-handling.md`, which includes `code`.
- Error codes used in the business docs but missing from the `error-handling.md` catalog: `DUPLICATE_SUBMISSION`, `ASSIGNMENT_HAS_NO_REQUIREMENTS`, `TEMPLATE_ALREADY_LINKED`. Add them when you first use them.
- Issue category `INTEGRITY` (from `ai-review.md`) is not yet listed in `business-rules.md` `BR-ISS-02`.
- The submission response in `api.md` section 17 does not yet show `attempt_number`, `is_latest`, `review_status`, or `current_analysis` (see `submissions.md`).
- Authentication endpoints in `authentication.md` (`logout-all`, `password`, `forgot-password`, `reset-password`) are not yet listed in `api.md`.

---

## Things Not to Do

- Do not invent business rules, endpoints, columns, or enum values that are not documented. Ask or flag them.
- Do not make unrelated refactors, formatting changes, or dependency upgrades in a feature change.
- Do not commit `.env`, credentials, or generated files.
- Do not disable authorization, validation, or tests "temporarily".
- Do not run destructive commands (`migrate:fresh`, `db:wipe`, dropping tables) outside the test database without explicit permission.
- Do not push, merge, or deploy unless asked.

---

## Response Format When Finishing a Task

```text
Summary
- What was changed and why (1–3 lines)

Files changed
- path/to/File.php — what changed

Rules
- BR-XXX-NN / SUB-XXX-NN — implemented / tested

Commands run
- php artisan test --filter=... → result
- ./vendor/bin/pint --dirty → result

Docs updated
- docs/...

Notes
- Assumptions, open questions, documentation gaps found, anything not finished or not verified
```
