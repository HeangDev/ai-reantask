package com.reantask.api.mapper;

import org.springframework.stereotype.Component;

import com.reantask.api.dto.response.ClassSubjectResponse;
import com.reantask.api.entity.ClassSubject;

import lombok.RequiredArgsConstructor;

/** Pure entity -> DTO mapping. The class and subject must be loaded by the caller's transaction. */
@Component
@RequiredArgsConstructor
public class ClassSubjectMapper {

    private final ClassMapper classMapper;
    private final SubjectMapper subjectMapper;

    public ClassSubjectResponse toResponse(ClassSubject classSubject) {
        return new ClassSubjectResponse(classSubject.getId(),
                classMapper.toResponse(classSubject.getClassRoom()),
                subjectMapper.toResponse(classSubject.getSubject()),
                classSubject.getTeacher().getId(), classSubject.getStatus(),
                classSubject.getCreatedAt(), classSubject.getUpdatedAt());
    }
}
