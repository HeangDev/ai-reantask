package com.reantask.api.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Neither the code nor the status can be changed here. */
public record UpdateClassRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 50000) String description,
        @NotNull LocalDate startAt,
        @NotNull LocalDate endDate
) { }
