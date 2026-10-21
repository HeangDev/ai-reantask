package com.reantask.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.response.ClassResponse;
import com.reantask.api.enums.ClassStatus;
import com.reantask.api.exception.BusinessRuleException;
import com.reantask.api.exception.ConflictException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.service.ClassService;
import com.reantask.api.service.ClassSubjectService;
import com.reantask.api.dto.response.ClassSubjectResponse;
import com.reantask.api.dto.response.SubjectResponse;
import com.reantask.api.enums.ClassSubjectStatus;
import com.reantask.api.enums.SubjectStatus;

// Filters are off: authentication and method security are covered by SecurityPolicyTest.
@WebMvcTest(ClassController.class)
@AutoConfigureMockMvc(addFilters = false)
class ClassControllerTest {

    private static final String VALID_BODY = """
            {"name":"Web 101","description":"Intro","startAt":"2026-01-05","endDate":"2026-06-30"}
            """;

    @Autowired MockMvc mvc;
    @MockitoBean ClassService classService;
    @MockitoBean ClassSubjectService classSubjectService;

    private static ClassResponse sample() {
        return new ClassResponse(1L, "Web 101", "ABC123", "Intro", ClassStatus.ACTIVE,
                LocalDate.of(2026, 1, 5), LocalDate.of(2026, 6, 30),
                Instant.parse("2026-01-01T00:00:00Z"), Instant.parse("2026-01-01T00:00:00Z"));
    }

    @Test
    void create_valid_returns201WithLocationAndEnvelope() throws Exception {
        when(classService.create(any())).thenReturn(sample());

        mvc.perform(post("/api/v1/classes").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("ABC123"))
                .andExpect(jsonPath("$.data.startAt").value("2026-01-05"));
    }

    @Test
    void create_missingFields_returns400WithFieldErrors() throws Exception {
        mvc.perform(post("/api/v1/classes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name":" "}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[?(@.field == 'name')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field == 'startAt')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field == 'endDate')]").exists());
    }

    @Test
    void create_clientSuppliedCode_isIgnored() throws Exception {
        // The request record has no code field, so the join code always comes from the server.
        when(classService.create(any())).thenReturn(sample());

        mvc.perform(post("/api/v1/classes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name":"Web","code":"HACKED","startAt":"2026-01-05","endDate":"2026-06-30"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value("ABC123"));
    }

    @Test
    void create_invalidDateRange_returns422() throws Exception {
        when(classService.create(any()))
                .thenThrow(new BusinessRuleException(ErrorCode.INVALID_DATE_RANGE, "bad range"));

        mvc.perform(post("/api/v1/classes").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("INVALID_DATE_RANGE"));
    }

    @Test
    void create_malformedDate_returns400() throws Exception {
        mvc.perform(post("/api/v1/classes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name":"Web","startAt":"not-a-date","endDate":"2026-06-30"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"));
    }

    @Test
    void get_found_returns200() throws Exception {
        when(classService.get(1L)).thenReturn(sample());

        mvc.perform(get("/api/v1/classes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Web 101"));
    }

    @Test
    void get_missing_returns404() throws Exception {
        when(classService.get(99L)).thenThrow(new NotFoundException(ErrorCode.CLASS_NOT_FOUND, "Class not found"));

        mvc.perform(get("/api/v1/classes/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CLASS_NOT_FOUND"));
    }

    @Test
    void get_nonPositiveId_returns400() throws Exception {
        mvc.perform(get("/api/v1/classes/0")).andExpect(status().isBadRequest());
    }

    @Test
    void list_returnsPagedEnvelope() throws Exception {
        when(classService.list(any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(sample()), 0, 10, 1, 1));

        mvc.perform(get("/api/v1/classes").param("status", "ACTIVE").param("q", "web"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].code").value("ABC123"))
                .andExpect(jsonPath("$.data.totalItems").value(1));
    }

    @Test
    void list_invalidStatus_returns400() throws Exception {
        mvc.perform(get("/api/v1/classes").param("status", "BOGUS"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PARAMETER"));
    }

    @Test
    void update_valid_returns200() throws Exception {
        when(classService.update(any(), any())).thenReturn(sample());

        mvc.perform(put("/api/v1/classes/1").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void delete_returns204() throws Exception {
        mvc.perform(delete("/api/v1/classes/1")).andExpect(status().isNoContent());
    }

    private static ClassSubjectResponse sampleClassSubject() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        return new ClassSubjectResponse(5L, sample(),
                new SubjectResponse(2L, "Java", null, SubjectStatus.ACTIVE, now, now),
                7L, ClassSubjectStatus.ACTIVE, now, now);
    }

    @Test
    void myTeaching_returnsPagedEnvelope() throws Exception {
        when(classSubjectService.listMyTeaching(any(), any()))
                .thenReturn(new PageResponse<>(List.of(sampleClassSubject()), 0, 10, 1, 1));

        mvc.perform(get("/api/v1/classes/me/teaching").param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].classRoom.code").value("ABC123"))
                .andExpect(jsonPath("$.data.items[0].subject.name").value("Java"))
                .andExpect(jsonPath("$.data.items[0].teacherId").value(7));
    }

    @Test
    void myTeaching_invalidStatus_returns400() throws Exception {
        mvc.perform(get("/api/v1/classes/me/teaching").param("status", "BOGUS"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PARAMETER"));
    }

    @Test
    void assignSubject_valid_returns201WithLocation() throws Exception {
        when(classSubjectService.assign(any(), any())).thenReturn(sampleClassSubject());

        mvc.perform(post("/api/v1/classes/1/subjects").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"subjectId\":2,\"teacherId\":7}"))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.data.id").value(5))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    void assignSubject_missingFields_returns400WithFieldErrors() throws Exception {
        mvc.perform(post("/api/v1/classes/1/subjects").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[?(@.field == 'subjectId')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field == 'teacherId')]").exists());
    }

    @Test
    void assignSubject_alreadyAssigned_returns409() throws Exception {
        when(classSubjectService.assign(any(), any()))
                .thenThrow(new ConflictException(ErrorCode.ALREADY_IN_CLASS, "dup"));

        mvc.perform(post("/api/v1/classes/1/subjects").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"subjectId\":2,\"teacherId\":7}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_IN_CLASS"));
    }
}
