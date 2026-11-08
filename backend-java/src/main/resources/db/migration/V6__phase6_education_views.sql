CREATE TABLE education_views (
    id         UUID PRIMARY KEY,
    content_id UUID        NOT NULL REFERENCES education_contents (id) ON DELETE CASCADE,
    patient_id UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    viewed_at  TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_education_view UNIQUE (content_id, patient_id)
);
CREATE INDEX idx_education_views_patient ON education_views (patient_id);
