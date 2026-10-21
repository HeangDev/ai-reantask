package com.reantask.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.reantask.api.entity.RevokedToken;
import com.reantask.api.repository.RevokedTokenRepository;

@ExtendWith(MockitoExtension.class)
class TokenRevocationServiceImplTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Mock RevokedTokenRepository repository;
    TokenRevocationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new TokenRevocationServiceImpl(repository, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void revoke_newToken_savesItAndPurgesExpired() {
        when(repository.existsByJti("jti-1")).thenReturn(false);

        service.revoke("jti-1", NOW.plusSeconds(600));

        ArgumentCaptor<RevokedToken> saved = ArgumentCaptor.forClass(RevokedToken.class);
        verify(repository).deleteExpired(NOW);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getJti()).isEqualTo("jti-1");
        assertThat(saved.getValue().getExpiresAt()).isEqualTo(NOW.plusSeconds(600));
    }

    @Test
    void revoke_alreadyRevoked_isIdempotent() {
        when(repository.existsByJti("jti-1")).thenReturn(true);

        service.revoke("jti-1", NOW.plusSeconds(600));

        verify(repository, never()).save(any());
    }

    @Test
    void revoke_alreadyExpiredToken_isNotStored() {
        service.revoke("jti-1", NOW.minusSeconds(1));

        verify(repository, never()).save(any());
    }

    @Test
    void isRevoked_delegatesToRepository() {
        when(repository.existsByJti("jti-1")).thenReturn(true);

        assertThat(service.isRevoked("jti-1")).isTrue();
    }
}
