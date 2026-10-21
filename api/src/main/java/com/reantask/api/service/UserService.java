package com.reantask.api.service;

import org.springframework.data.domain.Pageable;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.ChangePasswordRequest;
import com.reantask.api.dto.request.CreateUserRequest;
import com.reantask.api.dto.request.UpdateProfileRequest;
import com.reantask.api.dto.request.UpdateUserRequest;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.enums.UserStatus;

/**
 * Public API of the user feature. Admins manage everyone; teachers may only see and approve/reject
 * PENDING students (anything else is reported as not found).
 */
public interface UserService {

    /** Teachers are restricted to PENDING students regardless of the filters passed. */
    PageResponse<UserResponse> list(UserStatus status, Long roleId, String q, Pageable pageable);

    UserResponse get(Long id);

    UserResponse create(CreateUserRequest request);

    UserResponse update(Long id, UpdateUserRequest request);

    UserResponse approve(Long id);

    UserResponse reject(Long id);

    /** Soft delete. */
    void delete(Long id);

    UserResponse getMe();

    UserResponse updateMe(UpdateProfileRequest request);

    /**
     * Temporarily deactivates the signed-in user's own account: status becomes INACTIVE and every active session
     * is signed out. Data is kept and the user cannot log in until an admin reactivates the account. Idempotent.
     *
     * @throws com.reantask.api.exception.ConflictException INVALID_STATUS_TRANSITION when the account is not ACTIVE
     *         (e.g. SUSPENDED), LAST_ADMIN when this is the last active admin
     */
    void deactivateMe();

    /**
     * Replaces the signed-in user's profile image. The previous image file is removed once the change commits.
     *
     * @param content raw bytes of a JPEG, PNG or WebP image
     * @throws com.reantask.api.exception.BadRequestException INVALID_AVATAR when empty or not a supported image
     * @throws com.reantask.api.exception.AppException AVATAR_TOO_LARGE when over the size limit
     */
    UserResponse updateMyAvatar(byte[] content);

    /** Clears the signed-in user's profile image. Idempotent. */
    void removeMyAvatar();

    /**
     * Changes the signed-in user's password. Access tokens already issued stay valid until they expire.
     *
     * @throws com.reantask.api.exception.BusinessRuleException INVALID_CURRENT_PASSWORD when the current password
     *         is wrong, PASSWORD_UNCHANGED when the new password equals it
     */
    void changeMyPassword(ChangePasswordRequest request);
}
