-- roles, users, user_settings (user feature)

CREATE TABLE roles (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    status     VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT uq_roles_name UNIQUE (name),
    CONSTRAINT chk_roles_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE users (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id           BIGINT       NOT NULL,
    fullname          VARCHAR(255) NOT NULL,
    email             VARCHAR(150) NOT NULL,
    google_id         VARCHAR(255),
    phone             VARCHAR(20),
    password          VARCHAR(255) NOT NULL,
    avatar            VARCHAR(255),
    status            VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    email_verified_at TIMESTAMPTZ,
    created_at        TIMESTAMPTZ,
    created_by_user   BIGINT,
    updated_at        TIMESTAMPTZ,
    updated_by_user   BIGINT,
    deleted_at        TIMESTAMPTZ,
    deleted_by_user   BIGINT,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_google_id UNIQUE (google_id),
    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT chk_users_status CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED')),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT,
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by_user) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by_user) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by_user) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_users_role_id ON users (role_id);
CREATE INDEX idx_users_status_deleted_at ON users (status, deleted_at);
CREATE INDEX idx_users_created_by_user ON users (created_by_user);
CREATE INDEX idx_users_updated_by_user ON users (updated_by_user);
CREATE INDEX idx_users_deleted_by_user ON users (deleted_by_user);

CREATE TABLE user_settings (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT       NOT NULL,
    theme_mode          VARCHAR(20)  NOT NULL DEFAULT 'SYSTEM',
    language            VARCHAR(10)  NOT NULL DEFAULT 'EN',
    timezone            VARCHAR(100) NOT NULL DEFAULT 'Asia/Phnom_Penh',
    email_notifications BOOLEAN      NOT NULL DEFAULT TRUE,
    push_notifications  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ,
    CONSTRAINT uq_user_settings_user_id UNIQUE (user_id),
    CONSTRAINT chk_user_settings_theme_mode CHECK (theme_mode IN ('LIGHT', 'DARK', 'SYSTEM')),
    CONSTRAINT chk_user_settings_language CHECK (language IN ('EN', 'KH', 'KO')),
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
