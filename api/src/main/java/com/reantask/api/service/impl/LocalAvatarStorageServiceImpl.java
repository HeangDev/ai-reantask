package com.reantask.api.service.impl;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.reantask.api.config.AvatarProperties;
import com.reantask.api.dto.response.AvatarFile;
import com.reantask.api.exception.AppException;
import com.reantask.api.exception.BadRequestException;
import com.reantask.api.exception.ErrorCode;
import com.reantask.api.exception.NotFoundException;
import com.reantask.api.service.AvatarStorageService;
import com.reantask.api.util.ImageFormat;

/** Keeps avatars on the local disk under {@code app.storage.avatar.directory}. */
@Service
@EnableConfigurationProperties(AvatarProperties.class)
public class LocalAvatarStorageServiceImpl implements AvatarStorageService {

    public static final String URL_PREFIX = "/api/v1/avatars/";

    private static final Logger log = LoggerFactory.getLogger(LocalAvatarStorageServiceImpl.class);
    // Only names we generate ourselves; also rules out path traversal.
    private static final Pattern FILENAME = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)$");

    private final Path directory;
    private final long maxBytes;

    public LocalAvatarStorageServiceImpl(AvatarProperties properties) {
        this.directory = Path.of(properties.directory()).toAbsolutePath().normalize();
        this.maxBytes = properties.maxSize().toBytes();
    }

    @Override
    public String store(byte[] content) {
        if (content == null || content.length == 0) {
            throw new BadRequestException(ErrorCode.INVALID_AVATAR, "Avatar file is empty");
        }
        if (content.length > maxBytes) {
            throw new AppException(ErrorCode.AVATAR_TOO_LARGE,
                    "Avatar must be at most " + maxBytes / 1024 + " KB", HttpStatus.valueOf(413));
        }
        ImageFormat format = ImageFormat.detect(content).orElseThrow(() -> new BadRequestException(
                ErrorCode.INVALID_AVATAR, "Avatar must be a JPEG, PNG or WebP image"));

        String filename = UUID.randomUUID() + "." + format.extension();
        try {
            Files.createDirectories(directory);
            Files.write(directory.resolve(filename), content);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store avatar", e);
        }
        return URL_PREFIX + filename;
    }

    @Override
    public void delete(String avatarUrl) {
        if (avatarUrl == null || !avatarUrl.startsWith(URL_PREFIX)) {
            return;
        }
        String filename = avatarUrl.substring(URL_PREFIX.length());
        if (!FILENAME.matcher(filename).matches()) {
            return;
        }
        try {
            Files.deleteIfExists(directory.resolve(filename));
        } catch (IOException e) {
            // The user row already points elsewhere; a leftover file is harmless, so do not fail the request.
            log.warn("Could not delete avatar file {}", filename, e);
        }
    }

    @Override
    public AvatarFile load(String filename) {
        if (filename == null || !FILENAME.matcher(filename).matches()) {
            throw notFound();
        }
        Path file = directory.resolve(filename);
        if (!Files.isRegularFile(file)) {
            throw notFound();
        }
        String extension = filename.substring(filename.lastIndexOf('.') + 1);
        ImageFormat format = ImageFormat.fromExtension(extension).orElseThrow(this::notFound);
        try {
            return new AvatarFile(Files.readAllBytes(file), format.contentType());
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read avatar", e);
        }
    }

    private NotFoundException notFound() {
        return new NotFoundException(ErrorCode.AVATAR_NOT_FOUND, "Avatar not found");
    }
}
