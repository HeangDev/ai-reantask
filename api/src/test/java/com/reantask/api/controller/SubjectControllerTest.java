package com.reantask.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.response.SubjectResponse;
import com.reantask.api.enums.SubjectStatus;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.service.SubjectService;

// Filters are off: authentication and method security are covered by SecurityPolicyTest.
@WebMvcTest(SubjectController.class)
@AutoConfigureMockMvc(addFilters = false)
class SubjectControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean SubjectService subjectService;

    private static SubjectResponse sample() {
        return new SubjectResponse(1L, "Java", "Intro", SubjectStatus.ACTIVE,
                Instant.parse("2026-01-01T00:00:00Z"), Instant.parse("2026-01-01T00:00:00Z"));
    }

    @Test
    void create_valid_returns201WithLocationAndEnvelope() throws Exception {
        when(subjectService.create(any())).thenReturn(sample());

        mvc.perform(post("/api/v1/subjects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Java","description":"Intro"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    void create_blankName_returns400WithFieldError() throws Exception {
        mvc.perform(post("/api/v1/subjects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":" "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[?(@.field == 'name')]").exists());
    }

    @Test
    void get_found_returns200() throws Exception {
        when(subjectService.get(1L)).thenReturn(sample());

        mvc.perform(get("/api/v1/subjects/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Java"));
    }

    @Test
    void get_missing_returns404() throws Exception {
        when(subjectService.get(99L))
                .thenThrow(new NotFoundException(ErrorCode.SUBJECT_NOT_FOUND, "Subject not found"));

        mvc.perform(get("/api/v1/subjects/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SUBJECT_NOT_FOUND"));
    }

    @Test
    void get_nonPositiveId_returns400() throws Exception {
        mvc.perform(get("/api/v1/subjects/0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_returnsPagedEnvelope() throws Exception {
        when(subjectService.list(any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(sample()), 0, 10, 1, 1));

        mvc.perform(get("/api/v1/subjects").param("status", "ACTIVE").param("q", "jav"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].name").value("Java"))
                .andExpect(jsonPath("$.data.totalItems").value(1));
    }

    @Test
    void list_invalidStatus_returns400() throws Exception {
        mvc.perform(get("/api/v1/subjects").param("status", "BOGUS"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PARAMETER"));
    }

    @Test
    void update_valid_returns200() throws Exception {
        when(subjectService.update(any(), any())).thenReturn(sample());

        mvc.perform(put("/api/v1/subjects/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Java","description":"Intro"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void changeStatus_missingStatus_returns400() throws Exception {
        mvc.perform(patch("/api/v1/subjects/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void changeStatus_valid_returns200() throws Exception {
        when(subjectService.changeStatus(any(), any())).thenReturn(sample());

        mvc.perform(patch("/api/v1/subjects/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"INACTIVE"}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void delete_returns204() throws Exception {
        mvc.perform(delete("/api/v1/subjects/1"))
                .andExpect(status().isNoContent());
    }
}
