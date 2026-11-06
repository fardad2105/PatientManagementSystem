package app.thyrocare.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.thyrocare.domain.User;
import app.thyrocare.service.AccessService;
import app.thyrocare.service.AuditService;
import app.thyrocare.service.EducationService;
import app.thyrocare.service.MedicationWeekService;
import app.thyrocare.web.Dtos.EducationDto;
import app.thyrocare.web.Dtos.EducationRequest;
import app.thyrocare.web.Dtos.MedicationWeekResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Phase 5: admin education content management and weekly medication intake view (patient + assigned physician). */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class Phase5Controller {
    private final EducationService education;
    private final MedicationWeekService week;
    private final AccessService access;
    private final AuditService audit;

    @GetMapping("/admin/education")
    public List<EducationDto> list() {
        return education.list();
    }

    @PostMapping("/admin/education")
    public EducationDto create(@Valid @RequestBody EducationRequest body, @AuthenticationPrincipal User me) {
        EducationDto dto = education.create(me.getId(), body);
        audit.log(me, "create_content", "education_content", dto.id());
        return dto;
    }

    @PutMapping("/admin/education/{id}")
    public EducationDto update(@PathVariable UUID id, @Valid @RequestBody EducationRequest body, @AuthenticationPrincipal User me) {
        EducationDto dto = education.update(id, body);
        audit.log(me, "update_content:" + body.status(), "education_content", id);
        return dto;
    }

    @DeleteMapping("/admin/education/{id}")
    public Map<String, Boolean> delete(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        education.delete(id);
        audit.log(me, "delete_content", "education_content", id);
        return Map.of("ok", true);
    }

    @GetMapping("/patient/medications/week")
    public MedicationWeekResponse myWeek(@RequestParam(defaultValue = "0") int offset, @AuthenticationPrincipal User me) {
        return week.week(me.getId(), offset);
    }

    @GetMapping("/physician/patients/{id}/medications/week")
    public MedicationWeekResponse patientWeek(@PathVariable UUID id, @RequestParam(defaultValue = "0") int offset,
                                              @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "view_medication_week");
        return week.week(id, offset);
    }
}
