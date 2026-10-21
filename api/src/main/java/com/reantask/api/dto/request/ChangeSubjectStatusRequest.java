package com.reantask.api.dto.request;

import com.reantask.api.enums.SubjectStatus;

import jakarta.validation.constraints.NotNull;

public record ChangeSubjectStatusRequest(@NotNull SubjectStatus status) { }
