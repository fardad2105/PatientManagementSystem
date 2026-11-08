package app.thyrocare.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Patient-uploaded file (lab sheet, report, image). Bytes live in object storage; soft-delete only. */
@Entity
@Table(name = "medical_documents")
@Getter
@Setter
@NoArgsConstructor
public class MedicalDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String title;

    private LocalDate documentDate;
    private String notes;

    @Column(nullable = false)
    private String storagePath;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private boolean deleted;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
