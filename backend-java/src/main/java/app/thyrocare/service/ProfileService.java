package app.thyrocare.service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;

import app.thyrocare.domain.*;
import app.thyrocare.repository.Repositories.*;
import app.thyrocare.web.Dtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final PatientProfileRepository personalRepo;
    private final MedicalProfileRepository medicalRepo;
    private final AssignmentRepository assignments;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public ProfileBundle load(UUID patientId) {
        return new ProfileBundle(
                personalRepo.findByPatient_Id(patientId).map(PersonalDto::from).orElse(null),
                medicalRepo.findByPatient_Id(patientId).map(MedicalDto::from).orElse(null));
    }

    @Transactional
    public PersonalDto savePersonal(UUID patientId, PersonalRequest r) {
        PatientProfile p = personalRepo.findByPatient_Id(patientId).orElseGet(() -> {
            PatientProfile created = new PatientProfile();
            created.setPatient(users.getReferenceById(patientId));
            return created;
        });
        r.applyTo(p);
        p.setUpdatedAt(Instant.now());
        return PersonalDto.from(personalRepo.save(p));
    }

    @Transactional
    public MedicalDto saveMedical(UUID patientId, MedicalRequest r) {
        MedicalProfile m = medicalRepo.findByPatient_Id(patientId).orElseGet(() -> {
            MedicalProfile created = new MedicalProfile();
            created.setPatient(users.getReferenceById(patientId));
            return created;
        });
        r.applyTo(m);
        m.setSource("patient_reported");
        m.setUpdatedAt(Instant.now());
        m.setUpdatedBy(patientId);
        return MedicalDto.from(medicalRepo.save(m));
    }

    @Transactional(readOnly = true)
    public List<CareTeamMember> careTeam(UUID patientId) {
        return assignments.findByPatient_Id(patientId).stream()
                .map(PhysicianAssignment::getPhysician)
                .filter(d -> d.getStatus() == UserStatus.active)
                .map(d -> new CareTeamMember(d.getId(), d.getName(), d.getSpecialty()))
                .toList();
    }

    public static int completeness(ProfileBundle b) {
        PersonalDto p = b.personal();
        MedicalDto m = b.medical();
        Stream<Object> personal = p == null ? Stream.of(null, null, null, null, null, null, null)
                : Stream.of(p.firstName(), p.lastName(), p.birthDate(), p.gender(), p.phone(),
                p.emergencyContactName(), p.emergencyContactPhone());
        Stream<Object> medical = m == null ? Stream.of(null, null, null, null, null, null)
                : Stream.of(m.cancerType(), m.diagnosisDate(), m.surgeryDate(), m.surgeryType(), m.raiReceived(),
                m.stagingText());
        List<Object> all = Stream.concat(personal, medical).toList();
        long filled = all.stream().filter(Objects::nonNull).count();
        return Math.round(100f * filled / all.size());
    }
}
