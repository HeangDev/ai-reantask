# Authentication

**Project:** Student Assignment Review AI  
**Backend:** Laravel  
**Database:** MySQL  
**Authentication Package:** Laravel Sanctum (API tokens)

---

## 1. Overview

This document defines how users prove their identity to the Student Assignment Review AI API: how they register, log in, use tokens, log out, and manage passwords.

**Authentication** answers: *Who is this user?*  
**Authorization** answers: *What is this user allowed to do?*

This document covers authentication only. Roles, policies, and ownership rules are defined in `docs/backend/authorization.md`.

Related documents:

- `docs/backend/architecture.md`
- `docs/backend/api.md`
- `docs/backend/authorization.md`
- `docs/backend/error-handling.md`
- `docs/backend/testing.md`
- `docs/database/relationships.md`

**Note:** This document assumes Laravel Sanctum personal access tokens. If the project is configured with a different authentication system, update this document and `docs/backend/api.md` to match it.

---

## 2. Authentication Method

The API uses **bearer tokens** issued by Laravel Sanctum.

```text
Client                               API
  |                                   |
  |  POST /auth/login                 |
  |  { email, password }              |
  | --------------------------------> |
  |                                   |  Verify credentials
  |                                   |  Create Sanctum token
  |  200 { token, user }              |
  | <-------------------------------- |
  |                                   |
  |  GET /assignments                 |
  |  Authorization: Bearer {token}    |
  | --------------------------------> |
  |                                   |  auth:sanctum middleware
  |                                   |  identifies the user
  |  200 { data: [...] }              |
  | <-------------------------------- |
```

### 2.1 Why Tokens

- The API serves a separate frontend and may serve other clients later.
- Tokens are simple to send, revoke, and expire.
- Each login creates a separate token, so one device can be logged out without affecting others.

### 2.2 SPA Cookie Authentication (Optional)

If the frontend is served from the same top-level domain, Sanctum's cookie-based SPA authentication may be used instead. That choice requires CSRF protection, `SANCTUM_STATEFUL_DOMAINS`, and session configuration. If adopted, document it in a new section of this file and keep the token flow for non-browser clients.

---

## 3. Users and Roles

Authentication works on the `users` table. Each user has exactly one role through `users.role_id`, as defined in `docs/database/relationships.md`.

| Role | How the Account Is Created |
|---|---|
| Student | Self-registration through `POST /auth/register`, or created by an admin |
| Teacher | Created by an admin through `POST /users` |
| Admin | Created by a seeder or by another admin |

**Rules**

- Public registration always creates a **student** account.
- Clients cannot choose or change a role during registration or login.
- Only admins can assign the teacher or admin role.
- The first admin account is created by a database seeder using values from environment variables, never hard-coded credentials.

---

## 4. Endpoints

| Method | Endpoint                | Description                            | Access        |
|--------|-------------------------|----------------------------------------|---------------|
| `POST` | `/auth/register`        | Register a student account             | Public        |
| `POST` | `/auth/login`           | Log in and receive a token             | Public        |
| `POST` | `/auth/logout`          | Revoke the current token               | Authenticated |
| `POST` | `/auth/logout-all`      | Revoke all of the user's tokens        | Authenticated |
| `GET`  | `/auth/me`              | Get the authenticated user             | Authenticated |
| `PUT`  | `/auth/password`        | Change the current user's password     | Authenticated |
| `DELETE` | `/auth/account`       | Delete your own account (suspend + soft-delete) | Authenticated, not admins |
| `POST` | `/auth/forgot-password` | Send a password reset link             | Public        |
| `POST` | `/auth/reset-password`  | Reset the password using a reset token | Public        |

All endpoints are prefixed with `/api/v1`. Keep this list synchronized with `docs/backend/api.md`.

### 4.1 Routes

```php
// routes/api.php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth')->group(function () {

    // Public
    Route::middleware('throttle:auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [PasswordController::class, 'forgot']);
        Route::post('reset-password', [PasswordController::class, 'reset']);
    });

    // Authenticated
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('logout-all', [AuthController::class, 'logoutAll']);
        Route::put('password', [PasswordController::class, 'update']);
    });
});
```

---

## 5. Registration

