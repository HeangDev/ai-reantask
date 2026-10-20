# create-api templates

Templates use **`Product`** (`product`, `/api/v1/products`, table `products`) as the stand-in feature. Replace names, fields, and the base package `com.example.app` with the real ones. They target **Spring Boot 3.x, Java 17+, Spring Data JPA, Bean Validation**. For Boot 2.x swap `jakarta.*` for `javax.*` and replace `record` DTOs with classes on Java < 16.

Adapt to the project: if it uses Lombok, MapStruct, layer-first packages, or an existing error format, follow that instead of these defaults.

## Contents
1. Entity
2. Repository
3. DTOs
4. Mapper (manual and MapStruct)
5. Exception + global handler
6. Service
7. Controller
8. Flyway migration
9. Tests
10. Variants (UUID, soft delete, PATCH)

---

## 1. Entity

```java
package com.example.app.product.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;

    protected Product() { } // required by JPA

    public Product(String name, String description, BigDecimal price, boolean active) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.active = active;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // getters + setters for name, description, price, active (omit setter for id/createdAt)

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    // ID-based equality: safe with Hibernate proxies, unlike @Data
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Product other)) return false;
        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() { return getClass().hashCode(); }
}
```

If the project already has an auditing base class (`BaseEntity`, `@EnableJpaAuditing`), extend it and drop the timestamp fields and callbacks above.

## 2. Repository

```java
package com.example.app.product.repository;

import com.example.app.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByNameIgnoreCase(String name);   // include only if names should be unique
}
```

## 3. DTOs

```java
package com.example.app.product.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateProductRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 1000) String description,
        @NotNull @Positive @Digits(integer = 10, fraction = 2) BigDecimal price,
        Boolean active
) { }
```

```java
public record UpdateProductRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 1000) String description,
        @NotNull @Positive @Digits(integer = 10, fraction = 2) BigDecimal price,
        @NotNull Boolean active
) { }
```

```java
import java.time.Instant;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) { }
```

Request DTOs deliberately omit `id` and audit fields so clients cannot set them.

## 4. Mapper

**Manual (default, no extra dependency):**

```java
package com.example.app.product.mapper;

import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public Product toEntity(CreateProductRequest r) {
        return new Product(r.name(), r.description(), r.price(),
                r.active() == null || r.active());
    }

    public void updateEntity(Product p, UpdateProductRequest r) {
        p.setName(r.name());
        p.setDescription(r.description());
        p.setPrice(r.price());
        p.setActive(r.active());
    }

    public ProductResponse toResponse(Product p) {
        return new ProductResponse(p.getId(), p.getName(), p.getDescription(),
                p.getPrice(), p.isActive(), p.getCreatedAt(), p.getUpdatedAt());
    }
}
```

**MapStruct (when `--mapstruct` or already used in the project):**

```java
@Mapper(componentModel = "spring")
public interface ProductMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Product toEntity(CreateProductRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget Product product, UpdateProductRequest request);

    ProductResponse toResponse(Product product);
}
```

## 5. Exception + global handler

Create these **only if the project doesn't already have equivalents**.

```java
package com.example.app.product.exception;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) {
        super("Product not found: " + id);
    }
}
```

Shared handler (Spring Boot 3, RFC 7807 `ProblemDetail`):

```java
package com.example.app.common.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)   // or a shared ResourceNotFoundException
    ProblemDetail handleNotFound(RuntimeException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Resource not found");
        return pd;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
          .forEach(fe -> errors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        pd.setTitle("Invalid request");
        pd.setProperty("errors", errors);
        return pd;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail handleConflict(DataIntegrityViolationException ex) {
        // Don't leak SQL details to clients
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Request conflicts with existing data");
    }
}
```

Optionally set `spring.mvc.problemdetails.enabled=true` so framework-level errors use the same format.

## 6. Service

```java
package com.example.app.product.service;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository repository;
    private final ProductMapper mapper;

    public ProductService(ProductRepository repository, ProductMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional
    public ProductResponse create(CreateProductRequest request) {
        Product saved = repository.save(mapper.toEntity(request));
        return mapper.toResponse(saved);
    }

    public ProductResponse getById(Long id) {
        return mapper.toResponse(findOrThrow(id));
    }

    public Page<ProductResponse> list(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional
    public ProductResponse update(Long id, UpdateProductRequest request) {
        Product product = findOrThrow(id);
        mapper.updateEntity(product, request);
        return mapper.toResponse(product);   // dirty checking persists changes
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findOrThrow(id));
    }

    private Product findOrThrow(Long id) {
        return repository.findById(id).orElseThrow(() -> new ProductNotFoundException(id));
    }
}
```

