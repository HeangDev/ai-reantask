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
ADMIN, TEACHER, STUDENT
```
---
Role status:

```text
ACTIVE, INACTIVE
```

---

# 2. Users

## Table: users

| Field              | Type           | Constraints                 |
|--------------------|----------------|-----------------------------|
| id                 | BIGINT         | PK, AUTO_INCREMENT          |
| role_id            | BIGINT         | FK, NOT NULL                |
| fullname           | VARCHAR(255)   | NOT NULL                    |
| username           | VARCHAR(255)   | NOT NULL, UNIQUE            |
| email              | VARCHAR(150)   | NOT NULL, UNIQUE            |
| phone              | VARCHAR(20)    | NOT NULL, UNIQUE            |
| password           | VARCHAR(255)   | NOT NULL                    |
| avatar             | VARCHAR(255)   | NULL                        |
| status             | ENUM           | NOT NULL, DEFAULT 'ACTIVE'  |
| email_verified_at  | TIMESTAMP      | NULL                        |
| created_at         | TIMESTAMP      | NULL                        |
| created_by_user    | TIMESTAMP      | NULL                        |
| updated_at         | TIMESTAMP      | NULL                        |
| updated_by_user    | BIGINT         | NULL                        |
| deleted_at         | TIMESTAMP      | NULL                        |
| deleted_by_user    | BIGINT         | NULL                        |

---
User status:

```text
ACTIVE, INACTIVE, SUSPENDED, DELETED
```

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
Analysis Issues Severity:

```text
LOW, MEDIUM, HIGH, CRITICAL
```
Analysis Issues Category:

```text
STRUCTURE, REQUIREMENT, CODE, SECURITY, DEPENDENCY, DATABASE, API, TEST, UI
```
---
