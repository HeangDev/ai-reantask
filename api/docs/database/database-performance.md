# Database Performance Rules

## 1. General Principles
- Design database tables and queries for performance, scalability, and maintainability.
- Avoid unnecessary database queries.
- Retrieve only the columns required by the application.
- Use Laravel Eloquent and Query Builder efficiently.
- Optimize queries based on actual usage and execution plans.
- Do not optimize prematurely without identifying a real bottleneck.

## 2. Database Indexing
- Add indexes to frequently queried columns when beneficial.
- Index foreign keys and use unique indexes where required.
- Use composite indexes based on actual query patterns and column order.
- Avoid unnecessary indexes because they increase storage and write costs.
- Use EXPLAIN or EXPLAIN ANALYZE when supported by the MySQL version.

## 3. Query Optimization
- Avoid SELECT * when only specific columns are needed.
- Use appropriate WHERE conditions to reduce returned rows.
- Avoid unnecessary subqueries and repeated queries.
- Use joins or subqueries when appropriate.
- Avoid applying functions to indexed columns in filter conditions when they prevent efficient index usage.
- Avoid leading wildcards in LIKE searches when index usage is important.
- Use COUNT, SUM, and AVG in SQL instead of loading all records into application memory.
- Use parameterized queries and Laravel bindings.

## 4. Prevent N+1 Query Problems
- Use with() for eager loading related models.
- Use load() when relationships must be loaded after retrieving models.
- Use withCount() when only relationship counts are needed.
- Avoid queries inside loops when data can be retrieved in batches.
- Enable lazy-loading prevention in development or testing where appropriate.

## 5. Pagination and Large Datasets
- Paginate large result sets instead of retrieving all records.
- Use paginate() when total record counts are required.
- Use simplePaginate() when total page counts are unnecessary.
- Use cursorPaginate() when suitable for the query and ordering requirements.
- Use stable, deterministic ordering.
- Prefer indexed cursor-based pagination for large tables when appropriate.
- Avoid loading large datasets into memory unnecessarily.

## 6. Transactions and Locking
- Use transactions for operations that must succeed or fail together.
- Keep transactions as short as possible.
- Avoid slow external API calls inside transactions.
- Use lockForUpdate() when necessary to protect concurrent updates.
- Use atomic database updates for counters and inventory when appropriate.
- Handle deadlocks and retry transactions safely.
- Preserve business rules under concurrent requests.

## 7. Eloquent and Data Retrieval
- Select only the necessary columns.
- Use exists() to check record existence.
- Use value() or pluck() when full model instances are unnecessary.
- Use bulk insert() or upsert() when appropriate.
- Use chunking or lazy() for processing large datasets.
- Use Query Builder when model hydration is unnecessary.
- Remember that bulk operations may bypass Eloquent events and observers.

## 8. Schema and Data Types
- Choose appropriate MySQL data types and sizes.
- Use suitable primary keys and foreign keys.
- Ensure foreign key columns have compatible data types.
- Use DECIMAL for monetary values.
- Choose date and time types appropriate to the application.
- Prefer relational columns for frequently queried structured data when appropriate.
- Avoid unnecessary denormalization unless justified by measured performance needs.

## 9. Caching
- Use Laravel Cache for expensive, frequently requested data when appropriate.
- Define cache expiration and invalidation strategies.
- Keep cached data sufficiently fresh for business requirements.
- Protect cached sensitive information with proper access controls.
- Do not use caching as a substitute for fixing inefficient queries.

## 10. Database Connections and Configuration
- Use connection pooling or persistent connections only when supported and properly configured by the environment.
- Configure connection limits for expected concurrency and available resources.
- Store database credentials in environment configuration, not source code.
- Use appropriate database permissions for each environment.
- Monitor connection usage and exhaustion.

## 11. Database Monitoring
- Monitor slow queries and query execution time.
- Use MySQL slow query logs and Performance Schema when appropriate.
- Monitor CPU, memory, disk I/O, connections, and lock waits.
- Use EXPLAIN to inspect query execution plans.
- Test with realistic data volumes and concurrent workloads.
- Investigate bottlenecks before changing indexes or schema.

