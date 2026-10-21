package com.reantask.api.util;

import java.util.Arrays;
import java.util.Optional;

/** Image formats accepted for avatars, recognised by their magic bytes (never by the client's Content-Type). */
public enum ImageFormat {
    JPEG("jpg", "image/jpeg"),
    PNG("png", "image/png"),
    WEBP("webp", "image/webp");

    private static final byte[] JPEG_MAGIC = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] RIFF = {'R', 'I', 'F', 'F'};
    private static final byte[] WEBP_TAG = {'W', 'E', 'B', 'P'};
    private static final int WEBP_TAG_OFFSET = 8;

    private final String extension;
    private final String contentType;

    ImageFormat(String extension, String contentType) {
        this.extension = extension;
        this.contentType = contentType;
    }

    public String extension() {
        return extension;
    }

    public String contentType() {
        return contentType;
    }

    public static Optional<ImageFormat> detect(byte[] content) {
        if (startsWith(content, 0, JPEG_MAGIC)) {
            return Optional.of(JPEG);
        }
        if (startsWith(content, 0, PNG_MAGIC)) {
            return Optional.of(PNG);
        }
        if (startsWith(content, 0, RIFF) && startsWith(content, WEBP_TAG_OFFSET, WEBP_TAG)) {
            return Optional.of(WEBP);
        }
        return Optional.empty();
    }

    public static Optional<ImageFormat> fromExtension(String extension) {
        return Arrays.stream(values()).filter(f -> f.extension.equals(extension)).findFirst();
    }

    private static boolean startsWith(byte[] content, int offset, byte[] prefix) {
        if (content.length < offset + prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (content[offset + i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }
}
