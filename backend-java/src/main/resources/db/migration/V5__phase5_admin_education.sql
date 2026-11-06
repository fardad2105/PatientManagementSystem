ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;

ALTER TABLE audit_logs ADD COLUMN actor_name VARCHAR(120);
ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON audit_logs (action, created_at DESC);

CREATE TABLE education_contents (
    id            UUID PRIMARY KEY,
    title         VARCHAR(160)  NOT NULL,
    content_type  VARCHAR(20)   NOT NULL,
    summary       VARCHAR(300),
    body          TEXT,
    media_url     VARCHAR(500),
    status        VARCHAR(20)   NOT NULL,
    reviewer_name VARCHAR(120),
    reviewed_at   TIMESTAMPTZ,
    view_count    INT           NOT NULL DEFAULT 0,
    created_by    UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ   NOT NULL,
    updated_at    TIMESTAMPTZ   NOT NULL
);
CREATE INDEX idx_education_status ON education_contents (status, updated_at DESC);
