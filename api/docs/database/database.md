# Database Schema

Database:

MySQL

---

## 1. Roles

## Table: roles

| Field        | Type           | Constraints                 |
|--------------|----------------|-----------------------------|
| id           | BIGINT         | PK, AUTO_INCREMENT          |
| name         | VARCHAR(100)   | NOT NULL, UNIQUE            |
| status       | VARCHAR(20)    | NOT NULL, DEFAULT 'ACTIVE'  |
| created_at   | TIMESTAMP      | NULL                        |
| updated_at   | TIMESTAMP      | NULL                        |

Allowed values:

```text
admin, teacher, student
```

Role names are lowercase and match the `RoleName` enum. The `roles` table is seeded by `RoleSeeder`.
---
Role status:

```text
ACTIVE, INACTIVE
```

| Status     | Meaning / what to do                                                                                                                                   |
|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ACTIVE`   | The role is in use. Users with this role can log in and use the permissions it grants.                                                                 |
| `INACTIVE` | The role is disabled. Block login and access for users with this role, and don't let admins assign it to new users. Existing user rows stay unchanged. |

---

# 2. Users

## Table: users

| Field              | Type           | Constraints                 |
|--------------------|----------------|-----------------------------|
| id                 | BIGINT         | PK, AUTO_INCREMENT          |
| role_id            | BIGINT         | FK, NOT NULL                |
| fullname           | VARCHAR(255)   | NOT NULL                    |
| email              | VARCHAR(150)   | NOT NULL, UNIQUE            |
| google_id          | VARCHAR(255)   | NULL, UNIQUE                |
| phone              | VARCHAR(20)    | NULL, UNIQUE                |
| password           | VARCHAR(255)   | NOT NULL                    |
| avatar             | VARCHAR(255)   | NULL                        |
| status             | ENUM           | NOT NULL, DEFAULT 'ACTIVE'  |
| email_verified_at  | TIMESTAMP      | NULL                        |
| created_at         | TIMESTAMP      | NULL                        |
| created_by_user    | BIGINT         | FK (users.id), NULL         |
| updated_at         | TIMESTAMP      | NULL                        |
| updated_by_user    | BIGINT         | FK (users.id), NULL         |
| deleted_at         | TIMESTAMP      | NULL                        |
| deleted_by_user    | BIGINT         | FK (users.id), NULL         |

Notes:

- The audit foreign keys use `ON DELETE SET NULL`. `role_id` uses `ON DELETE RESTRICT`.
- Users are soft-deleted (`deleted_at`). Emails and phones stay reserved after a soft delete, because the unique indexes include deleted rows.
- `google_id` is Google's account id, set by Google sign-in. `phone` is optional because Google does not provide it; password sign-up still requires it.
- `created_by_user` is `NULL` for public self-registration and for seeded accounts.

---
User status:

```text
PENDING, ACTIVE, INACTIVE, SUSPENDED, DELETED
```

| Status      | Meaning / what to do                                                                                                                                                           |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `PENDING`   | A student who registered publicly and is waiting for an admin or a teacher to approve the account. They cannot log in until approved. Approve → `ACTIVE`. Reject → `DELETED`.  |
| `ACTIVE`    | A normal approved account. The user can log in and use all features allowed by their role.                                                                                     |
| `INACTIVE`  | The account is turned off, for example after graduation or a long absence. The user cannot log in, but history is kept. An admin can set it back to `ACTIVE`.                  |
| `SUSPENDED` | The account is temporarily blocked for a violation or a security concern. The user cannot log in. Keep all data. An admin reviews and restores to `ACTIVE`, or sets `DELETED`. |
| `DELETED`   | The account is soft-deleted (`deleted_at` and `deleted_by_user` are set). The user cannot log in and is hidden from lists. Email and phone stay reserved.                      |

---

# 3. Assignments

## Table: assignments

| Field           | Type           | Constraints                      |
|-----------------|----------------|----------------------------------|
| id              | BIGINT         | PK                               |
| teacher_id      | BIGINT         | FK, NOT NULL                     |
| title           | VARCHAR(255)   | NOT NULL                         |
| description     | LONGTEXT       | NULL                             |
| instructions    | LONGTEXT       | NULL                             |
| status          | ENUM           | NOT NULL, DEFAULT 'PUBLISHED'    |
| start_at        | TIMESTAMP      | NOT NULL                         |
| deadline_at     | TIMESTAMP      | NOT NULL                         |
| created_at      | TIMESTAMP      | NULL                             |
| created_by_user | BIGINT         | FK, NULL                         |
| updated_at      | TIMESTAMP      | NULL                             |
| updated_by_user | BIGINT         | FK, NULL                         |
| deleted_at      | TIMESTAMP      | NULL                             |
| deleted_by_user | BIGINT         | FK, NULL                         |

---
Assignment status:

```text
PUBLISHED, DRAFT, DELETED
```

| Status      | Meaning / what to do                                                                                                 |
|-------------|----------------------------------------------------------------------------------------------------------------------|
| `DRAFT`     | The teacher is still preparing it. Students cannot see it and cannot submit. Publish → `PUBLISHED`.                  |
| `PUBLISHED` | Visible to assigned students. They can submit between `start_at` and `deadline_at`.                                  |
| `DELETED`   | Soft-deleted. Hidden from teachers and students, but existing submissions and analysis results are kept for records. |

---

# 4. Assignment Students

## Table: assignment_students

| Field            | Type        | Constraints                  |
|------------------|-------------|------------------------------|
| id               | BIGINT      | PK                           |
| assignment_id    | BIGINT      | FK, NOT NULL                 |
| student_id       | BIGINT      | FK, NOT NULL                 |
| status           | ENUM        | NOT NULL, DEFAULT 'ACTIVE'   |
| joined_at        | TIMESTAMP   | NULL                         |
| created_at       | TIMESTAMP   | NULL                         |
| created_by_user  | BIGINT      | FK, NULL                     |
| updated_at       | TIMESTAMP   | NULL                         |
| updated_by_user  | BIGINT      | FK, NULL                     |
| deleted_at       | TIMESTAMP   | NULL                         |
| deleted_by_user  | BIGINT      | FK, NULL                     |

---
Assignment Students status:

```text
ACTIVE, INACTIVE, DELETED
```

| Status     | Meaning / what to do                                                                                                           |
|------------|--------------------------------------------------------------------------------------------------------------------------------|
| `ACTIVE`   | The student is assigned and can see and submit this assignment.                                                                |
| `INACTIVE` | The student is temporarily removed or excluded. They cannot submit, but old submissions are kept. Can be set back to `ACTIVE`. |
| `DELETED`  | The assignment was removed from the student (soft-deleted). Hidden from the student. Restore the row if re-assigned.           |

---

# 5. Assignment Requirements

## Table: assignment_requirements

| Field             | Type          | Constraints                |
|-------------------|---------------|----------------------------|
| id                | BIGINT        | PK                         |
| assignment_id     | BIGINT        | FK, NOT NULL               |
| title             | VARCHAR(255)  | NOT NULL                   |
| description       | LONGTEXT      | NULL                       |
| type              | VARCHAR(50)   | NOT NULL                   |
| is_required       | BOOLEAN       | NOT NULL, DEFAULT 'TRUE'   |
| weight            | DECIMAL(5,2)  | NOT NULL, DEFAULT '0'      |
| sort_order        | INT           | NOT NULL, DEFAULT '0'      |
| created_at        | TIMESTAMP     | NULL                       |
| created_by_user   | BIGINT        | FK, NULL                   |
| updated_at        | TIMESTAMP     | NULL                       |
| updated_by_user   | BIGINT        | FK, NULL                   |
| deleted_at        | TIMESTAMP     | NULL                       |
| deleted_by_user   | BIGINT        | FK, NULL                   |

---
Assignment Requirements Type:

```text
FEATURE, TECHNOLOGY, DATABASE, API, UI, SECURITY, TEST, DOCUMENTATION
```

---

# 6. Assignment Structures

## Table: assignment_structures

| Field           | Type           | Constraints                |
|-----------------|----------------|----------------------------|
| id              | BIGINT         | PK                         |
| assignment_id   | BIGINT         | FK, NOT NULL               |
| name            | VARCHAR(255)   | NOT NULL                   |
| description     | LONGTEXT       | NULL                       |
| created_at      | TIMESTAMP      | NULL                       |
| created_by_user | BIGINT         | FK, NULL                   |
| updated_at      | TIMESTAMP      | NULL                       |
| updated_by_user | BIGINT         | FK, NULL                   |
| deleted_at      | TIMESTAMP      | NULL                       |
| deleted_by_user | BIGINT         | FK, NULL                   |

---

# 7. Assignment Structure Rules

## Table: assignment_structure_rules

| Field             | Type           | Constraints                |
|-------------------|----------------|----------------------------|
| id                | BIGINT         | PK                         |
| structure_id      | BIGINT         | FK, NOT NULL               |
| path              | VARCHAR(255)   | NOT NULL                   |
| type              | VARCHAR(255)   | NOT NULL                   |
| is_required       | BOOLEAN        | NOT NULL, DEFAULT 'TRUE'   |
| description       | LONGTEXT       | NULL                       |
| created_at        | TIMESTAMP      | NULL                       |
| created_by_user   | BIGINT         | FK, NULL                   |
| updated_at        | TIMESTAMP      | NULL                       |
| updated_by_user   | BIGINT         | FK, NULL                   |
| deleted_at        | TIMESTAMP      | NULL                       |
| deleted_by_user   | BIGINT         | FK, NULL                   |

---

Assignment Requirements Rules Type:

```text
FILE, DIRECTORY
```

# 8. Git Connections

## Table: git_connections

| Field               | Type            | Constraints    |
|---------------------|-----------------|----------------|
| id                  | BIGINT       | PK             |
| user_id             | BIGINT          | FK, NOT NULL   |
| provider            | VARCHAR(50)     | NOT NULL       |
| provider_user_id    | VARCHAR(255)    | NOT NULL       |
| access_token        | TEXT            | NOT NULL       |
| refresh_token       | TEXT            | NULL           |
| token_expires_at    | TIMESTAMP       | NULL           |
| created_at          | TIMESTAMP       | NULL           |
| created_by_user     | BIGINT          | FK, NULL       |
| updated_at          | TIMESTAMP       | NULL           |
| updated_by_user     | BIGINT          | FK, NULL       |
| deleted_at          | TIMESTAMP       | NULL           |
| deleted_by_user     | BIGINT          | FK, NULL       |

---

# 9. Repositories

## Table: repositories

| Field               | Type            | Constraints              |
|---------------------|-----------------|--------------------------|
| id                  | BIGINT          | PK                       |
| git_connection_id   | BIGINT          | FK, NOT NULL             |
| provider            | VARCHAR(50)     | NOT NULL                 |
| external_id         | VARCHAR(255)    | NOT NULL                 |
| owner               | VARCHAR(255)    | NOT NULL                 |
| name                | VARCHAR(255)    | NOT NULL                 |
| full_name           | VARCHAR(255)    | NOT NULL                 |
| url                 | VARCHAR(255)    | NOT NULL                 |
| default_branch      | VARCHAR(255)    | NOT NULL, DEFAULT 'main' |
| created_at          | TIMESTAMP       | NULL                     |
| created_by_user     | BIGINT          | FK, NULL                 |
| updated_at          | TIMESTAMP       | NULL                     |
| updated_by_user     | BIGINT          | FK, NULL                 |
| deleted_at          | TIMESTAMP       | NULL                     |
| deleted_by_user     | BIGINT          | FK, NULL                 |

---

# 10. Assignment Repositories

## Table: assignment_repositories

| Field              | Type           | Constraints                  |
|--------------------|----------------|------------------------------|
| id                 | BIGINT         | PK                           |
| assignment_id      | BIGINT         | FK, NOT NULL                 |
| repository_id      | BIGINT         | FK, NOT NULL                 |
| type               | VARCHAR(50)    | NOT NULL, DEFAULT 'TEMPLATE' |
| branch             | VARCHAR(255)   | NOT NULL, DEFAULT 'main'     |
| created_at         | TIMESTAMP      | NULL                         |
| created_by_user    | BIGINT         | FK, NULL                     |
| updated_at         | TIMESTAMP      | NULL                         |
| updated_by_user    | BIGINT         | FK, NULL                     |
| deleted_at         | TIMESTAMP      | NULL                         |
| deleted_by_user    | BIGINT         | FK, NULL                     |

---

# 11. Assignment Student Repositories

## Table: assignment_student_repositories

| Field             | Type           | Constraints                |
|-------------------|----------------|----------------------------|
| id                | BIGINT         | PK                         |
| assignment_id     | BIGINT         | FK, NOT NULL               |
| student_id        | BIGINT         | FK, NOT NULL               |
| repository_id     | BIGINT         | FK, NOT NULL               |
| branch            | VARCHAR(255)   | NOT NULL                   |
| status            | ENUM           | NOT NULL, DEFAULT 'ACTIVE' |
| created_at        | TIMESTAMP      | NULL                       |
| created_by_user   | BIGINT         | FK, NULL                   |
| updated_at        | TIMESTAMP      | NULL                       |
| updated_by_user   | BIGINT         | FK, NULL                   |
| deleted_at        | TIMESTAMP      | NULL                       |
| deleted_by_user   | BIGINT         | FK, NULL                   |

---
Assignment Student Repositories status:

```text
ACTIVE, INACTIVE, DELETED
```

| Status     | Meaning / what to do                                                                                                                            |
|------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `ACTIVE`   | This repository and branch is the student's current repository for the assignment. Submissions and analysis use it.                             |
| `INACTIVE` | The repository link is paused or replaced by another one. It is not used for new submissions, but old submissions that reference it stay valid. |
| `DELETED`  | The link is soft-deleted. It is hidden and cannot be used. Restore the row if the same repository is linked again.                              |

---

# 12. Submissions

## Table: submissions

| Field            | Type           | Constraints                   |
|------------------|----------------|-------------------------------|
| id               | BIGINT         | PK                            |
| assignment_id    | BIGINT         | FK, NOT NULL                  |
| student_id       | BIGINT         | FK, NOT NULL                  |
| repository_id    | BIGINT         | FK, NOT NULL                  |
| commit_sha       | VARCHAR(100)   | NOT NULL                      |
| branch           | VARCHAR(255)   | NOT NULL                      |
| status           | ENUM           | NOT NULL, DEFAULT 'SUBMITTED' |
| submitted_at     | TIMESTAMP      | NOT NULL                      |
| created_at       | TIMESTAMP      | NULL                          |
| created_by_user  | BIGINT         | FK, NULL                      |
| updated_at       | TIMESTAMP      | NULL                          |
| updated_by_user  | BIGINT         | FK, NULL                      |
| deleted_at       | TIMESTAMP      | NULL                          |
| deleted_by_user  | BIGINT         | FK, NULL                      |

---
Submissions Status:

```text
SUBMITTED, ANALYZING, ANALYZED, VERIFIED, REJECTED
```

| Status      | Meaning / what to do                                                                                                                                                         |
|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `SUBMITTED` | The student submitted a commit. It is waiting in the queue. The system should create an `analysis_runs` record.                                                              |
| `ANALYZING` | An analysis run is in progress (`analysis_runs.status = RUNNING`). Don't start another run for the same submission.                                                          |
| `ANALYZED`  | Analysis finished and results and issues are available. The teacher can review the score.                                                                                    |
| `VERIFIED`  | A teacher reviewed and confirmed the result. This is final and counts as the official grade.                                                                                 |
| `REJECTED`  | The teacher or system rejected the submission, for example a wrong repository, invalid commit, or late submission. The student may submit again if the assignment allows it. |

---

# 13. Analysis Runs

## Table: analysis_runs

| Field         | Type            | Constraints                 |
|---------------|-----------------|-----------------------------|
| id            | BIGINT          | PK                          |
| submission_id | BIGINT          | FK, NOT NULL                |
| overall_score | DECIMAL(5,2)    | NULL                        |
| summary       | LONGTEXT        | NULL                        |
| status        | ENUM            | NOT NULL, DEFAULT 'PENDING' |
| started_at    | TIMESTAMP       | NULL                        |
| completed_at  | TIMESTAMP       | NULL                        |
| created_at    | TIMESTAMP       | NULL                        |
| updated_at    | TIMESTAMP       | NULL                        |

---
Analysis Runs Status:

```text
PENDING, RUNNING, COMPLETED, FAILED
```

| Status      | Meaning / what to do                                                                                                         |
|-------------|------------------------------------------------------------------------------------------------------------------------------|
| `PENDING`   | The run is created and waiting in the queue. `started_at` is empty.                                                          |
| `RUNNING`   | A worker is analyzing the code. Set `started_at`.                                                                            |
| `COMPLETED` | Finished successfully. Set `completed_at`, `overall_score` and `summary`. Set the submission to `ANALYZED`.                  |
| `FAILED`    | An error occurred, for example a clone failure or timeout. Save the error in `summary`. Allow a retry by creating a new run. |

---

# 14. Analysis Results

## Table: analysis_results

| Field             | Type            | Constraints                |
|-------------------|-----------------|----------------------------|
| id                | BIGINT          | PK                         |
| analysis_run_id   | BIGINT          | FK, NOT NULL               |
| requirement_id    | BIGINT          | FK, NOT NULL               |
| score             | DECIMAL(5,2)    | NULL                       |
| explanation       | LONGTEXT        | NULL                       |
| evidence          | JSON            | NULL                       |
| status            | ENUM            | NOT NULL, DEFAULT 'PASS'   |
| created_at        | TIMESTAMP       | NULL                       |
| updated_at        | TIMESTAMP       | NULL                       |

---
Analysis Results Status:

```text
PASS, PARTIAL, FAIL, NOT_CHECKED
```

| Status        | Meaning / what to do                                                                                                                                                   |
|---------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `PASS`        | The requirement is fully met. Full score for that requirement.                                                                                                         |
| `PARTIAL`     | The requirement is partly met. Give a partial score and explain what is missing in `explanation`.                                                                      |
| `FAIL`        | The requirement is not met. Score is 0 or very low, and `explanation` shows why.                                                                                       |
| `NOT_CHECKED` | The system could not evaluate this requirement, for example an unsupported type or an analysis error. Exclude it from the score or let the teacher review it manually. |

---

# 15. Analysis Issues

## Table: analysis_issues

| Field              | Type           | Constraints                |
|--------------------|----------------|----------------------------|
| id                 | BIGINT         | PK                         |
| analysis_run_id    | BIGINT         | FK, NOT NULL               |
| category           | VARCHAR(50)    | NOT NULL                   |
| severity           | VARCHAR(50)    | NOT NULL                   |
| title              | VARCHAR(255)   | NOT NULL                   |
| description        | LONGTEXT       | NULL                       |
| file_path          | VARCHAR(255)   | NULL                       |
| line_number        | INT            | NULL                       |
| suggestion         | LONGTEXT       | NULL                       |
| status             | ENUM           | NOT NULL, DEFAULT 'OPEN'   |
| resolved_at        | TIMESTAMP      | NULL                       |
| resolved_by_user   | BIGINT         | FK, NULL                   |
| created_at         | TIMESTAMP      | NULL                       |
| updated_at         | TIMESTAMP      | NULL                       |

---
Analysis Issues Status:

```text
OPEN, RESOLVED, IGNORED
```

| Status     | Meaning / what to do                                                                                                                    |
|------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| `OPEN`     | The issue was found and is not fixed yet. Show it to the student and the teacher.                                                       |
| `RESOLVED` | The issue was fixed, either confirmed by a later analysis or marked by a user. Set `resolved_at` and `resolved_by_user`.                |
| `IGNORED`  | The teacher decided it is not a problem or does not count (a false positive). Keep it for history but don't count it against the score. |

Analysis Issues Severity:

```text
LOW, MEDIUM, HIGH, CRITICAL
```

| Severity   | Meaning / what to do                                                                                  |
|------------|-------------------------------------------------------------------------------------------------------|
| `LOW`      | Style issue or minor suggestion. Fix when convenient.                                                 |
| `MEDIUM`   | Should be fixed.                                                                                      |
| `HIGH`     | Major defect that lowers the score.                                                                   |
| `CRITICAL` | Serious problem such as a security hole or a broken build. Fix before the submission can be verified. |

Analysis Issues Category:

```text
STRUCTURE, REQUIREMENT, CODE, SECURITY, DEPENDENCY, DATABASE, API, TEST, UI
```
---

# 16. Classes

## Table: classes

| Field           | Type         | Constraints                       |
|-----------------|--------------|-----------------------------------|
| id              | BIGINT       | PK, AUTO_INCREMENT                |
| name            | VARCHAR(255) | NOT NULL                          |
| code            | CHAR(6)      | NOT NULL, UNIQUE                  |
| description     | LONGTEXT     | NULL                              |
| status          | ENUM         | NOT NULL, DEFAULT 'ACTIVE'        |
| start_at        | DATE         | NOT NULL                          |
| end_date        | DATE         | NOT NULL                          |
| created_at      | TIMESTAMP    | NULL                              |
| created_by_user | BIGINT       | FK (users.id), NULL               |
| updated_at      | TIMESTAMP    | NULL                              |
| updated_by_user | BIGINT       | FK (users.id), NULL               |
| deleted_at      | TIMESTAMP    | NULL                              |
| deleted_by_user | BIGINT       | FK (users.id), NULL               |

---
Classes status:

```text
ACTIVE, INACTIVE
```

| Status     | Meaning / what to do                                                                                                                                             |
|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ACTIVE`   | The class is running. Admins can assign subjects, teachers and students, and members can see it.                                                                 |
| `INACTIVE` | The class is closed or paused, for example after `end_date` or before it starts. No new assignments or enrollments. Data is kept and an admin can reactivate it. |

