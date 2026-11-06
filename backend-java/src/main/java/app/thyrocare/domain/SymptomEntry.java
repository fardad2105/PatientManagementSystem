package app.thyrocare.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One self-reported symptom check-in per patient per day: overall mood plus 0-10 severity per symptom. */
@Entity
@Table(name = "symptom_entries")
@Getter
@Setter
@NoArgsConstructor
public class SymptomEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private LocalDate entryDate;

    @Column(nullable = false)
    private String mood;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "symptom_scores", joinColumns = @JoinColumn(name = "entry_id"))
    @MapKeyColumn(name = "symptom_key")
    @Column(name = "score", nullable = false)
    private Map<String, Integer> scores = new HashMap<>();

    private String notes;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
