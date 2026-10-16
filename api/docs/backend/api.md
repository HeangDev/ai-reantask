# API Documentation

**Project:** Student Assignment Review AI  
**Backend:** Laravel  
**Database:** MySQL  
**API Style:** RESTful JSON API  
**Current Version:** v1

---

## 1. Overview

This document defines the REST API endpoints, request formats, response formats, and access rules for the Student Assignment Review AI backend.

Related documents:

- `docs/backend/architecture.md`
- `docs/backend/authentication.md`
- `docs/backend/authorization.md`
- `docs/backend/error-handling.md`
- `docs/database/database.md`
- `docs/database/relationships.md`
- `docs/business/ai-review.md`

**Note:** Keep this document synchronized with `routes/api.php`. If an endpoint here does not exist in the code, or the code differs from this document, update one of them so they match.

---

## 2. Base URL

```text
{APP_URL}/api/v1
```

Example:

```text
http://localhost:8000/api/v1
```

All endpoints in this document are relative to the base URL.

---

## 3. Conventions

### 3.1 Headers

Every request should include:

```http
Accept: application/json
Content-Type: application/json
```

Protected endpoints also require:

```http
Authorization: Bearer {token}
```

### 3.2 Naming

- URLs use lowercase, plural, kebab-case nouns, such as `/assignment-requirements`.
- JSON fields use `snake_case`, matching the database column names.
- IDs are returned as integers unless the schema defines otherwise.
- Timestamps use ISO 8601 format in UTC, such as `2026-10-14T08:30:00Z`.

### 3.3 HTTP Methods

| Method          | Purpose                                |
|-----------------|----------------------------------------|
| `GET`           | Read a resource or a list of resources |
| `POST`          | Create a resource or start an action   |
| `PUT` / `PATCH` | Update a resource                      |
| `DELETE`        | Soft-delete a resource                 |

### 3.4 Route Nesting

Child resources are created and listed through their parent, and read, updated, or deleted directly by ID (shallow nesting).

```text
GET    /assignments/{assignment}/requirements
POST   /assignments/{assignment}/requirements
GET    /assignment-requirements/{requirement}
PATCH  /assignment-requirements/{requirement}
DELETE /assignment-requirements/{requirement}
```

### 3.5 Soft Deletion

`DELETE` endpoints soft-delete records and set `deleted_by_user`. Soft deletion must not remove historical submissions, analysis runs, or analysis results.

### 3.6 Audit Fields

The server sets `created_by_user`, `updated_by_user`, and `deleted_by_user` from the authenticated user. Clients must never send these fields, and the server must ignore them if sent.

---

## 4. Authentication

Authentication uses the system configured in the project. The examples in this document assume Laravel Sanctum token authentication (`auth:sanctum`).

| Method | Endpoint                | Description                            | Access        |
|--------|-------------------------|----------------------------------------|---------------|
| `POST` | `/auth/register`        | Register a student account             | Public        |
| `POST` | `/auth/login`           | Log in and receive a token             | Public        |
| `POST` | `/auth/google`          | Log in or register with a Google ID token | Public     |
| `POST` | `/auth/logout`          | Revoke the current token               | Authenticated |
| `POST` | `/auth/logout-all`      | Revoke all of the user's tokens        | Authenticated |
| `GET`  | `/auth/me`              | Get the authenticated user             | Authenticated |
| `PUT`  | `/auth/password`        | Change the current user's password     | Authenticated |
| `DELETE` | `/auth/account`       | Delete your own account (suspend + soft-delete) | Authenticated, not admins |
| `POST` | `/auth/forgot-password` | Send a password reset link             | Public        |
| `POST` | `/auth/reset-password`  | Reset the password using a reset token | Public        |

Request and response details for each endpoint are in `docs/backend/authentication.md`.

### 4.1 Register

```http
POST /api/v1/auth/register
```

```json
{
  "fullname": "Chan Sreyneang",
  "email": "student@example.com",
  "phone": "+855 12 000 111",
  "password": "a-strong-password",
  "password_confirmation": "a-strong-password"
}
```

Returns `201 Created` with the same body as login. The account always has the `student` role; `role_id`, `status`, and audit fields in the request are ignored (`BR-USR-02`).

### 4.2 Login

**Request**

```http
POST /api/v1/auth/login
```

```json
{
  "email": "teacher@example.com",
  "password": "secret-password"
}
```

**Response `200 OK`**

```json
{
  "data": {
    "token": "1|abcdef123456...",
    "token_type": "Bearer",
    "expires_at": "2026-10-21T08:30:00Z",
    "user": {
      "id": 1,
      "fullname": "Sok Dara",
      "email": "teacher@example.com",
      "phone": "+855 12 345 678",
      "avatar": null,
      "status": "ACTIVE",
      "role": {
        "id": 2,
        "name": "teacher"
      },
      "created_at": "2026-10-01T02:15:00Z",
      "updated_at": "2026-10-01T02:15:00Z"
    }
  }
}
```

