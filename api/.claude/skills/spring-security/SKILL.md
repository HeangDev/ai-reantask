---
name: spring-security
description: Add or harden authentication and authorization in a Spring Boot REST API using Spring Security 6 — JWT login/register, OAuth2 resource server (Keycloak, Auth0, Okta, Cognito), roles and method security, CORS, password hashing, JSON 401/403 errors, and security tests. Invoked as `spring-security [mode]` (e.g. `spring-security jwt`, `spring-security resource-server`, `spring-security audit`). Use this skill whenever the user mentions Spring Security, SecurityFilterChain, JWT, login/signup endpoints, Bearer tokens, roles/permissions, @PreAuthorize, CORS or CSRF in Spring Boot, "secure my API", or wants to protect endpoints created with create-api, even if they don't say "skill".
---

# spring-security [mode]

Secure a Spring Boot REST API with Spring Security 6 (Boot 3.x). Security code that is almost right is worse than none: a permissive filter chain or a weak token setup looks fine in demos and fails in production. So read the project first, use the framework's built-in components instead of hand-rolled filters, and verify with tests that prove unauthenticated and unauthorized requests are rejected.

## Invocation

```
spring-security [mode] [options]
```

| Mode              | What it does                                                                                                                   |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `jwt` (default)   | Stateless API that issues its own JWTs: user entity, register/login endpoints, BCrypt, roles, filter chain, JSON errors, tests |
| `resource-server` | API only validates tokens from an external IdP (Keycloak/Auth0/Okta/Cognito). No user table, no login endpoint                 |
| `session`         | Server-side session + form login, for apps with a browser UI (CSRF stays on)                                                   |
| `basic`           | HTTP Basic with in-memory or DB users, for internal tools and quick protection only                                            |
| `audit`           | Review existing security config and report/fix problems. No new auth system                                                    |

If the mode is missing and the project has no security yet, pick `jwt` and say so. If the user mentions Keycloak, Auth0, Okta, Cognito, "SSO", or an existing identity provider, choose `resource-server`. Ask at most one question, and only when the choice truly changes what you build.

Options: `--roles USER,ADMIN` (role names), `--refresh-token`, `--rsa` (asymmetric signing instead of HMAC), `--no-tests`, `--package <pkg>`.

## Workflow

### 1. Inspect the project (do not skip)

- **Spring Boot / Security version.** Boot 3.x = Security 6 (`jakarta.*`, lambda DSL, `requestMatchers`). Boot 2.x = Security 5 (`WebSecurityConfigurerAdapter`, `antMatchers`). The templates here are for Boot 3. For Boot 2, tell the user and either adapt carefully or recommend upgrading. Never mix the two APIs.
- **Existing security.** Search for `SecurityFilterChain`, `WebSecurityConfigurerAdapter`, `@EnableWebSecurity`, `spring-boot-starter-security`, `JwtAuthenticationFilter`. If something exists, extend or fix it rather than adding a second chain.
- **Existing user model.** Reuse an existing `User`/`Account` entity and repository if present.
- **Package layout, Lombok, error format, ID type.** Match the project (same rules as any generated code: look at an existing feature and copy its style). Reuse the existing global exception handler.
- **Endpoints to protect.** List controllers and their paths so the access rules fit the real API.
- **Servlet or reactive.** `spring-boot-starter-webflux` means `SecurityWebFilterChain` instead; say so and adapt (templates assume MVC).
- **Frontend origin** (for CORS), if the user mentions one.

### 2. Decide the access policy

Default to **deny by default**: everything requires authentication except an explicit allow-list (auth endpoints, health check, API docs if used). Never write `anyRequest().permitAll()`.

Map the existing endpoints to rules and state them in the summary. A sensible starting point:

