package com.reantask.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

import com.reantask.api.dto.common.ClientInfo;
import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.response.UserSessionResponse;
import com.reantask.api.entity.UserSession;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.repository.UserSessionRepository;
import com.reantask.api.security.CurrentUser;
import com.reantask.api.security.JwtService;
import com.reantask.api.service.TokenRevocationService;

@ExtendWith(MockitoExtension.class)
class UserSessionServiceImplTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Mock UserSessionRepository repository;
    @Mock CurrentUser currentUser;
    @Mock TokenRevocationService revocations;
    UserSessionServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserSessionServiceImpl(repository, currentUser, revocations, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void record_savesSessionOfTheIssuedTokenAndPurgesExpired() {
        var token = new JwtService.AccessToken("value", "jti-1", NOW.plusSeconds(900));

        service.record(7L, token, new ClientInfo("10.0.0.1", "Firefox"));

        ArgumentCaptor<UserSession> saved = ArgumentCaptor.forClass(UserSession.class);
        verify(repository).deleteExpired(NOW);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo(7L);
        assertThat(saved.getValue().getJti()).isEqualTo("jti-1");
        assertThat(saved.getValue().getIpAddress()).isEqualTo("10.0.0.1");
        assertThat(saved.getValue().getUserAgent()).isEqualTo("Firefox");
        assertThat(saved.getValue().getExpiresAt()).isEqualTo(NOW.plusSeconds(900));
    }

    @Test
    void record_overlongUserAgent_isTruncatedToTheColumnSize() {
        var token = new JwtService.AccessToken("value", "jti-1", NOW.plusSeconds(900));

        service.record(7L, token, new ClientInfo("10.0.0.1", "x".repeat(900)));

        ArgumentCaptor<UserSession> saved = ArgumentCaptor.forClass(UserSession.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getUserAgent()).hasSize(UserSession.MAX_USER_AGENT_LENGTH);
    }

    @Test
    void listMine_queriesOnlyTheCallersSessionsAndFlagsTheCurrentOne() {
        UserSession mine = session(1L, "jti-current");
        UserSession other = session(2L, "jti-other");
        when(currentUser.requireId()).thenReturn(7L);
        when(currentUser.token()).thenReturn(Optional.of(
                Jwt.withTokenValue("t").header("alg", "HS256").jti("jti-current").build()));
        when(repository.findActive(7L, NOW, PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(List.of(mine, other), PageRequest.of(0, 10), 2));

        PageResponse<UserSessionResponse> result = service.listMine(PageRequest.of(0, 10));

        assertThat(result.items()).extracting(UserSessionResponse::current).containsExactly(true, false);
        assertThat(result.items()).extracting(UserSessionResponse::id).containsExactly(1L, 2L);
        assertThat(result.totalItems()).isEqualTo(2);
    }

    @Test
    void listMine_capsPageSizeAndIgnoresClientSort() {
        when(currentUser.requireId()).thenReturn(7L);
        when(currentUser.token()).thenReturn(Optional.empty());
        when(repository.findActive(any(), any(), any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

        service.listMine(PageRequest.of(2, 5000, org.springframework.data.domain.Sort.by("jti")));

        verify(repository).findActive(7L, NOW, PageRequest.of(2, 100));
    }

    @Test
    void revokeMine_revokesTheTokenOfTheCallersOwnSession() {
        when(currentUser.requireId()).thenReturn(7L);
        when(repository.findByIdAndUserId(1L, 7L)).thenReturn(Optional.of(session(1L, "jti-1")));

        service.revokeMine(1L);

        verify(revocations).revoke("jti-1", NOW.plusSeconds(600));
    }

    @Test
    void revokeMine_someoneElsesOrUnknownSession_isNotFoundAndRevokesNothing() {
        when(currentUser.requireId()).thenReturn(7L);
        when(repository.findByIdAndUserId(99L, 7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.revokeMine(99L)).isInstanceOf(NotFoundException.class);

        verify(revocations, never()).revoke(any(), any());
    }

    private UserSession session(Long id, String jti) {
        UserSession s = new UserSession(7L, jti, "10.0.0.1", "Firefox", NOW.plusSeconds(600));
        ReflectionTestUtils.setField(s, "id", id);
        return s;
    }
}
