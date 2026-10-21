package com.reantask.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** The profile image is changed through {@code PUT /users/me/avatar}, not here. */
public record UpdateProfileRequest(
        @NotBlank @Size(max = 255) String fullname,
        @Size(max = 20) @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "must be 8-15 digits, optional leading +") String phone
) { }
