# Database Schema

## Database

MySQL

## General Rules

- Every main table should have a primary key.
- Use appropriate data types.
- Use foreign keys for enforced relationships where appropriate.
- Use indexes based on query patterns.
- Avoid unnecessary duplicated data.
- Use timestamps where appropriate.
- Use nullable columns only when null has a meaningful meaning.

---

## Example: Users

Table: users

| Column | Type | Rules |
|---|---|---|
| id | BIGINT | Primary Key |
| name | VARCHAR | Required |
| email | VARCHAR | Required, Unique |
| password | VARCHAR | Required |
| created_at | TIMESTAMP | Required |
| updated_at | TIMESTAMP | Required |