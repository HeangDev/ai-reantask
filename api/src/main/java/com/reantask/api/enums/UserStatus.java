package com.reantask.api.enums;

public enum UserStatus {
    PENDING, ACTIVE, INACTIVE, SUSPENDED, DELETED;

    /**
     * PENDING -> ACTIVE (approve) | DELETED (reject)
     * ACTIVE -> INACTIVE | SUSPENDED | DELETED
     * INACTIVE, SUSPENDED -> ACTIVE | DELETED
     * DELETED is final.
     */
    public boolean canTransitionTo(UserStatus next) {
        return switch (this) {
            case PENDING -> next == ACTIVE || next == DELETED;
            case ACTIVE -> next == INACTIVE || next == SUSPENDED || next == DELETED;
            case INACTIVE, SUSPENDED -> next == ACTIVE || next == DELETED;
            case DELETED -> false;
        };
    }
}
