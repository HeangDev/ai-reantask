# spring-security templates

Targets **Spring Boot 3.x / Spring Security 6, Java 17+, Spring MVC**. Replace `com.example.app` with the project's base package and adapt to its conventions (Lombok, ID type, error format, layer-first vs feature-first packages).

## Contents
1. Dependencies and configuration
2. JWT mode: properties and beans
3. JWT mode: security config
4. JWT mode: JSON 401/403 handlers
5. JWT mode: user model and UserDetailsService
6. JWT mode: auth endpoints
7. Resource-server mode (external IdP)
8. Method security and ownership checks
9. Tests
10. Variants (refresh tokens, RSA, session, basic)

---

## 1. Dependencies and configuration

Maven:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.security</groupId>
  <artifactId>spring-security-test</artifactId>
  <scope>test</scope>
</dependency>
```

`application.yml` (jwt mode). The secret has **no default**, so the app fails to start if it's missing:

```yaml
app:
  security:
    jwt:
      secret: ${JWT_SECRET}            # >= 32 bytes. Generate: openssl rand -base64 48
      issuer: ${JWT_ISSUER:my-api}
      access-token-ttl: 15m
    cors:
      allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}
```

Test profile (`src/test/resources/application-test.yml` or `@TestPropertySource`) needs its own throwaway secret of 32+ characters.

Enable property scanning if not already done: `@ConfigurationPropertiesScan` on the application class.

---

## 2. JWT mode: properties and beans

```java
package com.example.app.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(
        @NotBlank @Size(min = 32, message = "JWT secret must be at least 32 characters") String secret,
        @NotBlank String issuer,
        Duration accessTokenTtl
) {
    public JwtProperties {
        if (accessTokenTtl == null) accessTokenTtl = Duration.ofMinutes(15);
    }
}
```

```java
package com.example.app.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class JwtConfig {

    private SecretKey key(JwtProperties props) {
        return new SecretKeySpec(props.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(JwtProperties props) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key(props)));
    }

    @Bean
    JwtDecoder jwtDecoder(JwtProperties props) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key(props))
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        // Default validators check exp/nbf; add issuer validation
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(props.issuer()));
        decoder.setJwtValidator(validator);
        return decoder;
    }

    /** Maps the "roles" claim to ROLE_* authorities so hasRole("ADMIN") works. */
    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

Token issuing:

```java
package com.example.app.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final JwtProperties props;

    public JwtService(JwtEncoder encoder, JwtProperties props) {
        this.encoder = encoder;
        this.props = props;
    }

    public String issue(Authentication authentication) {
        Instant now = Instant.now();
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.startsWith("ROLE_") ? a.substring(5) : a)   // converter re-adds the prefix
                .toList();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.issuer())
                .issuedAt(now)
                .expiresAt(now.plus(props.accessTokenTtl()))
                .subject(authentication.getName())
                .claim("roles", roles)
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long expiresInSeconds() {
        return props.accessTokenTtl().toSeconds();
    }
}
```

---

## 3. JWT mode: security config

```java
package com.example.app.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http,
                                    JwtAuthenticationConverter jwtConverter,
                                    SecurityErrorHandlers errors) throws Exception {
        http
            // Safe to disable: stateless API, token sent in Authorization header (not a cookie)
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> {})   // uses the CorsConfigurationSource bean below
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/health/**").permitAll()
                // .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll() // only if springdoc is used
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter))
                .authenticationEntryPoint(errors)       // 401 for missing/invalid token
                .accessDeniedHandler(errors))           // 403 for bearer-token requests
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(errors)
                .accessDeniedHandler(errors));
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.security.cors.allowed-origins}") List<String> origins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origins);                       // explicit origins, never "*" with credentials
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

---

## 4. JWT mode: JSON 401/403 handlers

One class implements both interfaces so the chain above can reuse it.

```java
package com.example.app.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class SecurityErrorHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper mapper;

    public SecurityErrorHandlers(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest req, HttpServletResponse res, AuthenticationException ex)
            throws IOException {
        res.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        write(res, HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    @Override
    public void handle(HttpServletRequest req, HttpServletResponse res, AccessDeniedException ex)
            throws IOException {
        write(res, HttpStatus.FORBIDDEN, "You do not have permission to perform this action");
    }

    private void write(HttpServletResponse res, HttpStatus status, String detail) throws IOException {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(status.getReasonPhrase());
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        mapper.writeValue(res.getWriter(), pd);
    }
}
```

The message is deliberately generic; don't echo the exception message, which can reveal why validation failed.

Controller-level exceptions (such as a bad login) don't go through the entry point; handle them in the existing `@RestControllerAdvice`:

```java
@ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
ProblemDetail handleBadCredentials() {
    // Same response for unknown user and wrong password
    return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Invalid username or password");
}

@ExceptionHandler(AccessDeniedException.class)   // thrown by @PreAuthorize inside controllers/services
ProblemDetail handleAccessDenied() {
    return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "You do not have permission to perform this action");
}
```

---

## 5. JWT mode: user model and UserDetailsService

Reuse the project's existing user entity if there is one.

```java
package com.example.app.user;

