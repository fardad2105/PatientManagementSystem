package app.thyrocare.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.Appointment;
import app.thyrocare.repository.Repositories.AppointmentRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.web.Dtos.AppointmentDto;
import app.thyrocare.web.Dtos.AppointmentRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Appointments and in-app reminders. A reminder is "due" from (scheduled_at - remind_before) until the visit time. */
@Service
@RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository repo;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public List<AppointmentDto> list(UUID patientId, String scope) {
        Instant now = Instant.now();
        return repo.findByPatient_IdOrderByScheduledAtAsc(patientId).stream()
                .filter(a -> switch (scope == null ? "all" : scope) {
                    case "upcoming" -> "scheduled".equals(a.getStatus()) && a.getScheduledAt().isAfter(now);
                    case "past" -> !("scheduled".equals(a.getStatus()) && a.getScheduledAt().isAfter(now));
                    default -> true;
                })
                .map(AppointmentDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> upcoming(UUID patientId) {
        return repo.findByPatient_IdAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(patientId, "scheduled", Instant.now())
                .stream().map(AppointmentDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentDto> dueReminders(UUID patientId) {
        Instant now = Instant.now();
        return upcoming(patientId).stream().filter(a -> a.reminderAt() != null && !a.reminderAt().isAfter(now)).toList();
    }

    @Transactional
    public AppointmentDto create(UUID patientId, AppointmentRequest r) {
        Appointment a = new Appointment();
        a.setPatient(users.getReferenceById(patientId));
        apply(a, r);
        return AppointmentDto.from(repo.save(a));
    }

    @Transactional
    public AppointmentDto update(UUID patientId, UUID id, AppointmentRequest r) {
        Appointment a = owned(patientId, id);
        apply(a, r);
        a.setUpdatedAt(Instant.now());
        return AppointmentDto.from(a);
    }

    @Transactional
    public AppointmentDto setStatus(UUID patientId, UUID id, String status) {
        Appointment a = owned(patientId, id);
        a.setStatus(status);
        a.setUpdatedAt(Instant.now());
        return AppointmentDto.from(a);
    }

    @Transactional
    public void delete(UUID patientId, UUID id) {
        repo.delete(owned(patientId, id));
    }

    private Appointment owned(UUID patientId, UUID id) {
        return repo.findByIdAndPatient_Id(id, patientId).orElseThrow(() -> ApiException.notFound("نوبت یافت نشد"));
    }

    private void apply(Appointment a, AppointmentRequest r) {
        a.setTitle(r.title().trim());
        a.setAppointmentType(r.appointmentType());
        a.setScheduledAt(r.scheduledAt());
        a.setLocation(r.location());
        a.setPhysicianName(r.physicianName());
        a.setNotes(r.notes());
        a.setRemindBeforeMinutes(r.remindBeforeMinutes());
    }
}
