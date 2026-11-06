package app.thyrocare.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Educational item managed by the admin; it can only be published once a specialist reviewer is recorded. */
@Entity
@Table(name = "education_contents")
@Getter
@Setter
@NoArgsConstructor
public class EducationContent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String contentType;

    private String summary;

    @Column(columnDefinition = "TEXT")
    private String body;

    private String mediaUrl;

    @Column(nullable = false)
    private String status;

    private String reviewerName;
    private Instant reviewedAt;

    @Column(nullable = false)
    private int viewCount;

    private UUID createdBy;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
