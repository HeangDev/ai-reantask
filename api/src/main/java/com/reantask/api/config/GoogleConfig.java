package com.reantask.api.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import com.reantask.api.security.GoogleIdTokenVerifier;

@Configuration
@EnableConfigurationProperties(GoogleProperties.class)
public class GoogleConfig {

    // The decoder is not exposed as a bean: a second JwtDecoder would make the resource server's choice ambiguous.
    @Bean
    public GoogleIdTokenVerifier googleIdTokenVerifier(GoogleProperties props) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(GoogleIdTokenVerifier.JWK_SET_URI).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                GoogleIdTokenVerifier.issuerAndAudience(props.clientId())));
        return new GoogleIdTokenVerifier(decoder);
    }
}
