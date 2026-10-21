package com.reantask.api.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.reantask.api.dto.request.GoogleAuthRequest;
import com.reantask.api.dto.request.LoginRequest;
import com.reantask.api.dto.response.GoogleAuthResponse;
import com.reantask.api.dto.request.RegisterRequest;
import com.reantask.api.dto.response.TokenResponse;
import com.reantask.api.service.AuthService;
import com.reantask.api.dto.common.ApiResponse;
import com.reantask.api.dto.response.UserResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Registered. Waiting for approval.", authService.register(request));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<GoogleAuthResponse>> google(@Valid @RequestBody GoogleAuthRequest request) {
        GoogleAuthResponse response = authService.google(request);
        if (response.newAccount()) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok("Registered. Waiting for approval.", response));
        }
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }
}
