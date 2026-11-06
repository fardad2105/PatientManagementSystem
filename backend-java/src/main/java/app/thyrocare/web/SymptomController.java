package app.thyrocare.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.thyrocare.domain.User;
import app.thyrocare.service.AccessService;
import app.thyrocare.service.AuditService;
import app.thyrocare.service.SymptomService;
import app.thyrocare.web.Dtos.SymptomDto;
import app.thyrocare.web.Dtos.SymptomRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Patient symptom check-ins (owner-scoped) and read-only access for assigned physicians. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SymptomController {
    private final SymptomService symptoms;
    private final AccessService access;
    private final AuditService audit;

    @GetMapping("/patient/symptoms")
    public List<SymptomDto> list(@RequestParam(defaultValue = "180") int days, @AuthenticationPrincipal User me) {
        return symptoms.list(me.getId(), days);
    }

    @PutMapping("/patient/symptoms")
    public SymptomDto save(@Valid @RequestBody SymptomRequest body, @AuthenticationPrincipal User me) {
        SymptomDto dto = symptoms.save(me.getId(), body);
        audit.log(me, "upsert", "symptom_entry", dto.id());
        return dto;
    }

    @DeleteMapping("/patient/symptoms/{id}")
    public Map<String, Boolean> delete(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        symptoms.delete(me.getId(), id);
        audit.log(me, "delete", "symptom_entry", id);
        return Map.of("ok", true);
    }

    @GetMapping("/physician/patients/{id}/symptoms")
    public List<SymptomDto> patientSymptoms(@PathVariable UUID id, @RequestParam(defaultValue = "180") int days,
                                            @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "view_symptoms");
        return symptoms.list(id, days);
    }
}
