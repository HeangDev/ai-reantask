package com.reantask.api.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends AppException {

    public UnauthorizedException(ErrorCode code, String message) {
        super(code, message, HttpStatus.UNAUTHORIZED);
    }
}