| Endpoint pattern                   | Rule                                                                                      |
|------------------------------------|-------------------------------------------------------------------------------------------|
| `/api/v1/auth/**`                  | public                                                                                    |
| `/actuator/health/**`              | public                                                                                    |
| `GET /api/v1/**`                   | authenticated                                                                             |
| `POST/PUT/PATCH/DELETE /api/v1/**` | authenticated, with `ADMIN` (or domain roles) via `@PreAuthorize` on sensitive operations |
| `/actuator/**` (rest)              | `ADMIN`                                                                                   |

Prefer method security (`@PreAuthorize`) for per-endpoint role checks and keep URL rules coarse. It keeps the rule next to the code it protects.

### 3. Generate the files

See `references/templates.md` for full code. For `jwt` mode:

```
security/
├── SecurityConfig            filter chain, CORS, method security, password encoder
├── JwtProperties             typed config: secret, issuer, TTL
├── JwtConfig                 JwtEncoder / JwtDecoder / authorities converter beans
├── JwtService                issues tokens
├── SecurityErrorHandlers     JSON 401 / 403 (entry point + access denied handler)
auth/
├── AuthController            POST /register, POST /login (+ /refresh if requested)
├── AuthService
├── dto/                      RegisterRequest, LoginRequest, TokenResponse
user/                         (skip pieces that already exist)
├── AppUser, Role, AppUserRepository, AppUserDetailsService
```

Plus `application.yml` properties (secret from an environment variable), a Flyway migration for the user tables when Flyway is used, and tests.

For `resource-server` mode, generate only `SecurityConfig` (with `oauth2ResourceServer`), a role/claim converter matched to the IdP's token shape, the `issuer-uri` property, and tests. Do not create a user table or login endpoint, because the IdP owns identity.

### 4. Security rules to follow

These are the things that go wrong in real projects. Follow them and explain the reason in code comments only where it isn't obvious.

- **Use Spring's JWT support** (`spring-boot-starter-oauth2-resource-server` with `NimbusJwtEncoder`/`NimbusJwtDecoder`) rather than a custom `OncePerRequestFilter` and a third-party parser. It validates signature, expiry and issuer correctly and is maintained with the framework.
- **Secrets come from the environment**, never from committed files or defaults. HS256 needs a key of at least 32 bytes; fail fast at startup if it's missing or short. Use `--rsa` for multi-service setups where other services only need the public key.
- **Short-lived access tokens** (15 minutes is a good default). If sessions need to last longer, add refresh tokens (`--refresh-token`): store only a hash server-side, rotate on use, and make them revocable.
- **Hash passwords with `BCryptPasswordEncoder`** (or `DelegatingPasswordEncoder` via `PasswordEncoderFactories`). Never log, return, or serialize password hashes. Keep entities out of responses.
- **Don't reveal which part of a login failed.** Unknown user and wrong password return the same `401` with the same message.
- **Stateless means no CSRF token needed, but only for header-based tokens.** Disable CSRF only when using `SessionCreationPolicy.STATELESS` and Bearer tokens in the `Authorization` header. If a token is stored in a cookie, or in `session` mode, leave CSRF enabled.
- **CORS: explicit origins** from config. Never `*` together with credentials. Apply it through the security chain (`.cors(...)`) so preflight requests aren't blocked.
- **Return JSON errors**: `401` for missing/invalid credentials, `403` for authenticated-but-forbidden, in the same shape as the rest of the API (`ProblemDetail`). Bearer-token failures need the handlers attached under `oauth2ResourceServer(...)`, not only `exceptionHandling(...)`, or they're ignored.
- **Roles vs authorities.** `hasRole("ADMIN")` checks for `ROLE_ADMIN`. When mapping from a JWT claim, set the authority prefix to `ROLE_` once, in the converter, so rules stay readable.
- **Enable method security** with `@EnableMethodSecurity` (not the deprecated `@EnableGlobalMethodSecurity`).
- **Security headers and HTTPS**: keep Spring's default headers. Mention HSTS/TLS termination as a deployment concern; don't try to configure TLS in code.
- **Rate limiting and lockout on login** aren't built into Spring Security. Mention it in the summary as a recommended follow-up (gateway, Bucket4j, or similar) rather than half-implementing it.
- **Don't add dependencies silently.** List new starters in the summary: `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`, `spring-security-test` (test scope), `spring-boot-starter-validation`.