**Rules**

- Rate-limit login and registration endpoints.
- Return the same error for an unknown email and a wrong password.
- Never return the password hash.
- Registration must not allow clients to choose a privileged role.

---

## 5. Response Format

### 5.1 Single Resource

```json
{
  "data": {
    "id": 10,
    "title": "Laravel CRUD Project"
  }
}
```

### 5.2 Collection with Pagination

List endpoints are paginated and use Laravel's standard API Resource pagination format.

```json
{
  "data": [
    { "id": 10, "title": "Laravel CRUD Project" },
    { "id": 11, "title": "REST API Design" }
  ],
  "links": {
    "first": "http://localhost:8000/api/v1/assignments?page=1",
    "last": "http://localhost:8000/api/v1/assignments?page=5",
    "prev": null,
    "next": "http://localhost:8000/api/v1/assignments?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 5,
    "per_page": 15,
    "to": 15,
    "total": 72
  }
}
```

### 5.3 Query Parameters for Lists

| Parameter   | Example                           | Description                                  |
|-------------|-----------------------------------|----------------------------------------------|
| `page`      | `page=2`                          | Page number                                  |
| `per_page`  | `per_page=25`                     | Items per page (default `15`, maximum `100`) |
| `search`    | `search=laravel`                  | Keyword search where supported               |
| `sort`      | `sort=-created_at`                | Sort field; prefix `-` for descending        |
| `include`   | `include=requirements,structures` | Eager-load allowed relationships             |

Only documented `sort` fields and `include` relationships are accepted. Unknown values are ignored or rejected with `422`.

### 5.4 Action Response

Endpoints that start background work return `202 Accepted` with the record that tracks the work.

```json
{
  "data": {
    "id": 55,
    "status": "queued"
  },
  "message": "Analysis has been queued."
}
```

---

## 6. Error Format

Follow `docs/backend/error-handling.md` for the full error specification.

### 6.1 Validation Error `422`

```json
{
  "message": "The title field is required.",
  "errors": {
    "title": [
      "The title field is required."
    ],
    "due_at": [
      "The due at field must be a date after now."
    ]
  }
}
```

### 6.2 General Error

```json
{
  "message": "This action is unauthorized."
}
```

### 6.3 Status Codes

| Code   | Meaning                                       |
|--------|-----------------------------------------------|
| `200`  | Successful read or update                     |
| `201`  | Resource created                              |
| `202`  | Background action accepted                    |
| `204`  | Success with no response body                 |
| `401`  | Missing or invalid authentication             |
| `403`  | Authenticated but not permitted               |
| `404`  | Resource not found or not visible to the user |
| `409`  | Conflict with the current resource state      |
| `422`  | Validation failed                             |
| `429`  | Rate limit exceeded                           |
| `500`  | Unexpected server error                       |

Production responses must not include stack traces, SQL, file paths, or secrets.

---

## 7. Roles and Access

Roles are stored in the `roles` table. A user has exactly one role through `users.role_id`.

This document uses these role names:

| Role    | Description                                                       |
|---------|-------------------------------------------------------------------|
| Admin   | Manages users, roles, and system-wide data                        |
| Teacher | Creates and manages their own assignments and reviews submissions |
| Student | Joins assignments, connects repositories, and submits work        |

Use the actual role names stored in the database. Authorization is enforced by Laravel Policies; the "Access" column in each table below describes the expected policy behavior.

**Ownership rules**

- A teacher can manage only assignments where `assignments.teacher_id` is their user ID.
- A student can access only assignments they are enrolled in through `assignment_students`.
- A student can view only their own submissions, repositories, and analysis results.
- When a user cannot see a resource, return `404` instead of `403` if revealing its existence would leak information.

---

## 8. Users and Roles

| Method   | Endpoint        | Description        | Access                                         |
|----------|-----------------|--------------------|------------------------------------------------|
| `GET`    | `/roles`        | List roles         | Admin                                          |
| `GET`    | `/users`        | List users         | Admin                                          |
| `POST`   | `/users`        | Create a user      | Admin                                          |
| `GET`    | `/users/{user}` | Get a user         | Admin, or the user themselves                  |
| `PATCH`  | `/users/{user}` | Update a user      | Admin, or the user themselves (limited fields) |
| `DELETE` | `/users/{user}` | Soft-delete a user | Admin                                          |
| `GET`    | `/users/{user}/sessions` | List a user's login sessions | Admin, or the user themselves |
| `GET`    | `/users/pending-students` | List students waiting for approval (oldest first, paginated) | Admin, Teacher |
| `POST`   | `/users/{user}/approve` | Approve a `PENDING` student; the status becomes `ACTIVE` | Admin, Teacher |

