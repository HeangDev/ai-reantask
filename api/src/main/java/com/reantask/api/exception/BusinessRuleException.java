package com.reantask.api.exception;

import org.springframework.http.HttpStatus;

public class BusinessRuleException extends AppException {

    public BusinessRuleException(ErrorCode code, String message) {
        super(code, message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
