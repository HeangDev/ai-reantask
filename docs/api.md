# API Integration

## Rules

- Use the existing API client.
- Keep API calls outside presentation components.
- Reuse existing request and response types.
- Do not invent endpoints.
- Do not invent response fields.
- Handle API errors consistently.

## Authentication

Authentication must follow the existing authentication
implementation.

## API States

Every API-driven feature should handle:

- Loading
- Success
- Empty
- Error

## Error Handling

API errors should be converted into user-friendly messages
where appropriate.

Do not expose internal server errors or sensitive information
directly to users.