**Rules**

- Users cannot change their own `role_id` (`BR-USR-04`). Sending `role_id` or `status` without permission returns `403`.
- Only admins can assign or change roles (`BR-USR-03`) and a user's `status`. Admins cannot do either for their own account.
- Only admins can change a user's `email`. For everyone else `email` is ignored.
- `PATCH /users/{user}` never changes the password. Password changes go through `PUT /auth/password` (see `docs/backend/authentication.md`).
- Users who cannot see a user get `404` for `GET`, `PATCH`, and `DELETE`. Users who can see themselves but cannot delete their own account get `403`.
- `POST /users` and `PATCH /users/{user}` check authorization before validation, so a `403` or `404` is returned instead of validation errors.
- Changing a user's role or deleting a user revokes all of that user's tokens.
- `DELETE` soft-deletes only the user (`BR-USR-07`) and returns `204`.
- The roles listed by `GET /roles` and assignable through `role_id` must have `ACTIVE` status.

### 8.1 User Resource

```json
{
  "id": 3,
  "fullname": "Chan Sreyneang",
  "email": "student@example.com",
  "phone": "+855 12 000 111",
  "avatar": null,
  "status": "ACTIVE",
  "role": {
    "id": 3,
    "name": "student"
  },
  "created_at": "2026-10-01T02:15:00Z",
  "updated_at": "2026-10-01T02:15:00Z"
}
```

### 8.2 List Users

```http
GET /api/v1/users?role=student&status=ACTIVE&search=sreyneang&sort=-created_at&per_page=25
```

| Parameter  | Values                                         | Notes                                              |
|------------|------------------------------------------------|----------------------------------------------------|
| `role`     | `admin`, `teacher`, `student`                  | Filter by role name                                |
| `status`   | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `DELETED`   | Filter by status                                   |
| `search`   | any text, up to 255 characters                 | Matches `fullname` and `email`        |
| `sort`     | `created_at`, `fullname`, `email`  | Prefix `-` for descending; default `-created_at`   |
| `page`     | integer                                        |                                                    |
| `per_page` | `1`–`100`                                      | Default `15`                                       |

The role is always included in each user. Soft-deleted users are never listed.

### 8.3 Create User

```http
POST /api/v1/users
```

```json
{
  "fullname": "Sok Dara",
  "email": "teacher@example.com",
  "phone": "+855 12 345 678",
  "password": "a-strong-password",
  "password_confirmation": "a-strong-password",
  "role_id": 2,
  "status": "ACTIVE"
}
```

`status` is optional (default `ACTIVE`; `DELETED` is not accepted). Returns `201 Created` with the user resource. `created_by_user` is set from the authenticated admin.

**Validation**

| Field      | Rules                                                                                                  |
|------------|--------------------------------------------------------------------------------------------------------|
| `fullname` | Required, string, maximum 255 characters                                                               |
| `email`    | Required, valid email, maximum 150 characters, unique (including deleted users); stored lowercase      |
| `phone`    | Required, digits with an optional leading `+`, spaces, or hyphens, maximum 20 characters, unique      |
| `password` | Required, confirmed, follows the password policy in `authentication.md`                               |
| `role_id`  | Required, must be an existing `ACTIVE` role                                                            |

### 8.4 Update User

```http
PATCH /api/v1/users/{user}
```

| Field                                         | Who can send it                                   |
|-----------------------------------------------|---------------------------------------------------|
| `fullname`, `phone`                           | Admin, or the user themselves                     |
| `email`                                       | Admin only (ignored for everyone else)            |
| `role_id`, `status`                           | Admin, for another user only (otherwise `403`)    |

All fields are optional. Validation rules are the same as in section 8.3, and a user may keep their own current values. `updated_by_user` is set from the authenticated user.

### 8.4a Approve a Student

```http
POST /api/v1/users/{user}/approve
```

Returns `200` with the user resource (`status` `ACTIVE`). A user who is not a student returns `404`; a student who is not `PENDING` returns `409` with code `USER_NOT_PENDING`. `GET /users/pending-students` accepts `page` and `per_page`.

### 8.5 Roles

```http
GET /api/v1/roles
```

Admin only. Returns a paginated list of `{ "id": 1, "name": "admin", "status": "ACTIVE" }`.

### 8.6 Login Sessions

```http
GET /api/v1/users/{user}/sessions
```

A login session is one Sanctum token, created by each login or registration. The endpoint lists the user's **active** (not expired) sessions, newest first, paginated (`per_page` default `15`, maximum `100`).

