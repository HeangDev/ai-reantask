package com.reantask.api.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends AppException {

    public BadRequestException(ErrorCode code, String message) {
        super(code, message, HttpStatus.BAD_REQUEST);
    }
}
