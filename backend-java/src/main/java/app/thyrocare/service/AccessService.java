package app.thyrocare.service;

import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.Role;
import app.thyrocare.domain.User;
import app.thyrocare.domain.UserStatus;
import app.thyrocare.repository.Repositories.AssignmentRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Relationship check: a physician reaches a patient only through an admin-created assignment. */
@Service
@RequiredArgsConstructor
public class AccessService {
    private final AssignmentRepository assignments;
    private final UserRepository users;
    private final AuditService audit;

    public User assignedPatient(User physician, UUID patientId, String action) {
        boolean linked = assignments.existsByPhysician_IdAndPatient_Id(physician.getId(), patientId);
        User patient = linked ? users.findById(patientId)
                .filter(u -> u.getRole() == Role.patient && u.getStatus() == UserStatus.active).orElse(null) : null;
        if (patient == null) {
            audit.log(physician, action, "patient_record", patientId, "deny", "not assigned");
            throw ApiException.notFound("بیمار یافت نشد");
        }
        audit.log(physician, action, "patient_record", patientId);
        return patient;
    }
}
