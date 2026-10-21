package com.reantask.api.security;

import org.springframework.lang.Nullable;

/** Claims of a verified Google ID token. The email is always verified by Google. */
public record GoogleIdentity(String googleId, String email, @Nullable String fullname, @Nullable String picture) {
}
