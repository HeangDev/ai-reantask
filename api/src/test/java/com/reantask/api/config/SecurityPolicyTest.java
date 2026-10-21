package com.reantask.api.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.reantask.api.controller.AuthController;
import com.reantask.api.controller.AvatarController;
import com.reantask.api.dto.response.AvatarFile;
import com.reantask.api.service.AvatarStorageService;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import com.reantask.api.dto.response.TokenResponse;
import com.reantask.api.security.JwtService;
import com.reantask.api.security.SecurityErrorHandlers;
import com.reantask.api.service.AuthService;
import com.reantask.api.exception.GlobalExceptionHandler;
import com.reantask.api.dto.common.PageResponse;
import com.reantask.api.controller.RoleController;
import com.reantask.api.controller.UserController;
import com.reantask.api.dto.response.UserResponse;
import com.reantask.api.enums.UserStatus;
import com.reantask.api.service.RoleService;
import com.reantask.api.service.TokenRevocationService;
import com.reantask.api.service.UserService;
import com.reantask.api.service.UserSessionService;
import com.reantask.api.service.UserSettingService;

import java.util.List;

/** Proves the access policy: 401 without a valid token, 403 for the wrong role, success for the right one. */
@WebMvcTest({AuthController.class, UserController.class, RoleController.class, AvatarController.class})
@Import({SecurityConfig.class, SecurityErrorHandlers.class, JwtConfig.class, ClockConfig.class,
        JwtService.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
        "app.security.jwt.secret=test-secret-test-secret-test-secret-1234",
        "app.security.jwt.issuer=test-issuer",
        "app.security.cors.allowed-origins=http://localhost:3000"
})
class SecurityPolicyTest {

    @Autowired MockMvc mvc;
    @Autowired JwtService jwtService;

    @MockitoBean AuthService authService;
    @MockitoBean UserService userService;
    @MockitoBean UserSettingService settingService;
    @MockitoBean RoleService roleService;
    @MockitoBean TokenRevocationService revocationService;
    @MockitoBean UserSessionService sessionService;
    @MockitoBean AvatarStorageService avatarStorage;

    private static UserResponse sampleUser() {
        return new UserResponse(1L, 3L, "STUDENT", "Dara", "dara@example.com", null, null,
                UserStatus.ACTIVE, null, Instant.now(), Instant.now());
    }

    private static final String CREATE_USER_BODY = """
            {"roleId":3,"fullname":"Dara","email":"dara@example.com",
             "phone":"012345678","password":"Secret123"}
            """;

    @Test
    void protectedEndpoint_withoutToken_returns401Json() throws Exception {
        mvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void changePassword_withoutToken_returns401EvenThoughAuthPathsArePublic() throws Exception {
        mvc.perform(patch("/api/v1/auth/change-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Old12345\",\"newPassword\":\"New12345\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void mySessions_withoutToken_returns401() throws Exception {
        mvc.perform(get("/api/v1/users/me/sessions")).andExpect(status().isUnauthorized());
    }

    @Test
    void updateMyAvatar_withoutToken_returns401() throws Exception {
        mvc.perform(multipart(HttpMethod.PUT, "/api/v1/users/me/avatar")
                        .file(new MockMultipartFile("file", "me.png", "image/png", new byte[] {1})))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/users/me/avatar")).andExpect(status().isUnauthorized());
    }

    @Test
    void updateMyAvatar_withValidToken_returns200() throws Exception {
        String token = jwtService.issueAccessToken(5L, "STUDENT");
        when(userService.updateMyAvatar(any())).thenReturn(sampleUser());

        mvc.perform(multipart(HttpMethod.PUT, "/api/v1/users/me/avatar")
                        .file(new MockMultipartFile("file", "me.png", "image/png", new byte[] {1}))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void deactivateMe_withoutToken_returns401() throws Exception {
        mvc.perform(patch("/api/v1/users/me/deactivate")).andExpect(status().isUnauthorized());
    }

    @Test
    void deactivateMe_withValidToken_returns204() throws Exception {
        String token = jwtService.issueAccessToken(5L, "STUDENT");

        mvc.perform(patch("/api/v1/users/me/deactivate").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void getAvatarImage_isPublic() throws Exception {
        String name = "11111111-2222-3333-4444-555555555555.png";
        when(avatarStorage.load(name)).thenReturn(new AvatarFile(new byte[] {1}, "image/png"));

        mvc.perform(get("/api/v1/avatars/" + name)).andExpect(status().isOk());
    }

    @Test
    void meAndLogout_withoutToken_return401() throws Exception {
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/logout")).andExpect(status().isUnauthorized());
    }

    @Test
    void logout_withValidToken_returns204() throws Exception {
        String token = jwtService.issueAccessToken(5L, "STUDENT");

        mvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void revokedToken_isRejectedWith401() throws Exception {
        String token = jwtService.issueAccessToken(5L, "STUDENT");
        when(revocationService.isRevoked(any())).thenReturn(true);

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void changePassword_withValidToken_returns204() throws Exception {
        String token = jwtService.issueAccessToken(5L, "STUDENT");

        mvc.perform(patch("/api/v1/auth/change-password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Old12345\",\"newPassword\":\"New12345\"}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void protectedEndpoint_withGarbageToken_returns401() throws Exception {
        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void protectedEndpoint_withTokenSignedByAnotherKey_returns401() throws Exception {
        // header.payload.signature where the signature was not produced with our secret
        String forged = jwtService.issueAccessToken(1L, "ADMIN");
        String tampered = forged.substring(0, forged.lastIndexOf('.') + 1) + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void realIssuedToken_isAcceptedAndStudentRoleIsMapped() throws Exception {
        when(userService.getMe()).thenReturn(sampleUser());
        String token = jwtService.issueAccessToken(1L, "STUDENT");

        mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void realIssuedStudentToken_onAdminEndpoint_returns403() throws Exception {
        String token = jwtService.issueAccessToken(1L, "STUDENT");

        mvc.perform(post("/api/v1/users").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(CREATE_USER_BODY))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void teacher_onAdminOnlyRoles_returns403() throws Exception {
        mvc.perform(get("/api/v1/roles")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_onAdminOnlyRoles_returns200() throws Exception {
        when(roleService.list(any())).thenReturn(new PageResponse<>(List.of(), 0, 20, 0, 0));

        mvc.perform(get("/api/v1/roles")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk());
    }

    @Test
    void admin_creatingUser_returns201() throws Exception {
        when(userService.create(any())).thenReturn(sampleUser());

        mvc.perform(post("/api/v1/users")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON).content(CREATE_USER_BODY))
                .andExpect(status().isCreated());
    }

    @Test
    void teacher_canApprove_butStudentCannot() throws Exception {
        when(userService.approve(5L)).thenReturn(sampleUser());

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/users/5/approve")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TEACHER"))))
                .andExpect(status().isOk());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/users/5/approve")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void login_isPublic_noTokenNeeded() throws Exception {
        when(authService.login(any(), any())).thenReturn(TokenResponse.bearer("jwt", 900));

        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"dara@example.com","password":"Secret123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("jwt"))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"));
    }

    @Test
    void register_isPublic_andReturns201() throws Exception {
        when(authService.register(any())).thenReturn(sampleUser());

        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullname":"Dara","email":"dara@example.com","phone":"012345678",
                                 "password":"Secret123","role":"ADMIN","status":"ACTIVE"}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void register_invalidBody_returns400() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullname":"","email":"bad","phone":"1","password":"x"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
