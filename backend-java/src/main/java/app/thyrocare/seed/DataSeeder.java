package app.thyrocare.seed;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import app.thyrocare.domain.*;
import app.thyrocare.repository.Repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Creates the admin once (never overwrites it) and, if enabled, clearly fictional demo records. */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final PatientProfileRepository personalRepo;
    private final MedicalProfileRepository medicalRepo;
    private final AssignmentRepository assignments;
    private final MedicationRepository meds;
    private final LabResultRepository labs;
    private final PasswordEncoder encoder;

    @Value("${app.admin-email}")
    private String adminEmail;
    @Value("${app.admin-password}")
    private String adminPassword;
    @Value("${app.seed-demo-data}")
    private boolean seedDemo;

    @Override
    @Transactional
    public void run(String... args) {
        ensureUser(adminEmail.toLowerCase(), adminPassword, "مدیر سیستم", Role.admin, UserStatus.active);
        if (!seedDemo) return;
        User doctor = ensureUser("dr.sample@demo.thyrocare.app", "Physician@123", "دکتر نمونه (پزشک آزمایشی)",
                Role.physician, UserStatus.active);
        doctor.setSpecialty("فوق‌تخصص غدد درون‌ریز");
        User patient = ensureUser("patient.sample@demo.thyrocare.app", "Patient@123", "بیمار نمونه (داده‌ی ساختگی)",
                Role.patient, UserStatus.active);
        ensureUser("pending.sample@demo.thyrocare.app", "Pending@123", "بیمار در انتظار (داده‌ی ساختگی)",
                Role.patient, UserStatus.pending);

        if (personalRepo.findByPatient_Id(patient.getId()).isEmpty()) {
            PatientProfile p = new PatientProfile();
            p.setPatient(patient);
            p.setFirstName("سارا");
            p.setLastName("نمونه");
            p.setBirthDate(LocalDate.of(1985, 3, 21));
            p.setGender("female");
            p.setPhone("09120000000");
            p.setCity("تهران");
            p.setEmergencyContactName("علی نمونه");
            p.setEmergencyContactRelation("همسر");
            p.setEmergencyContactPhone("09120000001");
            p.setUpdatedAt(Instant.now());
            personalRepo.save(p);
        }
        if (medicalRepo.findByPatient_Id(patient.getId()).isEmpty()) {
            MedicalProfile m = new MedicalProfile();
            m.setPatient(patient);
            m.setCancerType("papillary");
            m.setDiagnosisDate(LocalDate.of(2023, 1, 10));
            m.setSurgeryDate(LocalDate.of(2023, 2, 15));
            m.setSurgeryType("total");
            m.setLymphNodeDissection("yes");
            m.setRaiReceived("yes");
            m.setRaiSessions(1);
            m.setLastRaiDate(LocalDate.of(2023, 5, 1));
            m.setStagingText("نمونه‌ی ساختگی — مرحله توسط پزشک ثبت می‌شود");
            m.setUpdatedAt(Instant.now());
            m.setUpdatedBy(patient.getId());
            medicalRepo.save(m);
        }
        if (!assignments.existsByPhysician_IdAndPatient_Id(doctor.getId(), patient.getId())) {
            PhysicianAssignment a = new PhysicianAssignment();
            a.setPatient(patient);
            a.setPhysician(doctor);
            assignments.save(a);
        }
        if (meds.findByPatient_IdOrderByActiveDescCreatedAtDesc(patient.getId()).isEmpty()) {
            Medication med = new Medication();
            med.setPatient(patient);
            med.setName("لووتیروکسین (نمونه‌ی ساختگی)");
            med.setDoseText("طبق نسخه‌ی پزشک");
            med.setFrequencyText("روزی یک بار، صبح ناشتا");
            med.setPrescriberName("دکتر نمونه");
            med.setStartDate(LocalDate.of(2023, 2, 20));
            meds.save(med);
        }
        if (labs.findByPatient_IdOrderBySampleDateAscCreatedAtAsc(patient.getId()).isEmpty()) {
            lab(patient, LabTestType.TSH, "1.2", "mIU/L", LocalDate.of(2024, 1, 15));
            lab(patient, LabTestType.TSH, "0.9", "mIU/L", LocalDate.of(2024, 7, 10));
            lab(patient, LabTestType.TSH, "1.1", "mIU/L", LocalDate.of(2025, 1, 20));
            lab(patient, LabTestType.TG, "0.3", "ng/mL", LocalDate.of(2024, 7, 10));
        }
    }

    private void lab(User patient, LabTestType type, String value, String unit, LocalDate date) {
        LabResult r = new LabResult();
        r.setPatient(patient);
        r.setTestType(type);
        r.setValue(new BigDecimal(value));
        r.setUnit(unit);
        r.setSampleDate(date);
        r.setLabName("آزمایشگاه نمونه (ساختگی)");
        r.setEnteredBy(patient.getId());
        r.setNotes("داده‌ی ساختگی برای آزمایش سامانه");
        labs.save(r);
    }

    private User ensureUser(String email, String password, String name, Role role, UserStatus status) {
        return users.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setName(name);
            u.setRole(role);
            u.setStatus(status);
            u.setPasswordHash(encoder.encode(password));
            return users.save(u);
        });
    }
}
