package app.thyrocare.web;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.*;
import app.thyrocare.repository.Repositories.AssignmentRepository;
import app.thyrocare.repository.Repositories.AuditLogRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.service.AdminInsightService;
import app.thyrocare.service.AuditService;
import app.thyrocare.web.Dtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Account and assignment management. Deliberately has no endpoint that returns clinical data. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final UserRepository users;
    private final AssignmentRepository assignments;
    private final AuditLogRepository auditLogs;
    private final AuditService audit;
    private final PasswordEncoder encoder;
    private final AdminInsightService insights;

    @GetMapping("/dashboard")
    public AdminDashboardDto dashboard() {
        return insights.dashboard();
    }

    @PatchMapping("/users/{id}")
    @Transactional
    public UserDto update(@PathVariable UUID id, @Valid @RequestBody UserUpdateRequest body, @AuthenticationPrincipal User admin) {
        User target = find(id);
        if (target.getRole() == Role.admin && !target.getId().equals(admin.getId())) {
            throw ApiException.forbidden("اطلاعات مدیر دیگر قابل تغییر نیست");
        }
        target.setName(body.name().trim());
        target.setPhone(body.phone() == null || body.phone().isBlank() ? null : body.phone());
        if (target.getRole() == Role.physician) target.setSpecialty(body.specialty());
        audit.log(admin, "update_user", "user", id);
        return UserDto.from(target);
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public Map<String, Boolean> deleteUser(@PathVariable UUID id, @AuthenticationPrincipal User admin) {
        User target = find(id);
        if (target.getRole() == Role.admin) throw ApiException.forbidden("حساب مدیر قابل حذف نیست");
        users.delete(target);
        audit.log(admin, "delete_user", "user", id, "allow", target.getEmail());
        return Map.of("ok", true);
    }

    @GetMapping("/stats")
    public StatsDto stats() {
        return new StatsDto(users.countByRoleAndStatus(Role.patient, UserStatus.active),
                users.countByRoleAndStatus(Role.patient, UserStatus.pending),
                users.countByRoleAndStatus(Role.physician, UserStatus.active), assignments.count());
    }

    @GetMapping("/users")
    public List<UserDto> list(@RequestParam(required = false) Role role, @RequestParam(required = false) UserStatus status,
                              @RequestParam(required = false) String q) {
        String needle = q == null ? null : q.trim().toLowerCase();
        return users.findAll().stream()
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> status == null || u.getStatus() == status)
                .filter(u -> needle == null || u.getName().toLowerCase().contains(needle) || u.getEmail().contains(needle))
                .sorted(Comparator.comparing(User::getCreatedAt).reversed())
                .map(UserDto::from).toList();
    }

    @PatchMapping("/users/{id}/status")
    @Transactional
    public UserDto setStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest body, @AuthenticationPrincipal User admin) {
        if (body.status() == UserStatus.pending) throw ApiException.badRequest("وضعیت نامعتبر است");
        User target = find(id);
        if (target.getRole() == Role.admin) throw ApiException.forbidden("وضعیت حساب مدیر قابل تغییر نیست");
        target.setStatus(body.status());
        target.setStatusChangedAt(Instant.now());
        audit.log(admin, "set_status:" + body.status(), "user", id);
        return UserDto.from(target);
    }

    @PostMapping("/users/{id}/reset-password")
    @Transactional
    public Map<String, Boolean> resetPassword(@PathVariable UUID id, @Valid @RequestBody ResetPasswordRequest body,
                                              @AuthenticationPrincipal User admin) {
        User target = find(id);
        if (target.getRole() == Role.admin) throw ApiException.forbidden("رمز مدیر از این بخش قابل تغییر نیست");
        target.setPasswordHash(encoder.encode(body.newPassword()));
        target.setTokenVersion(target.getTokenVersion() + 1);
        audit.log(admin, "reset_password", "user", id);
        return Map.of("ok", true);
    }

    @PostMapping("/physicians")
    public UserDto createPhysician(@Valid @RequestBody PhysicianRequest body, @AuthenticationPrincipal User admin) {
        String email = body.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw ApiException.badRequest("این ایمیل قبلاً ثبت شده است");
        User u = new User();
        u.setEmail(email);
        u.setName(body.name().trim());
        u.setRole(Role.physician);
        u.setStatus(UserStatus.active);
        u.setSpecialty(body.specialty() == null ? "فوق‌تخصص غدد درون‌ریز" : body.specialty());
        u.setPhone(body.phone());
        u.setPasswordHash(encoder.encode(body.password()));
        users.save(u);
        audit.log(admin, "create_physician", "user", u.getId());
        return UserDto.from(u);
    }

    @GetMapping("/assignments")
    @Transactional(readOnly = true)
    public List<AssignmentDto> assignmentList() {
        return assignments.findAllByOrderByCreatedAtDesc().stream()
                .map(a -> new AssignmentDto(a.getId(), a.getPatient().getId(), a.getPhysician().getId(),
                        a.getPatient().getName(), a.getPhysician().getName(), a.getCreatedAt()))
                .toList();
    }

    @PostMapping("/assignments")
    public Map<String, UUID> assign(@Valid @RequestBody AssignmentRequest body, @AuthenticationPrincipal User admin) {
        User patient = find(body.patientId());
        User physician = find(body.physicianId());
        if (patient.getRole() != Role.patient || patient.getStatus() != UserStatus.active) {
            throw ApiException.badRequest("فقط بیماران فعال قابل تخصیص هستند");
        }
        if (physician.getRole() != Role.physician || physician.getStatus() != UserStatus.active) {
            throw ApiException.badRequest("پزشک انتخاب‌شده معتبر یا فعال نیست");
        }
        if (assignments.existsByPhysician_IdAndPatient_Id(physician.getId(), patient.getId())) {
            throw ApiException.badRequest("این بیمار قبلاً به این پزشک تخصیص داده شده است");
        }
        PhysicianAssignment a = new PhysicianAssignment();
        a.setPatient(patient);
        a.setPhysician(physician);
        a.setAssignedBy(admin.getId());
        assignments.save(a);
        audit.log(admin, "assign", "physician_assignment", a.getId(), "allow", patient.getId() + "->" + physician.getId());
        return Map.of("id", a.getId());
    }

    @DeleteMapping("/assignments/{id}")
    public Map<String, Boolean> unassign(@PathVariable UUID id, @AuthenticationPrincipal User admin) {
        PhysicianAssignment a = assignments.findById(id).orElseThrow(() -> ApiException.notFound("تخصیص یافت نشد"));
        assignments.delete(a);
        audit.log(admin, "unassign", "physician_assignment", id);
        return Map.of("ok", true);
    }

    @GetMapping("/audit-logs")
    public List<AuditDto> auditLogs(@RequestParam(defaultValue = "100") int limit) {
        int size = Math.max(1, Math.min(limit, 500));
        return auditLogs.findAllByOrderByCreatedAtDesc(PageRequest.of(0, size)).stream().map(AuditDto::from).toList();
    }

    private User find(UUID id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("کاربر یافت نشد"));
    }
}
