package com.reantask.api.service.impl;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.reantask.api.dto.request.GoogleAuthRequest;
import com.reantask.api.dto.request.LoginRequest;
import com.reantask.api.dto.request.RegisterRequest;
import com.reantask.api.dto.response.GoogleAccountResponse;
import com.reantask.api.dto.response.GoogleAuthResponse;
import com.reantask.api.dto.response.TokenResponse;
import com.reantask.api.security.GoogleIdTokenVerifier;
import com.reantask.api.security.GoogleIdentity;
import com.reantask.api.security.JwtService;
import com.reantask.api.service.AuthService;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.ForbiddenException;
import com.reantask.api.exception.UnauthorizedException;
import com.reantask.api.dto.response.UserCredentialsResponse;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.enums.RoleStatus;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.service.UserAccountService;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserAccountService accounts;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier googleVerifier;
    // Checked against when the email is unknown so both failures cost about the same time.
    private final String dummyHash;

    public AuthServiceImpl(UserAccountService accounts, PasswordEncoder passwordEncoder, JwtService jwtService,
                           GoogleIdTokenVerifier googleVerifier) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleVerifier = googleVerifier;
        this.dummyHash = passwordEncoder.encode("not-a-real-password");
    }

    @Override
    public UserResponse register(RegisterRequest request) {
        return accounts.registerStudent(request.fullname(), request.email(), request.phone(),
                passwordEncoder.encode(request.password()));
    }

    @Override
    public TokenResponse login(LoginRequest request) {
        Optional<UserCredentialsResponse> found = accounts.findCredentialsByEmail(request.email());
        String hash = found.map(UserCredentialsResponse::passwordHash).orElse(dummyHash);
        boolean passwordMatches = passwordEncoder.matches(request.password(), hash);
        if (found.isEmpty() || !passwordMatches) {
            throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, "Invalid email or password");
        }

        UserCredentialsResponse user = found.get();
        assertCanLogin(user);
        String token = jwtService.issueAccessToken(user.id(), user.roleName().name());
        return TokenResponse.bearer(token, jwtService.accessTokenTtlSeconds());
    }

    @Override
    public GoogleAuthResponse google(GoogleAuthRequest request) {
        GoogleIdentity identity = googleVerifier.verify(request.credential());
        GoogleAccountResponse account = accounts.signInWithGoogle(identity.googleId(), identity.email(),
                identity.fullname(), identity.picture());
        if (account.created()) {
            return GoogleAuthResponse.registered(account.user());
        }
        assertCanLogin(account.credentials());
        UserCredentialsResponse user = account.credentials();
        String token = jwtService.issueAccessToken(user.id(), user.roleName().name());
        return GoogleAuthResponse.signedIn(TokenResponse.bearer(token, jwtService.accessTokenTtlSeconds()),
                account.user());
    }

    private void assertCanLogin(UserCredentialsResponse user) {
        ErrorCode blocked = switch (user.status()) {
            case ACTIVE -> null;
            case PENDING -> ErrorCode.ACCOUNT_PENDING;
            case INACTIVE -> ErrorCode.ACCOUNT_INACTIVE;
            case SUSPENDED -> ErrorCode.ACCOUNT_SUSPENDED;
            case DELETED -> ErrorCode.ACCOUNT_DELETED;
        };
        if (blocked != null) {
            throw new ForbiddenException(blocked, "This account cannot sign in: " + blocked);
        }
        if (user.roleStatus() != RoleStatus.ACTIVE) {
            throw new ForbiddenException(ErrorCode.ROLE_INACTIVE, "This account's role is disabled");
        }
    }
}
