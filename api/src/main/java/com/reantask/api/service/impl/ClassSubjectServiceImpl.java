package com.reantask.api.service.impl;

import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.AssignClassSubjectRequest;
import com.reantask.api.dto.response.ClassResponse;
import com.reantask.api.dto.response.ClassSubjectResponse;
import com.reantask.api.dto.response.SubjectResponse;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.entity.ClassRoom;
import com.reantask.api.entity.ClassSubject;
import com.reantask.api.entity.Subject;
import com.reantask.api.entity.User;
import com.reantask.api.enums.ClassStatus;
import com.reantask.api.enums.ClassSubjectStatus;
import com.reantask.api.enums.RoleName;
import com.reantask.api.enums.SubjectStatus;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.exception.BadRequestException;
import com.reantask.api.exception.BusinessRuleException;
import com.reantask.api.exception.ConflictException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.mapper.ClassSubjectMapper;
import com.reantask.api.repository.ClassSubjectRepository;
import com.reantask.api.security.CurrentUser;
import com.reantask.api.service.ClassService;
import com.reantask.api.service.ClassSubjectService;
import com.reantask.api.service.SubjectService;
import com.reantask.api.service.UserService;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClassSubjectServiceImpl implements ClassSubjectService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "status");

    private final ClassSubjectRepository classSubjectRepository;
    private final ClassService classService;
    private final SubjectService subjectService;
    private final UserService userService;
    private final ClassSubjectMapper mapper;
    private final CurrentUser currentUser;
    // Only used for getReference: the related rows were already validated through their own services.
    private final EntityManager entityManager;

    @Override
    @Transactional
    public ClassSubjectResponse assign(Long classId, AssignClassSubjectRequest request) {
        ClassResponse classRoom = classService.get(classId);
        if (classRoom.status() != ClassStatus.ACTIVE) {
            throw new BusinessRuleException(ErrorCode.CLASS_INACTIVE, "Class is not active");
        }
        SubjectResponse subject = subjectService.get(request.subjectId());
        if (subject.status() != SubjectStatus.ACTIVE) {
            throw new BusinessRuleException(ErrorCode.SUBJECT_INACTIVE, "Subject is not active");
        }
        assertActiveTeacher(userService.get(request.teacherId()));
        if (classSubjectRepository.existsByClassRoom_IdAndSubject_Id(classId, subject.id())) {
            throw new ConflictException(ErrorCode.ALREADY_IN_CLASS, "Subject is already assigned to this class");
        }

        ClassSubject classSubject = ClassSubject.builder()
                .classRoom(entityManager.getReference(ClassRoom.class, classId))
                .subject(entityManager.getReference(Subject.class, subject.id()))
                .teacher(entityManager.getReference(User.class, request.teacherId()))
                .status(ClassSubjectStatus.ACTIVE)
                .build();
        return mapper.toResponse(classSubjectRepository.saveAndFlush(classSubject));
    }

    @Override
    public PageResponse<ClassSubjectResponse> listMyTeaching(ClassSubjectStatus status, Pageable pageable) {
        Long teacherId = currentUser.requireId();
        return PageResponse.from(classSubjectRepository.findByTeacher(teacherId, status, sanitize(pageable))
                .map(mapper::toResponse));
    }

    private void assertActiveTeacher(UserResponse user) {
        if (!RoleName.TEACHER.dbValue().equals(user.roleName()) || user.status() != UserStatus.ACTIVE) {
            throw new BusinessRuleException(ErrorCode.TEACHER_INVALID, "User is not an active teacher");
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
