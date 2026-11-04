package app.thyrocare.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A medication exactly as prescribed by the physician; the system never suggests or changes doses. */
@Entity
@Table(name = "medications")
@Getter
@Setter
@NoArgsConstructor
public class Medication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String doseText;

    private String frequencyText;
    private String instructions;
    private String prescriberName;
    private LocalDate startDate;
    private LocalDate endDate;

    @Column(nullable = false)
    private boolean active = true;

    private String notes;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
