package com.reantask.api.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class UserAgentParserTest {

    @Test
    void parse_edgeOnWindows_readsEdgeNotChrome() {
        var device = UserAgentParser.parse(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0");

        assertThat(device.os()).isEqualTo("Windows");
        assertThat(device.browser()).isEqualTo("Edge");
    }

    @Test
    void parse_nullOrUnknown_returnsNulls() {
        assertThat(UserAgentParser.parse(null)).isEqualTo(new UserAgentParser.Device(null, null));
        assertThat(UserAgentParser.parse("curl/8.0")).isEqualTo(new UserAgentParser.Device(null, null));
    }
}
