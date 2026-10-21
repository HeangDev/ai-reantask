package com.reantask.api.dto.request;

import com.reantask.api.validation.ValidTimezone;
import com.reantask.api.enums.Language;
import com.reantask.api.enums.ThemeMode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserSettingRequest(
        @NotNull ThemeMode themeMode,
        @NotNull Language language,
        @NotBlank @Size(max = 100) @ValidTimezone String timezone,
        @NotNull Boolean emailNotifications,
        @NotNull Boolean pushNotifications
) { }