## 7. Controller

```java
package com.example.app.product.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest request) {
        ProductResponse created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public Page<ProductResponse> list(
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return service.list(pageable);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id,
                                  @Valid @RequestBody UpdateProductRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

Cap page size globally with `spring.data.web.pageable.max-page-size=100`.

Returning Spring's `Page` serializes extra internal fields and Spring Boot 3.3+ warns about it. If the project prefers a stable contract, add a small `PageResponse<T>` record (`content`, `page`, `size`, `totalElements`, `totalPages`) and map to it.

## 8. Flyway migration

`src/main/resources/db/migration/V<next>__create_products.sql` (PostgreSQL syntax; adjust for MySQL/H2):

```sql
CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(120)   NOT NULL,
    description VARCHAR(1000),
    price       NUMERIC(12, 2) NOT NULL,
    active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ    NOT NULL,
    updated_at  TIMESTAMPTZ    NOT NULL,
    version     BIGINT         NOT NULL DEFAULT 0
);
```

Add a unique index only if the field is genuinely unique:
`CREATE UNIQUE INDEX ux_products_name ON products (LOWER(name));`

If there is no migration tool, don't add one silently. Mention that `spring.jpa.hibernate.ddl-auto` is acceptable for local dev only.

## 9. Tests

### Service unit test

```java
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductRepository repository;
    @Spy  ProductMapper mapper = new ProductMapper();
    @InjectMocks ProductService service;

    @Test
    void create_savesAndReturnsResponse() {
        var request = new CreateProductRequest("Pen", "Blue", new BigDecimal("1.50"), true);
        when(repository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductResponse response = service.create(request);

        assertThat(response.name()).isEqualTo("Pen");
        verify(repository).save(any(Product.class));
    }

    @Test
    void getById_missing_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(ProductNotFoundException.class);
    }
}
```

### Controller slice test

```java
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean ProductService service;   // Boot 3.4+: @MockitoBean

    @Test
    void create_valid_returns201WithLocation() throws Exception {
        var response = new ProductResponse(1L, "Pen", null, new BigDecimal("1.50"), true,
                Instant.now(), Instant.now());
        when(service.create(any())).thenReturn(response);

        mvc.perform(post("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Pen","price":1.50}
                    """))
           .andExpect(status().isCreated())
           .andExpect(header().exists("Location"))
           .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void create_blankName_returns400() throws Exception {
        mvc.perform(post("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"","price":1.50}
                    """))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void get_missing_returns404() throws Exception {
        when(service.getById(99L)).thenThrow(new ProductNotFoundException(99L));

        mvc.perform(get("/api/v1/products/99"))
           .andExpect(status().isNotFound());
    }
}
```

`@WebMvcTest` only loads the web layer. Import `GlobalExceptionHandler` (`@Import`) if it is not picked up, and add security test config if Spring Security is present.

### Repository test (when a test DB is available)

```java
@DataJpaTest
class ProductRepositoryTest {

    @Autowired ProductRepository repository;

    @Test
    void save_setsIdAndTimestamps() {
        Product saved = repository.save(new Product("Pen", null, new BigDecimal("1.50"), true));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
    }
}
```

For PostgreSQL parity, prefer Testcontainers with `@ServiceConnection` (Boot 3.1+) over H2.

## 10. Variants

**UUID IDs (`--uuid`)**: `@Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;`, change `Long id` to `UUID id` across repository, service, controller, exception, tests; migration column `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.

**Soft delete (`--soft-delete`)**: add `deleted_at TIMESTAMPTZ NULL`; annotate the entity with `@SQLDelete(sql = "UPDATE products SET deleted_at = now() WHERE id = ? AND version = ?")` and `@SQLRestriction("deleted_at IS NULL")` (Hibernate 6.3+; `@Where` on older versions). Verify the `@SQLDelete` statement matches the table and `@Version` handling.

**PATCH (`--patch`)**: add `PatchProductRequest` with all-nullable fields (validation annotations still apply to non-null values), a `PATCH /{id}` endpoint, and a mapper method that copies only non-null fields.

**Kotlin (`--kotlin`)**: DTOs as `data class` with `@field:NotBlank`-style use-site targets; entities as regular `class` (use the `kotlin-jpa` and `kotlin-spring` compiler plugins), never `data class` for entities.