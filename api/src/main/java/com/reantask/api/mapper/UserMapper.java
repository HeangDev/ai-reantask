package com.reantask.api.mapper;

import org.springframework.stereotype.Component;

import com.reantask.api.dto.request.CreateUserRequest;
import com.reantask.api.dto.request.UpdateProfileRequest;
import com.reantask.api.dto.request.UpdateUserRequest;
import com.reantask.api.dto.request.UpdateUserSettingRequest;
import com.reantask.api.dto.response.RoleResponse;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.dto.response.UserSettingResponse;
import com.reantask.api.entity.Role;
import com.reantask.api.entity.User;
import com.reantask.api.entity.UserSetting;
import com.reantask.api.enums.UserStatus;

/** Pure entity <-> DTO mapping. Related entities and the password hash are resolved by the service. */
@Component
public class UserMapper {

    public User toEntity(CreateUserRequest request, Role role, String passwordHash) {
        return User.builder()
                .role(role)
                .fullname(request.fullname().trim())
                .email(request.email().trim().toLowerCase())
                .phone(blankToNull(request.phone()))
                .password(passwordHash)
                .avatar(blankToNull(request.avatar()))
                .status(UserStatus.ACTIVE)
                .build();
    }

    public void update(User user, UpdateUserRequest request, Role role) {
        user.setRole(role);
        user.setFullname(request.fullname().trim());
        user.setPhone(blankToNull(request.phone()));
        user.setAvatar(blankToNull(request.avatar()));
    }

    public void update(User user, UpdateProfileRequest request) {
        user.setFullname(request.fullname().trim());
        user.setPhone(blankToNull(request.phone()));
    }

    public void update(UserSetting setting, UpdateUserSettingRequest request) {
        setting.setThemeMode(request.themeMode());
        setting.setLanguage(request.language());
        setting.setEmailNotifications(request.emailNotifications());
        setting.setPushNotifications(request.pushNotifications());
    }

    public UserResponse toResponse(User user) {
        Role role = user.getRole();
        return new UserResponse(user.getId(), role.getId(), role.getName().name(), user.getFullname(),
                user.getEmail(), user.getPhone(), user.getAvatar(), user.getStatus(),
                user.getEmailVerifiedAt(), user.getCreatedAt(), user.getUpdatedAt());
    }

    public RoleResponse toResponse(Role role) {
        return new RoleResponse(role.getId(), role.getName().name(), role.getStatus());
    }

    public UserSettingResponse toResponse(UserSetting setting) {
        return new UserSettingResponse(setting.getThemeMode(), setting.getLanguage(),
                setting.isEmailNotifications(), setting.isPushNotifications());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
