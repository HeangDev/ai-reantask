package com.reantask.api.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.reantask.api.security.SecurityErrorHandlers;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String ADMIN = "ADMIN";
    private static final String TEACHER = "TEACHER";

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationConverter jwtConverter,
                                           SecurityErrorHandlers errors) throws Exception {
        http
                // Safe to disable: stateless API, token travels in the Authorization header, not a cookie.
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> { })
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Must come before the /auth/** rule: first match wins.
                        .requestMatchers("/api/v1/auth/me", "/api/v1/auth/logout",
                                "/api/v1/auth/change-password").authenticated()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Avatars load through <img src>, which cannot send a bearer token.
                        .requestMatchers(HttpMethod.GET, "/api/v1/avatars/*").permitAll()
                        // OpenAPI docs: disable in prod with springdoc.api-docs.enabled=false
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // Role rules per endpoint. First match wins, so specific paths come before wildcards.
                        .requestMatchers("/api/v1/users/me", "/api/v1/users/me/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/users", "/api/v1/users/*").hasAnyRole(ADMIN, TEACHER)
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/users/*/approve", "/api/v1/users/*/reject")
                                .hasAnyRole(ADMIN, TEACHER)
                        .requestMatchers("/api/v1/users", "/api/v1/users/*").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/v1/roles").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/v1/classes/me/teaching").hasRole(TEACHER)
                        .requestMatchers(HttpMethod.GET, "/api/v1/classes", "/api/v1/classes/*",
                                "/api/v1/subjects", "/api/v1/subjects/*").hasAnyRole(ADMIN, TEACHER)
                        .requestMatchers("/api/v1/classes", "/api/v1/classes/*", "/api/v1/classes/*/subjects",
                                "/api/v1/subjects", "/api/v1/subjects/*").hasRole(ADMIN)
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter))
                        .authenticationEntryPoint(errors)
                        .accessDeniedHandler(errors))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(errors)
                        .accessDeniedHandler(errors));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.security.cors.allowed-origins}") List<String> origins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
