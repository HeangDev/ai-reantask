package com.reantask.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.util.unit.DataSize;

import com.reantask.api.config.AvatarProperties;
import com.reantask.api.dto.response.AvatarFile;
import com.reantask.api.exception.AppException;
import com.reantask.api.exception.ErrorCode;

class LocalAvatarStorageServiceImplTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};

    @TempDir Path dir;

    LocalAvatarStorageServiceImpl storage;

    @BeforeEach
    void setUp() {
        storage = new LocalAvatarStorageServiceImpl(new AvatarProperties(dir.toString(), DataSize.ofBytes(64)));
    }

    private static void assertCode(Throwable e, ErrorCode expected) {
        assertThat(e).isInstanceOfSatisfying(AppException.class, ex -> assertThat(ex.getCode()).isEqualTo(expected));
    }

    private String filenameOf(String url) {
        return url.substring(LocalAvatarStorageServiceImpl.URL_PREFIX.length());
    }

    @Test
    void store_validPng_writesFileAndReturnsPublicPath() throws IOException {
        String url = storage.store(PNG);

        assertThat(url).startsWith("/api/v1/avatars/").endsWith(".png");
        assertThat(Files.readAllBytes(dir.resolve(filenameOf(url)))).isEqualTo(PNG);
    }

    @Test
    void store_sameImageTwice_getsDistinctNames() {
        assertThat(storage.store(PNG)).isNotEqualTo(storage.store(PNG));
    }

    @Test
    void store_createsMissingDirectory() {
        Path nested = dir.resolve("a/b");
        var local = new LocalAvatarStorageServiceImpl(new AvatarProperties(nested.toString(), DataSize.ofBytes(64)));

        local.store(PNG);

        assertThat(nested).isDirectory();
    }

    @Test
    void store_empty_isRejected() {
        assertThatThrownBy(() -> storage.store(new byte[0])).satisfies(e -> assertCode(e, ErrorCode.INVALID_AVATAR));
        assertThatThrownBy(() -> storage.store(null)).satisfies(e -> assertCode(e, ErrorCode.INVALID_AVATAR));
    }

    @Test
    void store_notAnImage_isRejectedEvenIfNamedLikeOne() {
        assertThatThrownBy(() -> storage.store("<svg onload=alert(1)>".getBytes()))
                .satisfies(e -> assertCode(e, ErrorCode.INVALID_AVATAR));
    }

    @Test
    void store_overLimit_isRejectedWith413() {
        byte[] big = new byte[65];
        System.arraycopy(PNG, 0, big, 0, PNG.length);

        assertThatThrownBy(() -> storage.store(big)).satisfies(e -> {
            assertCode(e, ErrorCode.AVATAR_TOO_LARGE);
            assertThat(((AppException) e).getStatus().value()).isEqualTo(413);
        });
    }

    @Test
    void load_storedAvatar_returnsBytesAndContentType() {
        String filename = filenameOf(storage.store(PNG));

        AvatarFile file = storage.load(filename);

        assertThat(file.content()).isEqualTo(PNG);
        assertThat(file.contentType()).isEqualTo("image/png");
    }

    @Test
    void load_missingOrMalformedName_throwsNotFound() {
        assertThatThrownBy(() -> storage.load("11111111-2222-3333-4444-555555555555.png"))
                .satisfies(e -> assertCode(e, ErrorCode.AVATAR_NOT_FOUND));
        assertThatThrownBy(() -> storage.load("../application.yaml"))
                .satisfies(e -> assertCode(e, ErrorCode.AVATAR_NOT_FOUND));
        assertThatThrownBy(() -> storage.load("..%2F..%2Fsecret.png"))
                .satisfies(e -> assertCode(e, ErrorCode.AVATAR_NOT_FOUND));
    }

    @Test
    void delete_localAvatar_removesFile() {
        String url = storage.store(PNG);

        storage.delete(url);

        assertThat(dir.resolve(filenameOf(url))).doesNotExist();
    }

    @Test
    void delete_externalNullOrTraversalUrls_areIgnored() throws IOException {
        Path keep = Files.writeString(dir.resolve("keep.txt"), "x");

        storage.delete(null);
        storage.delete("https://lh3.googleusercontent.com/photo.jpg");
        storage.delete("/api/v1/avatars/../keep.txt");
        storage.delete("/api/v1/avatars/11111111-2222-3333-4444-555555555555.png");

        assertThat(keep).exists();
    }
}
