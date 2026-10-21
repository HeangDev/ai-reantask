-- class_subjects (classes feature). A teacher teaches a subject in a class. Soft-deletable, audited.
-- (class_id, subject_id) stays reserved after a soft delete (plain unique constraint): restore, don't insert.

CREATE TABLE class_subjects (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    class_id        BIGINT      NOT NULL,
    subject_id      BIGINT      NOT NULL,
    teacher_id      BIGINT      NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ,
    created_by_user BIGINT,
    updated_at      TIMESTAMPTZ,
    updated_by_user BIGINT,
    deleted_at      TIMESTAMPTZ,
    deleted_by_user BIGINT,
    CONSTRAINT uq_class_subjects UNIQUE (class_id, subject_id),
    CONSTRAINT chk_class_subjects_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DELETED')),
    CONSTRAINT fk_class_subjects_class FOREIGN KEY (class_id) REFERENCES classes (id),
    CONSTRAINT fk_class_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects (id),
    CONSTRAINT fk_class_subjects_teacher FOREIGN KEY (teacher_id) REFERENCES users (id),
    CONSTRAINT fk_class_subjects_created_by FOREIGN KEY (created_by_user) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_class_subjects_updated_by FOREIGN KEY (updated_by_user) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_class_subjects_deleted_by FOREIGN KEY (deleted_by_user) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_class_subjects_subject_id ON class_subjects (subject_id);
CREATE INDEX idx_class_subjects_teacher_id ON class_subjects (teacher_id);
CREATE INDEX idx_class_subjects_created_by_user ON class_subjects (created_by_user);
CREATE INDEX idx_class_subjects_updated_by_user ON class_subjects (updated_by_user);
CREATE INDEX idx_class_subjects_deleted_by_user ON class_subjects (deleted_by_user);
