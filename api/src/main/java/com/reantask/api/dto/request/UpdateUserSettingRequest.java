package com.reantask.api.dto.request;

import com.reantask.api.enums.Language;
import com.reantask.api.enums.ThemeMode;

import jakarta.validation.constraints.NotNull;

public record UpdateUserSettingRequest(
        @NotNull ThemeMode themeMode,
        @NotNull Language language,
        @NotNull Boolean emailNotifications,
        @NotNull Boolean pushNotifications
) { }
