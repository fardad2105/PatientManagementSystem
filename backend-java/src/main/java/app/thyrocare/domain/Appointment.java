package app.thyrocare.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A follow-up appointment entered by the patient, with an optional in-app reminder window. */
@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String appointmentType;

    @Column(nullable = false)
    private Instant scheduledAt;

    private String location;
    private String physicianName;
    private String notes;

    @Column(nullable = false)
    private String status = "scheduled";

    private Integer remindBeforeMinutes;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public Instant reminderAt() {
        return remindBeforeMinutes == null ? null : scheduledAt.minusSeconds(remindBeforeMinutes * 60L);
    }
}
