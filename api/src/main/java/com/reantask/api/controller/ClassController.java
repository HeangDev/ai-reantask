package com.reantask.api.controller;

import java.net.URI;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.reantask.api.dto.common.ApiResponse;
import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.request.AssignClassSubjectRequest;
import com.reantask.api.dto.request.CreateClassRequest;
import com.reantask.api.dto.request.UpdateClassRequest;
import com.reantask.api.dto.response.ClassResponse;
import com.reantask.api.dto.response.ClassSubjectResponse;
import com.reantask.api.enums.ClassStatus;
import com.reantask.api.enums.ClassSubjectStatus;
import com.reantask.api.service.ClassService;
import com.reantask.api.service.ClassSubjectService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/classes")
@RequiredArgsConstructor
@Validated
public class ClassController {

    private final ClassService classService;
    private final ClassSubjectService classSubjectService;

    @GetMapping
    public ApiResponse<PageResponse<ClassResponse>> list(
            @RequestParam(required = false) ClassStatus status,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.ok(classService.list(status, q, pageable));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClassResponse>> create(@Valid @RequestBody CreateClassRequest request) {
        ClassResponse created = classService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(ApiResponse.ok("Created", created));
    }

    @GetMapping("/{id}")
    public ApiResponse<ClassResponse> get(@PathVariable @Positive Long id) {
        return ApiResponse.ok(classService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<ClassResponse> update(@PathVariable @Positive Long id,
                                             @Valid @RequestBody UpdateClassRequest request) {
        return ApiResponse.ok(classService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        classService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/teaching")
    public ApiResponse<PageResponse<ClassSubjectResponse>> myTeaching(
            @RequestParam(required = false) ClassSubjectStatus status,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.ok(classSubjectService.listMyTeaching(status, pageable));
    }

    @PostMapping("/{id}/subjects")
    public ResponseEntity<ApiResponse<ClassSubjectResponse>> assignSubject(
            @PathVariable @Positive Long id, @Valid @RequestBody AssignClassSubjectRequest request) {
        ClassSubjectResponse created = classSubjectService.assign(id, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{classSubjectId}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(ApiResponse.ok("Created", created));
    }
}