### 5.1 Request

```http
POST /api/v1/auth/register
```

```json
{
  "fullname": "Chan Sreyneang",
  "username": "sreyneang",
  "email": "student@example.com",
  "phone": "+855 12 000 111",
  "password": "a-strong-password",
  "password_confirmation": "a-strong-password"
}
```

### 5.2 Validation

`username`, `email`, and `phone` are required and unique because `docs/database/database.md` defines them as `NOT NULL` and `UNIQUE`.

| Field      | Rules                                                                                                       |
|------------|-------------------------------------------------------------------------------------------------------------|
| `fullname` | Required, string, maximum 255 characters                                                                    |
| `username` | Required, maximum 255 characters, only letters, digits, `.`, `_`, `-`, unique (including soft-deleted users) |
| `email`    | Required, valid email, maximum 150 characters, unique among users (including soft-deleted users)            |
| `phone`    | Required, digits with an optional leading `+`, spaces, or hyphens, maximum 20 characters, unique            |
| `password` | Required, confirmed, follows the password policy in section 9                                               |

Any `role_id`, `role`, `status`, or audit field sent in the request is ignored. New accounts are `ACTIVE` students.

### 5.3 Response `201 Created`

The body is the same as the login response in section 6.2. The token is named after the request's `User-Agent` header (truncated to 255 characters), or `api` when the header is empty.

**Rules**

- Emails are stored in lowercase and trimmed.
- Passwords are hashed with Laravel's `Hash` facade or the `hashed` model cast.
- If public registration should be disabled (for example, if a school creates all student accounts), disable the route and document the change.

---

## 6. Login

### 6.1 Request

```http
POST /api/v1/auth/login
```

```json
{
  "email": "teacher@example.com",
  "password": "secret-password",
  "device_name": "Chrome on Windows"
}
```

`device_name` is optional. It is used as the token name so users can identify their sessions. If omitted, the server uses a default such as `api`.

### 6.2 Response `200 OK`

```json
{
  "data": {
    "token": "5|Xyz789...",
    "token_type": "Bearer",
    "expires_at": "2026-10-21T08:30:00Z",
    "user": {
      "id": 1,
      "fullname": "Sok Dara",
      "username": "sok_dara",
      "email": "teacher@example.com",
      "phone": "+855 12 345 678",
      "avatar": null,
      "status": "ACTIVE",
      "role": {
        "id": 2,
        "name": "teacher"
      },
      "created_at": "2026-09-01T02:00:00Z",
      "updated_at": "2026-09-01T02:00:00Z"
    }
  }
}
```

`expires_at` is `null` when `SANCTUM_TOKEN_EXPIRATION` is not set.

### 6.3 Failed Login `401`

```json
{
  "message": "The provided credentials are incorrect.",
  "code": "INVALID_CREDENTIALS"
}
```

**Rules**

- Return the same response for an unknown email and a wrong password, so attackers cannot discover which emails are registered.
- Soft-deleted users cannot log in.
- Failed attempts are rate-limited per email and IP address (section 10).
- The plain-text token is returned **only once**, in the login or registration response. It cannot be retrieved again.

### 6.4 Controller Example

```php
// app/Http/Controllers/Api/V1/Auth/AuthController.php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Exceptions\InvalidCredentialsException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', strtolower($request->validated('email')))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            throw new InvalidCredentialsException();
        }

        $expiresAt = now()->addMinutes(config('sanctum.expiration'));

        $token = $user->createToken(
            $request->validated('device_name') ?? 'api',
            ['*'],
            $expiresAt
        );

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'expires_at' => $expiresAt->toIso8601String(),
                'user' => new UserResource($user->load('role')),
            ],
        ]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('role'));
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    public function logoutAll(Request $request): Response
    {
        $request->user()->tokens()->delete();

        return response()->noContent();
    }
}
```

`InvalidCredentialsException` extends `ApplicationException` from `docs/backend/error-handling.md` and returns status `401` with code `INVALID_CREDENTIALS`. Registration logic that creates the user and assigns the student role belongs in a Service, such as `App\Services\Auth\RegistrationService`.

