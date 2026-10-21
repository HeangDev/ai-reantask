package com.reantask.api.service;

import org.springframework.data.domain.Pageable;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.CreateSubjectRequest;
import com.reantask.api.dto.request.UpdateSubjectRequest;
import com.reantask.api.dto.response.SubjectResponse;
import com.reantask.api.enums.SubjectStatus;

/**
 * Public API of the subject feature. Admins manage subjects; teachers may read them.
 * Soft-deleted subjects are never returned.
 */
public interface SubjectService {

    PageResponse<SubjectResponse> list(SubjectStatus status, String q, Pageable pageable);

    /** @throws com.reantask.api.exception.NotFoundException SUBJECT_NOT_FOUND */
    SubjectResponse get(Long id);

    /** New subjects start as ACTIVE. */
    SubjectResponse create(CreateSubjectRequest request);

    /** @throws com.reantask.api.exception.NotFoundException SUBJECT_NOT_FOUND */
    SubjectResponse update(Long id, UpdateSubjectRequest request);

    /** Soft delete. Idempotent: deleting an already deleted subject is a no-op. */
    void delete(Long id);
}
