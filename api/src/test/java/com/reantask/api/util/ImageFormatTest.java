package com.reantask.api.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ImageFormatTest {

    static byte[] jpeg() {
        return new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0};
    }

    static byte[] png() {
        return new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0};
    }

    static byte[] webp() {
        return new byte[] {'R', 'I', 'F', 'F', 1, 0, 0, 0, 'W', 'E', 'B', 'P', 'V', 'P', '8', ' '};
    }

    @Test
    void detect_recognisesSupportedFormats() {
        assertThat(ImageFormat.detect(jpeg())).contains(ImageFormat.JPEG);
        assertThat(ImageFormat.detect(png())).contains(ImageFormat.PNG);
        assertThat(ImageFormat.detect(webp())).contains(ImageFormat.WEBP);
    }

    @Test
    void detect_rejectsOtherContent() {
        assertThat(ImageFormat.detect("<svg></svg>".getBytes())).isEmpty();
        assertThat(ImageFormat.detect("GIF89a".getBytes())).isEmpty();
        assertThat(ImageFormat.detect(new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E'})).isEmpty();
    }

    @Test
    void detect_handlesTruncatedAndEmptyInput() {
        assertThat(ImageFormat.detect(new byte[0])).isEmpty();
        assertThat(ImageFormat.detect(new byte[] {(byte) 0xFF, (byte) 0xD8})).isEmpty();
        assertThat(ImageFormat.detect(new byte[] {'R', 'I', 'F', 'F'})).isEmpty();
    }

    @Test
    void fromExtension_mapsKnownExtensionsOnly() {
        assertThat(ImageFormat.fromExtension("png")).contains(ImageFormat.PNG);
        assertThat(ImageFormat.fromExtension("svg")).isEmpty();
    }
}
