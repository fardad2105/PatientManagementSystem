package app.thyrocare.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** First time a patient opened a published education item; drives unique view counts and "new" badges. */
@Entity
@Table(name = "education_views")
@Getter
@Setter
@NoArgsConstructor
public class EducationView {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID contentId;

    @Column(nullable = false)
    private UUID patientId;

    @Column(nullable = false)
    private Instant viewedAt = Instant.now();
}
