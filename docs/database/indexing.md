# Database Indexing

Indexes should be created based on actual query patterns.

Consider indexes for:

- Foreign keys
- Frequently filtered columns
- Frequently sorted columns
- Unique fields
- Common search conditions

Do not create indexes blindly.

Before adding an index, consider:

- Query frequency
- Table size
- Write performance
- Existing indexes
- Query execution plans