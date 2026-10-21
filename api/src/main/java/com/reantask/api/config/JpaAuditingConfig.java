package com.reantask.api.config;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import com.reantask.api.security.CurrentUser;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware", dateTimeProviderRef = "auditingDateTimeProvider")
@RequiredArgsConstructor
public class JpaAuditingConfig {

    private final CurrentUser currentUser;
    private final Clock clock;

    @Bean
    public AuditorAware<Long> auditorAware() {
        return currentUser::id;
    }

    @Bean
    public DateTimeProvider auditingDateTimeProvider() {
        return () -> Optional.of(Instant.now(clock));
    }
}
