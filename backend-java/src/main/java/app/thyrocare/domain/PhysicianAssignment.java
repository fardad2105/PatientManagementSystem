package app.thyrocare.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "physician_assignments",
        uniqueConstraints = @UniqueConstraint(name = "uq_assignment", columnNames = {"patient_id", "physician_id"}))
@Getter
@Setter
@NoArgsConstructor
public class PhysicianAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "physician_id", nullable = false)
    private User physician;

    private UUID assignedBy;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
