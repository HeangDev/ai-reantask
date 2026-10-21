-- subjects (classes feature). Soft-deletable, audited.

CREATE TABLE subjects (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ,
    created_by_user BIGINT,
    updated_at      TIMESTAMPTZ,
    updated_by_user BIGINT,
    deleted_at      TIMESTAMPTZ,
    deleted_by_user BIGINT,
    CONSTRAINT chk_subjects_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT fk_subjects_created_by FOREIGN KEY (created_by_user) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_subjects_updated_by FOREIGN KEY (updated_by_user) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_subjects_deleted_by FOREIGN KEY (deleted_by_user) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_subjects_status_deleted_at ON subjects (status, deleted_at);
CREATE INDEX idx_subjects_created_by_user ON subjects (created_by_user);
CREATE INDEX idx_subjects_updated_by_user ON subjects (updated_by_user);
CREATE INDEX idx_subjects_deleted_by_user ON subjects (deleted_by_user);
