package com.reantask.api.service.impl;

import java.time.Clock;
import java.time.Instant;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.dto.common.ClientInfo;
import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.response.UserSessionResponse;
import com.reantask.api.entity.UserSession;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.repository.UserSessionRepository;
import com.reantask.api.security.CurrentUser;
import com.reantask.api.security.JwtService;
import com.reantask.api.service.TokenRevocationService;
import com.reantask.api.service.UserSessionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserSessionServiceImpl implements UserSessionService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserSessionRepository repository;
    private final CurrentUser currentUser;
    private final TokenRevocationService revocations;
    private final Clock clock;

    @Override
    @Transactional
    public void record(Long userId, JwtService.AccessToken token, ClientInfo client) {
        repository.deleteExpired(Instant.now(clock));
        repository.save(new UserSession(userId, token.id(), truncate(client.ipAddress(), UserSession.MAX_IP_LENGTH),
                truncate(client.userAgent(), UserSession.MAX_USER_AGENT_LENGTH), token.expiresAt()));
    }

    @Override
    public PageResponse<UserSessionResponse> listMine(Pageable pageable) {
        Long userId = currentUser.requireId();
        String currentJti = currentUser.token().map(jwt -> jwt.getId()).orElse(null);
        // Order is fixed by the query (newest first), so a client-supplied sort is ignored on purpose.
        Pageable page = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), MAX_PAGE_SIZE));
        return PageResponse.from(repository.findActive(userId, Instant.now(clock), page)
                .map(s -> new UserSessionResponse(s.getId(), s.getIpAddress(), s.getUserAgent(), s.getCreatedAt(),
                        s.getExpiresAt(), s.getJti().equals(currentJti))));
    }

    @Override
    @Transactional
    public void revokeMine(Long sessionId) {
        UserSession session = repository.findByIdAndUserId(sessionId, currentUser.requireId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.SESSION_NOT_FOUND, "Session not found"));
        revocations.revoke(session.getJti(), session.getExpiresAt());
    }

    private static String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
