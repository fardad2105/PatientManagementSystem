package app.thyrocare.web;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.thyrocare.domain.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

/** Request/response records. JSON uses snake_case via the global Jackson naming strategy. */
public final class Dtos {
    public static final String PHONE = "^[0-9+\\-\\s]{7,20}$";
    private static final String TRI = "yes|no|unknown";

    private Dtos() {
    }

    // ---------- auth & users ----------
    public record UserDto(UUID id, String email, String name, Role role, UserStatus status, String phone,
                          String specialty, Instant createdAt, Instant statusChangedAt) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getEmail(), u.getName(), u.getRole(), u.getStatus(), u.getPhone(),
                    u.getSpecialty(), u.getCreatedAt(), u.getStatusChangedAt());
        }
    }

    public record RegisterRequest(@NotBlank @Size(min = 2, max = 80) String name, @NotBlank @Email String email,
                                  @NotBlank @Size(min = 8, max = 128) String password,
                                  @Pattern(regexp = PHONE) String phone) {
    }

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {
    }

    public record ChangePasswordRequest(@NotBlank String currentPassword,
                                        @NotBlank @Size(min = 8, max = 128) String newPassword) {
    }

    // ---------- profiles ----------
    public record PersonalRequest(@Size(max = 60) String firstName, @Size(max = 60) String lastName,
                                  @Pattern(regexp = "^[0-9]{10}$") String nationalId,
                                  @PastOrPresent LocalDate birthDate,
                                  @Pattern(regexp = "male|female|other") String gender,
                                  @Pattern(regexp = PHONE) String phone, @Size(max = 60) String city,
                                  @Size(max = 300) String address, @Size(max = 80) String emergencyContactName,
                                  @Size(max = 40) String emergencyContactRelation,
                                  @Pattern(regexp = PHONE) String emergencyContactPhone) {
        public void applyTo(PatientProfile p) {
            p.setFirstName(firstName);
            p.setLastName(lastName);
            p.setNationalId(nationalId);
            p.setBirthDate(birthDate);
            p.setGender(gender);
            p.setPhone(phone);
            p.setCity(city);
            p.setAddress(address);
            p.setEmergencyContactName(emergencyContactName);
            p.setEmergencyContactRelation(emergencyContactRelation);
            p.setEmergencyContactPhone(emergencyContactPhone);
        }
    }

    public record PersonalDto(UUID patientId, String firstName, String lastName, String nationalId,
                              LocalDate birthDate, String gender, String phone, String city, String address,
                              String emergencyContactName, String emergencyContactRelation,
                              String emergencyContactPhone, Instant updatedAt) {
        public static PersonalDto from(PatientProfile p) {
            return new PersonalDto(p.getPatient().getId(), p.getFirstName(), p.getLastName(), p.getNationalId(),
                    p.getBirthDate(), p.getGender(), p.getPhone(), p.getCity(), p.getAddress(),
                    p.getEmergencyContactName(), p.getEmergencyContactRelation(), p.getEmergencyContactPhone(),
                    p.getUpdatedAt());
        }
    }

    public record MedicalRequest(@Pattern(regexp = "papillary|follicular|unknown") String cancerType,
                                 @PastOrPresent LocalDate diagnosisDate, @PastOrPresent LocalDate surgeryDate,
                                 @Pattern(regexp = "total|near_total|lobectomy|completion|unknown") String surgeryType,
                                 @Pattern(regexp = TRI) String lymphNodeDissection,
                                 @Pattern(regexp = TRI) String raiReceived,
                                 @Min(0) @Max(20) Integer raiSessions, @PastOrPresent LocalDate lastRaiDate,
                                 @Size(max = 200) String stagingText, @Size(max = 500) String otherConditions,
                                 @Size(max = 300) String allergies, @Size(max = 1000) String notes) {
        public void applyTo(MedicalProfile m) {
            m.setCancerType(cancerType);
            m.setDiagnosisDate(diagnosisDate);
            m.setSurgeryDate(surgeryDate);
            m.setSurgeryType(surgeryType);
            m.setLymphNodeDissection(lymphNodeDissection);
            m.setRaiReceived(raiReceived);
            m.setRaiSessions(raiSessions);
            m.setLastRaiDate(lastRaiDate);
            m.setStagingText(stagingText);
            m.setOtherConditions(otherConditions);
            m.setAllergies(allergies);
            m.setNotes(notes);
        }
    }

    public record MedicalDto(UUID patientId, String cancerType, LocalDate diagnosisDate, LocalDate surgeryDate,
                             String surgeryType, String lymphNodeDissection, String raiReceived, Integer raiSessions,
                             LocalDate lastRaiDate, String stagingText, String otherConditions, String allergies,
                             String notes, String source, Instant updatedAt, UUID updatedBy) {
        public static MedicalDto from(MedicalProfile m) {
            return new MedicalDto(m.getPatient().getId(), m.getCancerType(), m.getDiagnosisDate(), m.getSurgeryDate(),
                    m.getSurgeryType(), m.getLymphNodeDissection(), m.getRaiReceived(), m.getRaiSessions(),
                    m.getLastRaiDate(), m.getStagingText(), m.getOtherConditions(), m.getAllergies(), m.getNotes(),
                    m.getSource(), m.getUpdatedAt(), m.getUpdatedBy());
        }
    }

    public record ProfileBundle(PersonalDto personal, MedicalDto medical) {
    }

    public record CareTeamMember(UUID id, String name, String specialty) {
    }

    // ---------- medications ----------
    public record MedicationRequest(@NotBlank @Size(max = 120) String name, @NotBlank @Size(max = 80) String doseText,
                                    @Size(max = 120) String frequencyText, @Size(max = 300) String instructions,
                                    @Size(max = 80) String prescriberName, LocalDate startDate, LocalDate endDate,
                                    Boolean active, @Size(max = 500) String notes) {
    }

    public record MedicationLogRequest(Instant takenAt, @NotBlank @Pattern(regexp = "taken|missed|skipped") String status,
                                       @Size(max = 300) String note) {
    }

    public record MedicationLogDto(UUID id, UUID medicationId, Instant takenAt, String status, String note,
                                   Instant createdAt) {
        public static MedicationLogDto from(MedicationLog l) {
            return new MedicationLogDto(l.getId(), l.getMedication().getId(), l.getTakenAt(), l.getStatus(), l.getNote(),
                    l.getCreatedAt());
        }
    }

    public record MedicationDto(UUID id, String name, String doseText, String frequencyText, String instructions,
                                String prescriberName, LocalDate startDate, LocalDate endDate, boolean active,
                                String notes, Instant createdAt, Instant updatedAt, MedicationLogDto lastLog) {
        public static MedicationDto from(Medication m, MedicationLogDto lastLog) {
            return new MedicationDto(m.getId(), m.getName(), m.getDoseText(), m.getFrequencyText(), m.getInstructions(),
                    m.getPrescriberName(), m.getStartDate(), m.getEndDate(), m.isActive(), m.getNotes(),
                    m.getCreatedAt(), m.getUpdatedAt(), lastLog);
        }
    }

    // ---------- labs ----------
    public record LabRequest(@NotNull LabTestType testType,
                             @NotNull @DecimalMin("0") @Digits(integer = 8, fraction = 4) BigDecimal value,
                             @NotBlank String unit, @NotNull @PastOrPresent LocalDate sampleDate,
                             @Size(max = 120) String labName,
                             @DecimalMin("0") @Digits(integer = 8, fraction = 4) BigDecimal refLow,
                             @DecimalMin("0") @Digits(integer = 8, fraction = 4) BigDecimal refHigh,
                             @Size(max = 120) String refText, @Size(max = 500) String notes) {
    }

    public record LabDto(UUID id, LabTestType testType, BigDecimal value, String unit, LocalDate sampleDate,
                         String labName, BigDecimal refLow, BigDecimal refHigh, String refText, String source,
                         String notes, Instant createdAt, Instant updatedAt) {
        private static BigDecimal plain(BigDecimal v) {
            return v == null ? null : v.stripTrailingZeros();
        }

        public static LabDto from(LabResult r) {
            return new LabDto(r.getId(), r.getTestType(), plain(r.getValue()), r.getUnit(), r.getSampleDate(),
                    r.getLabName(), plain(r.getRefLow()), plain(r.getRefHigh()), r.getRefText(), r.getSource(),
                    r.getNotes(), r.getCreatedAt(), r.getUpdatedAt());
        }
    }

    // ---------- dashboards ----------
    public record DashboardDto(UserDto user, ProfileBundle profile, int completeness, List<CareTeamMember> careTeam,
                               List<String> upcomingModules, long medicationsActive,
                               @JsonProperty("doses_missed_7d") long dosesMissed7d,
                               List<LabDto> latestLabs, AppointmentDto nextAppointment,
                               List<AppointmentDto> dueReminders) {
    }

    // ---------- appointments ----------
    public record AppointmentRequest(@NotBlank @Size(max = 120) String title,
                                     @NotBlank @Pattern(regexp = "visit|lab|imaging|rai|other") String appointmentType,
                                     @NotNull Instant scheduledAt, @Size(max = 200) String location,
                                     @Size(max = 80) String physicianName, @Size(max = 500) String notes,
                                     @Min(0) @Max(20160) Integer remindBeforeMinutes) {
    }

    public record AppointmentStatusRequest(@NotBlank @Pattern(regexp = "scheduled|done|cancelled|missed") String status) {
    }

    public record AppointmentDto(UUID id, String title, String appointmentType, Instant scheduledAt, String location,
                                 String physicianName, String notes, String status, Integer remindBeforeMinutes,
                                 Instant reminderAt, Instant createdAt, Instant updatedAt) {
        public static AppointmentDto from(Appointment a) {
            return new AppointmentDto(a.getId(), a.getTitle(), a.getAppointmentType(), a.getScheduledAt(), a.getLocation(),
                    a.getPhysicianName(), a.getNotes(), a.getStatus(), a.getRemindBeforeMinutes(), a.reminderAt(),
                    a.getCreatedAt(), a.getUpdatedAt());
        }
    }

    public record PatientSummaryDto(UUID id, String name, String email, UserStatus status, String cancerType,
                                    LocalDate surgeryDate, Instant profileUpdatedAt, LocalDate birthDate,
                                    String stagingText, List<FlaggedLab> latestLabs, List<FlaggedLab> outOfRange,
                                    Instant nextAppointment, Instant lastVisit) {
    }

    // ---------- physician target ranges (neutral flags only) ----------
    public record TargetRequest(@NotNull LabTestType testType, @NotBlank String unit,
                                @DecimalMin(value = "0", message = "مقدار نمی‌تواند منفی باشد") @Digits(integer = 8, fraction = 4, message = "عدد نامعتبر است") BigDecimal targetLow,
                                @DecimalMin(value = "0", message = "مقدار نمی‌تواند منفی باشد") @Digits(integer = 8, fraction = 4, message = "عدد نامعتبر است") BigDecimal targetHigh) {
    }

    public record TargetsRequest(@NotNull @Size(max = 4) List<@Valid TargetRequest> targets) {
    }

    public record TargetDto(LabTestType testType, String unit, BigDecimal targetLow, BigDecimal targetHigh,
                            Instant updatedAt) {
        public static TargetDto from(LabTarget t) {
            return new TargetDto(t.getTestType(), t.getUnit(),
                    t.getTargetLow() == null ? null : t.getTargetLow().stripTrailingZeros(),
                    t.getTargetHigh() == null ? null : t.getTargetHigh().stripTrailingZeros(), t.getUpdatedAt());
        }
    }

    /** flag: above | below | in_range | no_target | unit_mismatch */
    public record FlaggedLab(LabDto lab, String flag, TargetDto target) {
    }

    public record PhysicianTodayAppt(AppointmentDto appointment, UUID patientId, String patientName) {
    }

    public record PhysicianRecentLab(FlaggedLab item, UUID patientId, String patientName) {
    }

    public record PhysicianDashboardDto(UserDto physician, long activePatients, long todayAppointments,
                                        long needsAttention, List<PatientSummaryDto> attention,
                                        List<PhysicianTodayAppt> today, List<PhysicianRecentLab> recentLabs) {
    }

    // ---------- symptoms ----------
    public record SymptomRequest(@NotNull LocalDate entryDate,
                                 @NotBlank @Pattern(regexp = "good|fair|bad|very_bad", message = "حال کلی نامعتبر است") String mood,
                                 @NotNull Map<String, Integer> scores,
                                 @Size(max = 500, message = "یادداشت حداکثر ۵۰۰ کاراکتر است") String notes) {
    }

    public record SymptomDto(UUID id, LocalDate entryDate, String mood, Map<String, Integer> scores, String notes,
                             Instant updatedAt) {
        public static SymptomDto from(SymptomEntry e) {
            return new SymptomDto(e.getId(), e.getEntryDate(), e.getMood(), new HashMap<>(e.getScores()), e.getNotes(),
                    e.getUpdatedAt());
        }
    }

    public record PatientBasic(UUID id, String name, String email, String phone, UserStatus status) {
    }

    public record PatientDetailDto(PatientBasic patient, ProfileBundle profile, int completeness) {
    }

    // ---------- admin ----------
    public record StatusRequest(@NotNull UserStatus status) {
    }

    public record PhysicianRequest(@NotBlank @Size(min = 2, max = 80) String name, @NotBlank @Email String email,
                                   @NotBlank @Size(min = 8, max = 128) String password,
                                   @Size(max = 80) String specialty, @Pattern(regexp = PHONE) String phone) {
    }

    public record ResetPasswordRequest(@NotBlank @Size(min = 8, max = 128) String newPassword) {
    }

    public record AssignmentRequest(@NotNull UUID patientId, @NotNull UUID physicianId) {
    }

    public record AssignmentDto(UUID id, UUID patientId, UUID physicianId, String patientName, String physicianName,
                                Instant createdAt) {
    }

    public record AuditDto(UUID id, UUID actorId, String actorEmail, String actorRole, String action,
                           String resourceType, String resourceId, String outcome, String details, Instant createdAt) {
        public static AuditDto from(AuditLog a) {
            return new AuditDto(a.getId(), a.getActorId(), a.getActorEmail(), a.getActorRole(), a.getAction(),
                    a.getResourceType(), a.getResourceId(), a.getOutcome(), a.getDetails(), a.getCreatedAt());
        }
    }

    public record StatsDto(long patientsActive, long patientsPending, long physiciansActive, long assignments) {
    }
}
