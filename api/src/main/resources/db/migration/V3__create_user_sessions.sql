-- One row per login, tied to the access token it issued (jti). Active = not expired and not in revoked_tokens.

CREATE TABLE user_sessions (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    jti        VARCHAR(64)  NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT uq_user_sessions_jti UNIQUE (jti),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- "Active sessions of a user" filters on user_id and expires_at, newest first.
CREATE INDEX idx_user_sessions_user_id_expires_at ON user_sessions (user_id, expires_at);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions (expires_at);
