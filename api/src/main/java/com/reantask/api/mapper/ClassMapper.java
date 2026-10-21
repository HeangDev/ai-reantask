package com.reantask.api.mapper;

import org.springframework.stereotype.Component;

import com.reantask.api.dto.request.CreateClassRequest;
import com.reantask.api.dto.request.UpdateClassRequest;
import com.reantask.api.dto.response.ClassResponse;
import com.reantask.api.entity.ClassRoom;
import com.reantask.api.enums.ClassStatus;

/** Pure entity <-> DTO mapping. The generated code is resolved by the service. */
@Component
public class ClassMapper {

    public ClassRoom toEntity(CreateClassRequest request, String code) {
        return ClassRoom.builder()
                .name(request.name().trim())
                .code(code)
                .description(blankToNull(request.description()))
                .status(ClassStatus.ACTIVE)
                .startAt(request.startAt())
                .endDate(request.endDate())
                .build();
    }

    public void update(ClassRoom classRoom, UpdateClassRequest request) {
        classRoom.setName(request.name().trim());
        classRoom.setDescription(blankToNull(request.description()));
        classRoom.setStartAt(request.startAt());
        classRoom.setEndDate(request.endDate());
    }

    public ClassResponse toResponse(ClassRoom classRoom) {
        return new ClassResponse(classRoom.getId(), classRoom.getName(), classRoom.getCode(),
                classRoom.getDescription(), classRoom.getStatus(), classRoom.getStartAt(), classRoom.getEndDate(),
                classRoom.getCreatedAt(), classRoom.getUpdatedAt());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
