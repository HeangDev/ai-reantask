package com.reantask.api.controller;

import java.time.Duration;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.reantask.api.dto.response.AvatarFile;
import com.reantask.api.service.AvatarStorageService;

import lombok.RequiredArgsConstructor;

/** Public so that {@code <img src>} works without an Authorization header; file names are random UUIDs. */
@RestController
@RequestMapping("/api/v1/avatars")
@RequiredArgsConstructor
public class AvatarController {

    private static final Duration CACHE_TTL = Duration.ofDays(30);

    private final AvatarStorageService avatarStorage;

    @GetMapping("/{filename}")
    public ResponseEntity<byte[]> get(@PathVariable String filename) {
        AvatarFile avatar = avatarStorage.load(filename);
        // A new upload always gets a new name, so a cached file never goes stale.
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(avatar.contentType()))
                .cacheControl(CacheControl.maxAge(CACHE_TTL).cachePublic().immutable())
                .body(avatar.content());
    }
}
