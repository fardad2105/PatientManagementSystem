CREATE TABLE users (
    id                  UUID PRIMARY KEY,
    email               VARCHAR(255) NOT NULL UNIQUE,
    name                VARCHAR(80)  NOT NULL,
    role                VARCHAR(20)  NOT NULL,
    status              VARCHAR(20)  NOT NULL,
    phone               VARCHAR(20),
    specialty           VARCHAR(80),
    password_hash       VARCHAR(100) NOT NULL,
    token_version       INT          NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL,
    status_changed_at   TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ
);
CREATE INDEX idx_users_role_status ON users (role, status);

CREATE TABLE patient_profiles (
    id                         UUID PRIMARY KEY,
    patient_id                 UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    first_name                 VARCHAR(60),
    last_name                  VARCHAR(60),
    national_id                VARCHAR(10),
    birth_date                 DATE,
    gender                     VARCHAR(10),
    phone                      VARCHAR(20),
    city                       VARCHAR(60),
    address                    VARCHAR(300),
    emergency_contact_name     VARCHAR(80),
    emergency_contact_relation VARCHAR(40),
    emergency_contact_phone    VARCHAR(20),
    updated_at                 TIMESTAMPTZ
);

CREATE TABLE medical_profiles (
    id                    UUID PRIMARY KEY,
    patient_id            UUID        NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    cancer_type           VARCHAR(20),
    diagnosis_date        DATE,
    surgery_date          DATE,
    surgery_type          VARCHAR(20),
    lymph_node_dissection VARCHAR(10),
    rai_received          VARCHAR(10),
    rai_sessions          INT,
    last_rai_date         DATE,
    staging_text          VARCHAR(200),
    other_conditions      VARCHAR(500),
    allergies             VARCHAR(300),
    notes                 VARCHAR(1000),
    source                VARCHAR(30) NOT NULL,
    updated_at            TIMESTAMPTZ,
    updated_by            UUID
);

CREATE TABLE physician_assignments (
    id           UUID PRIMARY KEY,
    patient_id   UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    physician_id UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    assigned_by  UUID,
    created_at   TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_assignment UNIQUE (patient_id, physician_id)
);
CREATE INDEX idx_assignment_physician ON physician_assignments (physician_id);

CREATE TABLE audit_logs (
    id            UUID PRIMARY KEY,
    actor_id      UUID,
    actor_email   VARCHAR(255),
    actor_role    VARCHAR(20),
    action        VARCHAR(60)  NOT NULL,
    resource_type VARCHAR(60)  NOT NULL,
    resource_id   VARCHAR(64),
    outcome       VARCHAR(10)  NOT NULL,
    details       VARCHAR(500),
    created_at    TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_audit_created ON audit_logs (created_at DESC);

CREATE TABLE login_attempts (
    identifier    VARCHAR(255) PRIMARY KEY,
    attempt_count INT NOT NULL,
    locked_until  TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ
);
