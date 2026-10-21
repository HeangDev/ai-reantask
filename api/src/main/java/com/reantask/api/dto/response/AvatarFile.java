package com.reantask.api.dto.response;

/** A stored avatar image ready to be streamed back to a client. */
public record AvatarFile(byte[] content, String contentType) { }