public enum Role { USER, ADMIN }
```

```java
package com.example.app.user;

import jakarta.persistence.*;
import java.util.EnumSet;
import java.util.Set;

@Entity
@Table(name = "app_users")     // "user" is a reserved word in several databases
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private boolean enabled = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "app_user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Set<Role> roles = EnumSet.of(Role.USER);

    protected AppUser() { }

    public AppUser(String username, String passwordHash) {
        this.username = username;
        this.passwordHash = passwordHash;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isEnabled() { return enabled; }
    public Set<Role> getRoles() { return roles; }
}
```

```java
public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsernameIgnoreCase(String username);
    boolean existsByUsernameIgnoreCase(String username);
}
```

```java
package com.example.app.user;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository repository;

    public AppUserDetailsService(AppUserRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        AppUser u = repository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password"));
        return User.withUsername(u.getUsername())
                .password(u.getPasswordHash())
                .disabled(!u.isEnabled())
                .authorities(u.getRoles().stream()
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                        .toList())
                .build();
    }
}
```

Flyway (PostgreSQL syntax, adjust as needed):

```sql
CREATE TABLE app_users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(100) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX ux_app_users_username ON app_users (LOWER(username));

CREATE TABLE app_user_roles (
    user_id BIGINT      NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
    role    VARCHAR(30) NOT NULL,
    PRIMARY KEY (user_id, role)
);
```

---

## 6. JWT mode: auth endpoints

```java
package com.example.app.auth.dto;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 100) String username,
        @NotBlank @Size(min = 8, max = 72) String password   // BCrypt ignores bytes beyond 72
) { }

public record LoginRequest(@NotBlank String username, @NotBlank String password) { }

public record TokenResponse(String accessToken, String tokenType, long expiresIn) {
    public static TokenResponse bearer(String token, long expiresIn) {
        return new TokenResponse(token, "Bearer", expiresIn);
    }
}
```

```java
package com.example.app.auth;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    // constructor injection omitted for brevity

    @Transactional
    public void register(RegisterRequest req) {
        if (users.existsByUsernameIgnoreCase(req.username())) {
            throw new DuplicateUsernameException();     // map to 409 in the advice
        }
        // Role is always USER here. Never accept roles from the request body.
        users.save(new AppUser(req.username(), encoder.encode(req.password())));
    }

    public TokenResponse login(LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(req.username(), req.password()));
        return TokenResponse.bearer(jwt.issue(auth), jwt.expiresInSeconds());
    }
}
```

```java
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService service;

    // constructor omitted

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequest request) {
        service.register(request);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return service.login(request);
    }
}
```

Bootstrapping the first admin: don't expose an "admin" flag on register. Use a Flyway seed migration, a one-off `ApplicationRunner` guarded by a property, or promote users with SQL. Say which in the summary.

---

## 7. Resource-server mode (external IdP)

No user table, no auth endpoints, no `JwtEncoder`.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${OIDC_ISSUER_URI}   # e.g. https://keycloak.example.com/realms/myrealm
          # audiences: ${OIDC_AUDIENCE}    # validate "aud" when the IdP supports it
```

Spring discovers the JWKS URL from the issuer and validates signature, expiry and issuer automatically. The filter chain is the same as section 3, minus the `JwtDecoder`/`JwtEncoder` beans and `/auth/**` rules.

Roles live in different claims depending on the IdP, so check a real token before writing the converter:

```java
// Keycloak: realm roles are nested at realm_access.roles
@Bean
JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(jwt -> {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        Collection<String> roles = realmAccess == null
                ? List.of() : (Collection<String>) realmAccess.getOrDefault("roles", List.of());
        return roles.stream()
                .map(r -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()))
                .toList();
    });
    return converter;
}
```

Other IdPs: Auth0 puts permissions in `permissions` (and often needs a namespaced custom claim for roles); Cognito uses `cognito:groups`; Okta uses `groups` or `scp`. Ask the user which IdP they use if you can't tell, and don't guess the claim name.

Audience validation (recommended when the IdP issues tokens for many APIs):

```java
@Bean
JwtDecoder jwtDecoder(@Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuer,
                      @Value("${app.security.audience}") String audience) {
    NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuer);
    OAuth2TokenValidator<Jwt> audienceValidator = new JwtClaimValidator<List<String>>(
            "aud", aud -> aud != null && aud.contains(audience));
    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer(issuer), audienceValidator));
    return decoder;
}
```

---

## 8. Method security and ownership checks

Role-based:

```java
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable Long id) { ... }
```

