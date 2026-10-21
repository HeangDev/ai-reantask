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
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.reantask.api.dto.response.GoogleAccountResponse;
import com.reantask.api.entity.Role;
import com.reantask.api.entity.User;
import com.reantask.api.enums.RoleName;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.exception.AppException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.mapper.UserMapper;
import com.reantask.api.repository.RoleRepository;
import com.reantask.api.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceImplTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock PasswordEncoder passwordEncoder;

    UserAccountServiceImpl service;
    Role student = new Role(RoleName.STUDENT);

    @BeforeEach
    void setUp() {
        service = new UserAccountServiceImpl(userRepository, roleRepository, new UserMapper(), passwordEncoder,
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private User existingUser(Instant emailVerifiedAt, UserStatus status) {
        return User.builder().role(student).fullname("Dara").email("dara@example.com").password("old-hash")
                .status(status).emailVerifiedAt(emailVerifiedAt).build();
    }

    @Test
    void signInWithGoogle_knownGoogleId_returnsExistingWithoutChanges() {
        User user = existingUser(NOW, UserStatus.ACTIVE);
        user.linkGoogleAccount("g-1", NOW);
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.of(user));

        GoogleAccountResponse result = service.signInWithGoogle("g-1", "dara@example.com", "Dara", null);

        assertThat(result.created()).isFalse();
        assertThat(result.credentials().status()).isEqualTo(UserStatus.ACTIVE);
        verify(userRepository, never()).save(any());
    }

    @Test
    void signInWithGoogle_unknownEmail_createsPendingStudentWithRandomPassword() {
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("dara@example.com")).thenReturn(Optional.empty());
        when(userRepository.emailTaken("dara@example.com", 0L)).thenReturn(false);
        when(roleRepository.findByName(RoleName.STUDENT)).thenReturn(Optional.of(student));
        when(passwordEncoder.encode(any())).thenReturn("random-hash");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        GoogleAccountResponse result = service.signInWithGoogle("g-1", "dara@example.com", "Dara", "http://pic");

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(result.created()).isTrue();
        assertThat(saved.getValue().getStatus()).isEqualTo(UserStatus.PENDING);
        assertThat(saved.getValue().getRole().getName()).isEqualTo(RoleName.STUDENT);
        assertThat(saved.getValue().getGoogleId()).isEqualTo("g-1");
        assertThat(saved.getValue().getPassword()).isEqualTo("random-hash");
        assertThat(saved.getValue().getPhone()).isNull();
        assertThat(saved.getValue().getEmailVerifiedAt()).isEqualTo(NOW);
    }

    @Test
    void signInWithGoogle_noName_usesEmailLocalPart() {
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("dara@example.com")).thenReturn(Optional.empty());
        when(userRepository.emailTaken("dara@example.com", 0L)).thenReturn(false);
        when(roleRepository.findByName(RoleName.STUDENT)).thenReturn(Optional.of(student));
        when(passwordEncoder.encode(any())).thenReturn("random-hash");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        service.signInWithGoogle("g-1", "dara@example.com", null, null);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getFullname()).isEqualTo("dara");
    }

    @Test
    void signInWithGoogle_existingVerifiedEmail_linksAndKeepsPassword() {
        User user = existingUser(NOW.minusSeconds(60), UserStatus.ACTIVE);
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("dara@example.com")).thenReturn(Optional.of(user));

        GoogleAccountResponse result = service.signInWithGoogle("g-1", "dara@example.com", "Dara", null);

        assertThat(result.created()).isFalse();
        assertThat(user.getGoogleId()).isEqualTo("g-1");
        assertThat(user.getPassword()).isEqualTo("old-hash");
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void signInWithGoogle_existingUnverifiedEmail_linksAndReplacesPassword() {
        User user = existingUser(null, UserStatus.PENDING);
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("dara@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(any())).thenReturn("random-hash");

        service.signInWithGoogle("g-1", "dara@example.com", "Dara", null);

        assertThat(user.getGoogleId()).isEqualTo("g-1");
        assertThat(user.getEmailVerifiedAt()).isEqualTo(NOW);
        assertThat(user.getPassword()).isEqualTo("random-hash");
    }

    @Test
    void signInWithGoogle_emailLinkedToAnotherGoogleAccount_isConflict() {
        User user = existingUser(NOW, UserStatus.ACTIVE);
        user.linkGoogleAccount("other-google-id", NOW);
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("dara@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.signInWithGoogle("g-1", "dara@example.com", "Dara", null))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.EMAIL_TAKEN));
        assertThat(user.getGoogleId()).isEqualTo("other-google-id");
    }

    @Test
    void signInWithGoogle_emailReservedBySoftDeletedUser_isForbidden() {
        when(userRepository.findByGoogleId("g-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("dara@example.com")).thenReturn(Optional.empty());
        when(userRepository.emailTaken("dara@example.com", 0L)).thenReturn(true);

        assertThatThrownBy(() -> service.signInWithGoogle("g-1", "dara@example.com", "Dara", null))
                .isInstanceOfSatisfying(AppException.class, e -> {
                    assertThat(e.getCode()).isEqualTo(ErrorCode.ACCOUNT_DELETED);
                    assertThat(e.getStatus().value()).isEqualTo(403);
                });
        verify(userRepository, never()).save(any());
    }
}
