package app.thyrocare.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import app.thyrocare.domain.*;
import app.thyrocare.repository.Repositories.AssignmentRepository;
import app.thyrocare.repository.Repositories.MedicalProfileRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.service.AccessService;
import app.thyrocare.service.LabService;
import app.thyrocare.service.MedicationService;
import app.thyrocare.service.ProfileService;
import app.thyrocare.web.Dtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Read-only access to the patients an admin has assigned to the calling physician. */
@RestController
@RequestMapping("/api/physician")
@RequiredArgsConstructor
public class PhysicianController {
    private final AssignmentRepository assignments;
    private final UserRepository users;
    private final MedicalProfileRepository medicalRepo;
    private final AccessService access;
    private final ProfileService profiles;
    private final MedicationService medications;
    private final LabService labs;

    @GetMapping("/patients")
    @Transactional(readOnly = true)
    public List<PatientSummaryDto> patients(@AuthenticationPrincipal User me) {
        List<UUID> ids = assignments.findByPhysician_Id(me.getId()).stream().map(a -> a.getPatient().getId()).toList();
        Map<UUID, MedicalProfile> medical = medicalRepo.findByPatient_IdIn(ids).stream()
                .collect(Collectors.toMap(m -> m.getPatient().getId(), Function.identity()));
        return users.findByIdInAndRoleAndStatusOrderByNameAsc(ids, Role.patient, UserStatus.active).stream().map(p -> {
            MedicalProfile m = medical.get(p.getId());
            return new PatientSummaryDto(p.getId(), p.getName(), p.getEmail(), p.getStatus(),
                    m == null ? null : m.getCancerType(), m == null ? null : m.getSurgeryDate(),
                    m == null ? null : m.getUpdatedAt());
        }).toList();
    }

    @GetMapping("/patients/{id}")
    public PatientDetailDto patient(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        User p = access.assignedPatient(me, id, "view");
        ProfileBundle bundle = profiles.load(id);
        return new PatientDetailDto(new PatientBasic(p.getId(), p.getName(), p.getEmail(), p.getPhone(), p.getStatus()),
                bundle, ProfileService.completeness(bundle));
    }

    @GetMapping("/patients/{id}/medications")
    public List<MedicationDto> patientMedications(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "view_medications");
        return medications.list(id);
    }

    @GetMapping("/patients/{id}/labs")
    public List<LabDto> patientLabs(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "view_labs");
        return labs.list(id, null);
    }
}
