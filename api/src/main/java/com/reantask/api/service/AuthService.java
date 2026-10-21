package com.reantask.api.service;

import com.reantask.api.dto.common.ClientInfo;
import com.reantask.api.dto.request.GoogleAuthRequest;
import com.reantask.api.dto.request.LoginRequest;
import com.reantask.api.dto.request.RegisterRequest;
import com.reantask.api.dto.response.GoogleAuthResponse;
import com.reantask.api.dto.response.TokenResponse;
import com.reantask.api.dto.response.UserResponse;

public interface AuthService {

    /** Creates a student with status PENDING. The client cannot choose role or status. */
    UserResponse register(RegisterRequest request);

    /**
     * Unknown email and wrong password both give INVALID_CREDENTIALS (401). Only after the password
     * matches is the account gate checked: ACCOUNT_PENDING / ACCOUNT_INACTIVE / ACCOUNT_SUSPENDED /
     * ACCOUNT_DELETED / ROLE_INACTIVE (403).
     */
    TokenResponse login(LoginRequest request, ClientInfo client);

    /**
     * Google sign-in and sign-up with a Google ID token. A first-time Google user is created as a PENDING student
     * and gets no token. Known users pass the same account gate as {@link #login}.
     *
     * @throws com.reantask.api.exception.UnauthorizedException GOOGLE_TOKEN_INVALID (401)
     */
    GoogleAuthResponse google(GoogleAuthRequest request, ClientInfo client);

    /**
     * Ends the access token used for this request: it is rejected from now on. Idempotent, and other devices'
     * tokens are not affected.
     */
    void logout();
}
