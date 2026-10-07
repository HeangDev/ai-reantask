# Authentication

## Authentication Method

The application uses Laravel Sanctum for API authentication.

## Rules

- Protected APIs require authentication.
- Authentication must be verified on the backend.
- Frontend authentication state must not be treated as authorization.
- Logout must invalidate the appropriate authentication state.
- Authentication errors should return appropriate HTTP responses.

## Protected Routes

Protected routes must use the appropriate authentication middleware.

Example:

auth:sanctum