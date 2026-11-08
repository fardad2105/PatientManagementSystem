package app.thyrocare.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Free-text note an assigned physician attaches to a patient's ultrasound, document, or record; visible to the patient. */
@Entity
@Table(name = "physician_notes")
@Getter
@Setter
@NoArgsConstructor
public class PhysicianNote {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "physician_id", nullable = false)
    private User physician;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private String targetType;

    private UUID targetId;

    @Column(nullable = false)
    private String body;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
