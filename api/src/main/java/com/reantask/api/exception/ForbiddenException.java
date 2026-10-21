package com.reantask.api.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends AppException {

    public ForbiddenException(ErrorCode code, String message) {
        super(code, message, HttpStatus.FORBIDDEN);
    }
}
