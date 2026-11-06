CREATE TABLE lab_targets (
    id           UUID PRIMARY KEY,
    physician_id UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    patient_id   UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    test_type    VARCHAR(10)    NOT NULL,
    unit         VARCHAR(20)    NOT NULL,
    target_low   NUMERIC(12, 4),
    target_high  NUMERIC(12, 4),
    updated_at   TIMESTAMPTZ    NOT NULL,
    CONSTRAINT uq_lab_target UNIQUE (physician_id, patient_id, test_type)
);
CREATE INDEX idx_lab_targets_physician ON lab_targets (physician_id);

CREATE TABLE symptom_entries (
    id          UUID PRIMARY KEY,
    patient_id  UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    entry_date  DATE        NOT NULL,
    mood        VARCHAR(20) NOT NULL,
    notes       VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_symptom_day UNIQUE (patient_id, entry_date)
);

CREATE TABLE symptom_scores (
    entry_id    UUID        NOT NULL REFERENCES symptom_entries (id) ON DELETE CASCADE,
    symptom_key VARCHAR(30) NOT NULL,
    score       INT         NOT NULL,
    PRIMARY KEY (entry_id, symptom_key)
);
