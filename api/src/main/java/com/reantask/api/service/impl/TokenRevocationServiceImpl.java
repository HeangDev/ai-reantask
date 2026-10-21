package com.reantask.api.service.impl;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.entity.RevokedToken;
import com.reantask.api.repository.RevokedTokenRepository;
import com.reantask.api.service.TokenRevocationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TokenRevocationServiceImpl implements TokenRevocationService {

    private final RevokedTokenRepository repository;
    private final Clock clock;

    @Override
    @Transactional
    public void revoke(String jti, Instant expiresAt) {
        Instant now = Instant.now(clock);
        repository.deleteExpired(now);
        if (expiresAt.isAfter(now) && !repository.existsByJti(jti)) {
            repository.save(new RevokedToken(jti, expiresAt));
        }
    }

    @Override
    public boolean isRevoked(String jti) {
        return repository.existsByJti(jti);
    }
}
