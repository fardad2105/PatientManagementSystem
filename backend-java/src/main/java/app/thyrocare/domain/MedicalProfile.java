package app.thyrocare.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "medical_profiles")
@Getter
@Setter
@NoArgsConstructor
public class MedicalProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false, unique = true)
    private User patient;

    private String cancerType;
    private LocalDate diagnosisDate;
    private LocalDate surgeryDate;
    private String surgeryType;
    private String lymphNodeDissection;
    private String raiReceived;
    private Integer raiSessions;
    private LocalDate lastRaiDate;
    private String stagingText;
    private String otherConditions;
    private String allergies;
    private String notes;

    @Column(nullable = false)
    private String source = "patient_reported";

    private Instant updatedAt;
    private UUID updatedBy;
}
