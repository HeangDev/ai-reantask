package com.reantask.api.service;

import org.springframework.data.domain.Pageable;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.ChangeClassStatusRequest;
import com.reantask.api.dto.request.CreateClassRequest;
import com.reantask.api.dto.request.UpdateClassRequest;
import com.reantask.api.dto.response.ClassResponse;
import com.reantask.api.enums.ClassStatus;

/**
 * Public API of the class feature. Admins manage classes; teachers may read them.
 * Soft-deleted classes are never returned.
 */
public interface ClassService {

    /** {@code q} matches the class name or code. */
    PageResponse<ClassResponse> list(ClassStatus status, String q, Pageable pageable);

    /** @throws com.reantask.api.exception.NotFoundException CLASS_NOT_FOUND */
    ClassResponse get(Long id);

    /**
     * Creates an ACTIVE class with a freshly generated unique 6-character code.
     *
     * @throws com.reantask.api.exception.BusinessRuleException INVALID_DATE_RANGE when endDate is before startAt
     * @throws com.reantask.api.exception.AppException CLASS_CODE_GENERATION_FAILED when no free code was found
     */
    ClassResponse create(CreateClassRequest request);

    /**
     * The code never changes.
     *
     * @throws com.reantask.api.exception.NotFoundException CLASS_NOT_FOUND
     * @throws com.reantask.api.exception.BusinessRuleException INVALID_DATE_RANGE when endDate is before startAt
     */
    ClassResponse update(Long id, UpdateClassRequest request);

    /**
     * Idempotent: re-applying the current status is a no-op. An INACTIVE class accepts no new assignments or
     * enrollments; its data is kept.
     *
     * @throws com.reantask.api.exception.NotFoundException CLASS_NOT_FOUND
     */
    ClassResponse changeStatus(Long id, ChangeClassStatusRequest request);

    /** Soft delete. Idempotent: deleting an already deleted class is a no-op. */
    void delete(Long id);
}
