# Laravel Backend Architecture

## Framework

The backend uses Laravel.

Follow Laravel conventions unless the project has an
established alternative architecture.

---

## Responsibilities

### Controllers

Controllers should:

- Receive HTTP requests.
- Validate or delegate validation.
- Call appropriate application logic.
- Return API responses.

Controllers should not contain large business logic.

---

### Form Requests

Use Form Requests for request validation when validation
is non-trivial or reusable.

Validation rules should remain close to the request boundary.

---

### Models

Eloquent Models are responsible for:

- Database mapping
- Relationships
- Model-specific behavior
- Appropriate scopes

Avoid putting large business workflows inside Models.

---

### Services

Use Services when business logic:

- Is complex
- Is reused
- Requires multiple models
- Represents a meaningful application operation

Do not create Services for every simple CRUD operation.

---

### API Resources

Use API Resources when response transformation is required.

Do not expose internal database structure unnecessarily.

---

### Policies

Use Policies or Gates for authorization.

Authorization must not depend only on frontend checks.

---

### Jobs

Use Jobs/Queues for operations that:

- Take significant time
- Do not need to block the request
- Can safely run asynchronously

---

## Request Flow

Preferred flow:

Request
  ↓
Route
  ↓
Controller
  ↓
Validation
  ↓
Application / Service Logic
  ↓
Model / Repository when appropriate
  ↓
Database
  ↓
Resource / Response
  ↓
Client