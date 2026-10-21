package com.reantask.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;

import com.reantask.api.exception.AppException;
import com.reantask.api.exception.ErrorCode;

class GoogleIdTokenVerifierTest {

    private static final String CLIENT_ID = "client-id.apps.googleusercontent.com";

    private static Jwt jwt(Map<String, Object> extra) {
        Jwt.Builder builder = Jwt.withTokenValue("t").header("alg", "RS256")
                .subject("g-1")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .claim("iss", "https://accounts.google.com")
                .claim("aud", java.util.List.of(CLIENT_ID))
                .claim("email", "Dara@Example.com")
                .claim("email_verified", true)
                .claim("name", "Dara");
        extra.forEach(builder::claim);
        return builder.build();
    }

    private GoogleIdTokenVerifier verifierReturning(Jwt jwt) {
        return new GoogleIdTokenVerifier(token -> jwt);
    }

    @Test
    void verify_validToken_returnsLowercasedIdentity() {
        GoogleIdentity identity = verifierReturning(jwt(Map.of())).verify("t");

        assertThat(identity.googleId()).isEqualTo("g-1");
        assertThat(identity.email()).isEqualTo("dara@example.com");
        assertThat(identity.fullname()).isEqualTo("Dara");
    }

    @Test
    void verify_decoderRejects_throwsGoogleTokenInvalid() {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier(token -> {
            throw new BadJwtException("expired");
        });

        assertThatThrownBy(() -> verifier.verify("t")).isInstanceOfSatisfying(AppException.class,
                e -> assertThat(e.getCode()).isEqualTo(ErrorCode.GOOGLE_TOKEN_INVALID));
    }

    @Test
    void verify_unverifiedEmail_throwsGoogleTokenInvalid() {
        GoogleIdTokenVerifier verifier = verifierReturning(jwt(Map.of("email_verified", false)));

        assertThatThrownBy(() -> verifier.verify("t")).isInstanceOfSatisfying(AppException.class,
                e -> assertThat(e.getCode()).isEqualTo(ErrorCode.GOOGLE_TOKEN_INVALID));
    }

    @Test
    void issuerAndAudience_acceptsBothGoogleIssuersForOurClient() {
        var validator = GoogleIdTokenVerifier.issuerAndAudience(CLIENT_ID);

        assertThat(validator.validate(jwt(Map.of())).hasErrors()).isFalse();
        assertThat(validator.validate(jwt(Map.of("iss", "accounts.google.com"))).hasErrors()).isFalse();
    }

    @Test
    void issuerAndAudience_rejectsOtherIssuerOrAudience() {
        var validator = GoogleIdTokenVerifier.issuerAndAudience(CLIENT_ID);

        assertThat(validator.validate(jwt(Map.of("iss", "https://evil.example"))).hasErrors()).isTrue();
        assertThat(validator.validate(jwt(Map.of("aud", java.util.List.of("other-client")))).hasErrors()).isTrue();
    }
}
