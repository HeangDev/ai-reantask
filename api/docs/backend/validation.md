# Backend Validation

All client-provided input must be validated on the backend.

## Rules

- Never trust frontend validation alone.
- Use Laravel validation.
- Use Form Requests for complex validation.
- Validate types and formats.
- Validate relationships and referenced records.
- Validate authorization before performing protected operations.

Frontend validation improves UX.

Backend validation provides security and data integrity.