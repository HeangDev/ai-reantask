package com.reantask.api.service.impl;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.exception.ConflictException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.ForbiddenException;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.dto.response.GoogleAccountResponse;
import com.reantask.api.dto.response.UserCredentialsResponse;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.entity.Role;
import com.reantask.api.entity.User;
import com.reantask.api.enums.RoleName;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.mapper.UserMapper;
import com.reantask.api.repository.RoleRepository;
import com.reantask.api.repository.UserRepository;
import com.reantask.api.service.UserAccountService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAccountServiceImpl implements UserAccountService {

    private static final long NO_USER_ID = 0L;

    private static final int MAX_FULLNAME_LENGTH = 255;
    private static final int MAX_AVATAR_LENGTH = 255;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    @Override
    public Optional<UserCredentialsResponse> findCredentialsByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email.trim()).map(UserAccountServiceImpl::toCredentials);
    }

    @Override
    @Transactional
    public GoogleAccountResponse signInWithGoogle(String googleId, String email, String fullname, String avatar) {
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) {
            return existing(byGoogleId.get());
        }
        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(email);
        if (byEmail.isPresent()) {
            User user = byEmail.get();
            if (user.getGoogleId() != null) {
                // Same email but a different Google account: never re-link.
                throw new ConflictException(ErrorCode.EMAIL_TAKEN, "Email is already linked to another Google account");
            }
            boolean emailWasUnverified = user.getEmailVerifiedAt() == null;
            user.linkGoogleAccount(googleId, Instant.now(clock));
            if (emailWasUnverified) {
                user.setPassword(randomPasswordHash());
            }
            return existing(user);
        }
        // Not visible, but the email may still be reserved by a soft-deleted user.
        if (userRepository.emailTaken(email, NO_USER_ID)) {
            throw new ForbiddenException(ErrorCode.ACCOUNT_DELETED, "This account cannot sign in: ACCOUNT_DELETED");
        }
        return created(googleId, email, fullname, avatar);
    }

    private GoogleAccountResponse existing(User user) {
        return new GoogleAccountResponse(toCredentials(user), mapper.toResponse(user), false);
    }

    private GoogleAccountResponse created(String googleId, String email, String fullname, String avatar) {
        Role student = roleRepository.findByName(RoleName.STUDENT)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ROLE_NOT_FOUND, "Role not found"));
        User user = userRepository.save(User.builder()
                .role(student)
                .fullname(displayName(fullname, email))
                .email(email)
                .password(randomPasswordHash())
                .avatar(avatar != null && avatar.length() <= MAX_AVATAR_LENGTH ? avatar : null)
                .status(UserStatus.PENDING)
                .googleId(googleId)
                .emailVerifiedAt(Instant.now(clock))
                .build());
        return new GoogleAccountResponse(toCredentials(user), mapper.toResponse(user), true);
    }

    private static String displayName(String fullname, String email) {
        String name = fullname == null || fullname.isBlank() ? email.substring(0, email.indexOf('@')) : fullname.trim();
        return name.length() > MAX_FULLNAME_LENGTH ? name.substring(0, MAX_FULLNAME_LENGTH) : name;
    }

    // Google-only accounts have no usable password; the column is NOT NULL, so store a hash nobody knows.
    private String randomPasswordHash() {
        return passwordEncoder.encode(UUID.randomUUID().toString());
    }

    private static UserCredentialsResponse toCredentials(User u) {
        return new UserCredentialsResponse(u.getId(), u.getEmail(), u.getPassword(),
                u.getRole().getName(), u.getRole().getStatus(), u.getStatus());
    }

    @Override
    @Transactional
    public UserResponse registerStudent(String fullname, String email, String phone, String passwordHash) {
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.emailTaken(normalizedEmail, NO_USER_ID)) {
            throw new ConflictException(ErrorCode.EMAIL_TAKEN, "Email is already in use");
        }
        if (phone != null && userRepository.phoneTaken(phone.trim(), NO_USER_ID)) {
            throw new ConflictException(ErrorCode.PHONE_TAKEN, "Phone is already in use");
        }
        Role student = roleRepository.findByName(RoleName.STUDENT)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ROLE_NOT_FOUND, "Role not found"));

        User user = User.builder()
                .role(student)
                .fullname(fullname.trim())
                .email(normalizedEmail)
                .phone(phone == null || phone.isBlank() ? null : phone.trim())
                .password(passwordHash)
                .status(UserStatus.PENDING)
                .build();
        return mapper.toResponse(userRepository.save(user));
    }
}
