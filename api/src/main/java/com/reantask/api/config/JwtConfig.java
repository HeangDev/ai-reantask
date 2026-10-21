package com.reantask.api.config;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.reantask.api.security.JwtService;
import com.reantask.api.service.TokenRevocationService;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {

    private SecretKey key(JwtProperties props) {
        return new SecretKeySpec(props.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(JwtProperties props) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key(props)));
    }

    @Bean
    public JwtDecoder jwtDecoder(JwtProperties props, ObjectProvider<TokenRevocationService> revocations) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key(props))
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        // Default validators check exp/nbf and the issuer; the second one rejects tokens ended by logout.
        // Resolved per call so slice tests without a database simply skip it.
        OAuth2Error revoked = new OAuth2Error("invalid_token", "The token has been revoked", null);
        OAuth2TokenValidator<Jwt> notRevoked = jwt -> {
            TokenRevocationService service = revocations.getIfAvailable();
            return service != null && jwt.getId() != null && service.isRevoked(jwt.getId())
                    ? OAuth2TokenValidatorResult.failure(revoked)
                    : OAuth2TokenValidatorResult.success();
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(props.issuer()), notRevoked));
        return decoder;
    }

    /** Maps the "role" claim (ADMIN, TEACHER, STUDENT) to ROLE_* so hasRole('ADMIN') works. */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName(JwtService.ROLE_CLAIM);
        authorities.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }
}
