package com.reantask.api.dto.response;

import com.reantask.api.enums.RoleStatus;

public record RoleResponse(Long id, String name, RoleStatus status) { }
