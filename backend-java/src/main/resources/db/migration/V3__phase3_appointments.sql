CREATE TABLE appointments (
    id                    UUID PRIMARY KEY,
    patient_id            UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title                 VARCHAR(120) NOT NULL,
    appointment_type      VARCHAR(20)  NOT NULL,
    scheduled_at          TIMESTAMPTZ  NOT NULL,
    location              VARCHAR(200),
    physician_name        VARCHAR(80),
    notes                 VARCHAR(500),
    status                VARCHAR(20)  NOT NULL,
    remind_before_minutes INT,
    created_at            TIMESTAMPTZ  NOT NULL,
    updated_at            TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_appointments_patient ON appointments (patient_id, scheduled_at);
