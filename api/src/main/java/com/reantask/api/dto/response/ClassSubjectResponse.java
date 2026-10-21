package com.reantask.api.dto.response;

import java.time.Instant;

import com.reantask.api.enums.ClassSubjectStatus;

public record ClassSubjectResponse(
        Long id,
        ClassResponse classRoom,
        SubjectResponse subject,
        Long teacherId,
        ClassSubjectStatus status,
        Instant createdAt,
        Instant updatedAt
) { }