```json
{
  "data": [
    {
      "id": 12,
      "device_name": "Chrome on Windows",
      "is_current": true,
      "last_used_at": "2026-10-14T08:30:00Z",
      "expires_at": "2026-10-21T08:30:00Z",
      "created_at": "2026-10-14T08:00:00Z"
    }
  ],
  "links": {},
  "meta": {}
}
```

**Rules**

- Access: admins and the user themselves. Anyone else gets `404`, as for `GET /users/{user}`.
- `is_current` is `true` only for the token that made the request, and only when the user is viewing their own sessions.
- The token value and its hash are never returned. `device_name` is the `device_name` sent at login (or the `User-Agent` for registration).
- IP address and user agent are not recorded, so they are not available.
- This endpoint is read-only. Revoking a single session is not part of the API yet; use `POST /auth/logout` and `POST /auth/logout-all`.

### 8.7 Subjects

| Method   | Endpoint              | Description      | Access                                            |
|----------|-----------------------|------------------|---------------------------------------------------|
| `GET`    | `/subjects`           | List subjects    | All roles (non-admins see `ACTIVE` only)          |
| `POST`   | `/subjects`           | Create a subject | Admin                                             |
| `GET`    | `/subjects/{subject}` | Get a subject    | All roles (non-admins: `ACTIVE` only, else `404`) |
| `PATCH`  | `/subjects/{subject}` | Update a subject | Admin                                             |
| `DELETE` | `/subjects/{subject}` | Soft-delete      | Admin                                             |

```json
{
  "data": {
    "id": 1,
    "name": "Web Development",
    "description": "HTML, CSS, and JavaScript",
    "status": "ACTIVE",
    "created_at": "2026-10-16T08:00:00Z",
    "updated_at": "2026-10-16T08:00:00Z"
  }
}
```

**Fields:** `name` (required on create, max 255), `description` (optional), `status` (`ACTIVE` or `INACTIVE`, default `ACTIVE`).

**List query parameters:** `page`, `per_page` (default `15`, maximum `100`), `search` (name contains), `status`, `sort` (`name` default, or `created_at`; prefix `-` for descending).

**Rules** (`BR-SBJ-01` to `BR-SBJ-04`)

- Non-admins who can see a subject get `403` on `PATCH` and `DELETE`; if they cannot see it (`INACTIVE`), they get `404`.
- `POST` and `PATCH` check authorization before validation.
- `name` must be unique among non-deleted subjects; a duplicate returns `422`.
- `DELETE` soft-deletes only the subject and returns `204`. Deleted subjects return `404`.

### 8.8 Classes

| Method   | Endpoint            | Description      | Access                                                          |
|----------|---------------------|------------------|-----------------------------------------------------------------|
| `GET`    | `/classes`          | List classes     | All roles (non-admins see only their own classes)               |
| `POST`   | `/classes`          | Create a class   | Admin                                                           |
| `GET`    | `/classes/{class}`  | Get a class      | Admin, or a teacher/student who belongs to it (else `404`)      |
| `PATCH`  | `/classes/{class}`  | Update a class   | Admin                                                           |
| `DELETE` | `/classes/{class}`  | Soft-delete      | Admin                                                           |

```json
{
  "data": {
    "id": 1,
    "name": "Web Dev 2026",
    "code": "K7Q2ZP",
    "description": "Morning class",
    "status": "ACTIVE",
    "start_at": "2026-11-01",
    "end_date": "2027-03-01",
    "created_at": "2026-10-16T08:00:00Z",
    "updated_at": "2026-10-16T08:00:00Z"
  }
}
```

**Fields:** `name` (required on create, max 255), `description` (optional), `start_at` and `end_date` (required on create, `YYYY-MM-DD`), `status` (`ACTIVE` or `INACTIVE`, default `ACTIVE`). `code` is read-only.

**List query parameters:** `page`, `per_page` (default `15`, maximum `100`), `search` (name or code contains), `status`, `sort` (`start_at`, `name`, or `created_at`; default `-start_at`; prefix `-` for descending).

**Rules** (`BR-CLS-01` to `BR-CLS-05`)

- A teacher or student who belongs to a class gets `403` on `PATCH` and `DELETE`; anyone else gets `404`.
- `POST` and `PATCH` check authorization before validation.
- On `PATCH`, a single date is checked against the stored other date.
- `DELETE` soft-deletes only the class and returns `204`. Deleted classes return `404`.

---

## 9. Assignments

| Method   | Endpoint                    | Description               | Access                                   |
|----------|-----------------------------|---------------------------|------------------------------------------|
| `GET`    | `/assignments`              | List visible assignments  | Teacher (own), Student (enrolled), Admin |
| `POST`   | `/assignments`              | Create an assignment      | Teacher                                  |
| `GET`    | `/assignments/{assignment}` | Get an assignment         | Owner teacher, enrolled student, Admin   |
| `PATCH`  | `/assignments/{assignment}` | Update an assignment      | Owner teacher, Admin                     |
| `DELETE` | `/assignments/{assignment}` | Soft-delete an assignment | Owner teacher, Admin                     |

