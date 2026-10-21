package com.reantask.api.service;

import java.time.Instant;

/** Deny-list of access tokens ended by logout, keyed by the JWT id (jti). */
public interface TokenRevocationService {

    /** Idempotent. Also purges entries whose tokens have expired. */
    void revoke(String jti, Instant expiresAt);

    boolean isRevoked(String jti);
}
