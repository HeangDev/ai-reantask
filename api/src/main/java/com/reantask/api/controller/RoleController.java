package com.reantask.api.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reantask.api.dto.common.ApiResponse;
import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.response.RoleResponse;
import com.reantask.api.service.RoleService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public ApiResponse<PageResponse<RoleResponse>> list(@PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.ok(roleService.list(pageable));
    }
}
