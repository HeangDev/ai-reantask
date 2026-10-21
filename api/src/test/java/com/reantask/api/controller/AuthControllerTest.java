package com.reantask.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.exception.BusinessRuleException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.service.AuthService;
import com.reantask.api.service.UserService;

// Filters are off: the 401/403 matrix lives in SecurityPolicyTest.
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean AuthService authService;
    @MockitoBean UserService userService;

    @Test
    void me_returnsCurrentUserInEnvelope() throws Exception {
        when(userService.getMe()).thenReturn(new UserResponse(1L, 3L, "student", "Dara", "dara@example.com", null,
                null, UserStatus.ACTIVE, null, Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:00:00Z")));

        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("dara@example.com"))
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    void logout_returns204() throws Exception {
        mvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isNoContent());
        verify(authService).logout();
    }

    @Test
    void changePassword_valid_returns204() throws Exception {
        mvc.perform(patch("/api/v1/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Old12345\",\"newPassword\":\"New12345\"}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void changePassword_weakNewPassword_returns400() throws Exception {
        mvc.perform(patch("/api/v1/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Old12345\",\"newPassword\":\"onlyletters\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[?(@.field == 'newPassword')]").exists());
    }

    @Test
    void changePassword_wrongCurrent_returns422() throws Exception {
        doThrow(new BusinessRuleException(ErrorCode.INVALID_CURRENT_PASSWORD, "Current password is incorrect"))
                .when(userService).changeMyPassword(any());

        mvc.perform(patch("/api/v1/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"wrong\",\"newPassword\":\"New12345\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("INVALID_CURRENT_PASSWORD"));
    }
}
