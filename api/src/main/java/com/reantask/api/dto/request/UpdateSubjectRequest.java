package com.reantask.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Status is changed through {@link ChangeSubjectStatusRequest}, not here. */
public record UpdateSubjectRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 50000) String description
) { }
