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

    /** Claims: sub = user id, role = ADMIN | TEACHER | STUDENT, plus iss, iat, exp, jti. */
    public String issueAccessToken(Long userId, String role) {
        Instant now = Instant.now(clock);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.issuer())
                .issuedAt(now)
                .expiresAt(now.plus(props.accessTokenTtl()))
                .subject(String.valueOf(userId))
                .id(UUID.randomUUID().toString())
                .claim(ROLE_CLAIM, role)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long accessTokenTtlSeconds() {
        return props.accessTokenTtl().toSeconds();
    }
}
