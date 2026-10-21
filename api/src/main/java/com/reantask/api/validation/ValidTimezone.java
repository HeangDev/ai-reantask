package com.reantask.api.validation;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.ElementType.RECORD_COMPONENT;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Documented
@Constraint(validatedBy = ValidTimezoneValidator.class)
@Target({FIELD, PARAMETER, RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidTimezone {

    String message() default "must be a valid IANA time zone id";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
