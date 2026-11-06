package app.thyrocare.service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import app.thyrocare.domain.Medication;
import app.thyrocare.domain.MedicationLog;
import app.thyrocare.repository.Repositories.MedicationLogRepository;
import app.thyrocare.repository.Repositories.MedicationRepository;
import app.thyrocare.web.Dtos.MedicationWeekDto;
import app.thyrocare.web.Dtos.MedicationWeekResponse;
import app.thyrocare.web.Dtos.WeekDayDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Saturday-to-Friday (Iranian week) view of the patient's own intake logs. Counts only; no clinical advice. */
@Service
@RequiredArgsConstructor
public class MedicationWeekService {
    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");

    private final MedicationRepository meds;
    private final MedicationLogRepository logs;

    @Transactional(readOnly = true)
    public MedicationWeekResponse week(UUID patientId, int offset) {
        LocalDate today = LocalDate.now(PhysicianInsightService.ZONE);
        LocalDate start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.SATURDAY)).plusWeeks(Math.max(-52, Math.min(offset, 0)));
        LocalDate end = start.plusDays(6);
        Instant from = start.atStartOfDay(PhysicianInsightService.ZONE).toInstant();
        Instant to = end.plusDays(1).atStartOfDay(PhysicianInsightService.ZONE).toInstant();
        List<MedicationLog> weekLogs = logs.findByPatient_IdAndTakenAtGreaterThanEqualAndTakenAtLessThanOrderByTakenAtAsc(patientId, from, to);

        List<MedicationWeekDto> out = new ArrayList<>();
        int taken = 0;
        int expected = 0;
        for (Medication m : meds.findByPatient_IdOrderByActiveDescCreatedAtDesc(patientId)) {
            List<MedicationLog> mine = weekLogs.stream().filter(l -> l.getMedication().getId().equals(m.getId())).toList();
            if (!m.isActive() && mine.isEmpty()) continue;
            List<WeekDayDto> days = new ArrayList<>();
            int t = 0;
            int e = 0;
            for (int i = 0; i < 7; i++) {
                LocalDate d = start.plusDays(i);
                List<MedicationLog> dayLogs = mine.stream().filter(l -> localDate(l.getTakenAt()).equals(d)).toList();
                MedicationLog firstTaken = dayLogs.stream().filter(l -> "taken".equals(l.getStatus())).findFirst().orElse(null);
                boolean inRange = (m.getStartDate() == null || !d.isBefore(m.getStartDate()))
                        && (m.getEndDate() == null || !d.isAfter(m.getEndDate()));
                String status;
                if (firstTaken != null) status = "taken";
                else if (!dayLogs.isEmpty()) status = "missed";
                else if (d.isAfter(today)) status = "future";
                else if (!inRange || !m.isActive()) status = "inactive";
                else status = "none";
                if (!d.isAfter(today) && (inRange && m.isActive() || firstTaken != null)) e++;
                if (firstTaken != null) t++;
                days.add(new WeekDayDto(d, status,
                        firstTaken == null ? null : firstTaken.getTakenAt().atZone(PhysicianInsightService.ZONE).format(HM)));
            }
            taken += t;
            expected += e;
            out.add(new MedicationWeekDto(m.getId(), m.getName(), m.getDoseText(), m.getFrequencyText(), days, t, e));
        }
        Integer percent = expected == 0 ? null : (int) Math.round(100.0 * Math.min(taken, expected) / expected);
        return new MedicationWeekResponse(start, end, today, percent, out);
    }

    private static LocalDate localDate(Instant i) {
        return ZonedDateTime.ofInstant(i, PhysicianInsightService.ZONE).toLocalDate();
    }
}