Ownership-based (prevents user A reading user B's data by guessing IDs). Put the rule in the service so every caller is covered:

```java
@PreAuthorize("hasRole('ADMIN') or @orderSecurity.isOwner(#id, authentication.name)")
public OrderResponse getById(Long id) { ... }
```

```java
@Component("orderSecurity")
public class OrderSecurity {
    private final OrderRepository repository;
    public OrderSecurity(OrderRepository repository) { this.repository = repository; }

    public boolean isOwner(Long orderId, String username) {
        return repository.existsByIdAndOwnerUsername(orderId, username);
    }
}
```

Alternative that avoids a second query: scope the lookup, such as `repository.findByIdAndOwnerUsername(id, username)`, and return `404` when absent. Returning `404` instead of `403` also avoids confirming that the record exists.

Read the current user in a controller:

```java
@GetMapping("/me")
public MeResponse me(@AuthenticationPrincipal Jwt jwt) {
    return new MeResponse(jwt.getSubject(), jwt.getClaimAsStringList("roles"));
}
```

---

## 9. Tests

Controller slice test proving the policy (`@WebMvcTest` doesn't load your `@Configuration` classes automatically, so import what the chain needs):

```java
@WebMvcTest(ProductController.class)
@Import({SecurityConfig.class, SecurityErrorHandlers.class, JwtConfig.class})
@EnableConfigurationProperties(JwtProperties.class)
@TestPropertySource(properties = {
        "app.security.jwt.secret=test-secret-test-secret-test-secret-1234",
        "app.security.jwt.issuer=test",
        "app.security.cors.allowed-origins=http://localhost:3000"
})
class ProductControllerSecurityTest {

    @Autowired MockMvc mvc;
    @MockBean ProductService service;            // Boot 3.4+: @MockitoBean
    @MockBean AppUserDetailsService userDetails; // satisfies AuthenticationManager wiring if JwtConfig is imported

    @Test
    void list_withoutToken_returns401() throws Exception {
        mvc.perform(get("/api/v1/products"))
           .andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void list_withUserRole_returns200() throws Exception {
        when(service.list(any())).thenReturn(Page.empty());

        mvc.perform(get("/api/v1/products")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
           .andExpect(status().isOk());
    }

    @Test
    void delete_withUserRole_returns403() throws Exception {
        mvc.perform(delete("/api/v1/products/1")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
           .andExpect(status().isForbidden());
    }

    @Test
    void delete_withAdminRole_returns204() throws Exception {
        mvc.perform(delete("/api/v1/products/1")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
           .andExpect(status().isNoContent());
    }
}
```

Imports: `org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt`. Use `.with(csrf())` for state-changing requests only in `session` mode.

Full-stack auth flow test (`@SpringBootTest` + `@AutoConfigureMockMvc`, with Testcontainers or H2):

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIT {

    @Autowired MockMvc mvc;
    @Autowired AppUserRepository users;
    @Autowired ObjectMapper objectMapper;

    @Test
    void register_login_andCallProtectedEndpoint() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(APPLICATION_JSON)
                .content("""
                    {"username":"alice","password":"correct-horse-battery"}"""))
           .andExpect(status().isCreated());

        assertThat(users.findByUsernameIgnoreCase("alice").orElseThrow().getPasswordHash())
                .startsWith("$2");   // BCrypt, not plain text

        String body = mvc.perform(post("/api/v1/auth/login").contentType(APPLICATION_JSON)
                .content("""
                    {"username":"alice","password":"correct-horse-battery"}"""))
           .andExpect(status().isOk())
           .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(body).get("accessToken").asText();

        mvc.perform(get("/api/v1/products").header("Authorization", "Bearer " + token))
           .andExpect(status().isOk());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(APPLICATION_JSON)
                .content("""
                    {"username":"alice","password":"wrong"}"""))
           .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withTamperedToken_returns401() throws Exception {
        mvc.perform(get("/api/v1/products").header("Authorization", "Bearer abc.def.ghi"))
           .andExpect(status().isUnauthorized());
    }
}
```

---

## 10. Variants

**Refresh tokens (`--refresh-token`)**: issue an opaque random token (`SecureRandom`, 32+ bytes, Base64URL) at login; store only its SHA-256 hash with user id, expiry and a `revoked` flag; `POST /auth/refresh` validates, **rotates** (revokes the old, issues a new pair), and detects reuse of an already-rotated token by revoking the whole family. `POST /auth/logout` revokes. Keep access tokens at 15 minutes.

**RSA signing (`--rsa`)**: generate a key pair (`openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048`), load the private key from a secret/volume path (never commit it), expose the public key to other services, use `NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(rsaJwk)))` and `NimbusJwtDecoder.withPublicKey(publicKey).build()`. Add a `kid` and publish a JWKS endpoint if keys will rotate.

**Session + form login (`session` mode)**: keep CSRF enabled with `CookieCsrfTokenRepository.withHttpOnlyFalse()` for SPAs on the same site, use `.formLogin(...)`/`.logout(...)`, `SessionCreationPolicy.IF_REQUIRED`, `sessionFixation().migrateSession()`, and secure cookie settings (`server.servlet.session.cookie.secure=true`, `http-only=true`, `same-site=lax`). Return JSON `401` for XHR requests rather than a redirect to a login page.

**HTTP Basic (`basic` mode)**: `.httpBasic(Customizer.withDefaults())`, stateless sessions, BCrypt-hashed users from `AppUserDetailsService`. Acceptable for internal tools behind TLS; not for public browser clients.

**Profiles**: relax only in `dev` (H2 console, Swagger) via a separate `@Profile("dev")` chain with ordered matchers, never by editing the default chain.