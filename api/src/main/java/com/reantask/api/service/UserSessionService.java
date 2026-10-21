package com.reantask.api.service;

import org.springframework.data.domain.Pageable;

import com.reantask.api.dto.common.ClientInfo;
import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.response.UserSessionResponse;
import com.reantask.api.security.JwtService;

/** Login sessions: one per issued access token. A session is active until its token expires or is logged out. */
public interface UserSessionService {

    /** Records the login that issued {@code token}. Also purges expired sessions. */
    void record(Long userId, JwtService.AccessToken token, ClientInfo client);

    /** Active sessions of the signed-in user, newest first. Only ever the caller's own. */
    PageResponse<UserSessionResponse> listMine(Pageable pageable);

    /**
     * Logs the caller out of one of their own sessions by revoking its token. Idempotent.
     * Another user's session id gives SESSION_NOT_FOUND (404), the same as an unknown id.
     */
    void revokeMine(Long sessionId);

    /** Logs the caller out everywhere by revoking the token of every active session. Idempotent. */
    void revokeAllMine();
}
