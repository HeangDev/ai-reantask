package com.reantask.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.dto.response.UserSessionResponse;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.service.UserService;
import com.reantask.api.service.UserSessionService;
import com.reantask.api.service.UserSettingService;

// Filters are off: authentication and method security belong to the auth feature.
@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean UserService userService;
    @MockitoBean UserSettingService settingService;
    @MockitoBean UserSessionService sessionService;

    private static UserResponse sample() {
        return new UserResponse(1L, 3L, "student", "Dara", "dara@example.com", "012345678", null,
                UserStatus.ACTIVE, null, Instant.parse("2026-01-01T00:00:00Z"), Instant.parse("2026-01-01T00:00:00Z"));
    }

    @Test
    void create_valid_returns201WithLocationAndEnvelope() throws Exception {
        when(userService.create(any())).thenReturn(sample());

        mvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"roleId":3,"fullname":"Dara","email":"dara@example.com",
                                 "phone":"012345678","password":"Secret123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    void create_invalidBody_returns400WithFieldErrors() throws Exception {
        mvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"roleId":3,"fullname":"","email":"not-an-email","phone":"1","password":"short"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[?(@.field == 'email')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field == 'fullname')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field == 'phone')]").exists())
                .andExpect(jsonPath("$.errors[?(@.field == 'password')]").exists());
    }

    @Test
    void get_missing_returns404() throws Exception {
        when(userService.get(99L)).thenThrow(new NotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));

        mvc.perform(get("/api/v1/users/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    }

    @Test
    void list_returnsPagedEnvelope() throws Exception {
        when(userService.list(any(), any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(sample()), 0, 20, 1, 1));

        mvc.perform(get("/api/v1/users").param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].email").value("dara@example.com"))
                .andExpect(jsonPath("$.data.totalItems").value(1));
    }

    @Test
    void mySessions_returnsPagedEnvelopeWithoutTokenIds() throws Exception {
        when(sessionService.listMine(any())).thenReturn(new PageResponse<>(
                List.of(new UserSessionResponse(1L, "10.0.0.1", "Firefox", Instant.parse("2026-01-01T00:00:00Z"),
                        Instant.parse("2026-01-01T00:15:00Z"), true)), 0, 10, 1, 1));

        mvc.perform(get("/api/v1/users/me/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].ipAddress").value("10.0.0.1"))
                .andExpect(jsonPath("$.data.items[0].current").value(true))
                .andExpect(jsonPath("$.data.items[0].jti").doesNotExist());
    }

    @Test
    void changeStatus_missingStatus_returns400() throws Exception {
        mvc.perform(patch("/api/v1/users/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void delete_returns204() throws Exception {
        mvc.perform(delete("/api/v1/users/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void get_nonPositiveId_returns400() throws Exception {
        mvc.perform(get("/api/v1/users/0"))
                .andExpect(status().isBadRequest());
    }
}
