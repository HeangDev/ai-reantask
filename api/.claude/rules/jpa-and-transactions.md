---
paths:
  - "**/entity/**"
  - "**/repository/**"
  - "**/service/**"
  - "**/converter/**"
---

# Backend Rules - JPA, Transactions, Repositories

## 1. Entities

- `@Entity @Table(name = "...")` with the exact table name. Columns map with `@Column(name = "...")` or the Spring naming strategy (`SpringPhysicalNamingStrategy` -> snake_case).
- Extend `AuditableEntity` (`@MappedSuperclass`, `@EntityListeners(AuditingEntityListener.class)`) for audited tables:

```java
@MappedSuperclass
public abstract class AuditableEntity {
  @CreatedDate        @Column(name="created_at", updatable=false) private Instant createdAt;
  @CreatedBy          @Column(name="created_by_user", updatable=false) private Long createdByUser;
  @LastModifiedDate   @Column(name="updated_at") private Instant updatedAt;
  @LastModifiedBy     @Column(name="updated_by_user") private Long updatedByUser;
  @Column(name="deleted_at") private Instant deletedAt;
  @Column(name="deleted_by_user") private Long deletedByUser;
}
```

- Tables without audit/soft-delete columns (`roles`, `user_settings`, `analysis_*`) use a smaller `TimestampedEntity` (`created_at`, `updated_at`) only.
- `@SQLRestriction("deleted_at IS NULL")` on soft-deletable entities.
- Primary key: `@Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id`.
- Enums: `@Enumerated(EnumType.STRING)`. `RoleName` uses a converter (lowercase in DB).
- JSONB: `@JdbcTypeCode(SqlTypes.JSON) private JsonNode evidence;`
- Relations: `@ManyToOne(fetch = LAZY)` always; no `EAGER`. Avoid bidirectional `@OneToMany` unless needed; never `CascadeType.REMOVE` (soft delete only).
- Foreign keys to users for audit are plain `Long` columns, not `@ManyToOne`.
- `equals/hashCode` on `id` (or business key), not on all fields. No `@Data`. Use `@Getter`, `@Setter` (where needed), `@NoArgsConstructor(access = PROTECTED)`, builder for creation.
- `@Version Long version` on `Submission`, `AnalysisRun`, `Assignment` (needs a `version BIGINT NOT NULL DEFAULT 0` column via migration if adopted).

## 2. Repositories

- Extend `JpaRepository<E, Long>` (+ `JpaSpecificationExecutor` for filter screens).
- Derived queries for simple cases; `@Query` JPQL with named parameters for the rest. Native SQL only for: restore lookups ignoring `@SQLRestriction`, partial-index-aware checks, reports.
- Restore pattern:

```java
@Query(value = "SELECT * FROM class_students WHERE class_id = :classId AND student_id = :studentId", nativeQuery = true)
Optional<ClassStudent> findIncludingDeleted(@Param("classId") Long classId, @Param("studentId") Long studentId);
```

- Existence checks use `existsBy...` not `findBy...`.
- List queries return `Page<T>` or DTO projections (interfaces/records), not whole entity graphs.
- N+1: use `@EntityGraph(attributePaths = {...})` or `JOIN FETCH`; set `hibernate.default_batch_fetch_size=50`.
- Bulk state changes via `@Modifying @Query` must also set `updated_at/updated_by_user` explicitly (listeners do not run).

## 3. Transactions

- `@Transactional` on `service/impl` methods only. Class-level `@Transactional(readOnly = true)`, override with `@Transactional` on writes.
- One service method = one unit of work. Do not call another service's `@Transactional` method from the same class via `this` (proxy bypass).
- Keep transactions short. Do NOT call external HTTP (Git provider) while holding a DB transaction that has locked rows: call the provider first (or after), persist inside a short transaction.
- Side effects after commit (queue analysis, send email) use `@TransactionalEventListener(phase = AFTER_COMMIT)`.
- Checked exceptions do not roll back by default; use `rollbackFor` if you throw checked exceptions. Our `AppException`s are runtime.
- Isolation: default READ COMMITTED. Use pessimistic lock (`PESSIMISTIC_WRITE`) for picking a `PENDING` analysis run, and optimistic `@Version` for user edits.

## 4. Soft Delete Implementation

```java
public void softDelete(Long id, Long actorId) {
  X e = repo.findById(id).orElseThrow(...);
  e.setStatus(XStatus.DELETED);        // if the table has status
  e.setDeletedAt(Instant.now(clock));
  e.setDeletedByUser(actorId);
  // save via dirty checking
}
```
- `restore`: clear `deletedAt/deletedByUser`, set `ACTIVE`, update audit.
- Provide `findIncludingDeleted` for tables with plain unique keys (`class_subjects`, `class_students`, `assignment_students`, `users`).

## 5. Status Transitions

- Model each state machine as an enum with `canTransitionTo(next)`:

```java
public enum SubmissionStatus {
  SUBMITTED, ANALYZING, ANALYZED, VERIFIED, REJECTED;
  public boolean canTransitionTo(SubmissionStatus n) { ... }
}
```
- Services call `assertTransition(from, to)` which throws `ConflictException(INVALID_STATUS_TRANSITION)`. Never set status from client input without validating the transition.
- Allowed transitions are defined in the module files `01`, `03`, `05`; keep enums and docs in sync.

## 6. Time

- Inject `java.time.Clock` (bean `Clock.systemUTC()`); use `Instant.now(clock)`. Never `new Date()` or `LocalDateTime.now()` in business code.
- Deadline checks: `!now.isBefore(startAt) && !now.isAfter(deadlineAt)`.
