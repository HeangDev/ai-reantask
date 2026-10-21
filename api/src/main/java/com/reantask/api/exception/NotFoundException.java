package com.reantask.api.exception;

import org.springframework.http.HttpStatus;

public class NotFoundException extends AppException {

    public NotFoundException(ErrorCode code, String message) {
        super(code, message, HttpStatus.NOT_FOUND);
    }
}
