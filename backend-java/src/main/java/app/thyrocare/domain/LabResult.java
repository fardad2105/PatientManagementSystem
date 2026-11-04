package app.thyrocare.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A recorded lab value with the lab's own reference range; never interpreted by the system. */
@Entity
@Table(name = "lab_results")
@Getter
@Setter
@NoArgsConstructor
public class LabResult {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LabTestType testType;

    @Column(name = "result_value", nullable = false, precision = 12, scale = 4)
    private BigDecimal value;

    @Column(nullable = false)
    private String unit;

    @Column(nullable = false)
    private LocalDate sampleDate;

    private String labName;

    @Column(precision = 12, scale = 4)
    private BigDecimal refLow;

    @Column(precision = 12, scale = 4)
    private BigDecimal refHigh;

    private String refText;

    @Column(nullable = false)
    private String source = "patient_reported";

    @Column(nullable = false)
    private UUID enteredBy;

    private String notes;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
