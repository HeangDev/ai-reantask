package com.reantask.api.service.impl;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.ChangeClassStatusRequest;
import com.reantask.api.dto.request.CreateClassRequest;
import com.reantask.api.dto.request.UpdateClassRequest;
import com.reantask.api.dto.response.ClassResponse;
import com.reantask.api.entity.ClassRoom;
import com.reantask.api.enums.ClassStatus;
import com.reantask.api.exception.AppException;
import com.reantask.api.exception.BadRequestException;
import com.reantask.api.exception.BusinessRuleException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.mapper.ClassMapper;
import com.reantask.api.repository.ClassRoomRepository;
import com.reantask.api.repository.ClassRoomSpecifications;
import com.reantask.api.security.CurrentUser;
import com.reantask.api.service.ClassService;
import com.reantask.api.util.ClassCodeGenerator;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClassServiceImpl implements ClassService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int MAX_CODE_ATTEMPTS = 10;
    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "name", "status", "startAt", "endDate");

    private final ClassRoomRepository classRepository;
    private final ClassMapper mapper;
    private final ClassCodeGenerator codeGenerator;
    private final CurrentUser currentUser;
    private final Clock clock;

    @Override
    public PageResponse<ClassResponse> list(ClassStatus status, String q, Pageable pageable) {
        Specification<ClassRoom> spec = ClassRoomSpecifications.hasStatus(status)
                .and(ClassRoomSpecifications.matches(q));
        return PageResponse.from(classRepository.findAll(spec, sanitize(pageable)).map(mapper::toResponse));
    }

    @Override
    public ClassResponse get(Long id) {
        return mapper.toResponse(findOrThrow(id));
    }

    @Override
    @Transactional
    public ClassResponse create(CreateClassRequest request) {
        assertDateRange(request.startAt(), request.endDate());
        ClassRoom classRoom = mapper.toEntity(request, nextFreeCode());
        return mapper.toResponse(classRepository.save(classRoom));
    }

    @Override
    @Transactional
    public ClassResponse update(Long id, UpdateClassRequest request) {
        ClassRoom classRoom = findOrThrow(id);
        assertDateRange(request.startAt(), request.endDate());
        mapper.update(classRoom, request);
        return mapper.toResponse(classRoom);
    }

    @Override
    @Transactional
    public ClassResponse changeStatus(Long id, ChangeClassStatusRequest request) {
        ClassRoom classRoom = findOrThrow(id);
        classRoom.setStatus(request.status());
        return mapper.toResponse(classRoom);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        // findById hides soft-deleted rows, so a repeated DELETE would 404; treat that as already done.
        classRepository.findById(id).ifPresent(classRoom -> {
            classRoom.setDeletedAt(Instant.now(clock));
            classRoom.setDeletedByUser(currentUser.id().orElse(null));
        });
    }

    private ClassRoom findOrThrow(Long id) {
        return classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CLASS_NOT_FOUND, "Class not found"));
    }

    private void assertDateRange(LocalDate startAt, LocalDate endDate) {
        if (endDate.isBefore(startAt)) {
            throw new BusinessRuleException(ErrorCode.INVALID_DATE_RANGE,
                    "End date must be on or after the start date");
        }
    }

    /** Retries on collision; the DB unique key (which includes soft-deleted rows) is the final guard. */
    private String nextFreeCode() {
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
            String code = codeGenerator.generate();
            if (!classRepository.codeExists(code)) {
                return code;
            }
        }
        throw new AppException(ErrorCode.CLASS_CODE_GENERATION_FAILED, "Could not generate a unique class code",
                HttpStatus.INTERNAL_SERVER_ERROR);
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
