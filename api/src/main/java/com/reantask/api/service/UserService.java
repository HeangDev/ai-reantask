package com.reantask.api.service;

import org.springframework.data.domain.Pageable;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.ChangePasswordRequest;
import com.reantask.api.dto.request.ChangeUserStatusRequest;
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

    /** Idempotent: re-applying the current status is a no-op. Throws INVALID_STATUS_TRANSITION otherwise. */
    UserResponse changeStatus(Long id, ChangeUserStatusRequest request);

    UserResponse approve(Long id);

    UserResponse reject(Long id);

    /** Soft delete. */
    void delete(Long id);

    UserResponse getMe();

    UserResponse updateMe(UpdateProfileRequest request);

    /**
     * Changes the signed-in user's password. Access tokens already issued stay valid until they expire.
     *
     * @throws com.reantask.api.exception.BusinessRuleException INVALID_CURRENT_PASSWORD when the current password
     *         is wrong, PASSWORD_UNCHANGED when the new password equals it
     */
    void changeMyPassword(ChangePasswordRequest request);
}
