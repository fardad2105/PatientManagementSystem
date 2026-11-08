CREATE TABLE medical_documents (
    id                UUID PRIMARY KEY,
    patient_id        UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category          VARCHAR(20)   NOT NULL,
    title             VARCHAR(160)  NOT NULL,
    document_date     DATE,
    notes             VARCHAR(1000),
    storage_path      VARCHAR(300)  NOT NULL,
    original_filename VARCHAR(255)  NOT NULL,
    content_type      VARCHAR(100)  NOT NULL,
    size_bytes        BIGINT        NOT NULL,
    deleted           BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ   NOT NULL
);
CREATE INDEX idx_documents_patient ON medical_documents (patient_id, deleted, created_at DESC);

CREATE TABLE neck_ultrasounds (
    id                     UUID PRIMARY KEY,
    patient_id             UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    exam_date              DATE          NOT NULL,
    imaging_center         VARCHAR(160),
    radiologist_name       VARCHAR(120),
    reason                 VARCHAR(30),
    reason_text            VARCHAR(200),
    thyroid_bed_status     VARCHAR(20),
    residual_tissue        VARCHAR(10),
    bed_finding            VARCHAR(10),
    lymph_node_status      VARCHAR(20),
    finding_location       VARCHAR(20),
    finding_location_text  VARCHAR(120),
    finding_size_mm        NUMERIC(6, 1),
    descriptive_features   VARCHAR(4000),
    radiologist_conclusion VARCHAR(8000),
    report_document_id     UUID REFERENCES medical_documents (id) ON DELETE SET NULL,
    created_at             TIMESTAMPTZ   NOT NULL,
    updated_at             TIMESTAMPTZ   NOT NULL
);
CREATE INDEX idx_ultrasounds_patient ON neck_ultrasounds (patient_id, exam_date DESC);

CREATE TABLE ultrasound_findings (
    id             UUID PRIMARY KEY,
    ultrasound_id  UUID          NOT NULL REFERENCES neck_ultrasounds (id) ON DELETE CASCADE,
    sort_order     INT           NOT NULL,
    location       VARCHAR(20)   NOT NULL,
    location_text  VARCHAR(120),
    finding_type   VARCHAR(160),
    length_mm      NUMERIC(6, 1),
    width_mm       NUMERIC(6, 1),
    height_mm      NUMERIC(6, 1),
    description    VARCHAR(2000)
);

CREATE TABLE physician_notes (
    id           UUID PRIMARY KEY,
    physician_id UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    patient_id   UUID          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    target_type  VARCHAR(20)   NOT NULL,
    target_id    UUID,
    body         VARCHAR(2000) NOT NULL,
    created_at   TIMESTAMPTZ   NOT NULL,
    updated_at   TIMESTAMPTZ   NOT NULL
);
CREATE INDEX idx_physician_notes_patient ON physician_notes (patient_id, created_at DESC);
