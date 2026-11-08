package app.thyrocare.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.NeckUltrasound;
import app.thyrocare.domain.UltrasoundFinding;
import app.thyrocare.repository.Repositories.NeckUltrasoundRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.web.Phase7Dtos.FindingRequest;
import app.thyrocare.web.Phase7Dtos.UltrasoundDto;
import app.thyrocare.web.Phase7Dtos.UltrasoundRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Neck ultrasound follow-up records. Values are stored as reported by the radiologist; nothing is scored or classified. */
@Service
@RequiredArgsConstructor
public class UltrasoundService {
    private final NeckUltrasoundRepository repo;
    private final UserRepository users;
    private final DocumentService documents;
    private final app.thyrocare.repository.Repositories.PhysicianNoteRepository notes;

    @Transactional(readOnly = true)
    public List<UltrasoundDto> list(UUID patientId) {
        return repo.findByPatient_IdOrderByExamDateDescCreatedAtDesc(patientId).stream().map(UltrasoundDto::from).toList();
    }

    @Transactional
    public UltrasoundDto create(UUID patientId, UltrasoundRequest r) {
        NeckUltrasound u = new NeckUltrasound();
        u.setPatient(users.getReferenceById(patientId));
        apply(patientId, u, r);
        return UltrasoundDto.from(repo.save(u));
    }

    @Transactional
    public UltrasoundDto update(UUID patientId, UUID id, UltrasoundRequest r) {
        NeckUltrasound u = find(patientId, id);
        apply(patientId, u, r);
        u.setUpdatedAt(Instant.now());
        return UltrasoundDto.from(repo.saveAndFlush(u));
    }

    @Transactional
    public void delete(UUID patientId, UUID id) {
        repo.delete(find(patientId, id));
        notes.deleteForTarget("ultrasound", id);
    }

    private NeckUltrasound find(UUID patientId, UUID id) {
        return repo.findByIdAndPatient_Id(id, patientId).orElseThrow(() -> ApiException.notFound("سونوگرافی یافت نشد"));
    }

    private void apply(UUID patientId, NeckUltrasound u, UltrasoundRequest r) {
        if (r.examDate().isAfter(LocalDate.now(PhysicianInsightService.ZONE))) throw ApiException.badRequest("تاریخ سونوگرافی نمی‌تواند در آینده باشد");
        u.setExamDate(r.examDate());
        u.setImagingCenter(blank(r.imagingCenter()));
        u.setRadiologistName(blank(r.radiologistName()));
        u.setReason(blank(r.reason()));
        u.setReasonText(blank(r.reasonText()));
        u.setThyroidBedStatus(blank(r.thyroidBedStatus()));
        u.setResidualTissue(blank(r.residualTissue()));
        u.setBedFinding(blank(r.bedFinding()));
        u.setLymphNodeStatus(blank(r.lymphNodeStatus()));
        u.setFindingLocation(blank(r.findingLocation()));
        u.setFindingLocationText(blank(r.findingLocationText()));
        u.setFindingSizeMm(r.findingSizeMm());
        u.setDescriptiveFeatures(blank(r.descriptiveFeatures()));
        u.setRadiologistConclusion(blank(r.radiologistConclusion()));
        u.setReportDocument(r.reportDocumentId() == null ? null : documents.find(patientId, r.reportDocumentId()));
        u.getFindings().clear();
        List<FindingRequest> rows = r.findings() == null ? List.of() : r.findings();
        for (int i = 0; i < rows.size(); i++) {
            FindingRequest f = rows.get(i);
            UltrasoundFinding e = new UltrasoundFinding();
            e.setUltrasound(u);
            e.setSortOrder(i);
            e.setLocation(f.location());
            e.setLocationText(blank(f.locationText()));
            e.setFindingType(blank(f.findingType()));
            e.setLengthMm(f.lengthMm());
            e.setWidthMm(f.widthMm());
            e.setHeightMm(f.heightMm());
            e.setDescription(blank(f.description()));
            u.getFindings().add(e);
        }
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
