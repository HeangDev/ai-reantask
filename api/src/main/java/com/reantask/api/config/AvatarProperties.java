package com.reantask.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Validated
@ConfigurationProperties(prefix = "app.storage.avatar")
public record AvatarProperties(
        @NotBlank String directory,
        @NotNull DataSize maxSize
) { }
