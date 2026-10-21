package com.reantask.api.mapper;

import org.springframework.stereotype.Component;

import com.reantask.api.dto.request.CreateSubjectRequest;
import com.reantask.api.dto.request.UpdateSubjectRequest;
import com.reantask.api.dto.response.SubjectResponse;
import com.reantask.api.entity.Subject;
import com.reantask.api.enums.SubjectStatus;

/** Pure entity <-> DTO mapping. */
@Component
public class SubjectMapper {

    public Subject toEntity(CreateSubjectRequest request) {
        return Subject.builder()
                .name(request.name().trim())
                .description(blankToNull(request.description()))
                .status(SubjectStatus.ACTIVE)
                .build();
    }

    public void update(Subject subject, UpdateSubjectRequest request) {
        subject.setName(request.name().trim());
        subject.setDescription(blankToNull(request.description()));
    }

    public SubjectResponse toResponse(Subject subject) {
        return new SubjectResponse(subject.getId(), subject.getName(), subject.getDescription(),
                subject.getStatus(), subject.getCreatedAt(), subject.getUpdatedAt());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
