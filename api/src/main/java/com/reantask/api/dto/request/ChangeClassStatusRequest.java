package com.reantask.api.dto.request;

import com.reantask.api.enums.ClassStatus;

import jakarta.validation.constraints.NotNull;

public record ChangeClassStatusRequest(@NotNull ClassStatus status) { }
