# Frontend Architecture

## Principles

- Prefer feature-oriented organization for feature-specific code.
- Keep shared components separate from feature-specific components.
- Keep API communication separate from presentation.
- Keep reusable logic in hooks or appropriate utilities.
- Keep validation schemas separate from UI components.
- Avoid circular dependencies.

## Directory Responsibilities

### `components/`

Contains reusable UI components shared across features.

### `features/`

Contains feature-specific:

- Components
- Hooks
- Services
- Types
- Schemas

### `hooks/`

Contains reusable application hooks.

### `services/`

Contains API and external-service integration.

### `schemas/`

Contains shared validation schemas when they are not
feature-specific.

### `stores/`

Contains shared client-side state.

### `types/`

Contains shared TypeScript types.

### `utils/`

Contains reusable pure utility functions.

## Dependency Direction

Prefer:

UI
↓
Hooks / Feature Logic
↓
Services
↓
API

Shared components should not depend on feature-specific modules.