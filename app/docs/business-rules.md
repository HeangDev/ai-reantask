# Business Rules

## Authentication

- Unauthenticated users cannot access protected pages.
- Authenticated users can access authorized pages.
- Authentication errors must be displayed clearly.
- A new account created with Google is a pending student, like password registration. It can sign in only after approval.
- Google sign-in is shown only when `VITE_GOOGLE_CLIENT_ID` is set.

## User Management

- Users must have the required fields before creation.
- A user cannot be created with an invalid email.
- Users cannot be edited without permission.
- Destructive actions must require confirmation when appropriate.

## General Rules

- Do not allow duplicate submissions.
- Do not display stale data as current without indicating its state.
- Destructive actions should provide clear feedback.