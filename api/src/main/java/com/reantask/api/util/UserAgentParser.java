package com.reantask.api.util;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.lang.Nullable;

/** Reads the browser and operating system out of a User-Agent. Order matters: Edge and Chrome both say "Safari". */
public final class UserAgentParser {

    private static final Map<Pattern, String> BROWSERS = new LinkedHashMap<>();
    private static final Map<Pattern, String> SYSTEMS = new LinkedHashMap<>();

    static {
        BROWSERS.put(Pattern.compile("edg(e|a|ios)?/", Pattern.CASE_INSENSITIVE), "Edge");
        BROWSERS.put(Pattern.compile("opr/|opera", Pattern.CASE_INSENSITIVE), "Opera");
        BROWSERS.put(Pattern.compile("firefox|fxios", Pattern.CASE_INSENSITIVE), "Firefox");
        BROWSERS.put(Pattern.compile("chrome|crios", Pattern.CASE_INSENSITIVE), "Chrome");
        BROWSERS.put(Pattern.compile("safari", Pattern.CASE_INSENSITIVE), "Safari");

        SYSTEMS.put(Pattern.compile("iphone|ipad|ios", Pattern.CASE_INSENSITIVE), "iOS");
        SYSTEMS.put(Pattern.compile("android", Pattern.CASE_INSENSITIVE), "Android");
        SYSTEMS.put(Pattern.compile("windows", Pattern.CASE_INSENSITIVE), "Windows");
        SYSTEMS.put(Pattern.compile("mac os|macintosh", Pattern.CASE_INSENSITIVE), "macOS");
        SYSTEMS.put(Pattern.compile("linux", Pattern.CASE_INSENSITIVE), "Linux");
    }

    private UserAgentParser() {
    }

    /** Either part is null when it cannot be read. */
    public record Device(@Nullable String os, @Nullable String browser) {
    }

    public static Device parse(@Nullable String userAgent) {
        String ua = userAgent == null ? "" : userAgent;
        return new Device(firstMatch(SYSTEMS, ua), firstMatch(BROWSERS, ua));
    }

    @Nullable
    private static String firstMatch(Map<Pattern, String> patterns, String ua) {
        return patterns.entrySet().stream()
                .filter(e -> e.getKey().matcher(ua).find())
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
    }
}
