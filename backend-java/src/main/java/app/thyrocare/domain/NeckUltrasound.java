package app.thyrocare.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Neck ultrasound report as transcribed by the patient from the radiologist's report. Stored verbatim, never interpreted. */
@Entity
@Table(name = "neck_ultrasounds")
@Getter
@Setter
@NoArgsConstructor
public class NeckUltrasound {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private LocalDate examDate;

    private String imagingCenter;
    private String radiologistName;
    private String reason;
    private String reasonText;
    private String thyroidBedStatus;
    private String residualTissue;
    private String bedFinding;
    private String lymphNodeStatus;
    private String findingLocation;
    private String findingLocationText;

    @Column(name = "finding_size_mm", precision = 6, scale = 1)
    private BigDecimal findingSizeMm;

    private String descriptiveFeatures;
    private String radiologistConclusion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_document_id")
    private MedicalDocument reportDocument;

    @OneToMany(mappedBy = "ultrasound", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<UltrasoundFinding> findings = new ArrayList<>();

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
