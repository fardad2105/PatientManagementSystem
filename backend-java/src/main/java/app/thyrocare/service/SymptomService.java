package app.thyrocare.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.SymptomEntry;
import app.thyrocare.repository.Repositories.SymptomEntryRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.web.Dtos.SymptomDto;
import app.thyrocare.web.Dtos.SymptomRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Daily symptom check-ins. Values are stored and charted as reported; no scoring or interpretation. */
@Service
@RequiredArgsConstructor
public class SymptomService {
    public static final List<String> KEYS = List.of("fatigue", "palpitations", "anxiety", "weight_change", "neck_pain",
            "swallowing", "hair_loss", "cold_sensitivity", "mood_swings");

    private final SymptomEntryRepository repo;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public List<SymptomDto> list(UUID patientId, int days) {
        LocalDate from = LocalDate.now(PhysicianInsightService.ZONE).minusDays(Math.max(1, Math.min(days, 730)));
        return repo.findByPatient_IdAndEntryDateGreaterThanEqualOrderByEntryDateAsc(patientId, from).stream()
                .map(SymptomDto::from).toList();
    }

    @Transactional
    public SymptomDto save(UUID patientId, SymptomRequest r) {
        if (r.entryDate().isAfter(LocalDate.now(PhysicianInsightService.ZONE))) {
            throw ApiException.badRequest("تاریخ نمی‌تواند در آینده باشد");
        }
        for (Map.Entry<String, Integer> s : r.scores().entrySet()) {
            if (!KEYS.contains(s.getKey())) throw ApiException.badRequest("علامت نامعتبر است");
            if (s.getValue() == null || s.getValue() < 0 || s.getValue() > 10) {
                throw ApiException.badRequest("شدت هر علامت باید بین ۰ تا ۱۰ باشد");
            }
        }
        SymptomEntry e = repo.findByPatient_IdAndEntryDate(patientId, r.entryDate()).orElseGet(() -> {
            SymptomEntry n = new SymptomEntry();
            n.setPatient(users.getReferenceById(patientId));
            n.setEntryDate(r.entryDate());
            return n;
        });
        e.setMood(r.mood());
        e.setNotes(r.notes());
        e.getScores().clear();
        e.getScores().putAll(r.scores());
        e.setUpdatedAt(Instant.now());
        return SymptomDto.from(repo.save(e));
    }

    @Transactional
    public void delete(UUID patientId, UUID id) {
        repo.delete(repo.findByIdAndPatient_Id(id, patientId).orElseThrow(() -> ApiException.notFound("ثبت علائم یافت نشد")));
    }
}
