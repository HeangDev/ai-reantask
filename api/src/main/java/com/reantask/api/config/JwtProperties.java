package com.reantask.api.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Validated
@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(
        @NotBlank @Size(min = 32, message = "JWT secret must be at least 32 characters") String secret,
        @NotBlank String issuer,
        Duration accessTokenTtl
) {

    public JwtProperties {
        if (accessTokenTtl == null) {
            accessTokenTtl = Duration.ofMinutes(15);
        }
    }

    @Override
    public String toString() {
        return "JwtProperties[issuer=" + issuer + ", accessTokenTtl=" + accessTokenTtl + "]";
    }
}