### 5. Tests

Unless `--no-tests`, generate tests that prove the policy, not just the happy path:

- Unauthenticated request to a protected endpoint -> `401`.
- Authenticated but wrong role -> `403`.
- Correct role -> success.
- Public endpoints reachable without a token.
- Login: valid credentials return a token; wrong password returns `401`; the token works against a protected endpoint.
- Register: duplicate username returns `409`; password is stored hashed.

Use `spring-security-test`: `@WithMockUser`, or `SecurityMockMvcRequestPostProcessors.jwt()` for resource-server style tests. `@WebMvcTest` slices need the security config imported (`@Import(SecurityConfig.class)` plus any beans it needs). See `references/templates.md`.

### 6. Integrate with existing APIs

If controllers from `create-api` (or others) exist, add `@PreAuthorize` to the write endpoints and, where it matters, scope data to the current user (`@AuthenticationPrincipal Jwt jwt` -> `jwt.getSubject()`). Mention any endpoint that returns other users' data without an ownership check; that is the most common authorization bug (broken object-level authorization), and URL rules alone don't prevent it.

### 7. Verify

If a shell is available, run the build and the security tests:

```bash
./mvnw -q test -Dtest='*Security*,*Auth*'      # Maven
./gradlew test --tests '*Security*' --tests '*Auth*'   # Gradle
```

Fix compile errors you introduced (wrong import package, missing dependency, bean not found). If you can't run it, say so; don't imply the tests passed.

### 8. Report

End with a short summary:

1. Mode chosen and why.
2. Files created or changed.
3. Access policy table (which endpoints are public, authenticated, role-restricted).
4. Required config: environment variables (e.g. `JWT_SECRET`), and how to generate a value (`openssl rand -base64 48`).
5. New dependencies.
6. A `curl` example for register -> login -> authenticated call.
7. Known gaps and recommended follow-ups (rate limiting, refresh-token revocation, HTTPS, audit logging).

## `audit` mode

Read-only first. Review the existing configuration and report findings ordered by severity, each with the file/line and a concrete fix. Check for:

- `anyRequest().permitAll()` or overly broad `permitAll()` matchers
- CSRF disabled with cookie or session auth
- CORS `*` origins with credentials
- Hard-coded or short JWT secrets, secrets in `application.yml`/git
- Long-lived or non-expiring tokens; missing `iss`/`exp` validation
- Plain-text or weakly hashed passwords (`NoOpPasswordEncoder`, MD5/SHA-1)
- Entities exposed in responses (password hash leakage)
- Actuator, H2 console, Swagger exposed publicly in production
- Missing ownership checks on `/{id}` endpoints (BOLA/IDOR)
- Different error messages for unknown user vs wrong password
- Mixed Security 5/6 APIs, deprecated `WebSecurityConfigurerAdapter`
- Missing tests for 401/403

Apply fixes only when the user asks or the request clearly implies it.

## Edge cases

- **Existing security config conflicts**: if a chain already exists, show the differences and edit that file; two `SecurityFilterChain` beans without ordered matchers cause confusing behavior.
- **H2 console / Swagger in dev**: allow them only under a `dev` profile, never in the default chain.
- **Multiple user types** (customers vs staff): keep one auth mechanism and model the difference as roles or a claim, unless the user explicitly needs separate chains.
- **Social login / SSO for browsers**: that's `oauth2Login`, a different flow from `resource-server`. Say which one the user needs; don't mix them in a single chain without ordered matchers.
- **Microservices**: validate tokens at each service (`resource-server`); don't have services call a shared auth service per request.
- **Don't invent roles or permissions** that the domain doesn't have. Start with `USER` and `ADMIN` and let the user rename them.

## Reference

- `references/templates.md`: full Java/YAML templates for jwt mode, resource-server mode, method security, CORS, error handlers, and tests. Read it before generating code and adapt it to the project's conventions.