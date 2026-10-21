package com.reantask.api.dto.response;

import com.reantask.api.enums.Language;
import com.reantask.api.enums.ThemeMode;

public record UserSettingResponse(
        ThemeMode themeMode,
        Language language,
        String timezone,
        boolean emailNotifications,
        boolean pushNotifications
) { }
