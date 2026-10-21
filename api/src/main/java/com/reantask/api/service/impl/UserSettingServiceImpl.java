package com.reantask.api.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.security.CurrentUser;
import com.reantask.api.dto.request.UpdateUserSettingRequest;
import com.reantask.api.dto.response.UserSettingResponse;
import com.reantask.api.entity.UserSetting;
import com.reantask.api.mapper.UserMapper;
import com.reantask.api.repository.UserSettingRepository;
import com.reantask.api.service.UserSettingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserSettingServiceImpl implements UserSettingService {

    private final UserSettingRepository settingRepository;
    private final UserMapper mapper;
    private final CurrentUser currentUser;

    @Override
    public UserSettingResponse getMine() {
        return mapper.toResponse(findOrCreate(currentUser.requireId()));
    }

    @Override
    public UserSettingResponse updateMine(UpdateUserSettingRequest request) {
        UserSetting setting = findOrCreate(currentUser.requireId());
        mapper.update(setting, request);
        return mapper.toResponse(setting);
    }

    private UserSetting findOrCreate(Long userId) {
        return settingRepository.findByUserId(userId)
                .orElseGet(() -> settingRepository.save(new UserSetting(userId)));
    }
}
