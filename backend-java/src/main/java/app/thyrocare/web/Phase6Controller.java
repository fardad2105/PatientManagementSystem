package app.thyrocare.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.thyrocare.domain.User;
import app.thyrocare.service.AuditService;
import app.thyrocare.service.EducationLibraryService;
import app.thyrocare.service.TodayDoseService;
import app.thyrocare.web.Dtos.LibraryDetailDto;
import app.thyrocare.web.Dtos.LibraryItemDto;
import app.thyrocare.web.Dtos.TodayDoseDto;
import app.thyrocare.web.Dtos.TodayDoseRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Phase 6: patient education library and one-tap daily dose logging. */
@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
public class Phase6Controller {
    private final EducationLibraryService library;
    private final TodayDoseService doses;
    private final AuditService audit;

    @GetMapping("/education")
    public List<LibraryItemDto> library(@AuthenticationPrincipal User me) {
        return library.list(me.getId());
    }

    @GetMapping("/education/unread-count")
    public Map<String, Long> unread(@AuthenticationPrincipal User me) {
        return library.unread(me.getId());
    }

    @GetMapping("/education/{id}")
    public LibraryDetailDto open(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        return library.open(me.getId(), id);
    }

    @GetMapping("/medications/today")
    public List<TodayDoseDto> today(@AuthenticationPrincipal User me) {
        return doses.today(me.getId());
    }

    @PostMapping("/medications/{id}/today")
    public List<TodayDoseDto> logToday(@PathVariable UUID id, @Valid @RequestBody TodayDoseRequest body,
                                       @AuthenticationPrincipal User me) {
        List<TodayDoseDto> out = doses.log(me.getId(), id, body.status());
        audit.log(me, "create", "medication_log", id);
        return out;
    }
}
