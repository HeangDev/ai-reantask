-- classes (classes feature). Soft-deletable, audited. `code` is the server-generated join code.
-- The code stays reserved after a soft delete (plain unique constraint).

CREATE TABLE classes (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    code            CHAR(6)      NOT NULL,
    description     TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    start_at        DATE         NOT NULL,
    end_date        DATE         NOT NULL,
    created_at      TIMESTAMPTZ,
    created_by_user BIGINT,
    updated_at      TIMESTAMPTZ,
    updated_by_user BIGINT,
    deleted_at      TIMESTAMPTZ,
    deleted_by_user BIGINT,
    CONSTRAINT uq_classes_code UNIQUE (code),
    CONSTRAINT chk_classes_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_classes_dates CHECK (end_date >= start_at),
    CONSTRAINT fk_classes_created_by FOREIGN KEY (created_by_user) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_classes_updated_by FOREIGN KEY (updated_by_user) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_classes_deleted_by FOREIGN KEY (deleted_by_user) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_classes_status_deleted_at ON classes (status, deleted_at);
CREATE INDEX idx_classes_created_by_user ON classes (created_by_user);
CREATE INDEX idx_classes_updated_by_user ON classes (updated_by_user);
CREATE INDEX idx_classes_deleted_by_user ON classes (deleted_by_user);
