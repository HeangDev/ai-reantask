package com.reantask.api.dto.response;

import java.time.Instant;

/** @param current true for the session the request itself is made with */
public record UserSessionResponse(
        Long id,
        String ipAddress,
        String userAgent,
        Instant signedInAt,
        Instant expiresAt,
        boolean current
) {
}
