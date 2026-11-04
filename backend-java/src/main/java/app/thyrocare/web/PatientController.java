package app.thyrocare.web;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.thyrocare.domain.LabTestType;
import app.thyrocare.domain.User;
import app.thyrocare.repository.Repositories.MedicationLogRepository;
import app.thyrocare.repository.Repositories.MedicationRepository;
import app.thyrocare.service.AuditService;
import app.thyrocare.service.LabService;
import app.thyrocare.service.MedicationService;
import app.thyrocare.service.ProfileService;
import app.thyrocare.web.Dtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Every route here is ROLE_PATIENT-only and scoped to the caller's own id; ids from the path are owner-checked. */
@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
public class PatientController {
    private static final List<String> UPCOMING = List.of("appointments", "symptoms", "timeline", "documents", "education");

    private final ProfileService profiles;
    private final MedicationService medications;
    private final LabService labs;
    private final MedicationRepository medRepo;
    private final MedicationLogRepository logRepo;
    private final AuditService audit;

    @GetMapping("/profile")
    public ProfileBundle profile(@AuthenticationPrincipal User me) {
        return profiles.load(me.getId());
    }

    @PutMapping("/profile/personal")
    public PersonalDto savePersonal(@Valid @RequestBody PersonalRequest body, @AuthenticationPrincipal User me) {
        PersonalDto saved = profiles.savePersonal(me.getId(), body);
        audit.log(me, "update", "patient_profile", me.getId());
        return saved;
    }

    @PutMapping("/profile/medical")
    public MedicalDto saveMedical(@Valid @RequestBody MedicalRequest body, @AuthenticationPrincipal User me) {
        MedicalDto saved = profiles.saveMedical(me.getId(), body);
        audit.log(me, "update", "medical_profile", me.getId());
        return saved;
    }

    @GetMapping("/dashboard")
    public DashboardDto dashboard(@AuthenticationPrincipal User me) {
        ProfileBundle bundle = profiles.load(me.getId());
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        return new DashboardDto(UserDto.from(me), bundle, ProfileService.completeness(bundle), profiles.careTeam(me.getId()),
                UPCOMING, medRepo.countByPatient_IdAndActiveTrue(me.getId()),
                logRepo.countByPatient_IdAndStatusAndTakenAtAfter(me.getId(), "missed", weekAgo),
                labs.latestPerType(me.getId()));
    }

    // ---------- medications ----------
    @GetMapping("/medications")
    public List<MedicationDto> medications(@AuthenticationPrincipal User me) {
        return medications.list(me.getId());
    }

    @PostMapping("/medications")
    public MedicationDto createMedication(@Valid @RequestBody MedicationRequest body, @AuthenticationPrincipal User me) {
        MedicationDto dto = medications.create(me.getId(), body);
        audit.log(me, "create", "medication", dto.id());
        return dto;
    }

    @PutMapping("/medications/{id}")
    public MedicationDto updateMedication(@PathVariable UUID id, @Valid @RequestBody MedicationRequest body,
                                          @AuthenticationPrincipal User me) {
        MedicationDto dto = medications.update(me.getId(), id, body);
        audit.log(me, "update", "medication", id);
        return dto;
    }

    @DeleteMapping("/medications/{id}")
    public Map<String, Boolean> deleteMedication(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        medications.delete(me.getId(), id);
        audit.log(me, "delete", "medication", id);
        return Map.of("ok", true);
    }

    @GetMapping("/medications/{id}/logs")
    public List<MedicationLogDto> medicationLogs(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        return medications.logs(me.getId(), id);
    }

    @PostMapping("/medications/{id}/logs")
    public MedicationLogDto addLog(@PathVariable UUID id, @Valid @RequestBody MedicationLogRequest body,
                                   @AuthenticationPrincipal User me) {
        MedicationLogDto dto = medications.addLog(me.getId(), id, body);
        audit.log(me, "create", "medication_log", dto.id());
        return dto;
    }

    @DeleteMapping("/medication-logs/{logId}")
    public Map<String, Boolean> deleteLog(@PathVariable UUID logId, @AuthenticationPrincipal User me) {
        medications.deleteLog(me.getId(), logId);
        audit.log(me, "delete", "medication_log", logId);
        return Map.of("ok", true);
    }

    // ---------- labs ----------
    @GetMapping("/labs")
    public List<LabDto> labs(@RequestParam(name = "test_type", required = false) LabTestType type,
                             @AuthenticationPrincipal User me) {
        return labs.list(me.getId(), type);
    }

    @PostMapping("/labs")
    public LabDto createLab(@Valid @RequestBody LabRequest body, @AuthenticationPrincipal User me) {
        LabDto dto = labs.create(me.getId(), body);
        audit.log(me, "create", "lab_result", dto.id());
        return dto;
    }

    @PutMapping("/labs/{id}")
    public LabDto updateLab(@PathVariable UUID id, @Valid @RequestBody LabRequest body, @AuthenticationPrincipal User me) {
        LabDto dto = labs.update(me.getId(), id, body);
        audit.log(me, "update", "lab_result", id);
        return dto;
    }

    @DeleteMapping("/labs/{id}")
    public Map<String, Boolean> deleteLab(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        labs.delete(me.getId(), id);
        audit.log(me, "delete", "lab_result", id);
        return Map.of("ok", true);
    }
}
