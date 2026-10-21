package com.reantask.api.dto.common;

import org.springframework.lang.Nullable;

/** Where a request came from, read from HTTP by the controller so services stay free of HTTP types. */
public record ClientInfo(@Nullable String ipAddress, @Nullable String userAgent) {

    public static final ClientInfo UNKNOWN = new ClientInfo(null, null);
}
