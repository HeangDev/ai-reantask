package com.reantask.api.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.reantask.api.dto.common.ClientInfo;
import com.reantask.api.dto.request.ChangePasswordRequest;
import com.reantask.api.dto.request.GoogleAuthRequest;
import com.reantask.api.dto.request.LoginRequest;
import com.reantask.api.dto.response.GoogleAuthResponse;
import com.reantask.api.dto.request.RegisterRequest;
import com.reantask.api.dto.response.TokenResponse;
import com.reantask.api.service.AuthService;
import com.reantask.api.service.UserService;
import com.reantask.api.dto.common.ApiResponse;
import com.reantask.api.dto.response.UserResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Registered. Waiting for approval.", authService.register(request));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<GoogleAuthResponse>> google(@Valid @RequestBody GoogleAuthRequest request,
                                                                  HttpServletRequest http) {
        GoogleAuthResponse response = authService.google(request, clientOf(http));
        if (response.newAccount()) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok("Registered. Waiting for approval.", response));
        }
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserResponse> me() {
        return ApiResponse.ok(userService.getMe());
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> logout() {
        authService.logout();
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changeMyPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return ApiResponse.ok(authService.login(request, clientOf(http)));
    }

    // getRemoteAddr is the direct peer; behind a proxy, set server.forward-headers-strategy to get the real client.
    private static ClientInfo clientOf(HttpServletRequest http) {
        return new ClientInfo(http.getRemoteAddr(), http.getHeader(HttpHeaders.USER_AGENT));
    }
}
