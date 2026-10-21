package com.reantask.api.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends AppException {

    public ConflictException(ErrorCode code, String message) {
        super(code, message, HttpStatus.CONFLICT);
    }
}
