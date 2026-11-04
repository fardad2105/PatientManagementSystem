package app.thyrocare.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.thyrocare.domain.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** All Spring Data repositories in one place; patient-owned lookups always include the patient id. */
public final class Repositories {
    private Repositories() {
    }

    public interface UserRepository extends JpaRepository<User, UUID> {
        Optional<User> findByEmail(String email);

        boolean existsByEmail(String email);

        long countByRoleAndStatus(Role role, UserStatus status);

        List<User> findByIdInAndRoleAndStatusOrderByNameAsc(Collection<UUID> ids, Role role, UserStatus status);
    }

    public interface PatientProfileRepository extends JpaRepository<PatientProfile, UUID> {
        Optional<PatientProfile> findByPatient_Id(UUID patientId);
    }

    public interface MedicalProfileRepository extends JpaRepository<MedicalProfile, UUID> {
        Optional<MedicalProfile> findByPatient_Id(UUID patientId);

        List<MedicalProfile> findByPatient_IdIn(Collection<UUID> patientIds);
    }

    public interface AssignmentRepository extends JpaRepository<PhysicianAssignment, UUID> {
        List<PhysicianAssignment> findByPhysician_Id(UUID physicianId);

        List<PhysicianAssignment> findByPatient_Id(UUID patientId);

        boolean existsByPhysician_IdAndPatient_Id(UUID physicianId, UUID patientId);

        List<PhysicianAssignment> findAllByOrderByCreatedAtDesc();
    }

    public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
        List<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    }

    public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, String> {
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("select a from LoginAttempt a where a.identifier = :id")
        Optional<LoginAttempt> findForUpdate(@Param("id") String identifier);
    }

    public interface MedicationRepository extends JpaRepository<Medication, UUID> {
        List<Medication> findByPatient_IdOrderByActiveDescCreatedAtDesc(UUID patientId);

        Optional<Medication> findByIdAndPatient_Id(UUID id, UUID patientId);

        long countByPatient_IdAndActiveTrue(UUID patientId);
    }

    public interface MedicationLogRepository extends JpaRepository<MedicationLog, UUID> {
        List<MedicationLog> findTop30ByMedication_IdOrderByTakenAtDesc(UUID medicationId);

        Optional<MedicationLog> findFirstByMedication_IdOrderByTakenAtDesc(UUID medicationId);

        Optional<MedicationLog> findByIdAndPatient_Id(UUID id, UUID patientId);

        long countByPatient_IdAndStatusAndTakenAtAfter(UUID patientId, String status, Instant after);
    }

    public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
        List<Appointment> findByPatient_IdOrderByScheduledAtAsc(UUID patientId);

        List<Appointment> findByPatient_IdAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(UUID patientId, String status, Instant after);

        Optional<Appointment> findByIdAndPatient_Id(UUID id, UUID patientId);
    }

    public interface LabResultRepository extends JpaRepository<LabResult, UUID> {
        List<LabResult> findByPatient_IdOrderBySampleDateAscCreatedAtAsc(UUID patientId);

        List<LabResult> findByPatient_IdAndTestTypeOrderBySampleDateAscCreatedAtAsc(UUID patientId, LabTestType type);

        Optional<LabResult> findByIdAndPatient_Id(UUID id, UUID patientId);

        Optional<LabResult> findFirstByPatient_IdAndTestTypeOrderBySampleDateDescCreatedAtDesc(UUID patientId, LabTestType type);
    }
}
