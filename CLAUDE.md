# CLAUDE.md

## Project Overview

This is a full-stack web application consisting of:

- Frontend
- Laravel backend
- MySQL database

The frontend communicates with the Laravel backend through APIs.

---

## General Rules

- Understand the existing implementation before making changes.
- Follow the existing architecture.
- Follow the documentation in `docs/`.
- Do not invent requirements, APIs, database fields, or business rules.
- Reuse existing implementations where appropriate.
- Make the smallest safe change.
- Do not modify unrelated files.
- Verify important changes after implementation.

---

## Development Workflow

For every task:

1. Understand the requirement.
2. Read relevant documentation.
3. Inspect the existing implementation.
4. Identify affected frontend, backend, and database areas.
5. Create an implementation plan.
6. Implement the change.
7. Run tests and validation.
8. Verify the result.
9. Report the changes and verification result.

Workflow:

Understand → Inspect → Plan → Implement → Test → Verify

---

## Documentation

### Requirements

`docs/requirements.md`

### Business Rules

`docs/business-rules.md`

### Frontend

`docs/frontend/`

### Backend

`docs/backend/`

### Database

`docs/database/`

The implementation must follow these documents.

---

## Laravel

Follow the existing Laravel architecture and conventions.

- Use Laravel conventions where applicable.
- Use Form Requests for complex request validation.
- Use API Resources for API response transformation when appropriate.
- Use Services only when business logic requires a separate abstraction.
- Keep Controllers focused.
- Keep business logic out of Controllers when it becomes complex.
- Use Policies/Gates for authorization.
- Use Eloquent relationships appropriately.
- Use database transactions for multi-step operations when required.
- Use Jobs/Queues for appropriate asynchronous work.
- Do not introduce unnecessary architectural layers.

---

## MySQL

Follow the database documentation in:

`docs/database/`

- Use proper primary keys.
- Define appropriate foreign keys.
- Use appropriate indexes.
- Avoid unnecessary duplicated data.
- Use transactions when required.
- Avoid N+1 queries.
- Do not modify existing schema without checking impact.
- Use migrations for schema changes.

---

## API

The API contract is defined in:

`docs/backend/api.md`

Do not invent:

- Endpoints
- HTTP methods
- Request fields
- Response fields
- Authentication behavior

When changing an API, consider:

- Backend implementation
- Frontend usage
- Validation
- Authentication
- Authorization
- API documentation
- Tests

---

## Security

Never expose:

- Passwords
- API keys
- Tokens
- Private keys
- Database credentials
- Secrets

Validate user input.

Apply authorization before protected operations.

Do not trust client-provided permissions or roles.

---

## Testing

After changes, run appropriate:

- Unit tests
- Feature tests
- API tests
- Frontend tests
- Type checks
- Lint
- Build

Database-related changes should include appropriate migration
and test verification.

---

## Change Scope

When modifying code:

- Inspect dependencies first.
- Make minimal changes.
- Preserve existing behavior.
- Avoid unrelated refactoring.
- Do not change database schema unnecessarily.
- Do not introduce dependencies without justification.

---

## AI Behavior

The AI must:

- Prefer evidence over assumptions.
- Inspect actual code before making conclusions.
- Follow project documentation.
- Never invent missing information.
- Clearly identify uncertainty.
- Explain important architectural changes.
- Verify important modifications.
- Report failed checks honestly.