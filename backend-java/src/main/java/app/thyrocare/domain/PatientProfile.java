package app.thyrocare.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "patient_profiles")
@Getter
@Setter
@NoArgsConstructor
public class PatientProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false, unique = true)
    private User patient;

    private String firstName;
    private String lastName;
    private String nationalId;
    private LocalDate birthDate;
    private String gender;
    private String phone;
    private String city;
    private String address;
    private String emergencyContactName;
    private String emergencyContactRelation;
    private String emergencyContactPhone;
    private Instant updatedAt;
}
