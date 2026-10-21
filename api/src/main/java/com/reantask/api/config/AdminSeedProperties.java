package com.reantask.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

@Validated
@ConfigurationProperties(prefix = "app.seed.admin")
public record AdminSeedProperties(
        @NotBlank String fullname,
        @NotBlank String email,
        String phone,
        @NotBlank String password
) {

    @Override
    public String toString() {
        return "AdminSeedProperties[email=" + email + "]";
    }
}
