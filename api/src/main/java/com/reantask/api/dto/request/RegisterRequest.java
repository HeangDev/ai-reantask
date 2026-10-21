package com.reantask.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Public student registration. There is deliberately no role or status field. */
public record RegisterRequest(
        @NotBlank @Size(max = 255) String fullname,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(max = 20) @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "must be 8-15 digits, optional leading +") String phone,
        @NotBlank @Size(min = 8, max = 72) @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "must contain a letter and a digit") String password
) {

    @Override
    public String toString() {
        return "RegisterRequest[email=" + email + "]";
    }
}
