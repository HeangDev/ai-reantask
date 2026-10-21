package com.reantask.api.dto.request;

import com.reantask.api.enums.UserStatus;

import jakarta.validation.constraints.NotNull;

public record ChangeUserStatusRequest(@NotNull UserStatus status) { }