**In the code:** the controller above is a simplified example. The implemented controller is thin; credential checking, token issuing, logout, and password changes are in `App\Services\Auth\AuthService`, and registration is in `App\Services\Auth\RegistrationService`.

**Account status:** only soft-deleted users are blocked from logging in (`BR-USR-06`). Whether `INACTIVE` and `SUSPENDED` users may log in is not defined in the business rules yet, so the API currently allows it.

---

## 7. Using the Token

Send the token on every protected request:

```http
GET /api/v1/auth/me
Accept: application/json
Authorization: Bearer 5|Xyz789...
```

Protected routes use the `auth:sanctum` middleware. If the token is missing, invalid, expired, or revoked, the API returns:

```json
{
  "message": "Unauthenticated.",
  "code": "UNAUTHENTICATED"
}
```

with status `401`.

### 7.1 Current User Response

```http
GET /api/v1/auth/me
```

```json
{
  "data": {
    "id": 1,
    "fullname": "Sok Dara",
    "username": "sok_dara",
    "email": "teacher@example.com",
    "phone": "+855 12 345 678",
    "avatar": null,
    "status": "ACTIVE",
    "role": {
      "id": 2,
      "name": "teacher"
    },
    "created_at": "2026-09-01T02:00:00Z",
    "updated_at": "2026-09-01T02:00:00Z"
  }
}
```

The response never includes `password`, `remember_token`, or token values.

---

## 8. Token Lifecycle

### 8.1 Storage

Sanctum stores tokens in the `personal_access_tokens` table. Only a SHA-256 hash of each token is stored; the plain-text value exists only in the client.

### 8.2 Expiration

Set an expiration so stolen tokens stop working:

```php
// config/sanctum.php

'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 60 * 24 * 7), // minutes (7 days)
```

```dotenv
# .env.example
SANCTUM_TOKEN_EXPIRATION=10080
```

Remove expired tokens on a schedule:

```php
// routes/console.php

use Illuminate\Support\Facades\Schedule;

Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

### 8.3 Token Abilities

All tokens use the `['*']` ability. Access control is handled by roles and Policies, not by token abilities. If limited-scope tokens are needed later (for example, a read-only integration token), define the abilities here before using them.

### 8.4 When Tokens Are Revoked

| Event                         | Tokens Revoked                    |
|-------------------------------|-----------------------------------|
| `POST /auth/logout`           | The current token                 |
| `POST /auth/logout-all`       | All of the user's tokens          |
| Password change               | All tokens except the current one |
| Password reset                | All tokens                        |
| Role change by an admin       | All of the affected user's tokens |
| User soft-deleted by an admin | All of the affected user's tokens |
| User deletes their own account | All of the user's tokens       |

Revoking tokens on role change ensures that cached client state is refreshed with the new permissions.

---

## 9. Passwords

### 9.1 Password Policy

Define the policy once in a service provider and use `Password::defaults()` everywhere:

```php
// app/Providers/AppServiceProvider.php

use Illuminate\Validation\Rules\Password;

public function boot(): void
{
    Password::defaults(function () {
        $rule = Password::min(8)->letters()->numbers();

        return $this->app->isProduction()
            ? $rule->mixedCase()->uncompromised()
            : $rule;
    });
}
```

```php
// In a Form Request
'password' => ['required', 'confirmed', Password::defaults()],
```

### 9.2 Hashing

- Use the `hashed` cast on the `User` model, or `Hash::make()`.
- Never store, log, or return plain-text passwords.
- Never compare passwords with `==`; use `Hash::check()`.

```php
// app/Models/User.php

protected $hidden = [
    'password',
    'remember_token',
];

