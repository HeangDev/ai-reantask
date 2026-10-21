package com.reantask.api.security;

import java.util.List;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.UnauthorizedException;

/** Verifies a Google ID token (signature, expiry, issuer, audience = our client id) and extracts the identity. */
public class GoogleIdTokenVerifier {

    public static final String JWK_SET_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final List<String> ISSUERS = List.of("https://accounts.google.com", "accounts.google.com");
    private static final String INVALID_MESSAGE = "Invalid Google token";

    private final JwtDecoder decoder;

    public GoogleIdTokenVerifier(JwtDecoder decoder) {
        this.decoder = decoder;
    }

    /** Validator for issuer and audience; the timestamp check is added by the decoder config. */
    public static OAuth2TokenValidator<Jwt> issuerAndAudience(String clientId) {
        OAuth2Error error = new OAuth2Error("invalid_token", "Not a Google token for this application", null);
        return jwt -> ISSUERS.contains(jwt.getClaimAsString("iss"))
                && jwt.getAudience() != null && jwt.getAudience().contains(clientId)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(error);
    }

    /** @throws UnauthorizedException GOOGLE_TOKEN_INVALID when the token is invalid or its email is unverified */
    public GoogleIdentity verify(String idToken) {
        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException e) {
            throw new UnauthorizedException(ErrorCode.GOOGLE_TOKEN_INVALID, INVALID_MESSAGE);
        }
        String email = jwt.getClaimAsString("email");
        if (jwt.getSubject() == null || email == null || email.isBlank()
                || !Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))) {
            throw new UnauthorizedException(ErrorCode.GOOGLE_TOKEN_INVALID, INVALID_MESSAGE);
        }
        return new GoogleIdentity(jwt.getSubject(), email.trim().toLowerCase(),
                jwt.getClaimAsString("name"), jwt.getClaimAsString("picture"));
    }
}
