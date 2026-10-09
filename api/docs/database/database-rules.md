# General Rules for Database Schema

**Technology:** Laravel + MySQL

## 1. Table Naming

- Use `snake_case` for all table names.
- Table names should be plural.
- Use descriptive names that represent the stored data.
- Use lowercase letters.
- Avoid abbreviations unless they are widely understood.

Examples:

- `users`
- `roles`
- `assignments`
- `assignment_students`
- `assignment_submissions`
- `ai_reviews`

## 2. Primary Key

- Every table must have a primary key named `id`.
- Use Laravel's `$table->id()` for standard primary keys.
- Primary keys must be unique and auto-incrementing unless the project has a documented reason to use another strategy.

Example:

```php
$table->id();
```

MySQL type: `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`.

## 3. Foreign Keys

- Use `{referenced_table_singular}_id` for foreign key names.
- Foreign keys must reference an existing primary key or an explicitly defined candidate key.
- Foreign key data types must match the referenced column.
- Define foreign key constraints in migrations.
- Use `constrained()` when Laravel can infer the referenced table.
- Choose `cascadeOnDelete()`, `restrictOnDelete()`, or `nullOnDelete()` according to business requirements.
- Do not use cascading deletes automatically without considering data integrity and audit/history requirements.

Example:

```php
$table->foreignId('user_id')
    ->constrained()
    ->restrictOnDelete();
```

## 4. Column Naming

- Use `snake_case` for all column names.
- Use descriptive and meaningful names.
- Use consistent terminology throughout the database.
- Avoid reserved SQL keywords as column names.
- Use clear boolean names such as `is_active`, `is_published`, or `is_verified`.

Examples:

- `first_name`
- `assignment_id`
- `submitted_at`
- `is_active`

## 5. Data Types

Choose data types based on the data being stored.

- Primary keys: `$table->id()`
- Foreign keys: `$table->foreignId()`
- Short text: `$table->string()`
- Long text: `$table->text()` or `$table->longText()`
- Whole numbers: `$table->integer()` or `$table->unsignedInteger()`
- Decimal values: `$table->decimal()`
- Boolean values: `$table->boolean()`
- Dates: `$table->date()`
- Date and time: `$table->dateTime()` or `$table->timestamp()`
- Structured JSON data: `$table->json()`

Rules:

- Do not store numbers as strings when arithmetic or numeric comparisons are required.
- Do not use floating-point types for financial amounts; use an appropriate `DECIMAL` type.
- Define suitable lengths, precision, and signedness.
- Use JSON only for flexible or structured data that does not need frequent relational querying.
- Choose date/time types consistently and document the timezone convention used by the application.

## 6. Required and Optional Columns

- Use `NOT NULL` for required fields.
- Use `nullable()` only when a field is genuinely optional.
- Define sensible default values when appropriate.
- Do not make every column nullable.
- Do not add a default value merely to avoid validating required input.

Example:

```php
$table->string('title');
$table->text('description')->nullable();
$table->boolean('is_active')->default(true);
```

## 7. Timestamps and Soft Deletes

- Most application tables should include Laravel timestamps.
- Use `$table->timestamps()` to create `created_at` and `updated_at`.
- Add event-specific timestamps when the business process requires them.

Example:

```php
$table->timestamps();
```

Examples of event-specific timestamps:

- `published_at`
- `submitted_at`
- `reviewed_at`
- `cancelled_at`

- Use `$table->softDeletes()` only when records need to be recoverable or retained for business/audit reasons.
- Define how soft-deleted records affect related records and queries.

## 8. Unique Constraints and Indexes

- Add unique constraints to fields or combinations of fields that must not contain duplicates.
- Index foreign keys and frequently queried columns when appropriate.
- Use composite indexes for queries that commonly filter or sort by multiple columns.
- Avoid unnecessary indexes because they increase storage and can slow writes.
- Confirm indexes against expected query patterns.

Examples:

```php
$table->string('email')->unique();

$table->index(['assignment_id', 'status']);
```

For a pivot table, prevent duplicate associations when required:

```php
$table->unique(['assignment_id', 'student_id']);
```

## 9. Relationships

- Define relationships using foreign keys wherever appropriate.
- Keep Laravel Eloquent relationships consistent with the database schema.
- Avoid storing duplicate information unnecessarily.
- Use pivot tables for many-to-many relationships.
- Add unique constraints to prevent duplicate associations where the business rules require it.
- Document any polymorphic relationships and their trade-offs.

Examples:

