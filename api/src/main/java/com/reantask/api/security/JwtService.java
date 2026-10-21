package com.reantask.api.security;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.reantask.api.config.JwtProperties;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtService {

    public static final String ROLE_CLAIM = "role";

    private final JwtEncoder encoder;
    private final JwtProperties props;
    private final Clock clock;

    /** An issued token with the id and expiry needed to track its session. */
    public record AccessToken(String value, String id, Instant expiresAt) {

        @Override
        public String toString() {
            return "AccessToken[id=" + id + ", expiresAt=" + expiresAt + "]";
        }
    }

    /** Claims: sub = user id, role = ADMIN | TEACHER | STUDENT, plus iss, iat, exp, jti. */
    public AccessToken issue(Long userId, String role) {
        Instant now = Instant.now(clock);
        Instant expiresAt = now.plus(props.accessTokenTtl());
        String id = UUID.randomUUID().toString();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.issuer())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(String.valueOf(userId))
                .id(id)
                .claim(ROLE_CLAIM, role)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String value = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AccessToken(value, id, expiresAt);
    }

    public String issueAccessToken(Long userId, String role) {
        return issue(userId, role).value();
    }

    public long accessTokenTtlSeconds() {
        return props.accessTokenTtl().toSeconds();
    }
}
