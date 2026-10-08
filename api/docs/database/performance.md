# Database Performance

## Rules

Avoid:

- N+1 queries
- Unnecessary SELECT *
- Repeated queries
- Missing indexes
- Loading unnecessary relationships
- Large unbounded result sets

Prefer:

- Eager loading when appropriate
- Pagination
- Select only required columns
- Appropriate indexes
- Query optimization based on evidence

## Verification

Use query logs or appropriate database analysis tools when investigating performance problems.

Do not optimize based only on assumptions.