# Authorization

Authorization must be enforced on the backend.

## Rules

- Users can only perform actions they are authorized to perform.
- Frontend permission checks are for UI behavior only.
- Backend authorization is the source of truth.
- Use Policies or Gates where appropriate.
- Do not trust role or permission information provided by the client.

## Example

A user may see an Edit button in the frontend only when
the permission exists.

However, the backend must independently verify the permission
before updating the resource.