**Allowed `include` values:** `teacher`, `requirements`, `structures`, `repositories`

### 9.1 Create Assignment

**Request**

```http
POST /api/v1/assignments
```

```json
{
  "title": "Laravel CRUD Project",
  "description": "Build a CRUD application for managing books.",
  "due_at": "2026-11-30T16:59:00Z"
}
```

**Response `201 Created`**

```json
{
  "data": {
    "id": 10,
    "title": "Laravel CRUD Project",
    "description": "Build a CRUD application for managing books.",
    "due_at": "2026-11-30T16:59:00Z",
    "teacher": {
      "id": 1,
      "name": "Sok Dara"
    },
    "created_at": "2026-10-14T08:30:00Z",
    "updated_at": "2026-10-14T08:30:00Z"
  }
}
```

**Rules**

- `teacher_id` is set from the authenticated teacher and is never accepted from the request.
- Field names above are examples; use the columns defined in `docs/database/database.md`.

---

## 10. Assignment Students (Enrollment)

| Method   | Endpoint                                   | Description                                     | Access               |
|----------|--------------------------------------------|-------------------------------------------------|----------------------|
| `GET`    | `/assignments/{assignment}/students`       | List enrolled students                          | Owner teacher, Admin |
| `POST`   | `/assignments/{assignment}/students`       | Enroll one or more students                     | Owner teacher, Admin |
| `DELETE` | `/assignment-students/{assignmentStudent}` | Remove an enrollment (soft delete)              | Owner teacher, Admin |
| `GET`    | `/me/assignments`                          | List the current student's enrolled assignments | Student              |

### 10.1 Enroll Students

**Request**

```json
{
  "student_ids": [3, 4, 5]
}
```

**Response `201 Created`**

```json
{
  "data": [
    { "id": 21, "assignment_id": 10, "student": { "id": 3, "name": "Chan Sreyneang" } },
    { "id": 22, "assignment_id": 10, "student": { "id": 4, "name": "Kim Visal" } },
    { "id": 23, "assignment_id": 10, "student": { "id": 5, "name": "Heng Piseth" } }
  ]
}
```

**Rules**

- Every ID must belong to a user with the student role.
- A student cannot be enrolled twice in the same assignment.
- Removing an enrollment must not delete the student's existing submissions or analysis history.

---

## 11. Assignment Requirements

| Method   | Endpoint                                 | Description               | Access                                 |
|----------|------------------------------------------|---------------------------|----------------------------------------|
| `GET`    | `/assignments/{assignment}/requirements` | List requirements         | Owner teacher, enrolled student, Admin |
| `POST`   | `/assignments/{assignment}/requirements` | Create a requirement      | Owner teacher, Admin                   |
| `GET`    | `/assignment-requirements/{requirement}` | Get a requirement         | Owner teacher, enrolled student, Admin |
| `PATCH`  | `/assignment-requirements/{requirement}` | Update a requirement      | Owner teacher, Admin                   |
| `DELETE` | `/assignment-requirements/{requirement}` | Soft-delete a requirement | Owner teacher, Admin                   |

### 11.1 Create Requirement

```json
{
  "title": "Implement book validation",
  "description": "Title and author are required. ISBN must be unique.",
  "weight": 20,
  "sort_order": 1
}
```

**Rules**

- Requirements are used by AI analysis to produce `analysis_results`.
- Deleting a requirement must not remove historical analysis results that reference it.
- Field names are examples; use the columns defined in the schema.

---

## 12. Assignment Structures and Structure Rules

An assignment can have multiple project structures. Each structure can have multiple rules describing expected files, folders, or conventions.

### 12.1 Structures

| Method   | Endpoint                               | Description                    | Access                                 |
|----------|----------------------------------------|--------------------------------|----------------------------------------|
| `GET`    | `/assignments/{assignment}/structures` | List structures                | Owner teacher, enrolled student, Admin |
| `POST`   | `/assignments/{assignment}/structures` | Create a structure             | Owner teacher, Admin                   |
| `GET`    | `/assignment-structures/{structure}`   | Get a structure with its rules | Owner teacher, enrolled student, Admin |
| `PATCH`  | `/assignment-structures/{structure}`   | Update a structure             | Owner teacher, Admin                   |
| `DELETE` | `/assignment-structures/{structure}`   | Soft-delete a structure        | Owner teacher, Admin                   |

### 12.2 Structure Rules

