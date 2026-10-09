# Database Schema

Database:

PostgreSQL

---

## 1. Roles

## Table: roles

| Field      | Type        | Constraints      |
|------------|-------------|------------------|
| id         | BIGSERIAL   | PK               |
| name       | VARCHAR(50) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP   | NOT NULL         |
| updated_at | TIMESTAMP   | NOT NULL         |

Allowed values:

```text
ADMIN
TEACHER
STUDENT
```

---

# 2. Users

## Table: users

| Field        | Type         | Constraints       |
|--------------|--------------|-------------------|
| id           | BIGSERIAL    | PK                |
| role_id      | BIGINT       | FK, NOT NULL      |
| name         | VARCHAR(100) | NOT NULL          |
| email        | VARCHAR(150) | NOT NULL, UNIQUE  |
| phone        | VARCHAR(20)  | NOT NULL          |
| password     | VARCHAR(150) | NOT NULL          |
| avatar        | VARCHAR(255)  | NULL          |
| email_verified_at   | TIMESTAMP    | NULL          |
| created_at   | TIMESTAMP    | NOT NULL          |
| updated_at   | TIMESTAMP    | NOT NULL          |

---
User status:

```text
active
inactive
suspended
```
