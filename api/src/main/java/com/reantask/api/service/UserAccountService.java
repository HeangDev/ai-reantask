package com.reantask.api.service;

import java.util.Optional;

import com.reantask.api.dto.response.GoogleAccountResponse;
import com.reantask.api.dto.response.UserCredentialsResponse;
import com.reantask.api.dto.response.UserResponse;

/** Account operations used by the auth feature (login lookup, public registration). */
public interface UserAccountService {

    /** Soft-deleted users are not found. Email match is case-insensitive. */
    Optional<UserCredentialsResponse> findCredentialsByEmail(String email);

    /**
     * Public self-registration: always role student, status PENDING, no creator.
     *
     * @param passwordHash already hashed by the caller
     * @throws com.reantask.api.exception.ConflictException EMAIL_TAKEN or PHONE_TAKEN
     */
    UserResponse registerStudent(String fullname, String email, String phone, String passwordHash);

    /**
     * Google sign-in and sign-up in one step. Matches by {@code googleId}, else links an existing account with the
     * same (Google-verified) email, else creates a student with status PENDING and a random password.
     * Linking an account whose email was never verified also replaces its password, so whoever registered that
     * email first cannot keep using it.
     *
     * @param fullname may be null; the email's local part is used then
     * @throws com.reantask.api.exception.ForbiddenException ACCOUNT_DELETED when the email belongs to a deleted user
     */
    GoogleAccountResponse signInWithGoogle(String googleId, String email, String fullname, String avatar);
}
