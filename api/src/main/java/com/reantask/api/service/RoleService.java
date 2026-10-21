package com.reantask.api.service;

import org.springframework.data.domain.Pageable;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.response.RoleResponse;

public interface RoleService {

    PageResponse<RoleResponse> list(Pageable pageable);
}
