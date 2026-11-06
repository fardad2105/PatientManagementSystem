package app.thyrocare.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.EducationContent;
import app.thyrocare.repository.Repositories.EducationContentRepository;
import app.thyrocare.web.Dtos.EducationDto;
import app.thyrocare.web.Dtos.EducationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Educational content lifecycle: draft -> in_review -> published (publishing requires a named specialist reviewer). */
@Service
@RequiredArgsConstructor
public class EducationService {
    private final EducationContentRepository repo;

    @Transactional(readOnly = true)
    public List<EducationDto> list() {
        return repo.findAllByOrderByUpdatedAtDesc().stream().map(EducationDto::from).toList();
    }

    @Transactional
    public EducationDto create(UUID adminId, EducationRequest r) {
        EducationContent e = new EducationContent();
        e.setCreatedBy(adminId);
        apply(e, r);
        return EducationDto.from(repo.save(e));
    }

    @Transactional
    public EducationDto update(UUID id, EducationRequest r) {
        EducationContent e = find(id);
        apply(e, r);
        e.setUpdatedAt(Instant.now());
        return EducationDto.from(e);
    }

    @Transactional
    public void delete(UUID id) {
        repo.delete(find(id));
    }

    private EducationContent find(UUID id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("محتوا یافت نشد"));
    }

    private void apply(EducationContent e, EducationRequest r) {
        String reviewer = r.reviewerName() == null || r.reviewerName().isBlank() ? null : r.reviewerName().trim();
        if ("published".equals(r.status()) && reviewer == null) {
            throw ApiException.badRequest("انتشار محتوا فقط پس از ثبت نام متخصص بازبین ممکن است");
        }
        if ("published".equals(r.status()) && (!"published".equals(e.getStatus()) || !reviewer.equals(e.getReviewerName()))) {
            e.setReviewedAt(Instant.now());
        }
        e.setTitle(r.title().trim());
        e.setContentType(r.contentType());
        e.setSummary(r.summary());
        e.setBody(r.body());
        e.setMediaUrl(r.mediaUrl() == null || r.mediaUrl().isBlank() ? null : r.mediaUrl().trim());
        e.setStatus(r.status());
        e.setReviewerName(reviewer);
    }
}
