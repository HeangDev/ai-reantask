package com.reantask.api.dto.response;

import java.time.Instant;

import com.reantask.api.enums.UserStatus;

public record UserResponse(
        Long id,
        Long roleId,
        String roleName,
        String fullname,
        String email,
        String phone,
        String avatar,
        UserStatus status,
        Instant emailVerifiedAt,
        Instant createdAt,
        Instant updatedAt
) { }
