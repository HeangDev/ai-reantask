package com.reantask.api.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.reantask.api.dto.response.AvatarFile;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.service.AvatarStorageService;

@WebMvcTest(AvatarController.class)
@AutoConfigureMockMvc(addFilters = false)
class AvatarControllerTest {

    private static final String NAME = "11111111-2222-3333-4444-555555555555.png";

    @Autowired MockMvc mvc;
    @MockitoBean AvatarStorageService avatarStorage;

    @Test
    void get_existing_returnsImageWithCacheHeaders() throws Exception {
        byte[] bytes = {1, 2, 3};
        when(avatarStorage.load(NAME)).thenReturn(new AvatarFile(bytes, "image/png"));

        mvc.perform(get("/api/v1/avatars/" + NAME))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("immutable")))
                .andExpect(content().bytes(bytes));
    }

    @Test
    void get_missing_returns404() throws Exception {
        when(avatarStorage.load(NAME)).thenThrow(new NotFoundException(ErrorCode.AVATAR_NOT_FOUND, "Avatar not found"));

        mvc.perform(get("/api/v1/avatars/" + NAME))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("AVATAR_NOT_FOUND"));
    }
}
