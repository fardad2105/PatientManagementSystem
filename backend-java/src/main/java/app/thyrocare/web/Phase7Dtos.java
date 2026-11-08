package app.thyrocare.web;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import app.thyrocare.domain.MedicalDocument;
import app.thyrocare.domain.NeckUltrasound;
import app.thyrocare.domain.PhysicianNote;
import app.thyrocare.domain.UltrasoundFinding;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

/** Phase 7 DTOs: neck ultrasound follow-up, medical documents, physician notes. */
public final class Phase7Dtos {
    private Phase7Dtos() {
    }

    public static final String LOC = "thyroid_bed|right_bed|left_bed|central|right_lateral|left_lateral|other";
    private static final String MM = "اندازه باید بین ۰ تا ۵۰۰ میلی‌متر باشد";

    public record DocumentDto(UUID id, String category, String title, LocalDate documentDate, String notes,
                              String originalFilename, String contentType, long sizeBytes, Instant createdAt) {
        public static DocumentDto from(MedicalDocument d) {
            return d == null || d.isDeleted() ? null : new DocumentDto(d.getId(), d.getCategory(), d.getTitle(),
                    d.getDocumentDate(), d.getNotes(), d.getOriginalFilename(), d.getContentType(), d.getSizeBytes(), d.getCreatedAt());
        }
    }

    public record FindingRequest(@NotBlank @Pattern(regexp = LOC, message = "محل یافته نامعتبر است") String location,
                                 @Size(max = 120) String locationText, @Size(max = 160) String findingType,
                                 @DecimalMin(value = "0", message = MM) @DecimalMax(value = "500", message = MM) BigDecimal lengthMm,
                                 @DecimalMin(value = "0", message = MM) @DecimalMax(value = "500", message = MM) BigDecimal widthMm,
                                 @DecimalMin(value = "0", message = MM) @DecimalMax(value = "500", message = MM) BigDecimal heightMm,
                                 @Size(max = 2000) String description) {
    }

    public record UltrasoundRequest(
            @NotNull(message = "تاریخ انجام سونوگرافی ضروری است") LocalDate examDate,
            @Size(max = 160) String imagingCenter,
            @Size(max = 120) String radiologistName,
            @Pattern(regexp = "routine_followup|tg_change|physician_request|symptom|other", message = "علت نامعتبر است") String reason,
            @Size(max = 200) String reasonText,
            @Pattern(regexp = "normal|post_surgical|finding|unclear", message = "وضعیت بستر تیروئید نامعتبر است") String thyroidBedStatus,
            @Pattern(regexp = "yes|no|unknown", message = "مقدار بافت باقی‌مانده نامعتبر است") String residualTissue,
            @Pattern(regexp = "yes|no", message = "مقدار یافته در بستر نامعتبر است") String bedFinding,
            @Pattern(regexp = "normal|finding|unclear", message = "وضعیت غدد لنفاوی نامعتبر است") String lymphNodeStatus,
            @Pattern(regexp = LOC, message = "محل یافته نامعتبر است") String findingLocation,
            @Size(max = 120) String findingLocationText,
            @DecimalMin(value = "0", message = MM) @DecimalMax(value = "500", message = MM) BigDecimal findingSizeMm,
            @Size(max = 4000) String descriptiveFeatures,
            @Size(max = 8000) String radiologistConclusion,
            UUID reportDocumentId,
            @Size(max = 10, message = "حداکثر ۱۰ یافته") List<@Valid FindingRequest> findings) {
    }

    public record FindingDto(UUID id, String location, String locationText, String findingType, BigDecimal lengthMm,
                             BigDecimal widthMm, BigDecimal heightMm, String description) {
        static FindingDto from(UltrasoundFinding f) {
            return new FindingDto(f.getId(), f.getLocation(), f.getLocationText(), f.getFindingType(), f.getLengthMm(),
                    f.getWidthMm(), f.getHeightMm(), f.getDescription());
        }
    }

    public record UltrasoundDto(UUID id, LocalDate examDate, String imagingCenter, String radiologistName, String reason,
                                String reasonText, String thyroidBedStatus, String residualTissue, String bedFinding,
                                String lymphNodeStatus, String findingLocation, String findingLocationText,
                                BigDecimal findingSizeMm, String descriptiveFeatures, String radiologistConclusion,
                                DocumentDto reportDocument, List<FindingDto> findings, Instant createdAt, Instant updatedAt) {
        public static UltrasoundDto from(NeckUltrasound u) {
            return new UltrasoundDto(u.getId(), u.getExamDate(), u.getImagingCenter(), u.getRadiologistName(), u.getReason(),
                    u.getReasonText(), u.getThyroidBedStatus(), u.getResidualTissue(), u.getBedFinding(),
                    u.getLymphNodeStatus(), u.getFindingLocation(), u.getFindingLocationText(), u.getFindingSizeMm(),
                    u.getDescriptiveFeatures(), u.getRadiologistConclusion(), DocumentDto.from(u.getReportDocument()),
                    u.getFindings().stream().map(FindingDto::from).toList(), u.getCreatedAt(), u.getUpdatedAt());
        }
    }

    public record NoteRequest(@NotBlank @Pattern(regexp = "ultrasound|document|general", message = "نوع یادداشت نامعتبر است") String targetType,
                              UUID targetId,
                              @NotBlank(message = "متن یادداشت خالی است") @Size(max = 2000, message = "حداکثر ۲۰۰۰ کاراکتر") String body) {
    }

    public record NoteUpdateRequest(@NotBlank(message = "متن یادداشت خالی است") @Size(max = 2000, message = "حداکثر ۲۰۰۰ کاراکتر") String body) {
    }

    public record NoteDto(UUID id, UUID physicianId, String physicianName, String targetType, UUID targetId, String body,
                          Instant createdAt, Instant updatedAt) {
        public static NoteDto from(PhysicianNote n) {
            return new NoteDto(n.getId(), n.getPhysician().getId(), n.getPhysician().getName(), n.getTargetType(),
                    n.getTargetId(), n.getBody(), n.getCreatedAt(), n.getUpdatedAt());
        }
    }
}
