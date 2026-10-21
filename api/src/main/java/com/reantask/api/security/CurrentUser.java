package com.reantask.api.security;

import java.util.Optional;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.UnauthorizedException;

/** Reads the SecurityContext only. The authentication name is the user id (JWT sub claim). */
@Component
public class CurrentUser {

    public Optional<Long> id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        try {
            return Optional.of(Long.valueOf(auth.getName()));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public Long requireId() {
        return id().orElseThrow(() -> new UnauthorizedException(ErrorCode.UNAUTHORIZED, "Authentication required"));
    }

    /** @param role role name without the ROLE_ prefix, e.g. ADMIN */
    public boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}
