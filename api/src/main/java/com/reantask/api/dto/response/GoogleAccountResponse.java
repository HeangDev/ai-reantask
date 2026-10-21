package com.reantask.api.dto.response;

/** Internal contract for the auth feature only. Never return this from a controller. */
public record GoogleAccountResponse(UserCredentialsResponse credentials, UserResponse user, boolean created) {
}