| Method   | Endpoint                                   | Description        | Access                                 |
|----------|--------------------------------------------|--------------------|----------------------------------------|
| `GET`    | `/assignment-structures/{structure}/rules` | List rules         | Owner teacher, enrolled student, Admin |
| `POST`   | `/assignment-structures/{structure}/rules` | Create a rule      | Owner teacher, Admin                   |
| `PATCH`  | `/assignment-structure-rules/{rule}`       | Update a rule      | Owner teacher, Admin                   |
| `DELETE` | `/assignment-structure-rules/{rule}`       | Soft-delete a rule | Owner teacher, Admin                   |

### 12.3 Create Structure Rule

```json
{
  "path": "app/Http/Controllers/BookController.php",
  "rule_type": "FILE_REQUIRED",
  "description": "A BookController must exist."
}
```

`rule_type` values are examples; use the enum defined in `app/Enums/` and the schema.

---

## 13. Git Connections

A Git connection links a user to a Git hosting account.

| Method   | Endpoint                           | Description                         | Access                   |
|----------|------------------------------------|-------------------------------------|--------------------------|
| `GET`    | `/git-connections`                 | List the current user's connections | Authenticated (own only) |
| `POST`   | `/git-connections`                 | Create a connection                 | Authenticated            |
| `GET`    | `/git-connections/{gitConnection}` | Get a connection                    | Owner                    |
| `PATCH`  | `/git-connections/{gitConnection}` | Update a connection                 | Owner                    |
| `DELETE` | `/git-connections/{gitConnection}` | Soft-delete a connection            | Owner                    |

### 13.1 Create Git Connection

```json
{
  "provider": "github",
  "username": "sreyneang-dev",
  "access_token": "ghp_xxxxxxxxxxxxxxxx"
}
```

### 13.2 Git Connection Resource

```json
{
  "id": 7,
  "provider": "github",
  "username": "sreyneang-dev",
  "has_token": true,
  "created_at": "2026-10-02T03:00:00Z"
}
```

**Rules**

- Access tokens are encrypted at rest and **never** returned in any response.
- Tokens must not be written to logs, exceptions, or job payloads in plain text.
- Validate the token with the provider before saving when the provider supports it.

---

## 14. Repositories

| Method   | Endpoint                                        | Description                        | Access                                   |
|----------|-------------------------------------------------|------------------------------------|------------------------------------------|
| `GET`    | `/git-connections/{gitConnection}/repositories` | List repositories for a connection | Connection owner                         |
| `POST`   | `/git-connections/{gitConnection}/repositories` | Register a repository              | Connection owner                         |
| `GET`    | `/repositories/{repository}`                    | Get a repository                   | Connection owner, related teacher, Admin |
| `PATCH`  | `/repositories/{repository}`                    | Update a repository                | Connection owner                         |
| `DELETE` | `/repositories/{repository}`                    | Soft-delete a repository           | Connection owner                         |

### 14.1 Register Repository

```json
{
  "url": "https://github.com/sreyneang-dev/laravel-books.git",
  "default_branch": "main"
}
```

**Rules**

- Accept only `https://` URLs from allowed Git hosts.
- Reject local, private-network, and file URLs to prevent server-side request forgery.
- Confirm the connection has access to the repository before saving.
- Soft-deleting a repository must not remove submissions that reference it.

---

## 15. Assignment Repositories

Links a repository to an assignment as a `TEMPLATE` or `REFERENCE`.

| Method   | Endpoint                                          | Description              | Access                                                      |
|----------|---------------------------------------------------|--------------------------|-------------------------------------------------------------|
| `GET`    | `/assignments/{assignment}/repositories`          | List linked repositories | Owner teacher, Admin; enrolled students see `TEMPLATE` only |
| `POST`   | `/assignments/{assignment}/repositories`          | Link a repository        | Owner teacher, Admin                                        |
| `DELETE` | `/assignment-repositories/{assignmentRepository}` | Unlink (soft delete)     | Owner teacher, Admin                                        |

### 15.1 Link Repository

```json
{
  "repository_id": 30,
  "type": "TEMPLATE"
}
```

**Rules**

