package com.reantask.api.service;

import com.reantask.api.dto.request.UpdateUserSettingRequest;
import com.reantask.api.dto.response.UserSettingResponse;

/** Settings of the authenticated user. A default row is created on first access. */
public interface UserSettingService {

    UserSettingResponse getMine();

    UserSettingResponse updateMine(UpdateUserSettingRequest request);
}
