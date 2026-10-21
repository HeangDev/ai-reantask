package com.reantask.api.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AssignClassSubjectRequest(
        @NotNull @Positive Long subjectId,
        @NotNull @Positive Long teacherId
) { }