---

# 17. Subjects

## Table: subjects

| Field           | Type         | Constraints                       |
|-----------------|--------------|-----------------------------------|
| id              | BIGINT       | PK, AUTO_INCREMENT                |
| name            | VARCHAR(255) | NOT NULL                          |
| description     | LONGTEXT     | NULL                              |
| status          | ENUM         | NOT NULL, DEFAULT 'ACTIVE'        |
| created_at      | TIMESTAMP    | NULL                              |
| created_by_user | BIGINT       | FK (users.id), NULL               |
| updated_at      | TIMESTAMP    | NULL                              |
| updated_by_user | BIGINT       | FK (users.id), NULL               |
| deleted_at      | TIMESTAMP    | NULL                              |
| deleted_by_user | BIGINT       | FK (users.id), NULL               |

---
Subjects status:

```text
ACTIVE, INACTIVE
```

| Status     | Meaning / what to do                                                                                                      |
|------------|---------------------------------------------------------------------------------------------------------------------------|
| `ACTIVE`   | The subject is available and can be added to classes.                                                                     |
| `INACTIVE` | The subject is retired. It cannot be added to new classes, but existing `class_subjects` rows and history stay unchanged. |

---

# 18. Class Subjects

## Table: class_subjects

| Field            | Type           | Constraints                  |
|------------------|----------------|------------------------------|
| id               | BIGINT         | PK, AUTO_INCREMENT           |
| class_id         | BIGINT         | FK, NOT NULL                 |
| subject_id       | BIGINT         | FK, NOT NULL                 |
| teacher_id       | BIGINT         | FK, NOT NULL                 |
| status           | ENUM           | NOT NULL, DEFAULT 'ACTIVE'   |
| created_at       | TIMESTAMP      | NULL                         |
| created_by_user  | BIGINT         | FK (users.id), NULL          |
| updated_at       | TIMESTAMP      | NULL                         |
| updated_by_user  | BIGINT         | FK (users.id), NULL          |
| deleted_at       | TIMESTAMP      | NULL                         |
| deleted_by_user  | BIGINT         | FK (users.id), NULL          |

