# State Management

## Principles

Use the smallest appropriate state scope.

### Local UI State

Use local component state for:

- Modal open/close
- Temporary form state
- Tabs
- Dropdowns
- UI-only preferences

### Shared Client State

Use the existing global state solution only when state is shared
across multiple parts of the application.

### Server State

API/server data should use the project's existing
server-state/data-fetching solution.

## Rules

- Do not duplicate the same state unnecessarily.
- Do not put all state into global state.
- Avoid storing derived data when it can be calculated.
- Keep server state separate from UI state.