package com.reantask.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(max = 150) String email,
        @NotBlank @Size(max = 72) String password
) {

    @Override
    public String toString() {
        return "LoginRequest[email=" + email + "]";
    }
}
