package com.reantask.api.service.impl;

import java.time.Clock;
import java.time.Instant;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.exception.BadRequestException;
import com.reantask.api.exception.BusinessRuleException;
import com.reantask.api.exception.ConflictException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.security.CurrentUser;
import com.reantask.api.dto.request.ChangePasswordRequest;
import com.reantask.api.dto.request.ChangeUserStatusRequest;
import com.reantask.api.dto.request.CreateUserRequest;
import com.reantask.api.dto.request.UpdateProfileRequest;
import com.reantask.api.dto.request.UpdateUserRequest;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.entity.Role;
import com.reantask.api.entity.User;
import com.reantask.api.enums.RoleName;
import com.reantask.api.enums.RoleStatus;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.mapper.UserMapper;
import com.reantask.api.repository.RoleRepository;
import com.reantask.api.repository.UserRepository;
import com.reantask.api.repository.UserSpecifications;
import com.reantask.api.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "fullname", "email", "status");
    private static final long NO_USER_ID = 0L;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUser currentUser;
    private final Clock clock;

    @Override
    public PageResponse<UserResponse> list(UserStatus status, Long roleId, String q, Pageable pageable) {
        UserStatus effectiveStatus = status;
        Long effectiveRoleId = roleId;
        if (!isAdmin()) {
            // Teachers only review PENDING students.
            effectiveStatus = UserStatus.PENDING;
            effectiveRoleId = roleRepository.findByName(RoleName.STUDENT).map(Role::getId).orElse(NO_USER_ID);
        }
        Specification<User> spec = UserSpecifications.fetchRole()
                .and(UserSpecifications.hasStatus(effectiveStatus))
                .and(UserSpecifications.hasRoleId(effectiveRoleId))
                .and(UserSpecifications.matches(q));
        return PageResponse.from(userRepository.findAll(spec, sanitize(pageable)).map(mapper::toResponse));
    }

    @Override
    public UserResponse get(Long id) {
        User user = findOrThrow(id);
        assertCanReview(user);
        return mapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String email = request.email().trim().toLowerCase();
        assertEmailFree(email, NO_USER_ID);
        assertPhoneFree(request.phone(), NO_USER_ID);
        Role role = findAssignableRole(request.roleId());

        User user = mapper.toEntity(request, role, passwordEncoder.encode(request.password()));
        return mapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = findOrThrow(id);
        assertPhoneFree(request.phone(), id);

        Role role = user.getRole();
        if (!role.getId().equals(request.roleId())) {
            role = findAssignableRole(request.roleId());
            assertNotLastActiveAdmin(user);
        }
        mapper.update(user, request, role);
        return mapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse changeStatus(Long id, ChangeUserStatusRequest request) {
        User user = findOrThrow(id);
        UserStatus target = request.status();
        if (user.getStatus() == target) {
            return mapper.toResponse(user);
        }
        assertNotSelf(user);
        assertTransition(user, target);
        if (target != UserStatus.ACTIVE) {
            assertNotLastActiveAdmin(user);
        }
        applyStatus(user, target);
        return mapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse approve(Long id) {
        User user = findOrThrow(id);
        assertCanReview(user);
        assertPending(user);
        applyStatus(user, UserStatus.ACTIVE);
        return mapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse reject(Long id) {
        User user = findOrThrow(id);
        assertCanReview(user);
        assertPending(user);
        applyStatus(user, UserStatus.DELETED);
        return mapper.toResponse(user);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        // findById hides soft-deleted rows, so a repeated DELETE would 404; treat that as already done.
        userRepository.findById(id).ifPresent(user -> {
            assertNotSelf(user);
            assertNotLastActiveAdmin(user);
            applyStatus(user, UserStatus.DELETED);
        });
    }

    @Override
    public UserResponse getMe() {
        return mapper.toResponse(findOrThrow(currentUser.requireId()));
    }

    @Override
    @Transactional
    public UserResponse updateMe(UpdateProfileRequest request) {
        User user = findOrThrow(currentUser.requireId());
        assertPhoneFree(request.phone(), user.getId());
        mapper.update(user, request);
        return mapper.toResponse(user);
    }

    @Override
    @Transactional
    public void changeMyPassword(ChangePasswordRequest request) {
        User user = findOrThrow(currentUser.requireId());
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BusinessRuleException(ErrorCode.INVALID_CURRENT_PASSWORD, "Current password is incorrect");
        }
        if (request.currentPassword().equals(request.newPassword())) {
            throw new BusinessRuleException(ErrorCode.PASSWORD_UNCHANGED,
                    "New password must be different from the current password");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));
    }

    private Role findAssignableRole(Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ROLE_NOT_FOUND, "Role not found"));
        if (role.getStatus() == RoleStatus.INACTIVE) {
            throw new BusinessRuleException(ErrorCode.ROLE_INACTIVE, "Role is inactive and cannot be assigned");
        }
        return role;
    }

    private void applyStatus(User user, UserStatus target) {
        user.setStatus(target);
        if (target == UserStatus.DELETED) {
            user.setDeletedAt(Instant.now(clock));
            user.setDeletedByUser(currentUser.id().orElse(null));
        }
    }

    private boolean isAdmin() {
        return currentUser.hasRole("ADMIN");
    }

    /** Teachers may only touch PENDING students; everything else looks like it does not exist. */
    private void assertCanReview(User user) {
        if (isAdmin()) {
            return;
        }
        boolean pendingStudent = user.getRole().getName() == RoleName.STUDENT
                && user.getStatus() == UserStatus.PENDING;
        if (!pendingStudent) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "User not found");
        }
    }

    private void assertPending(User user) {
        if (user.getStatus() != UserStatus.PENDING) {
            throw new ConflictException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Only PENDING users can be approved or rejected");
        }
    }

    private void assertTransition(User user, UserStatus target) {
        if (!user.getStatus().canTransitionTo(target)) {
            throw new ConflictException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Cannot change status from " + user.getStatus() + " to " + target);
        }
    }

    private void assertNotSelf(User user) {
        if (currentUser.id().filter(me -> me.equals(user.getId())).isPresent()) {
            throw new BusinessRuleException(ErrorCode.CANNOT_MODIFY_SELF, "You cannot change your own status");
        }
    }

    private void assertNotLastActiveAdmin(User user) {
        boolean activeAdmin = user.getRole().getName() == RoleName.ADMIN && user.getStatus() == UserStatus.ACTIVE;
        if (activeAdmin && userRepository.countByRole_NameAndStatus(RoleName.ADMIN, UserStatus.ACTIVE) <= 1) {
            throw new ConflictException(ErrorCode.LAST_ADMIN, "The last active admin cannot be removed or demoted");
        }
    }

    private void assertEmailFree(String email, Long excludeId) {
        if (userRepository.emailTaken(email, excludeId)) {
            throw new ConflictException(ErrorCode.EMAIL_TAKEN, "Email is already in use");
        }
    }

    private void assertPhoneFree(String phone, Long excludeId) {
        if (phone != null && !phone.isBlank() && userRepository.phoneTaken(phone.trim(), excludeId)) {
            throw new ConflictException(ErrorCode.PHONE_TAKEN, "Phone is already in use");
        }
    }

    private Pageable sanitize(Pageable pageable) {
        Sort sort = pageable.getSort();
        if (sort.isUnsorted()) {
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        }
        sort.forEach(order -> {
            if (!SORTABLE_FIELDS.contains(order.getProperty())) {
                throw new BadRequestException(ErrorCode.INVALID_SORT_FIELD,
                        "Cannot sort by '" + order.getProperty() + "'");
            }
        });
        return PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), MAX_PAGE_SIZE), sort);
    }
}
