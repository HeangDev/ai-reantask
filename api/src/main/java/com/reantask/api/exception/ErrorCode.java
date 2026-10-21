package com.reantask.api.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;

/** Single catalogue of machine-readable error codes. Add new codes here. */
@Getter
public enum ErrorCode {

    // Generic
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST),
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST),
    INVALID_SORT_FIELD(HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
    FORBIDDEN(HttpStatus.FORBIDDEN),
    NOT_FOUND(HttpStatus.NOT_FOUND),
    CONFLICT(HttpStatus.CONFLICT),
    CONCURRENT_UPDATE(HttpStatus.CONFLICT),
    TOO_MANY_REQUESTS(HttpStatus.TOO_MANY_REQUESTS),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR),

    // Auth
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    GOOGLE_TOKEN_INVALID(HttpStatus.UNAUTHORIZED),
    ACCOUNT_PENDING(HttpStatus.FORBIDDEN),
    ACCOUNT_INACTIVE(HttpStatus.FORBIDDEN),
    ACCOUNT_SUSPENDED(HttpStatus.FORBIDDEN),
    ACCOUNT_DELETED(HttpStatus.FORBIDDEN),

    // Users
    USER_NOT_FOUND(HttpStatus.NOT_FOUND),
    ROLE_NOT_FOUND(HttpStatus.NOT_FOUND),
    SESSION_NOT_FOUND(HttpStatus.NOT_FOUND),
    ROLE_INACTIVE(HttpStatus.UNPROCESSABLE_ENTITY),
    EMAIL_TAKEN(HttpStatus.CONFLICT),
    PHONE_TAKEN(HttpStatus.CONFLICT),
    INVALID_CURRENT_PASSWORD(HttpStatus.UNPROCESSABLE_ENTITY),
    PASSWORD_UNCHANGED(HttpStatus.UNPROCESSABLE_ENTITY),
    INVALID_STATUS_TRANSITION(HttpStatus.CONFLICT),
    CANNOT_MODIFY_SELF(HttpStatus.UNPROCESSABLE_ENTITY),
    LAST_ADMIN(HttpStatus.CONFLICT);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }
}
