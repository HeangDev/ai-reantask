package com.reantask.api.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/** {@code token} is null for a first-time Google user: the account is PENDING until approved. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GoogleAuthResponse(TokenResponse token, UserResponse user, boolean newAccount) {

    public static GoogleAuthResponse signedIn(TokenResponse token, UserResponse user) {
        return new GoogleAuthResponse(token, user, false);
    }

    public static GoogleAuthResponse registered(UserResponse user) {
        return new GoogleAuthResponse(null, user, true);
    }
}
