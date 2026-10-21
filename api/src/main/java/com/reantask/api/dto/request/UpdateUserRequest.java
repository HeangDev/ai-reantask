package com.reantask.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Admin update. Email, password and status have their own flows. */
public record UpdateUserRequest(
        @NotNull @Positive Long roleId,
        @NotBlank @Size(max = 255) String fullname,
        @Size(max = 20) @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "must be 8-15 digits, optional leading +") String phone,
        @Size(max = 255) String avatar
) { }
