package app.thyrocare.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.MedicationLog;
import app.thyrocare.repository.Repositories.MedicationLogRepository;
import app.thyrocare.repository.Repositories.MedicationRepository;
import app.thyrocare.web.Dtos.MedicationLogRequest;
import app.thyrocare.web.Dtos.TodayDoseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** "Did you take your medication today?" card: one log per medication per (Tehran) day via a single tap. */
@Service
@RequiredArgsConstructor
public class TodayDoseService {
    private final MedicationRepository meds;
    private final MedicationLogRepository logs;
    private final MedicationService medications;

    @Transactional(readOnly = true)
    public List<TodayDoseDto> today(UUID patientId) {
        LocalDate today = LocalDate.now(PhysicianInsightService.ZONE);
        List<MedicationLog> todays = todaysLogs(patientId, today);
        return meds.findByPatient_IdOrderByActiveDescCreatedAtDesc(patientId).stream()
                .filter(m -> m.isActive()
                        && (m.getStartDate() == null || !today.isBefore(m.getStartDate()))
                        && (m.getEndDate() == null || !today.isAfter(m.getEndDate())))
                .map(m -> {
                    List<MedicationLog> mine = todays.stream().filter(l -> l.getMedication().getId().equals(m.getId())).toList();
                    MedicationLog pick = mine.stream().filter(l -> "taken".equals(l.getStatus())).findFirst()
                            .orElse(mine.isEmpty() ? null : mine.get(mine.size() - 1));
                    return new TodayDoseDto(m.getId(), m.getName(), m.getDoseText(), m.getFrequencyText(),
                            pick == null ? null : ("taken".equals(pick.getStatus()) ? "taken" : "missed"),
                            pick == null ? null : pick.getTakenAt());
                }).toList();
    }

    @Transactional
    public List<TodayDoseDto> log(UUID patientId, UUID medicationId, String status) {
        boolean already = today(patientId).stream()
                .anyMatch(d -> d.medicationId().equals(medicationId) && d.status() != null);
        if (already) throw new ApiException(HttpStatus.CONFLICT, "مصرف امروز این دارو قبلاً ثبت شده است");
        medications.addLog(patientId, medicationId, new MedicationLogRequest(Instant.now(), status, null));
        return today(patientId);
    }

    private List<MedicationLog> todaysLogs(UUID patientId, LocalDate today) {
        Instant from = today.atStartOfDay(PhysicianInsightService.ZONE).toInstant();
        Instant to = today.plusDays(1).atStartOfDay(PhysicianInsightService.ZONE).toInstant();
        return logs.findByPatient_IdAndTakenAtGreaterThanEqualAndTakenAtLessThanOrderByTakenAtAsc(patientId, from, to);
    }
}
