package com.reantask.api.enums;

import java.util.Arrays;

public enum RoleName {
    ADMIN, TEACHER, STUDENT;

    /** Lowercase value stored in roles.name. */
    public String dbValue() {
        return name().toLowerCase();
    }

    public static RoleName fromDbValue(String value) {
        return Arrays.stream(values())
                .filter(r -> r.dbValue().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown role name: " + value));
    }
}