- One-to-many: `users` → `assignments`
- Many-to-many: `assignments` ↔ `users` through `assignment_students`
- One-to-many: `assignments` → `assignment_submissions`
- One-to-many: `assignment_submissions` → `ai_reviews`

## 10. Status Fields

- Define allowed status values explicitly in application validation and business rules.
- Use consistent status names and spelling across the project.
- Use PHP Enums or dedicated constants when appropriate.
- Do not accept arbitrary status values from user input.
- Use MySQL `ENUM` only when its constraints and migration implications are acceptable; otherwise, use a string column with application-level validation.
- Document valid state transitions, not only the list of statuses.

Examples:

- Assignment: `draft`, `published`, `closed`
- Submission: `pending`, `submitted`, `under_review`, `reviewed`, `rejected`
- AI review: `pending`, `processing`, `completed`, `failed`

## 11. Monetary and Score Fields

- Use `DECIMAL` for financial amounts.
- Define score precision and range according to grading requirements.
- Keep a student's earned score separate from the assignment's maximum score.
- Validate score values in the application and enforce database constraints where supported and appropriate.

Example:

```php
$table->decimal('score', 8, 2)->nullable();
$table->decimal('max_score', 8, 2)->default(100.00);
```

## 12. Database Transactions

- Use database transactions for operations that must succeed or fail together.
- Roll back related changes if an operation fails.
- Avoid leaving partially created or inconsistent records.
- Use row locking or other concurrency controls when simultaneous requests could conflict.

Example:

```php
DB::transaction(function () {
    // Create a submission and its related database records.
});
```

## 13. Data Integrity and Security

- Validate incoming data on the server side.
- Enforce foreign keys, unique constraints, and suitable database constraints.
- Never store plain-text passwords; use Laravel's password hashing facilities.
- Do not store API keys, access tokens, or sensitive credentials in plain text.
- Apply authorization checks before users access or modify records.
- Protect student submissions, personal information, and AI review results from unauthorized access.
- Store only the data the application needs.
- Define retention and deletion policies for uploaded files and sensitive records.

## 14. AI Review Data

- Keep submissions and AI review results in separate tables when they represent different entities or lifecycles.
- Link each AI review to the correct submission.
- Store review status, score, feedback, and relevant timestamps as required.
- Use JSON for structured feedback only when its structure is appropriate and documented.
- Record AI provider and model information when required for traceability.
- Never store provider API secrets directly in AI review records.
- Preserve review history if multiple reviews or re-reviews are supported.
- Define how failed, retried, and in-progress reviews are represented.

## 15. Laravel Migration Rules

- Create and modify schema through version-controlled Laravel migrations.
- Use descriptive migration names.
- Define foreign keys, indexes, and unique constraints explicitly where needed.
- Ensure migrations can be rolled back safely where practical.
- Create referenced tables before dependent tables.
- Review generated migrations before running them in production.
- Do not modify production database structure manually when a migration should be used.
- Test migrations against the project's supported MySQL version.

## 16. Eloquent Model Rules

- Create an Eloquent model for each main entity.
- Define `belongsTo()`, `hasMany()`, and `belongsToMany()` relationships explicitly.
- Configure `$fillable` or `$guarded` to protect against mass-assignment vulnerabilities.
- Define casts for booleans, dates, JSON fields, and enums where appropriate.
- Keep database access and business logic organized in suitable application layers.
- Do not rely on Eloquent relationships alone for integrity; use database constraints where appropriate.

## 17. General Design Principles

- Follow normalization principles and avoid unnecessary duplication.
- Keep each table focused on one main responsibility.
- Use consistent naming conventions and data types.
- Design tables according to documented business requirements.
- Avoid creating tables or columns without a clear purpose.
- Document complex relationships and business constraints.
- Consider maintainability, data integrity, query performance, and future growth.
- Do not optimize prematurely; use query patterns and measurements to guide indexing and denormalization.

## 18. Final Checklist

Before approving a database schema, verify:

- [ ] Every table has a primary key.
- [ ] Every foreign key references the correct column and has a deliberate delete behavior.
- [ ] Table and column names follow the project's naming conventions.
- [ ] Data types, nullability, defaults, and precision are appropriate.
- [ ] Required unique constraints and indexes exist.
- [ ] Relationships match the business requirements.
- [ ] Timestamps and soft deletes are used intentionally.
- [ ] Status values and valid state transitions are documented.
- [ ] Sensitive data is protected.
- [ ] Transactions and concurrency are considered for multi-step operations.
- [ ] Migrations can be executed and rolled back safely where practical.
- [ ] The schema matches `database.md`, `relationships.md`, and `business-rules.md`.
