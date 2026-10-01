# CLAUDE.md

## Project Overview

This is a frontend web application.

The frontend is responsible for:

- User interface
- User interaction
- Client-side state
- Form handling
- API integration
- Client-side validation
- Responsive design
- Accessibility

The project requirements and technical documentation are defined in
the `docs/` directory.

---

## Source of Truth

Before implementing or changing a feature, consult the relevant
documentation in `docs/`.

Use:

- `docs/requirements.md` for functional requirements
- `docs/business-rules.md` for business rules
- `docs/ui-ux.md` for UI/UX requirements
- `docs/architecture.md` for frontend architecture
- `docs/api.md` for API integration rules
- `docs/state-management.md` for state management
- `docs/forms-validation.md` for forms and validation
- `docs/testing.md` for testing and verification

If documentation conflicts with the existing implementation,
identify the conflict before making a change.

Do not invent requirements.

---

## Technology

Inspect `package.json` and the existing source code before making
technology-related decisions.

Follow the project's existing:

- React
- TypeScript
- Tailwind CSS
- Zustand
- React Hook Form
- Zod
- TanStack Query
- Jest

Do not introduce a new dependency unless it is necessary.

---

## Development Workflow

For every task:

1. Understand the requirement.
2. Read relevant documentation.
3. Inspect the existing implementation.
4. Identify affected files and dependencies.
5. Create a concise implementation plan.
6. Implement the smallest safe change.
7. Run appropriate checks.
8. Verify the result.
9. Report what changed and what was verified.

Workflow:

Understand → Inspect → Plan → Implement → Test → Verify

---

## General Coding Rules

- Follow existing project conventions.
- Prefer simple and maintainable solutions.
- Keep components focused.
- Avoid duplicated code.
- Reuse existing components and utilities.
- Use meaningful names.
- Keep types explicit and reusable.
- Avoid unnecessary abstractions.
- Avoid premature optimization.
- Avoid unrelated refactoring.
- Do not modify unrelated files.

---

## React Rules

When React is used:

- Prefer functional components.
- Reuse existing components.
- Keep components focused.
- Extract reusable logic into hooks.
- Avoid unnecessary `useEffect`.
- Avoid unnecessary re-renders.
- Keep business logic out of presentation components when appropriate.
- Follow existing component patterns.

Do not rewrite existing components unless there is a clear reason.

---

## TypeScript Rules

- Use TypeScript for application code.
- Avoid `any`.
- Prefer explicit types for public interfaces and important data.
- Reuse existing types.
- Avoid duplicate type definitions.
- Keep API types consistent with actual API responses.
- Use type narrowing instead of unsafe casts when possible.

---

## UI / UX Rules

- Follow the existing design system.
- Reuse existing UI components.
- Keep spacing, typography, and visual patterns consistent.
- Support loading, empty, error, and success states.
- Ensure responsive behavior.
- Follow accessibility best practices.
- Do not introduce a new visual style without a requirement.

---

## API Rules

- Keep API communication separate from presentation components.
- Reuse existing API services or data-fetching patterns.
- Do not invent API endpoints.
- Do not invent request or response fields.
- Handle loading, success, empty, and error states.
- Handle API validation errors consistently.

---

## State Management Rules

Use the smallest appropriate state scope.

- Local state → component-specific UI state
- Shared state → existing global state solution
- Server state → existing server-state/data-fetching solution

Do not put all application state into a global store.

Do not duplicate server state unnecessarily.

---

## Form Rules

- Follow the project's existing form library.
- Follow the project's existing validation library.
- Reuse validation schemas when possible.
- Display field-level validation errors.
- Handle server-side validation errors.
- Prevent duplicate submissions.
- Show appropriate loading and success states.

---

## Security Rules

Never expose or hardcode:

- API keys
- Passwords
- Access tokens
- Private keys
- Secrets
- Database credentials

Do not log sensitive information.

Do not introduce insecure client-side authentication patterns.

---

## Performance Rules

Avoid:

- Unnecessary API requests
- Unnecessary re-renders
- Large unnecessary dependencies
- Duplicate data fetching
- Expensive client-side operations

Optimize based on evidence rather than assumptions.

---

## Testing and Verification

After making changes, run the appropriate project checks.

When available:

- Type checking
- Linting
- Unit tests
- Component tests
- Integration tests
- Production build

If a check fails:

1. Determine whether the failure is related to the change.
2. Fix it when appropriate.
3. Run the check again.
4. Report unresolved failures.

Never hide failed verification.

---

## Change Scope

Before changing code:

- Understand the file.
- Check its dependencies.
- Check where shared components are used.
- Check related tests.

Make the smallest safe change.

Do not perform unrelated refactoring.

---

## AI Behavior

Claude must:

- Inspect before modifying.
- Prefer evidence over assumptions.
- Follow project documentation.
- Reuse existing patterns.
- Avoid unnecessary dependencies.
- Avoid unnecessary rewrites.
- Clearly identify uncertainty.
- Never invent APIs, requirements, files, or behavior.
- Verify important changes.
- Report errors and failed verification honestly.

---

## Completion Criteria

A task is complete only when:

- The requested requirement is implemented.
- Existing functionality is preserved.
- Relevant UI states are handled.
- Type checking passes when available.
- Linting passes when available.
- Tests pass when available.
- Build passes when applicable.
- No unrelated changes were introduced.

Final workflow:

Analyze → Implement → Test → Verify → Report