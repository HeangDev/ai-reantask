---
paths:
  - "**/security/**"
  - "**/config/**"
  - "**/controller/**"
  - "**/*Auth*.java"
---

# Backend Rules - Security and Permissions

## 1. Authentication

- Stateless JWT. Access token 15 min, refresh token 7-30 days, rotated on every refresh; store a hash of the refresh token (table or cache) so it can be revoked. Revoke all refresh tokens on password change, suspension, deletion.
- Sign with HS512/RS256; secret/keys from environment (`JWT_SECRET`), minimum 256-bit. Claims: `sub` (user id), `role`, `iat`, `exp`, `jti`.
- Login flow: find user by email (case-insensitive), check BCrypt, then the state gate below.
- Google sign-in: verify the Google ID token server-side (audience = our client id). Link by `google_id`, else by verified email. New Google users are created as `student` + `PENDING` (needs approval) unless an admin pre-created them.
- Login gate (all must hold): `users.status = ACTIVE`, `deleted_at IS NULL`, `roles.status = ACTIVE`. Error codes: `ACCOUNT_PENDING`, `ACCOUNT_INACTIVE`, `ACCOUNT_SUSPENDED`, `ACCOUNT_DELETED` (return generic `INVALID_CREDENTIALS` for unknown email or bad password).
- Re-check the gate on every authenticated request (cheap cached lookup, 1-5 min TTL) so suspension takes effect quickly.
- Passwords: BCrypt cost >= 10; min length 8, require letter + digit; never log; never email.
- Lock/Throttle: 5 failed logins per account/IP per 15 min -> 429 `TOO_MANY_ATTEMPTS`.

## 2. Authorization (RBAC + ownership)

Roles: `ROLE_ADMIN`, `ROLE_TEACHER`, `ROLE_STUDENT` (from `roles.name`).

1. Coarse role check per endpoint in `SecurityConfig` (`authorizeHttpRequests` matchers; first match wins, specific paths before wildcards). Do not use `@PreAuthorize`.
2. Fine check (ownership, state) in `service/impl`: never rely on the annotation alone.
3. Default deny: everything except `/auth/**`, health, OpenAPI (non-prod) requires authentication.

Permission matrix:

| Capability                                                | Admin       | Teacher                              | Student                              |
|-----------------------------------------------------------|-------------|--------------------------------------|--------------------------------------|
| Manage users, roles, status                               | yes         | approve/reject PENDING students only | no                                   |
| Manage classes, subjects, class_subjects, enrollment      | yes         | read own                             | read own                             |
| Create/edit/publish assignments                           | read/delete | own subjects only                    | no                                   |
| Assign students, requirements, structures, template repos | no (read)   | own assignments                      | no                                   |
| View assignment                                           | yes         | own                                  | only assigned + `PUBLISHED` + ACTIVE |
| Connect Git, link repository                              | own         | own                                  | own                                  |
| Submit                                                    | no          | no                                   | yes                                  |
| View submissions/results/issues                           | all         | own assignments                      | own only                             |
| Verify / reject submission                                | yes         | own assignments                      | no                                   |
| Mark issue `IGNORED`/`RESOLVED`                           | yes         | own assignments                      | no                                   |
| Reanalyze                                                 | yes         | own assignments                      | no                                   |
| Edit own profile/settings                                 | yes         | yes                                  | yes                                  |

Ownership definitions:
- Teacher owns an assignment when `assignments.teacher_id = currentUser.id`.
- Student is assigned when an `assignment_students` row is `ACTIVE` for them and the class membership is `ACTIVE`.
- A student owns a submission when `submissions.student_id = currentUser.id`.

Return 404 (not 403) when a user asks for a record they must not know exists.

## 3. Input and Output Safety

- Validate every request DTO (`@Valid`, Jakarta annotations). Reject unknown JSON properties (`FAIL_ON_UNKNOWN_PROPERTIES=true`).
- Mass assignment: never bind client JSON onto entities. Fields like `role`, `status`, `teacherId`, `createdBy` come from the server/auth context, not the body, except where an endpoint explicitly allows it for admins.
- SQL injection: only JPA/JPQL/Criteria with bound parameters. Native queries use named parameters. Sort/filter fields are whitelisted.
- XSS: API returns JSON; sanitize/escape rich text fields (`description`, `instructions`, `explanation`) on output in the client, and strip dangerous HTML on input if Markdown/HTML is allowed.
- Path safety: structure rule `path` normalized, no `..`, no absolute paths, no NUL; max 255.
- File/repo analysis safety: clone into a temp dir with a size and time limit, never execute student code on the API host, delete the clone afterwards; no following of symlinks outside the clone.
- SSRF: repository URLs only from the Git provider API results (allow-list hosts: github.com, gitlab.com + configured self-hosted).
- Do not expose stack traces. Errors use `ErrorCode` + message only.

## 4. Secrets and Tokens

- Secrets in environment variables or a secret manager: `JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `GIT_TOKEN_ENC_KEY`, `DB_PASSWORD`, provider OAuth secrets. Never in git, never in `application.yml` defaults.
- Git provider tokens: encrypted (AES-256-GCM, random IV per value, stored `iv:ciphertext`), key rotation supported by a key id prefix.
- Mask tokens in logs (`****`). `toString()` of entities/DTOs excludes sensitive fields (`@ToString.Exclude`).

## 5. Transport and Headers

- HTTPS only in non-local envs; HSTS on.
- CORS: explicit origins list from config, methods GET/POST/PUT/PATCH/DELETE, headers `Authorization, Content-Type, Idempotency-Key`; `allowCredentials` only if cookies are used.
- Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, a restrictive `Content-Security-Policy` if serving HTML.
- CSRF disabled for the stateless Bearer-token API. If refresh token is stored in an HttpOnly cookie, enable SameSite=Strict/Lax and CSRF protection for that endpoint.

## 6. Rate Limiting and Abuse

- Limit: `/auth/login`, `/auth/register`, `/auth/google` (per IP + per email), submission creation (per student per assignment, e.g. 10/hour), Git sync (per user).
- Use Bucket4j or a gateway. Return 429 with `Retry-After`.

## 7. Auditing

- JPA auditing fills `created_by_user`, `updated_by_user`; the soft-delete flow fills `deleted_by_user`. `AuditorAware` returns the authenticated user id, or `null` for public registration and seeders.
- Security events logged at INFO (login success/failure, role/status change, approve/reject, verify, token refresh failure) with user id, IP, no secrets.
