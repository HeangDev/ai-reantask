package com.reantask.api.controller;

import java.io.IOException;
import java.net.URI;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.reantask.api.dto.common.ApiResponse;
import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.CreateUserRequest;
import com.reantask.api.dto.request.UpdateProfileRequest;
import com.reantask.api.dto.request.UpdateUserRequest;
import com.reantask.api.dto.request.UpdateUserSettingRequest;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.dto.response.UserSessionResponse;
import com.reantask.api.dto.response.UserSettingResponse;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.service.UserService;
import com.reantask.api.service.UserSessionService;
import com.reantask.api.service.UserSettingService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;
    private final UserSettingService settingService;
    private final UserSessionService sessionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ApiResponse<PageResponse<UserResponse>> list(
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) Long roleId,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.ok(userService.list(status, roleId, q, pageable));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(ApiResponse.ok("Created", created));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ApiResponse<UserResponse> get(@PathVariable @Positive Long id) {
        return ApiResponse.ok(userService.get(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserResponse> update(@PathVariable @Positive Long id,
                                            @Valid @RequestBody UpdateUserRequest request) {
        return ApiResponse.ok(userService.update(id, request));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ApiResponse<UserResponse> approve(@PathVariable @Positive Long id) {
        return ApiResponse.ok(userService.approve(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ApiResponse<UserResponse> reject(@PathVariable @Positive Long id) {
        return ApiResponse.ok(userService.reject(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserResponse> me() {
        return ApiResponse.ok(userService.getMe());
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserResponse> updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(userService.updateMe(request));
    }

    @PatchMapping("/me/deactivate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deactivateMe() {
        userService.deactivateMe();
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserResponse> updateMyAvatar(@RequestPart("file") MultipartFile file) throws IOException {
        return ApiResponse.ok(userService.updateMyAvatar(file.getBytes()));
    }

    @DeleteMapping("/me/avatar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeMyAvatar() {
        userService.removeMyAvatar();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/sessions")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<UserSessionResponse>> mySessions(@PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.ok(sessionService.listMine(pageable));
    }

    @DeleteMapping("/me/sessions/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> revokeMySession(@PathVariable @Positive Long id) {
        sessionService.revokeMine(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/settings")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserSettingResponse> mySettings() {
        return ApiResponse.ok(settingService.getMine());
    }

    @PutMapping("/me/settings")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserSettingResponse> updateMySettings(@Valid @RequestBody UpdateUserSettingRequest request) {
        return ApiResponse.ok(settingService.updateMine(request));
    }
}
