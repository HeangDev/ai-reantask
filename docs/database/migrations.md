# Database Migrations

## Rules

- All schema changes must use Laravel migrations.
- Do not manually modify production database schema.
- Migration names should clearly describe the change.
- Foreign key constraints should be considered carefully.
- Avoid destructive migrations without a migration strategy.
- Test migrations before deployment.

## Workflow

Create Migration
      ↓
Run Migration
      ↓
Verify Schema
      ↓
Run Tests