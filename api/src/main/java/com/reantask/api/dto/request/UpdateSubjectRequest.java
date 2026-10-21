package com.reantask.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** The status cannot be changed here. */
public record UpdateSubjectRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 50000) String description
) { }
