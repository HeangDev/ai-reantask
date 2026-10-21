package com.reantask.api.dto.response;

import com.reantask.api.enums.RoleName;
import com.reantask.api.enums.RoleStatus;
import com.reantask.api.enums.UserStatus;

/** Internal contract for the auth feature only. Never return this from a controller. */
public record UserCredentialsResponse(
        Long id,
        String email,
        String passwordHash,
        RoleName roleName,
        RoleStatus roleStatus,
        UserStatus status
) {

    @Override
    public String toString() {
        return "UserCredentialsResponse[id=" + id + ", status=" + status + "]";
    }
}
