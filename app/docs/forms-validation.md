# Forms and Validation

## Principles

Use the existing form and validation libraries.

## Form Requirements

Forms should support:

- Initial values
- User input
- Client validation
- Server validation
- Loading state
- Submit state
- Success feedback
- Error feedback

## Validation

- Reuse existing schemas.
- Avoid duplicate validation rules.
- Keep validation logic separate from presentation when appropriate.

## Submission

Prevent duplicate submissions while a request is in progress.

Do not clear user input after a failed submission.