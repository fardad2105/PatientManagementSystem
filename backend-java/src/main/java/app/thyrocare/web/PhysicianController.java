package app.thyrocare.web;

import java.util.List;
import java.util.UUID;

import app.thyrocare.domain.User;
import app.thyrocare.service.AccessService;
import app.thyrocare.service.AppointmentService;
import app.thyrocare.service.AuditService;
import app.thyrocare.service.LabService;
import app.thyrocare.service.MedicationService;
import app.thyrocare.service.PhysicianInsightService;
import app.thyrocare.service.ProfileService;
import app.thyrocare.web.Dtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Access to the patients an admin has assigned to the calling physician. Only target ranges are writable. */
@RestController
@RequestMapping("/api/physician")
@RequiredArgsConstructor
public class PhysicianController {
    private final AccessService access;
    private final ProfileService profiles;
    private final MedicationService medications;
    private final LabService labs;
    private final AppointmentService appointments;
    private final PhysicianInsightService insights;
    private final AuditService audit;

    @GetMapping("/dashboard")
    public PhysicianDashboardDto dashboard(@AuthenticationPrincipal User me) {
        return insights.dashboard(me);
    }

    @GetMapping("/patients")
    public List<PatientSummaryDto> patients(@AuthenticationPrincipal User me) {
        return insights.patients(me);
    }

    @GetMapping("/alerts")
    public List<PatientSummaryDto> alerts(@AuthenticationPrincipal User me) {
        return insights.alerts(me);
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

    @GetMapping("/patients/{id}/appointments")
    public List<AppointmentDto> patientAppointments(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "view_appointments");
        return appointments.list(id, "all");
    }

    @GetMapping("/patients/{id}/labs")
    public List<LabDto> patientLabs(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "view_labs");
        return labs.list(id, null);
    }

    @GetMapping("/patients/{id}/targets")
    public List<TargetDto> targets(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "view_targets");
        return insights.targets(me, id);
    }

    @PutMapping("/patients/{id}/targets")
    public List<TargetDto> saveTargets(@PathVariable UUID id, @Valid @RequestBody TargetsRequest body,
                                       @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "update_targets");
        List<TargetDto> saved = insights.saveTargets(me, id, body.targets());
        audit.log(me, "update", "lab_targets", id);
        return saved;
    }
}
