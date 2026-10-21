package com.reantask.api.dto.response;

import java.time.Instant;

import com.reantask.api.enums.SubjectStatus;

public record SubjectResponse(
        Long id,
        String name,
        String description,
        SubjectStatus status,
        Instant createdAt,
        Instant updatedAt
) { }
