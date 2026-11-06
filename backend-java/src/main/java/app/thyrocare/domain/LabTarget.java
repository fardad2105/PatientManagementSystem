package app.thyrocare.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A target range set by a physician for one of their assigned patients; used only for neutral out-of-range flags. */
@Entity
@Table(name = "lab_targets")
@Getter
@Setter
@NoArgsConstructor
public class LabTarget {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "physician_id", nullable = false)
    private User physician;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LabTestType testType;

    @Column(nullable = false)
    private String unit;

    @Column(precision = 12, scale = 4)
    private BigDecimal targetLow;

    @Column(precision = 12, scale = 4)
    private BigDecimal targetHigh;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