protected function casts(): array
{
    return [
        'password' => 'hashed',
        'email_verified_at' => 'datetime',
    ];
}
```

### 9.3 Change Password

```http
PUT /api/v1/auth/password
```

```json
{
  "current_password": "old-password",
  "password": "new-strong-password",
  "password_confirmation": "new-strong-password"
}
```

- `current_password` uses Laravel's `current_password:sanctum` rule.
- On success, return `204 No Content` and revoke all other tokens.

### 9.3.1 Delete Own Account

```http
DELETE /api/v1/auth/account
```

```json
{
  "current_password": "my-password"
}
```

- Returns `204 No Content`. A missing or wrong `current_password` returns `422`.
- Admins cannot delete their own account (`BR-USR-04`) and get `403`, checked before the password.
- In one transaction the account gets `status = SUSPENDED`, is soft-deleted, has `deleted_by_user` set to itself, and all of its tokens are revoked.
- Nothing else is deleted (`BR-USR-07`). The email, username, and phone stay reserved (`BR-USR-05`).
- The user can no longer log in (`BR-USR-06`). Restoring an account is not part of the API.

### 9.4 Forgot and Reset Password

```http
POST /api/v1/auth/forgot-password
```

```json
{
  "email": "student@example.com"
}
```

Always return `200 OK` with the same message, whether or not the email exists:

```json
{
  "message": "If an account exists for this email, a password reset link has been sent."
}
```

```http
POST /api/v1/auth/reset-password
```

```json
{
  "token": "reset-token-from-email",
  "email": "student@example.com",
  "password": "new-strong-password",
  "password_confirmation": "new-strong-password"
}
```

- On success the API returns `200 OK` with `{ "message": "Your password has been reset." }`. An invalid or expired token returns `422` with an error on the `email` field.
- Soft-deleted users never receive a reset link; the response is still the same as for any other email.
- Use Laravel's `Password` broker and the `password_reset_tokens` table.
- Reset tokens expire according to `config/auth.php` (default 60 minutes).
- The reset link points to the frontend URL, configured with `ResetPassword::createUrlUsing()`.
- On success, revoke all of the user's tokens.

---

## 10. Rate Limiting

Define the `auth` limiter used by the public authentication routes:

```php
// app/Providers/AppServiceProvider.php

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    RateLimiter::for('auth', function (Request $request) {
        $email = strtolower((string) $request->input('email'));

        return [
            Limit::perMinute(5)->by($email . '|' . $request->ip()),
            Limit::perMinute(20)->by($request->ip()),
        ];
    });
}
```

| Endpoint                     | Limit                                               |
|------------------------------|-----------------------------------------------------|
| `POST /auth/login`           | 5 per minute per email and IP; 20 per minute per IP |
| `POST /auth/register`        | Same as login                                       |
| `POST /auth/forgot-password` | Same as login                                       |
| `POST /auth/reset-password`  | Same as login                                       |

Exceeding the limit returns `429` with code `RATE_LIMITED` and a `Retry-After` header, as described in `docs/backend/error-handling.md`.

---

## 11. Email Verification (Optional)

Email verification is not required in the current version. If enabled:

- Implement `MustVerifyEmail` on the `User` model.
- Add `POST /auth/email/verification-notification` and `GET /auth/email/verify/{id}/{hash}` endpoints.
- Protect student and teacher actions with the `verified` middleware.
- Document the endpoints in this file and in `docs/backend/api.md`.

---

## 12. Git Credentials Are Not Authentication

Git connection tokens (for GitHub or other providers) are stored in `git_connections` and are used only to access repositories. They are **not** used to log in to this application.

- Logging in with a Git provider (OAuth social login) is not supported in the current version.
- Git tokens are encrypted at rest and never returned in API responses.
- Logging out does not delete Git connections.

If social login is added later, document the flow here and keep application tokens separate from Git provider tokens.

---

## 13. Security Rules

- Serve the API over HTTPS only in production.
- Return the same response for unknown emails and wrong passwords.
- Rate-limit all public authentication endpoints.
- Never return the password hash, `remember_token`, or stored token hashes.
- Never log passwords, bearer tokens, or reset tokens. Add these fields to `dontFlash` (see `docs/backend/error-handling.md`).
- Set token expiration and prune expired tokens.
- Revoke tokens on password change, password reset, role change, and account deletion.
- Do not accept `role_id`, `role`, or audit fields from clients during registration.
- Do not put tokens in URLs or query strings.
- The frontend should store tokens securely and clear them on logout. Avoid `localStorage` when the frontend can use a more secure option.
- Keep `APP_KEY` secret; it protects encrypted values such as Git tokens.

---

## 14. Configuration Checklist

| Item                               | Location                                                        |
|------------------------------------|-----------------------------------------------------------------|
| Install Sanctum                    | `composer require laravel/sanctum` or `php artisan install:api` |
| `HasApiTokens` trait on `User`     | `app/Models/User.php`                                           |
| `auth:sanctum` on protected routes | `routes/api.php`                                                |
| Token expiration                   | `config/sanctum.php`, `SANCTUM_TOKEN_EXPIRATION`                |
| Prune expired tokens               | `routes/console.php`                                            |
| Password policy                    | `AppServiceProvider::boot()`                                    |
| `auth` rate limiter                | `AppServiceProvider::boot()`                                    |
| Password reset URL                 | `AppServiceProvider::boot()`                                    |
| Hidden fields on `User`            | `app/Models/User.php`                                           |
| First admin seeder                 | `database/seeders/AdminUserSeeder.php`                          |

---

## 15. Testing

Follow `docs/backend/testing.md`. Authentication tests belong in `tests/Feature/Api/V1/Auth/`.

Required tests:

| Test                                          | Expected Result                                   |
|-----------------------------------------------|---------------------------------------------------|
| Register with valid data                      | `201`, token returned, user has the student role  |
| Register with `role_id` in the request        | Role is still student                             |
| Register with an existing email               | `422`                                             |
| Register with a weak password                 | `422`                                             |
| Login with valid credentials                  | `200`, token and user returned                    |
| Login with a wrong password                   | `401`, `INVALID_CREDENTIALS`                      |
| Login with an unknown email                   | Same response as a wrong password                 |
| Login as a soft-deleted user                  | `401`                                             |
| Too many login attempts                       | `429`                                             |
| `GET /auth/me` without a token                | `401`                                             |
| `GET /auth/me` with a valid token             | `200`, no password or token fields                |
| Expired token                                 | `401`                                             |
| Logout                                        | Current token deleted; next request returns `401` |
| Logout all                                    | All tokens deleted                                |
| Change password with a wrong current password | `422`                                             |
| Change password                               | Other tokens revoked, current token still works   |
| Forgot password with an unknown email         | `200`, same message as a known email              |
| Reset password                                | Password updated, all tokens revoked              |

### 15.1 Example

```php
// tests/Feature/Api/V1/Auth/LoginTest.php

