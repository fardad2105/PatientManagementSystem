package app.thyrocare.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.*;
import app.thyrocare.repository.Repositories.*;
import app.thyrocare.web.Dtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Physician panel data. The only "alert" logic is a plain comparison of the latest recorded value against the
 * range the physician entered for that patient; nothing is interpreted or recommended.
 */
@Service
@RequiredArgsConstructor
public class PhysicianInsightService {
    public static final ZoneId ZONE = ZoneId.of("Asia/Tehran");

    private final AssignmentRepository assignments;
    private final UserRepository users;
    private final MedicalProfileRepository medicalRepo;
    private final PatientProfileRepository personalRepo;
    private final LabTargetRepository targetRepo;
    private final LabResultRepository labRepo;
    private final AppointmentRepository apptRepo;
    private final LabService labs;
    private final AppointmentService appointments;

    @Transactional(readOnly = true)
    public List<PatientSummaryDto> patients(User me) {
        List<User> list = assignedPatients(me);
        if (list.isEmpty()) return List.of();
        List<UUID> ids = list.stream().map(User::getId).toList();
        Map<UUID, MedicalProfile> medical = medicalRepo.findByPatient_IdIn(ids).stream()
                .collect(Collectors.toMap(m -> m.getPatient().getId(), Function.identity()));
        Map<UUID, PatientProfile> personal = personalRepo.findByPatient_IdIn(ids).stream()
                .collect(Collectors.toMap(p -> p.getPatient().getId(), Function.identity()));
        Map<UUID, Map<LabTestType, LabTarget>> targets = targetsByPatient(me);
        return list.stream().map(p -> summary(p, medical.get(p.getId()), personal.get(p.getId()),
                targets.getOrDefault(p.getId(), Map.of()))).toList();
    }

    @Transactional(readOnly = true)
    public List<PatientSummaryDto> alerts(User me) {
        return patients(me).stream().filter(p -> !p.outOfRange().isEmpty()).toList();
    }

    @Transactional(readOnly = true)
    public PhysicianDashboardDto dashboard(User me) {
        List<PatientSummaryDto> all = patients(me);
        List<PatientSummaryDto> attention = all.stream().filter(p -> !p.outOfRange().isEmpty()).toList();
        List<UUID> ids = all.stream().map(PatientSummaryDto::id).toList();
        List<PhysicianTodayAppt> today = List.of();
        List<PhysicianRecentLab> recent = List.of();
        if (!ids.isEmpty()) {
            Instant start = LocalDate.now(ZONE).atStartOfDay(ZONE).toInstant();
            today = apptRepo.findByPatient_IdInAndScheduledAtBetweenOrderByScheduledAtAsc(ids, start, start.plus(1, ChronoUnit.DAYS))
                    .stream().filter(a -> !"cancelled".equals(a.getStatus()))
                    .map(a -> new PhysicianTodayAppt(AppointmentDto.from(a), a.getPatient().getId(), a.getPatient().getName()))
                    .toList();
            Map<UUID, Map<LabTestType, LabTarget>> targets = targetsByPatient(me);
            recent = labRepo.findTop8ByPatient_IdInOrderBySampleDateDescCreatedAtDesc(ids).stream().map(r -> {
                UUID pid = r.getPatient().getId();
                LabTarget t = targets.getOrDefault(pid, Map.of()).get(r.getTestType());
                return new PhysicianRecentLab(flag(LabDto.from(r), t), pid, r.getPatient().getName());
            }).toList();
        }
        return new PhysicianDashboardDto(UserDto.from(me), all.size(), today.size(), attention.size(), attention, today, recent);
    }

    @Transactional(readOnly = true)
    public List<TargetDto> targets(User me, UUID patientId) {
        return targetRepo.findByPhysician_IdAndPatient_Id(me.getId(), patientId).stream().map(TargetDto::from).toList();
    }

    @Transactional
    public List<TargetDto> saveTargets(User me, UUID patientId, List<TargetRequest> rows) {
        for (TargetRequest r : rows) {
            if (!r.testType().allowsUnit(r.unit())) throw ApiException.badRequest("واحد انتخاب‌شده برای این آزمایش معتبر نیست");
            if (r.targetLow() != null && r.targetHigh() != null && r.targetLow().compareTo(r.targetHigh()) > 0) {
                throw ApiException.badRequest("حد پایین نمی‌تواند بیشتر از حد بالا باشد");
            }
            Optional<LabTarget> existing = targetRepo.findByPhysician_IdAndPatient_IdAndTestType(me.getId(), patientId, r.testType());
            if (r.targetLow() == null && r.targetHigh() == null) {
                existing.ifPresent(targetRepo::delete);
                continue;
            }
            LabTarget t = existing.orElseGet(() -> {
                LabTarget n = new LabTarget();
                n.setPhysician(users.getReferenceById(me.getId()));
                n.setPatient(users.getReferenceById(patientId));
                n.setTestType(r.testType());
                return n;
            });
            t.setUnit(r.unit());
            t.setTargetLow(r.targetLow());
            t.setTargetHigh(r.targetHigh());
            t.setUpdatedAt(Instant.now());
            targetRepo.save(t);
        }
        targetRepo.flush();
        return targets(me, patientId);
    }

    public static FlaggedLab flag(LabDto l, LabTarget t) {
        if (t == null) return new FlaggedLab(l, "no_target", null);
        TargetDto td = TargetDto.from(t);
        if (!t.getUnit().equals(l.unit())) return new FlaggedLab(l, "unit_mismatch", td);
        if (t.getTargetLow() != null && l.value().compareTo(t.getTargetLow()) < 0) return new FlaggedLab(l, "below", td);
        if (t.getTargetHigh() != null && l.value().compareTo(t.getTargetHigh()) > 0) return new FlaggedLab(l, "above", td);
        return new FlaggedLab(l, "in_range", td);
    }

    private List<User> assignedPatients(User me) {
        List<UUID> ids = assignments.findByPhysician_Id(me.getId()).stream().map(a -> a.getPatient().getId()).toList();
        return ids.isEmpty() ? List.of() : users.findByIdInAndRoleAndStatusOrderByNameAsc(ids, Role.patient, UserStatus.active);
    }

    private Map<UUID, Map<LabTestType, LabTarget>> targetsByPatient(User me) {
        return targetRepo.findByPhysician_Id(me.getId()).stream().collect(Collectors.groupingBy(t -> t.getPatient().getId(),
                Collectors.toMap(LabTarget::getTestType, Function.identity())));
    }

    private PatientSummaryDto summary(User p, MedicalProfile m, PatientProfile pp, Map<LabTestType, LabTarget> targets) {
        List<FlaggedLab> latest = labs.latestPerType(p.getId()).stream().map(l -> flag(l, targets.get(l.testType()))).toList();
        List<FlaggedLab> out = latest.stream().filter(f -> f.flag().equals("above") || f.flag().equals("below")).toList();
        List<AppointmentDto> upcoming = appointments.upcoming(p.getId());
        Instant last = apptRepo.findFirstByPatient_IdAndStatusOrderByScheduledAtDesc(p.getId(), "done")
                .map(Appointment::getScheduledAt).orElse(null);
        return new PatientSummaryDto(p.getId(), p.getName(), p.getEmail(), p.getStatus(),
                m == null ? null : m.getCancerType(), m == null ? null : m.getSurgeryDate(),
                m == null ? null : m.getUpdatedAt(), pp == null ? null : pp.getBirthDate(),
                m == null ? null : m.getStagingText(), latest, out,
                upcoming.isEmpty() ? null : upcoming.get(0).scheduledAt(), last);
    }
}
