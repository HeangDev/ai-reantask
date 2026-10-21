package com.reantask.api.service;

import org.springframework.data.domain.Pageable;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.AssignClassSubjectRequest;
import com.reantask.api.dto.response.ClassSubjectResponse;
import com.reantask.api.enums.ClassSubjectStatus;

/**
 * Public API of the class-subject feature: which teacher teaches which subject in which class.
 * Admins assign; a teacher reads their own teaching list. Soft-deleted rows are never returned.
 */
public interface ClassSubjectService {

    /**
     * Assigns a teacher to teach a subject in a class. The new row is ACTIVE.
     *
     * @throws com.reantask.api.exception.NotFoundException CLASS_NOT_FOUND, SUBJECT_NOT_FOUND or USER_NOT_FOUND
     * @throws com.reantask.api.exception.BusinessRuleException CLASS_INACTIVE, SUBJECT_INACTIVE, or TEACHER_INVALID
     *         when the user is not an ACTIVE teacher
     * @throws com.reantask.api.exception.ConflictException ALREADY_IN_CLASS when the class already has the subject
     */
    ClassSubjectResponse assign(Long classId, AssignClassSubjectRequest request);

    /**
     * The classes (with subject) the signed-in teacher teaches. Rows whose class or subject was deleted are skipped.
     *
     * @param status optional filter; all non-deleted statuses when null
     */
    PageResponse<ClassSubjectResponse> listMyTeaching(ClassSubjectStatus status, Pageable pageable);
}
