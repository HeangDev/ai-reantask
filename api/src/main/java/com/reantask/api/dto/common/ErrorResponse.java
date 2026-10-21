package com.reantask.api.dto.common;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(boolean success, String code, String message, List<FieldError> errors,
                            String path, String traceId, Instant timestamp) {

    public record FieldError(String field, String message) { }

    public static ErrorResponse of(String code, String message, List<FieldError> errors, String path, String traceId) {
        return new ErrorResponse(false, code, message, errors, path, traceId, Instant.now());
    }
}
