package com.reantask.api.validation;

import java.time.DateTimeException;
import java.time.ZoneId;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidTimezoneValidator implements ConstraintValidator<ValidTimezone, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        try {
            ZoneId.of(value);
            return true;
        } catch (DateTimeException e) {
            return false;
        }
    }
}
