package com.reantask.api.util;

import java.security.SecureRandom;

import org.springframework.stereotype.Component;

/** Produces random 6-character class join codes ({@code [A-Z0-9]}). Uniqueness is the caller's job. */
@Component
public class ClassCodeGenerator {

    public static final int CODE_LENGTH = 6;
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private final SecureRandom random = new SecureRandom();

    public String generate() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return code.toString();
    }
}
