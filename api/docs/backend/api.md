# API Documentation

## General Rules

The backend exposes RESTful APIs for the frontend.

Each API should clearly define:

- HTTP method
- Endpoint
- Authentication requirement
- Authorization requirement
- Request parameters
- Request body
- Validation
- Response
- Error responses

---

## Response

Use a consistent API response structure.

Example:

{
  "data": {},
  "message": "Success"
}

---

## Errors

API errors should provide appropriate:

- HTTP status
- Error message
- Validation errors when applicable

Do not expose internal exceptions or sensitive information.

---

## Versioning

If API versioning is used, follow the existing versioning strategy.

Example:

/api/v1/users