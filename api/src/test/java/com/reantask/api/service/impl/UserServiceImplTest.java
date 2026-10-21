package com.reantask.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.reantask.api.exception.AppException;
import com.reantask.api.exception.BadRequestException;
import com.reantask.api.service.AvatarStorageService;
import com.reantask.api.service.UserSessionService;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.security.CurrentUser;
import com.reantask.api.dto.request.ChangePasswordRequest;
import com.reantask.api.dto.request.CreateUserRequest;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.entity.Role;
import com.reantask.api.entity.User;
import com.reantask.api.enums.RoleName;
import com.reantask.api.enums.RoleStatus;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.mapper.UserMapper;
import com.reantask.api.repository.RoleRepository;
import com.reantask.api.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock CurrentUser currentUser;
    @Mock AvatarStorageService avatarStorage;
    @Mock UserSessionService sessionService;

    UserServiceImpl service;
    Role adminRole;
    Role teacherRole;
    Role studentRole;

    @BeforeEach
    void setUp() {
        service = new UserServiceImpl(userRepository, roleRepository, new UserMapper(), passwordEncoder,
                currentUser, Clock.fixed(NOW, ZoneOffset.UTC), avatarStorage, sessionService);
        adminRole = role(1L, RoleName.ADMIN);
        teacherRole = role(2L, RoleName.TEACHER);
        studentRole = role(3L, RoleName.STUDENT);
    }

    // ---- create ----

    @Test
    void create_savesActiveUserWithHashedPasswordAndLowercaseEmail() {
        when(userRepository.emailTaken(anyString(), anyLong())).thenReturn(false);
        when(userRepository.phoneTaken(anyString(), anyLong())).thenReturn(false);
        when(roleRepository.findById(3L)).thenReturn(Optional.of(studentRole));
        when(passwordEncoder.encode("Secret123")).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = service.create(
                new CreateUserRequest(3L, " Dara ", "Dara@Example.COM", "012345678", "Secret123", null));

        assertThat(response.email()).isEqualTo("dara@example.com");
        assertThat(response.fullname()).isEqualTo("Dara");
        assertThat(response.status()).isEqualTo(UserStatus.ACTIVE);
        assertThat(response.roleName()).isEqualTo("student");
        verify(passwordEncoder).encode("Secret123");
    }

    @Test
    void create_emailTaken_throwsConflict() {
        when(userRepository.emailTaken(anyString(), anyLong())).thenReturn(true);

        assertThatThrownBy(() -> service.create(
                new CreateUserRequest(3L, "Dara", "dara@example.com", "012345678", "Secret123", null)))
                .isInstanceOfSatisfying(AppException.class, e -> assertThat(e.getCode()).isEqualTo(ErrorCode.EMAIL_TAKEN));
        verify(userRepository, never()).save(any());
    }

    @Test
    void create_inactiveRole_isRejected() {
        studentRole.setStatus(RoleStatus.INACTIVE);
        when(userRepository.emailTaken(anyString(), anyLong())).thenReturn(false);
        when(userRepository.phoneTaken(anyString(), anyLong())).thenReturn(false);
        when(roleRepository.findById(3L)).thenReturn(Optional.of(studentRole));

        assertThatThrownBy(() -> service.create(
                new CreateUserRequest(3L, "Dara", "dara@example.com", "012345678", "Secret123", null)))
                .isInstanceOfSatisfying(AppException.class, e -> assertThat(e.getCode()).isEqualTo(ErrorCode.ROLE_INACTIVE));
    }

    // ---- get / not found ----

    @Test
    void get_missing_throwsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(99L))
                .isInstanceOfSatisfying(AppException.class, e -> assertThat(e.getCode()).isEqualTo(ErrorCode.USER_NOT_FOUND));
    }

    @Test
    void get_teacherCannotSeeNonPendingUser() {
        User active = user(10L, studentRole, UserStatus.ACTIVE);
        when(userRepository.findById(10L)).thenReturn(Optional.of(active));
        when(currentUser.hasRole("ADMIN")).thenReturn(false);

        assertThatThrownBy(() -> service.get(10L))
                .isInstanceOfSatisfying(AppException.class, e -> assertThat(e.getCode()).isEqualTo(ErrorCode.USER_NOT_FOUND));
    }

    // ---- approve / reject ----

    @Test
    void approve_pendingStudentByTeacher_becomesActive() {
        User pending = user(10L, studentRole, UserStatus.PENDING);
        when(userRepository.findById(10L)).thenReturn(Optional.of(pending));
        when(currentUser.hasRole("ADMIN")).thenReturn(false);

        UserResponse response = service.approve(10L);

        assertThat(response.status()).isEqualTo(UserStatus.ACTIVE);
        assertThat(pending.getDeletedAt()).isNull();
    }

    @Test
    void approve_nonPendingByAdmin_throwsInvalidTransition() {
        User active = user(10L, studentRole, UserStatus.ACTIVE);
        when(userRepository.findById(10L)).thenReturn(Optional.of(active));
        when(currentUser.hasRole("ADMIN")).thenReturn(true);

        assertThatThrownBy(() -> service.approve(10L))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.INVALID_STATUS_TRANSITION));
    }

    @Test
    void reject_pendingStudent_softDeletesWithActorAndTime() {
        User pending = user(10L, studentRole, UserStatus.PENDING);
        when(userRepository.findById(10L)).thenReturn(Optional.of(pending));
        when(currentUser.hasRole("ADMIN")).thenReturn(false);
        when(currentUser.id()).thenReturn(Optional.of(2L));

        UserResponse response = service.reject(10L);

        assertThat(response.status()).isEqualTo(UserStatus.DELETED);
        assertThat(pending.getDeletedAt()).isEqualTo(NOW);
        assertThat(pending.getDeletedByUser()).isEqualTo(2L);
    }

    @Test
    void reject_teacherCannotRejectPendingTeacher() {
        User pendingTeacher = user(11L, teacherRole, UserStatus.PENDING);
        when(userRepository.findById(11L)).thenReturn(Optional.of(pendingTeacher));
        when(currentUser.hasRole("ADMIN")).thenReturn(false);

        assertThatThrownBy(() -> service.reject(11L))
                .isInstanceOfSatisfying(AppException.class, e -> assertThat(e.getCode()).isEqualTo(ErrorCode.USER_NOT_FOUND));
        assertThat(pendingTeacher.getStatus()).isEqualTo(UserStatus.PENDING);
    }

    // ---- delete ----

    @Test
    void delete_softDeletesUser() {
        User active = user(10L, studentRole, UserStatus.ACTIVE);
        when(userRepository.findById(10L)).thenReturn(Optional.of(active));
        when(currentUser.id()).thenReturn(Optional.of(1L));

        service.delete(10L);

        assertThat(active.getStatus()).isEqualTo(UserStatus.DELETED);
        assertThat(active.getDeletedAt()).isEqualTo(NOW);
        assertThat(active.getDeletedByUser()).isEqualTo(1L);
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void delete_alreadyGone_isNoOp() {
        when(userRepository.findById(10L)).thenReturn(Optional.empty());

        service.delete(10L);

        verify(userRepository, never()).delete(any(User.class));
    }

    // ---- list ----

    @Test
    void list_unknownSortField_throwsInvalidSortField() {
        when(currentUser.hasRole("ADMIN")).thenReturn(true);

        assertThatThrownBy(() -> service.list(null, null, null,
                PageRequest.of(0, 20, Sort.by("password"))))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.INVALID_SORT_FIELD));
    }

    // ---- deactivate my account ----

    @Test
    void deactivateMe_activeUser_becomesInactiveAndIsSignedOutEverywhere() {
        User me = user(5L, studentRole, UserStatus.ACTIVE);
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));

        service.deactivateMe();

        assertThat(me.getStatus()).isEqualTo(UserStatus.INACTIVE);
        verify(sessionService).revokeAllMine();
        assertThat(me.getDeletedAt()).isNull();
    }

    @Test
    void deactivateMe_alreadyInactive_isNoOp() {
        User me = user(5L, studentRole, UserStatus.INACTIVE);
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));

        service.deactivateMe();

        assertThat(me.getStatus()).isEqualTo(UserStatus.INACTIVE);
        verify(sessionService, never()).revokeAllMine();
    }

    @Test
    void deactivateMe_suspendedUser_isRejectedAndStaysSuspended() {
        User me = user(5L, studentRole, UserStatus.SUSPENDED);
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));

        assertThatThrownBy(() -> service.deactivateMe())
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.INVALID_STATUS_TRANSITION));
        assertThat(me.getStatus()).isEqualTo(UserStatus.SUSPENDED);
        verify(sessionService, never()).revokeAllMine();
    }

    @Test
    void deactivateMe_lastActiveAdmin_isRejected() {
        User me = user(5L, adminRole, UserStatus.ACTIVE);
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));
        when(userRepository.countByRole_NameAndStatus(RoleName.ADMIN, UserStatus.ACTIVE)).thenReturn(1L);

        assertThatThrownBy(() -> service.deactivateMe())
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.LAST_ADMIN));
        assertThat(me.getStatus()).isEqualTo(UserStatus.ACTIVE);
        verify(sessionService, never()).revokeAllMine();
    }

    @Test
    void deactivateMe_adminWithAnotherActiveAdmin_isAllowed() {
        User me = user(5L, adminRole, UserStatus.ACTIVE);
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));
        when(userRepository.countByRole_NameAndStatus(RoleName.ADMIN, UserStatus.ACTIVE)).thenReturn(2L);

        service.deactivateMe();

        assertThat(me.getStatus()).isEqualTo(UserStatus.INACTIVE);
    }

    // ---- my avatar ----

    @Test
    void updateMyAvatar_storesImageSavesUrlAndDeletesPreviousFile() {
        User me = user(5L, studentRole, UserStatus.ACTIVE);
        me.setAvatar("/api/v1/avatars/old.png");
        byte[] image = {1, 2, 3};
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));
        when(avatarStorage.store(image)).thenReturn("/api/v1/avatars/new.png");

        UserResponse response = service.updateMyAvatar(image);

        assertThat(response.avatar()).isEqualTo("/api/v1/avatars/new.png");
        assertThat(me.getAvatar()).isEqualTo("/api/v1/avatars/new.png");
        verify(avatarStorage).delete("/api/v1/avatars/old.png");
    }

    @Test
    void updateMyAvatar_invalidImage_keepsCurrentAvatarAndDeletesNothing() {
        User me = user(5L, studentRole, UserStatus.ACTIVE);
        me.setAvatar("/api/v1/avatars/old.png");
        byte[] bad = {9};
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));
        when(avatarStorage.store(bad))
                .thenThrow(new BadRequestException(ErrorCode.INVALID_AVATAR, "not an image"));

        assertThatThrownBy(() -> service.updateMyAvatar(bad))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.INVALID_AVATAR));
        assertThat(me.getAvatar()).isEqualTo("/api/v1/avatars/old.png");
        verify(avatarStorage, never()).delete(any());
    }

    @Test
    void removeMyAvatar_clearsAvatarAndDeletesFile() {
        User me = user(5L, studentRole, UserStatus.ACTIVE);
        me.setAvatar("/api/v1/avatars/old.png");
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));

        service.removeMyAvatar();

        assertThat(me.getAvatar()).isNull();
        verify(avatarStorage).delete("/api/v1/avatars/old.png");
    }

    // ---- change my password ----

    @Test
    void changeMyPassword_correctCurrent_storesNewHash() {
        User me = user(5L, studentRole, UserStatus.ACTIVE);
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));
        when(passwordEncoder.matches("Old12345", "hash")).thenReturn(true);
        when(passwordEncoder.encode("New12345")).thenReturn("new-hash");

        service.changeMyPassword(new ChangePasswordRequest("Old12345", "New12345"));

        assertThat(me.getPassword()).isEqualTo("new-hash");
    }

    @Test
    void changeMyPassword_wrongCurrent_isRejectedAndKeepsHash() {
        User me = user(5L, studentRole, UserStatus.ACTIVE);
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.changeMyPassword(new ChangePasswordRequest("wrong", "New12345")))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.INVALID_CURRENT_PASSWORD));
        assertThat(me.getPassword()).isEqualTo("hash");
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void changeMyPassword_sameAsCurrent_isRejected() {
        User me = user(5L, studentRole, UserStatus.ACTIVE);
        when(currentUser.requireId()).thenReturn(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(me));
        when(passwordEncoder.matches("Same1234", "hash")).thenReturn(true);

        assertThatThrownBy(() -> service.changeMyPassword(new ChangePasswordRequest("Same1234", "Same1234")))
                .isInstanceOfSatisfying(AppException.class,
                        e -> assertThat(e.getCode()).isEqualTo(ErrorCode.PASSWORD_UNCHANGED));
        assertThat(me.getPassword()).isEqualTo("hash");
    }

    private Role role(Long id, RoleName name) {
        Role role = new Role(name);
        ReflectionTestUtils.setField(role, "id", id);
        return role;
    }

    private User user(Long id, Role role, UserStatus status) {
        User user = User.builder().role(role).fullname("Test").email("t" + id + "@example.com")
                .password("hash").status(status).build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
