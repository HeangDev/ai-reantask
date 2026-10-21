package com.reantask.api.service;

import com.reantask.api.dto.response.AvatarFile;

/**
 * Stores and serves profile images. Internal building block of the user feature: callers pass raw bytes and
 * get back the public URL path that is saved in {@code users.avatar}.
 */
public interface AvatarStorageService {

    /**
     * Validates the image (size limit, JPEG/PNG/WebP detected from the bytes) and stores it under a random name.
     *
     * @return the public path of the stored image, e.g. {@code /api/v1/avatars/<uuid>.png}
     * @throws com.reantask.api.exception.BadRequestException INVALID_AVATAR when empty or not a supported image
     * @throws com.reantask.api.exception.AppException AVATAR_TOO_LARGE (413) when over the size limit
     */
    String store(byte[] content);

    /**
     * Removes the file behind an avatar path. Ignores {@code null}, external URLs (e.g. Google photos) and files
     * that no longer exist.
     */
    void delete(String avatarUrl);

    /** @throws com.reantask.api.exception.NotFoundException AVATAR_NOT_FOUND, including for malformed names */
    AvatarFile load(String filename);
}
