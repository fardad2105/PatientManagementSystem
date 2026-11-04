package app.thyrocare.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.thyrocare.domain.User;
import app.thyrocare.service.AppointmentService;
import app.thyrocare.service.AuditService;
import app.thyrocare.web.Dtos.AppointmentDto;
import app.thyrocare.web.Dtos.AppointmentRequest;
import app.thyrocare.web.Dtos.AppointmentStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** ROLE_PATIENT (via /api/patient/**); every lookup is scoped to the caller's own appointments. */
@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
public class AppointmentController {
    private final AppointmentService appointments;
    private final AuditService audit;

    @GetMapping("/appointments")
    public List<AppointmentDto> list(@RequestParam(required = false) String scope, @AuthenticationPrincipal User me) {
        return appointments.list(me.getId(), scope);
    }

    @GetMapping("/reminders")
    public List<AppointmentDto> reminders(@AuthenticationPrincipal User me) {
        return appointments.dueReminders(me.getId());
    }

    @PostMapping("/appointments")
    public AppointmentDto create(@Valid @RequestBody AppointmentRequest body, @AuthenticationPrincipal User me) {
        AppointmentDto dto = appointments.create(me.getId(), body);
        audit.log(me, "create", "appointment", dto.id());
        return dto;
    }

    @PutMapping("/appointments/{id}")
    public AppointmentDto update(@PathVariable UUID id, @Valid @RequestBody AppointmentRequest body,
                                 @AuthenticationPrincipal User me) {
        AppointmentDto dto = appointments.update(me.getId(), id, body);
        audit.log(me, "update", "appointment", id);
        return dto;
    }

    @PatchMapping("/appointments/{id}/status")
    public AppointmentDto status(@PathVariable UUID id, @Valid @RequestBody AppointmentStatusRequest body,
                                 @AuthenticationPrincipal User me) {
        AppointmentDto dto = appointments.setStatus(me.getId(), id, body.status());
        audit.log(me, "set_status:" + body.status(), "appointment", id);
        return dto;
    }

    @DeleteMapping("/appointments/{id}")
    public Map<String, Boolean> delete(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        appointments.delete(me.getId(), id);
        audit.log(me, "delete", "appointment", id);
        return Map.of("ok", true);
    }
}
