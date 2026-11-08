package app.thyrocare.service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.MedicalDocument;
import app.thyrocare.repository.Repositories.MedicalDocumentRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.web.Phase7Dtos.DocumentDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Patient medical documents: validated by size and file signature, stored privately, served only via the backend. */
@Service
@RequiredArgsConstructor
public class DocumentService {
    public static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final List<String> CATEGORIES = List.of("lab", "ultrasound", "pathology", "imaging", "report", "other");
    private static final Map<String, String> EXT = Map.of("application/pdf", "pdf", "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");

    private final MedicalDocumentRepository repo;
    private final UserRepository users;
    private final StorageService storage;

    public record FileBlob(byte[] data, String contentType, String filename) {
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> list(UUID patientId) {
        return repo.findByPatient_IdAndDeletedFalseOrderByCreatedAtDesc(patientId).stream().map(DocumentDto::from).toList();
    }

    @Transactional
    public DocumentDto upload(UUID patientId, MultipartFile file, String category, String title, LocalDate date, String notes) {
        if (!CATEGORIES.contains(category)) throw ApiException.badRequest("دسته‌بندی نامعتبر است");
        if (file == null || file.isEmpty()) throw ApiException.badRequest("فایلی انتخاب نشده است");
        if (file.getSize() > MAX_BYTES) throw ApiException.badRequest("حجم فایل حداکثر ۱۰ مگابایت است");
        if (date != null && date.isAfter(LocalDate.now(PhysicianInsightService.ZONE))) throw ApiException.badRequest("تاریخ نمی‌تواند در آینده باشد");
        String name = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename().replaceAll("[\\\\/\\r\\n]", "_");
        String t = title == null || title.isBlank() ? name : title.trim();
        if (t.length() > 160) throw ApiException.badRequest("عنوان حداکثر ۱۶۰ کاراکتر است");
        if (notes != null && notes.length() > 1000) throw ApiException.badRequest("توضیحات حداکثر ۱۰۰۰ کاراکتر است");
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("خواندن فایل ناموفق بود");
        }
        String type = sniff(data);
        if (type == null) throw ApiException.badRequest("فقط فایل PDF، JPG، PNG یا WEBP مجاز است");
        String path = storage.put(StorageService.pathFor(patientId, EXT.get(type)), data, type);
        MedicalDocument d = new MedicalDocument();
        d.setPatient(users.getReferenceById(patientId));
        d.setCategory(category);
        d.setTitle(t);
        d.setDocumentDate(date);
        d.setNotes(notes == null || notes.isBlank() ? null : notes.trim());
        d.setStoragePath(path);
        d.setOriginalFilename(name.length() > 255 ? name.substring(name.length() - 255) : name);
        d.setContentType(type);
        d.setSizeBytes(data.length);
        return DocumentDto.from(repo.save(d));
    }

    @Transactional
    public void delete(UUID patientId, UUID id) {
        find(patientId, id).setDeleted(true);
    }

    @Transactional(readOnly = true)
    public MedicalDocument find(UUID patientId, UUID id) {
        return repo.findByIdAndPatient_IdAndDeletedFalse(id, patientId).orElseThrow(() -> ApiException.notFound("فایل یافت نشد"));
    }

    @Transactional(readOnly = true)
    public FileBlob download(UUID patientId, UUID id) {
        MedicalDocument d = find(patientId, id);
        return new FileBlob(storage.get(d.getStoragePath()), d.getContentType(), d.getOriginalFilename());
    }

    private static String sniff(byte[] b) {
        if (starts(b, 0x25, 0x50, 0x44, 0x46)) return "application/pdf";
        if (starts(b, 0x89, 0x50, 0x4E, 0x47)) return "image/png";
        if (starts(b, 0xFF, 0xD8, 0xFF)) return "image/jpeg";
        if (b.length > 12 && starts(b, 0x52, 0x49, 0x46, 0x46) && new String(Arrays.copyOfRange(b, 8, 12)).equals("WEBP")) return "image/webp";
        return null;
    }

    private static boolean starts(byte[] b, int... sig) {
        if (b.length < sig.length) return false;
        for (int i = 0; i < sig.length; i++) if ((b[i] & 0xFF) != sig[i]) return false;
        return true;
    }
}
