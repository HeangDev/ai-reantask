package com.reantask.api.dto.response;

import java.time.Instant;
import java.time.LocalDate;

import com.reantask.api.enums.ClassStatus;

public record ClassResponse(
        Long id,
        String name,
        String code,
        String description,
        ClassStatus status,
        LocalDate startAt,
        LocalDate endDate,
        Instant createdAt,
        Instant updatedAt
) { }