---
Class Subjects status:

```text
ACTIVE, INACTIVE, DELETED
```

| Status     | Meaning / what to do                                                                                                                                                                |
|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ACTIVE`   | The teacher is currently teaching this subject in the class. They can create assignments for it.                                                                                    |
| `INACTIVE` | The subject or teacher assignment is paused, for example the teacher is on leave. The teacher cannot create new assignments, but old ones are kept. Set back to `ACTIVE` to resume. |
| `DELETED`  | The subject was removed from the class (soft-deleted). Hidden everywhere. Restore this row if the same subject is added again, because of the `(class_id, subject_id)` unique key.  |

---

# 19. Class Students

## Table: class_students

| Field            | Type           | Constraints                  |
|------------------|----------------|------------------------------|
| id               | BIGINT         | PK, AUTO_INCREMENT           |
| class_id         | BIGINT         | FK, NOT NULL                 |
| student_id       | BIGINT         | FK, NOT NULL                 |
| status           | ENUM           | NOT NULL, DEFAULT 'ACTIVE'   |
| created_at       | TIMESTAMP      | NULL                         |
| created_by_user  | BIGINT         | FK (users.id), NULL          |
| updated_at       | TIMESTAMP      | NULL                         |
| updated_by_user  | BIGINT         | FK (users.id), NULL          |
| deleted_at       | TIMESTAMP      | NULL                         |
| deleted_by_user  | BIGINT         | FK (users.id), NULL          |

---
Class Students status:

```text
ACTIVE, INACTIVE, DELETED
```

| Status     | Meaning / what to do                                                                                                                                                  |
|------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ACTIVE`   | The student is enrolled and sees the class, its subjects and its assignments.                                                                                         |
| `INACTIVE` | The student is temporarily out of the class, for example on leave or suspended. They cannot see new work, but history is kept. Set back to `ACTIVE` when they return. |
| `DELETED`  | The student was removed from the class (soft-deleted). Hidden everywhere. Restore this row if they rejoin, because of the `(class_id, student_id)` unique key.        |

---

# 20. User Settings

## Table: user_settings

| Field               | Type          | Constraints                         |
|---------------------|---------------|-------------------------------------|
| id                  | BIGINT        | PK, AUTO_INCREMENT                  |
| user_id             | BIGINT        | FK, NOT NULL                        |
| theme_mode          | VARCHAR(20)   | NOT NULL, DEFAULT 'SYSTEM'          |
| language            | VARCHAR(10)   | NOT NULL, DEFAULT 'EN'              |
| timezone            | VARCHAR(100)  | NOT NULL, DEFAULT 'Asia/Phnom_Penh' |
| email_notifications | BOOLEAN       | NOT NULL, DEFAULT TRUE              |
| push_notifications  | BOOLEAN       | NOT NULL, DEFAULT TRUE              |
| created_at          | TIMESTAMP     | NULL                                |
| updated_at          | TIMESTAMP     | NULL                                |

---
User Settings Theme Mode:

```text
LIGHT, DARK, SYSTEM
```

User Settings Language:

```text
EN, KH, KO
```

---