## 12. Migrations and Index Changes
- Define indexes and constraints in Laravel migrations.
- Use descriptive index names when helpful.
- Review schema changes on large production tables.
- Consider table locks, metadata locks, disk space, and migration duration.
- Use safe deployment strategies for high-traffic tables.
- Avoid undocumented manual production schema changes.

## 13. Security and Reliability
- Use parameter binding to prevent SQL injection.
- Apply authorization and tenant-scoping conditions where required.
- Avoid exposing sensitive database errors to API clients.
- Use database constraints to enforce critical data integrity rules.
- Do not bypass validation, authorization, or business rules for performance.

## 14. AI Agent Implementation Rules
Before implementing or modifying database queries, the AI Agent MUST:
1. Understand the business purpose and expected data volume.
2. Check existing migrations, relationships, indexes, and query patterns.
3. Identify N+1 queries and unnecessary data retrieval.
4. Add or modify indexes only when justified by query patterns.
5. Preserve data integrity, authorization, and business rules.
6. Use transactions for operations requiring atomicity.
7. Consider concurrency when modifying shared records.
8. Verify query correctness and relevant automated tests.
9. Use EXPLAIN or profiling tools for significant performance-sensitive queries when possible.
10. Document significant performance trade-offs and assumptions.

## 15. Final Rules
- Correctness and data integrity come before performance.
- Prefer simple, maintainable queries over unnecessary complexity.
- Never assume an index improves every query.
- Never introduce caching without an invalidation strategy.
- Never remove validation or security checks to improve performance.
- Base significant optimization decisions on measurements, not assumptions.

## 16. Final Checklist

### Query Performance
- [ ] Retrieve only required columns instead of using SELECT *.
- [ ] Check for and prevent N+1 query problems.
- [ ] Use eager loading when related data is required.
- [ ] Avoid unnecessary or duplicate database queries.
- [ ] Use pagination for large result sets.
- [ ] Use SQL aggregation instead of loading unnecessary records into application memory.
- [ ] Verify execution plans for important performance-sensitive queries when appropriate.

### Indexing and Schema
- [ ] Check whether frequently queried columns need indexes.
- [ ] Verify indexes for frequently used filtering, sorting, and joining conditions.
- [ ] Review composite indexes against actual query patterns.
- [ ] Avoid unnecessary or duplicate indexes.
- [ ] Verify foreign keys, data types, and database constraints.
- [ ] Define schema changes and indexes through Laravel migrations.

### Data Integrity and Concurrency
- [ ] Use transactions for operations requiring atomicity.
- [ ] Check for race conditions when multiple requests modify the same records.
- [ ] Use appropriate locking or atomic updates when necessary.
- [ ] Ensure database constraints and business rules remain enforced.
- [ ] Handle transaction failures and deadlocks safely.

### Caching and Resource Usage
- [ ] Cache expensive, frequently requested data only when appropriate.
- [ ] Define cache expiration and invalidation strategies.
- [ ] Avoid loading unnecessarily large datasets into memory.
- [ ] Review database connection usage and resource limits.
- [ ] Avoid unnecessary processing inside transactions.

### Security and Reliability
- [ ] Use parameter binding to prevent SQL injection.
- [ ] Apply authorization and tenant-scoping conditions where required.
- [ ] Avoid exposing sensitive database errors.
- [ ] Ensure optimizations do not bypass validation or security controls.
- [ ] Verify bulk operations do not unintentionally bypass required Eloquent events or observers.

### Testing and Verification
- [ ] Run relevant automated tests after modifying queries or schemas.
- [ ] Verify query results remain correct.
- [ ] Test critical business rules and concurrent operations where applicable.
- [ ] Measure performance for significant optimizations.
- [ ] Review migration safety before production deployment.
- [ ] Document significant performance trade-offs and assumptions.

### Final Approval
- [ ] All applicable checklist items have been reviewed.
- [ ] No known critical query performance issues remain unresolved.
- [ ] Data integrity, authorization, and business rules are preserved.
- [ ] The implementation is maintainable and ready for review.

**Important:** Mark an item complete only after verification. If an item is not applicable, document the reason when necessary. Never claim performance has been verified without appropriate evidence.
