package com.reantask.api.service.impl;

import java.time.Clock;
import java.time.Instant;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.CreateSubjectRequest;
import com.reantask.api.dto.request.UpdateSubjectRequest;
import com.reantask.api.dto.response.SubjectResponse;
import com.reantask.api.entity.Subject;
import com.reantask.api.enums.SubjectStatus;
import com.reantask.api.exception.BadRequestException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.mapper.SubjectMapper;
import com.reantask.api.repository.SubjectRepository;
import com.reantask.api.repository.SubjectSpecifications;
import com.reantask.api.security.CurrentUser;
import com.reantask.api.service.SubjectService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubjectServiceImpl implements SubjectService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "name", "status");

    private final SubjectRepository subjectRepository;
    private final SubjectMapper mapper;
    private final CurrentUser currentUser;
    private final Clock clock;

    @Override
    public PageResponse<SubjectResponse> list(SubjectStatus status, String q, Pageable pageable) {
        Specification<Subject> spec = SubjectSpecifications.hasStatus(status)
                .and(SubjectSpecifications.matches(q));
        return PageResponse.from(subjectRepository.findAll(spec, sanitize(pageable)).map(mapper::toResponse));
    }

    @Override
    public SubjectResponse get(Long id) {
        return mapper.toResponse(findOrThrow(id));
    }

    @Override
    @Transactional
    public SubjectResponse create(CreateSubjectRequest request) {
        return mapper.toResponse(subjectRepository.save(mapper.toEntity(request)));
    }

    @Override
    @Transactional
    public SubjectResponse update(Long id, UpdateSubjectRequest request) {
        Subject subject = findOrThrow(id);
        mapper.update(subject, request);
        return mapper.toResponse(subject);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        // findById hides soft-deleted rows, so a repeated DELETE would 404; treat that as already done.
        subjectRepository.findById(id).ifPresent(subject -> {
            subject.setDeletedAt(Instant.now(clock));
            subject.setDeletedByUser(currentUser.id().orElse(null));
        });
    }

    private Subject findOrThrow(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.SUBJECT_NOT_FOUND, "Subject not found"));
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
