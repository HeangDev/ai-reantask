package com.reantask.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** @param credential the Google ID token from Google Identity Services */
public record GoogleAuthRequest(@NotBlank @Size(max = 4096) String credential) {

    @Override
    public String toString() {
        return "GoogleAuthRequest[]";
    }
}
