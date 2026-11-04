CREATE TABLE medications (
    id              UUID PRIMARY KEY,
    patient_id      UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name            VARCHAR(120) NOT NULL,
    dose_text       VARCHAR(80)  NOT NULL,
    frequency_text  VARCHAR(120),
    instructions    VARCHAR(300),
    prescriber_name VARCHAR(80),
    start_date      DATE,
    end_date        DATE,
    active          BOOLEAN      NOT NULL,
    notes           VARCHAR(500),
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_medications_patient ON medications (patient_id);

CREATE TABLE medication_logs (
    id            UUID PRIMARY KEY,
    medication_id UUID        NOT NULL REFERENCES medications (id) ON DELETE CASCADE,
    patient_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    taken_at      TIMESTAMPTZ NOT NULL,
    status        VARCHAR(10) NOT NULL,
    note          VARCHAR(300),
    created_at    TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_medication_logs_medication ON medication_logs (medication_id, taken_at DESC);

CREATE TABLE lab_results (
    id           UUID PRIMARY KEY,
    patient_id   UUID           NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    test_type    VARCHAR(10)    NOT NULL,
    result_value NUMERIC(12, 4) NOT NULL,
    unit         VARCHAR(20)    NOT NULL,
    sample_date  DATE           NOT NULL,
    lab_name     VARCHAR(120),
    ref_low      NUMERIC(12, 4),
    ref_high     NUMERIC(12, 4),
    ref_text     VARCHAR(120),
    source       VARCHAR(30)    NOT NULL,
    entered_by   UUID           NOT NULL,
    notes        VARCHAR(500),
    created_at   TIMESTAMPTZ    NOT NULL,
    updated_at   TIMESTAMPTZ    NOT NULL
);
CREATE INDEX idx_lab_results_patient ON lab_results (patient_id, test_type, sample_date);
