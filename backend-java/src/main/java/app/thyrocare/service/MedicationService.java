package app.thyrocare.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.Medication;
import app.thyrocare.domain.MedicationLog;
import app.thyrocare.repository.Repositories.MedicationLogRepository;
import app.thyrocare.repository.Repositories.MedicationRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.web.Dtos.MedicationDto;
import app.thyrocare.web.Dtos.MedicationLogDto;
import app.thyrocare.web.Dtos.MedicationLogRequest;
import app.thyrocare.web.Dtos.MedicationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Medications are recorded exactly as prescribed; no dose is suggested, calculated or changed here. */
@Service
@RequiredArgsConstructor
public class MedicationService {
    private static final String NOT_FOUND = "دارو یافت نشد";

    private final MedicationRepository meds;
    private final MedicationLogRepository logs;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public List<MedicationDto> list(UUID patientId) {
        return meds.findByPatient_IdOrderByActiveDescCreatedAtDesc(patientId).stream().map(this::toDto).toList();
    }

    @Transactional
    public MedicationDto create(UUID patientId, MedicationRequest r) {
        Medication m = new Medication();
        m.setPatient(users.getReferenceById(patientId));
        apply(m, r);
        return toDto(meds.save(m));
    }

    @Transactional
    public MedicationDto update(UUID patientId, UUID id, MedicationRequest r) {
        Medication m = owned(patientId, id);
        apply(m, r);
        m.setUpdatedAt(Instant.now());
        return toDto(m);
    }

    @Transactional
    public void delete(UUID patientId, UUID id) {
        meds.delete(owned(patientId, id));
    }

    @Transactional(readOnly = true)
    public List<MedicationLogDto> logs(UUID patientId, UUID medicationId) {
        owned(patientId, medicationId);
        return logs.findTop30ByMedication_IdOrderByTakenAtDesc(medicationId).stream().map(MedicationLogDto::from).toList();
    }

    @Transactional
    public MedicationLogDto addLog(UUID patientId, UUID medicationId, MedicationLogRequest r) {
        Medication m = owned(patientId, medicationId);
        Instant takenAt = r.takenAt() == null ? Instant.now() : r.takenAt();
        if (takenAt.isAfter(Instant.now().plus(5, ChronoUnit.MINUTES))) {
            throw ApiException.badRequest("زمان مصرف نمی‌تواند در آینده باشد");
        }
        MedicationLog log = new MedicationLog();
        log.setMedication(m);
        log.setPatient(m.getPatient());
        log.setTakenAt(takenAt);
        log.setStatus(r.status());
        log.setNote(r.note());
        return MedicationLogDto.from(logs.save(log));
    }

    @Transactional
    public void deleteLog(UUID patientId, UUID logId) {
        logs.delete(logs.findByIdAndPatient_Id(logId, patientId).orElseThrow(() -> ApiException.notFound("ثبت یافت نشد")));
    }

    private Medication owned(UUID patientId, UUID id) {
        return meds.findByIdAndPatient_Id(id, patientId).orElseThrow(() -> ApiException.notFound(NOT_FOUND));
    }

    private void apply(Medication m, MedicationRequest r) {
        if (r.startDate() != null && r.endDate() != null && r.endDate().isBefore(r.startDate())) {
            throw ApiException.badRequest("تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد");
        }
        m.setName(r.name().trim());
        m.setDoseText(r.doseText().trim());
        m.setFrequencyText(r.frequencyText());
        m.setInstructions(r.instructions());
        m.setPrescriberName(r.prescriberName());
        m.setStartDate(r.startDate());
        m.setEndDate(r.endDate());
        m.setActive(r.active() == null || r.active());
        m.setNotes(r.notes());
    }

    private MedicationDto toDto(Medication m) {
        MedicationLogDto last = logs.findFirstByMedication_IdOrderByTakenAtDesc(m.getId()).map(MedicationLogDto::from).orElse(null);
        return MedicationDto.from(m, last);
    }
}
