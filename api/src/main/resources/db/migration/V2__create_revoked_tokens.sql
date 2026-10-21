-- Access tokens revoked by logout. A row is only needed until the token would have expired anyway.

CREATE TABLE revoked_tokens (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    jti        VARCHAR(64)  NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT uq_revoked_tokens_jti UNIQUE (jti)
);

-- Cleanup of expired rows filters on expires_at.
CREATE INDEX idx_revoked_tokens_expires_at ON revoked_tokens (expires_at);