public function test_login_returns_same_error_for_unknown_email_and_wrong_password(): void
{
    User::factory()->student()->create([
        'email' => 'student@example.com',
        'password' => 'correct-password',
    ]);

    $wrongPassword = $this->postJson('/api/v1/auth/login', [
        'email' => 'student@example.com',
        'password' => 'wrong-password',
    ]);

    $unknownEmail = $this->postJson('/api/v1/auth/login', [
        'email' => 'nobody@example.com',
        'password' => 'wrong-password',
    ]);

    $wrongPassword->assertUnauthorized();
    $unknownEmail->assertUnauthorized();
    $this->assertSame($wrongPassword->json(), $unknownEmail->json());
}

public function test_logout_revokes_current_token(): void
{
    $user = User::factory()->student()->create();
    $token = $user->createToken('test')->plainTextToken;

    $this->withToken($token)
        ->postJson('/api/v1/auth/logout')
        ->assertNoContent();

    $this->assertDatabaseCount('personal_access_tokens', 0);
}
```

---

## 16. Rules for AI Coding Agents

1. Use the authentication system configured in the project. Do not add a second one.
2. Protect every non-public route with `auth:sanctum`.
3. Never accept a role from a public request.
4. Never return, log, or store plain-text passwords or tokens.
5. Revoke tokens in every situation listed in section 8.4.
6. Keep authorization rules in Policies, not in authentication code.
7. Use the error formats and codes in `docs/backend/error-handling.md`.
8. Update this document and `docs/backend/api.md` when an authentication endpoint changes.
9. Add tests for every authentication change and report actual test results.

---

## 17. Summary

- The API uses Laravel Sanctum bearer tokens.
- Public registration creates student accounts only; teachers and admins are created by admins.
- Login errors do not reveal whether an email exists.
- Tokens expire, can be revoked per device or all at once, and are revoked on password, role, and account changes.
- Passwords follow one central policy and are always hashed.
- Public authentication endpoints are rate-limited.
- Git provider tokens are separate from application authentication.
