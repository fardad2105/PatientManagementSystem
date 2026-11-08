package app.thyrocare.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.EducationContent;
import app.thyrocare.domain.EducationView;
import app.thyrocare.repository.Repositories.EducationContentRepository;
import app.thyrocare.repository.Repositories.EducationViewRepository;
import app.thyrocare.web.Dtos.LibraryDetailDto;
import app.thyrocare.web.Dtos.LibraryItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Patient-facing library: only published items with a recorded specialist reviewer are ever returned. */
@Service
@RequiredArgsConstructor
public class EducationLibraryService {
    private static final String PUBLISHED = "published";

    private final EducationContentRepository contents;
    private final EducationViewRepository views;

    @Transactional(readOnly = true)
    public List<LibraryItemDto> list(UUID patientId) {
        Set<UUID> seen = viewedIds(patientId);
        return contents.findByStatusAndReviewerNameIsNotNullOrderByReviewedAtDesc(PUBLISHED).stream()
                .map(e -> LibraryItemDto.from(e, seen.contains(e.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> unread(UUID patientId) {
        Set<UUID> seen = viewedIds(patientId);
        long n = contents.findByStatusAndReviewerNameIsNotNullOrderByReviewedAtDesc(PUBLISHED).stream()
                .filter(e -> !seen.contains(e.getId())).count();
        return Map.of("unread", n);
    }

    @Transactional
    public LibraryDetailDto open(UUID patientId, UUID id) {
        EducationContent e = contents.findByIdAndStatusAndReviewerNameIsNotNull(id, PUBLISHED)
                .orElseThrow(() -> ApiException.notFound("محتوا یافت نشد"));
        int count = e.getViewCount();
        if (!views.existsByContentIdAndPatientId(id, patientId)) {
            EducationView v = new EducationView();
            v.setContentId(id);
            v.setPatientId(patientId);
            try {
                views.saveAndFlush(v);
                contents.incrementViews(id);
                count++;
            } catch (org.springframework.dao.DataIntegrityViolationException ignored) {
                // concurrent first open by the same patient; already counted
            }
        }
        return new LibraryDetailDto(e.getId(), e.getTitle(), e.getContentType(), e.getSummary(), e.getBody(),
                e.getMediaUrl(), e.getReviewerName(), e.getReviewedAt(), count);
    }

    private Set<UUID> viewedIds(UUID patientId) {
        return views.findByPatientId(patientId).stream().map(EducationView::getContentId).collect(Collectors.toSet());
    }
}
