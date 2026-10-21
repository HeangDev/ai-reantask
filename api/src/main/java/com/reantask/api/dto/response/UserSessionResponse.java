package com.reantask.api.dto.response;

import java.time.Instant;

/**
 * @param os       read from the User-Agent, null when unknown
 * @param browser  read from the User-Agent, null when unknown
 * @param location city / country of the login, null until a GeoIP lookup fills it
 * @param current  true for the session the request itself is made with
 */
public record UserSessionResponse(
        Long id,
        String ipAddress,
        String userAgent,
        String os,
        String browser,
        String location,
        Instant signedInAt,
        Instant expiresAt,
        boolean current
) {
}
