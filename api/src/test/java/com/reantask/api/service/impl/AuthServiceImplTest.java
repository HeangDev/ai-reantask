package com.reantask.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.reantask.api.dto.request.GoogleAuthRequest;
import com.reantask.api.dto.request.LoginRequest;
import com.reantask.api.dto.request.RegisterRequest;
import com.reantask.api.dto.response.GoogleAccountResponse;
import com.reantask.api.dto.response.GoogleAuthResponse;
import com.reantask.api.dto.response.TokenResponse;
import com.reantask.api.security.GoogleIdTokenVerifier;
import com.reantask.api.security.GoogleIdentity;
import com.reantask.api.security.JwtService;
import com.reantask.api.exception.AppException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.UnauthorizedException;
import com.reantask.api.dto.response.UserCredentialsResponse;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.enums.RoleName;
import com.reantask.api.enums.RoleStatus;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.service.UserAccountService;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock UserAccountService accounts;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock GoogleIdTokenVerifier googleVerifier;

    AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        when(passwordEncoder.encode("not-a-real-password")).thenReturn("dummy-hash");
        service = new AuthServiceImpl(accounts, passwordEncoder, jwtService, googleVerifier);
    }

    private static final GoogleIdentity IDENTITY = new GoogleIdentity("g-1", "dara@example.com", "Dara", "http://pic");

    private UserResponse userResponse(UserStatus status) {
        return new UserResponse(7L, 3L, "student", "Dara", "dara@example.com", null, null, status, null,
                Instant.now(), Instant.now());
    }

    private void stubGoogle(UserStatus status, boolean created) {
        when(googleVerifier.verify("id-token")).thenReturn(IDENTITY);
        when(accounts.signInWithGoogle("g-1", "dara@example.com", "Dara", "http://pic"))
                .thenReturn(new GoogleAccountResponse(
                        new UserCredentialsResponse(7L, "dara@example.com", "hash", RoleName.STUDENT,
                                RoleStatus.ACTIVE, status),
                        userResponse(status), created));
    }

    @Test
    void google_firstTimeUser_isRegisteredPendingWithoutToken() {
        stubGoogle(UserStatus.PENDING, true);

        GoogleAuthResponse response = service.google(new GoogleAuthRequest("id-token"));

        assertThat(response.newAccount()).isTrue();
        assertThat(response.token()).isNull();
        assertThat(response.user().status()).isEqualTo(UserStatus.PENDING);
        verify(jwtService, never()).issueAccessToken(any(), anyString());
    }

    @Test
    void google_activeUser_getsToken() {
        stubGoogle(UserStatus.ACTIVE, false);
        when(jwtService.issueAccessToken(7L, "STUDENT")).thenReturn("jwt-value");
        when(jwtService.accessTokenTtlSeconds()).thenReturn(900L);

        GoogleAuthResponse response = service.google(new GoogleAuthRequest("id-token"));

        assertThat(response.newAccount()).isFalse();
        assertThat(response.token().accessToken()).isEqualTo("jwt-value");
    }

    @ParameterizedTest
    @CsvSource({
            "PENDING, ACCOUNT_PENDING",
            "INACTIVE, ACCOUNT_INACTIVE",
            "SUSPENDED, ACCOUNT_SUSPENDED",
            "DELETED, ACCOUNT_DELETED"
    })
    void google_blockedStatus_isRejected(UserStatus status, ErrorCode expected) {
        stubGoogle(status, false);

        assertThatThrownBy(() -> service.google(new GoogleAuthRequest("id-token")))
                .isInstanceOfSatisfying(AppException.class, e -> assertThat(e.getCode()).isEqualTo(expected));
        verify(jwtService, never()).issueAccessToken(any(), anyString());
    }

    @Test
    void google_invalidToken_isRejectedBeforeTouchingAccounts() {
        when(googleVerifier.verify("bad")).thenThrow(
                new UnauthorizedException(ErrorCode.GOOGLE_TOKEN_INVALID, "Invalid Google token"));

        assertThatThrownBy(() -> service.google(new GoogleAuthRequest("bad")))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.GOOGLE_TOKEN_INVALID));
        verify(accounts, never()).signInWithGoogle(anyString(), anyString(), any(), any());
    }

    private UserCredentialsResponse credentials(UserStatus status, RoleStatus roleStatus) {
        return new UserCredentialsResponse(7L, "dara@example.com", "stored-hash", RoleName.TEACHER, roleStatus, status);
    }

    @Test
    void login_activeUserWithCorrectPassword_returnsBearerTokenWithIdAndRole() {
        when(accounts.findCredentialsByEmail("dara@example.com"))
                .thenReturn(Optional.of(credentials(UserStatus.ACTIVE, RoleStatus.ACTIVE)));
        when(passwordEncoder.matches("Secret123", "stored-hash")).thenReturn(true);
        when(jwtService.issueAccessToken(7L, "TEACHER")).thenReturn("jwt-value");
        when(jwtService.accessTokenTtlSeconds()).thenReturn(900L);

        TokenResponse response = service.login(new LoginRequest("dara@example.com", "Secret123"));

        assertThat(response.accessToken()).isEqualTo("jwt-value");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(900L);
    }

    @Test
    void login_wrongPassword_throwsInvalidCredentials() {
        when(accounts.findCredentialsByEmail("dara@example.com"))
                .thenReturn(Optional.of(credentials(UserStatus.ACTIVE, RoleStatus.ACTIVE)));
        when(passwordEncoder.matches("wrong", "stored-hash")).thenReturn(false);

        assertThatThrownBy(() -> service.login(new LoginRequest("dara@example.com", "wrong")))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.INVALID_CREDENTIALS));
        verify(jwtService, never()).issueAccessToken(any(), anyString());
    }

    @Test
    void login_unknownEmail_looksIdenticalToWrongPassword() {
        when(accounts.findCredentialsByEmail("ghost@example.com")).thenReturn(Optional.empty());
        // Even a "matching" dummy comparison must not let an unknown email through.
        when(passwordEncoder.matches("Secret123", "dummy-hash")).thenReturn(true);

        assertThatThrownBy(() -> service.login(new LoginRequest("ghost@example.com", "Secret123")))
                .isInstanceOfSatisfying(AppException.class, e -> {
                    assertThat(e.getCode()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
                    assertThat(e.getMessage()).isEqualTo("Invalid email or password");
                });
        verify(passwordEncoder).matches("Secret123", "dummy-hash");
    }

    @ParameterizedTest
    @CsvSource({
            "PENDING, ACCOUNT_PENDING",
            "INACTIVE, ACCOUNT_INACTIVE",
            "SUSPENDED, ACCOUNT_SUSPENDED",
            "DELETED, ACCOUNT_DELETED"
    })
    void login_blockedStatus_isRejectedAfterPasswordCheck(UserStatus status, ErrorCode expected) {
        when(accounts.findCredentialsByEmail("dara@example.com"))
                .thenReturn(Optional.of(credentials(status, RoleStatus.ACTIVE)));
        when(passwordEncoder.matches("Secret123", "stored-hash")).thenReturn(true);

        assertThatThrownBy(() -> service.login(new LoginRequest("dara@example.com", "Secret123")))
                .isInstanceOfSatisfying(AppException.class, e -> {
                    assertThat(e.getCode()).isEqualTo(expected);
                    assertThat(e.getStatus().value()).isEqualTo(403);
                });
        verify(jwtService, never()).issueAccessToken(any(), anyString());
    }

    @Test
    void login_pendingUserWithWrongPassword_doesNotRevealStatus() {
        when(accounts.findCredentialsByEmail("dara@example.com"))
                .thenReturn(Optional.of(credentials(UserStatus.PENDING, RoleStatus.ACTIVE)));
        when(passwordEncoder.matches("wrong", "stored-hash")).thenReturn(false);

        assertThatThrownBy(() -> service.login(new LoginRequest("dara@example.com", "wrong")))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.INVALID_CREDENTIALS));
    }

    @Test
    void login_inactiveRole_isRejected() {
        when(accounts.findCredentialsByEmail("dara@example.com"))
                .thenReturn(Optional.of(credentials(UserStatus.ACTIVE, RoleStatus.INACTIVE)));
        when(passwordEncoder.matches("Secret123", "stored-hash")).thenReturn(true);

        assertThatThrownBy(() -> service.login(new LoginRequest("dara@example.com", "Secret123")))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.ROLE_INACTIVE));
    }

    @Test
    void register_hashesPasswordAndDelegatesWithoutAnyRoleOrStatus() {
        UserResponse created = new UserResponse(1L, 3L, "student", "Dara", "dara@example.com", "012345678", null,
                UserStatus.PENDING, null, Instant.now(), Instant.now());
        when(passwordEncoder.encode("Secret123")).thenReturn("new-hash");
        when(accounts.registerStudent("Dara", "dara@example.com", "012345678", "new-hash")).thenReturn(created);

        UserResponse response = service.register(
                new RegisterRequest("Dara", "dara@example.com", "012345678", "Secret123"));

        assertThat(response.status()).isEqualTo(UserStatus.PENDING);
        verify(accounts).registerStudent("Dara", "dara@example.com", "012345678", "new-hash");
    }
}
