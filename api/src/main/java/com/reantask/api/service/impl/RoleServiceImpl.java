package com.reantask.api.service.impl;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.response.RoleResponse;
import com.reantask.api.mapper.UserMapper;
import com.reantask.api.repository.RoleRepository;
import com.reantask.api.service.RoleService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final UserMapper mapper;

    @Override
    public PageResponse<RoleResponse> list(Pageable pageable) {
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("id"));
        return PageResponse.from(roleRepository.findAll(sorted).map(mapper::toResponse));
    }
}