- `type` must be `TEMPLATE` or `REFERENCE`.
- `REFERENCE` repositories (for example, a teacher's solution) must never be visible to students.
- The teacher must have access to the repository being linked.

---

## 16. Student Repositories

Links a student's repository to an assignment they are enrolled in.

| Method   | Endpoint                                               | Description                           | Access                               |
|----------|--------------------------------------------------------|---------------------------------------|--------------------------------------|
| `GET`    | `/assignments/{assignment}/student-repositories`       | List all student repositories         | Owner teacher, Admin                 |
| `GET`    | `/assignments/{assignment}/student-repositories/me`    | Get the current student's repository  | Enrolled student                     |
| `POST`   | `/assignments/{assignment}/student-repositories`       | Link the current student's repository | Enrolled student                     |
| `DELETE` | `/assignment-student-repositories/{studentRepository}` | Unlink (soft delete)                  | Owning student, owner teacher, Admin |

### 16.1 Link Student Repository

```json
{
  "repository_id": 41
}
```

**Rules**

- The student must be enrolled in the assignment.
- The repository must belong to one of the student's own Git connections.
- `student_id` is set from the authenticated user and is never accepted from the request.

---

## 17. Submissions

| Method   | Endpoint                                | Description                            | Access                               |
|----------|-----------------------------------------|----------------------------------------|--------------------------------------|
| `GET`    | `/assignments/{assignment}/submissions` | List submissions for an assignment     | Owner teacher, Admin                 |
| `GET`    | `/me/submissions`                       | List the current student's submissions | Student                              |
| `POST`   | `/assignments/{assignment}/submissions` | Create a submission                    | Enrolled student                     |
| `GET`    | `/submissions/{submission}`             | Get a submission                       | Owning student, owner teacher, Admin |
| `DELETE` | `/submissions/{submission}`             | Soft-delete a submission               | Admin                                |

**Allowed `include` values:** `student`, `repository`, `latest_analysis_run`

### 17.1 Create Submission

**Request**

```http
POST /api/v1/assignments/10/submissions
```

```json
{
  "repository_id": 41,
  "branch": "main",
  "commit_sha": "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4"
}
```

`commit_sha` is optional. If omitted, the server resolves the latest commit on the given branch and stores it.

**Response `201 Created`**

```json
{
  "data": {
    "id": 88,
    "assignment_id": 10,
    "student": {
      "id": 3,
      "name": "Chan Sreyneang"
    },
    "repository": {
      "id": 41,
      "url": "https://github.com/sreyneang-dev/laravel-books.git"
    },
    "branch": "main",
    "commit_sha": "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4",
    "submitted_at": "2026-10-14T09:00:00Z",
    "latest_analysis_run": {
      "id": 55,
      "status": "queued"
    }
  }
}
```

**Rules**

- The student must be enrolled in the assignment.
- The repository must be the student's linked repository for this assignment.
- Late-submission behavior follows `docs/business/submissions.md`.
- Creating a submission dispatches an analysis job; the HTTP request must not wait for the analysis to finish.
- Submissions are not editable after creation; a new attempt creates a new submission.

---

## 18. Analysis Runs

An analysis run is one AI review of one submission. A submission can have multiple runs to preserve history and support retries.

| Method | Endpoint                                        | Description                           | Access                               |
|--------|-------------------------------------------------|---------------------------------------|--------------------------------------|
| `GET`  | `/submissions/{submission}/analysis-runs`       | List runs for a submission            | Owning student, owner teacher, Admin |
| `POST` | `/submissions/{submission}/analysis-runs`       | Start a new run (retry or re-analyze) | Owner teacher, Admin                 |
| `GET`  | `/analysis-runs/{analysisRun}`                  | Get a run with status                 | Owning student, owner teacher, Admin |

**Allowed `include` values:** `results`, `issues`

### 18.1 Start Analysis Run

**Request**

```http
POST /api/v1/submissions/88/analysis-runs
```

**Response `202 Accepted`**

```json
{
  "data": {
    "id": 56,
    "submission_id": 88,
    "status": "queued",
    "commit_sha": "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4",
    "started_at": null,
    "completed_at": null
  },
  "message": "Analysis has been queued."
}
```

### 18.2 Status Values

| Status      | Meaning                              |
|-------------|--------------------------------------|
| `queued`    | Waiting for a queue worker           |
| `running`   | Analysis in progress                 |
| `completed` | Results stored successfully          |
| `failed`    | Analysis failed; see `error_message` |

Use the status enum defined in `app/Enums/` and the schema if it differs.

**Rules**

- Return `409 Conflict` if the submission already has a run with status `queued` or `running`.
- Every run records the exact `commit_sha` it analyzed.
- Starting a new run never overwrites or deletes previous runs.
- Failed runs expose a safe `error_message` only; provider errors and stack traces stay in server logs.
- Clients poll `GET /analysis-runs/{analysisRun}` to track progress.

---

## 19. Analysis Results

Each result scores one assignment requirement within one analysis run.

| Method   | Endpoint                               | Description            | Access                               |
|----------|----------------------------------------|------------------------|--------------------------------------|
| `GET`    | `/analysis-runs/{analysisRun}/results` | List results for a run | Owning student, owner teacher, Admin |
| `GET`    | `/analysis-results/{analysisResult}`   | Get a result           | Owning student, owner teacher, Admin |

### 19.1 Analysis Result Resource

```json
{
  "id": 301,
  "analysis_run_id": 56,
  "requirement": {
    "id": 14,
    "title": "Implement book validation"
  },
  "status": "PARTIALLY_MET",
  "score": 12,
  "max_score": 20,
  "feedback": "Title and author are validated, but ISBN uniqueness is not enforced.",
  "evidence": [
    {
      "file": "app/Http/Requests/StoreBookRequest.php",
      "line_start": 14,
      "line_end": 22
    }
  ],
  "created_at": "2026-10-14T09:03:12Z"
}
```

**Rules**

- Results are created only by the analysis job; there is no public create endpoint.
- Each result's requirement must belong to the same assignment as the run's submission.
- AI output is validated against the expected structure before it is stored.
- Field names and status values are examples; use the schema and enums.

---

## 20. Analysis Issues

Issues are specific problems found during an analysis run, such as missing files, security risks, or code-quality findings.

| Method   | Endpoint                                   | Description               | Access                               |
|----------|--------------------------------------------|---------------------------|--------------------------------------|
| `GET`    | `/analysis-runs/{analysisRun}/issues`      | List issues for a run     | Owning student, owner teacher, Admin |
| `GET`    | `/analysis-issues/{analysisIssue}`         | Get an issue              | Owning student, owner teacher, Admin |
| `PATCH`  | `/analysis-issues/{analysisIssue}/resolve` | Mark an issue as resolved | Owner teacher, Admin                 |
| `PATCH`  | `/analysis-issues/{analysisIssue}/reopen`  | Reopen a resolved issue   | Owner teacher, Admin                 |

### 20.1 Resolve Issue

**Request**

```json
{
  "resolution_note": "Reviewed manually. This is an acceptable pattern for this assignment."
}
```

**Response `200 OK`**

```json
{
  "data": {
    "id": 512,
    "analysis_run_id": 56,
    "severity": "MEDIUM",
    "category": "SECURITY",
    "message": "Mass assignment is not restricted on the Book model.",
    "file": "app/Models/Book.php",
    "line": 9,
    "is_resolved": true,
    "resolved_by": {
      "id": 1,
      "name": "Sok Dara"
    },
    "resolved_at": "2026-10-14T10:20:00Z",
    "resolution_note": "Reviewed manually. This is an acceptable pattern for this assignment."
  }
}
```

**Rules**

- `resolved_by_user` is set from the authenticated user.
- Resolving an issue does not change the stored analysis results.

---

## 21. Rate Limiting

| Endpoint Group                                 | Suggested Limit                 |
|------------------------------------------------|---------------------------------|
| `/auth/login`, `/auth/register`                | 5 requests per minute per IP    |
| `POST /assignments/{assignment}/submissions`   | 10 requests per minute per user |
| `POST /submissions/{submission}/analysis-runs` | 5 requests per minute per user  |
| All other authenticated endpoints              | 60 requests per minute per user |

Limits are configured in Laravel's rate limiters and may be adjusted. Exceeding a limit returns `429` with a `Retry-After` header.

---

## 22. Endpoint Summary

| Group                   | Base Path                                                                            |
|:------------------------|:-------------------------------------------------------------------------------------|
| Authentication          | `/auth`                                                                              |
| Roles                   | `/roles`                                                                             |
| Users                   | `/users`                                                                             |
| Current user shortcuts  | `/me/assignments`, `/me/submissions`                                                 |
| Assignments             | `/assignments`                                                                       |
| Enrollment              | `/assignments/{assignment}/students`, `/assignment-students`                         |
| Requirements            | `/assignments/{assignment}/requirements`, `/assignment-requirements`                 |
| Structures              | `/assignments/{assignment}/structures`, `/assignment-structures`                     |
| Structure rules         | `/assignment-structures/{structure}/rules`, `/assignment-structure-rules`            |
| Git connections         | `/git-connections`                                                                   |
| Repositories            | `/git-connections/{gitConnection}/repositories`, `/repositories`                     |
| Assignment repositories | `/assignments/{assignment}/repositories`, `/assignment-repositories`                 |
| Student repositories    | `/assignments/{assignment}/student-repositories`, `/assignment-student-repositories` |
| Submissions             | `/assignments/{assignment}/submissions`, `/submissions`                              |
| Analysis runs           | `/submissions/{submission}/analysis-runs`, `/analysis-runs`                          |
| Analysis results        | `/analysis-runs/{analysisRun}/results`, `/analysis-results`                          |
| Analysis issues         | `/analysis-runs/{analysisRun}/issues`, `/analysis-issues`                            |

---

## 23. Rules for Maintaining This Document

1. Add or update the endpoint here in the same change that adds or modifies it in `routes/api.php`.
2. Document the access rule for every endpoint and enforce it with a Policy.
3. Never document or return secrets, tokens, or password hashes in examples or responses.
4. Mark breaking changes clearly and introduce a new API version when they cannot be avoided.
5. Keep field names consistent with `docs/database/database.md`.
6. Add feature tests for each documented endpoint, covering success, validation failure, and permission denial.
