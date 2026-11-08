package app.thyrocare.web;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.thyrocare.domain.User;
import app.thyrocare.service.AccessService;
import app.thyrocare.service.AuditService;
import app.thyrocare.service.DocumentService;
import app.thyrocare.service.DocumentService.FileBlob;
import app.thyrocare.service.PhysicianNoteService;
import app.thyrocare.service.UltrasoundService;
import app.thyrocare.web.Phase7Dtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Phase 7: neck ultrasound follow-up, medical document upload/download and physician notes. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class Phase7Controller {
    private final UltrasoundService ultrasounds;
    private final DocumentService documents;
    private final PhysicianNoteService notes;
    private final AccessService access;
    private final AuditService audit;

    // ----- patient: ultrasounds -----
    @GetMapping("/patient/ultrasounds")
    public List<UltrasoundDto> myUltrasounds(@AuthenticationPrincipal User me) {
        return ultrasounds.list(me.getId());
    }

    @PostMapping("/patient/ultrasounds")
    public UltrasoundDto createUltrasound(@Valid @RequestBody UltrasoundRequest body, @AuthenticationPrincipal User me) {
        UltrasoundDto dto = ultrasounds.create(me.getId(), body);
        audit.log(me, "create", "neck_ultrasound", dto.id());
        return dto;
    }

    @PutMapping("/patient/ultrasounds/{id}")
    public UltrasoundDto updateUltrasound(@PathVariable UUID id, @Valid @RequestBody UltrasoundRequest body, @AuthenticationPrincipal User me) {
        UltrasoundDto dto = ultrasounds.update(me.getId(), id, body);
        audit.log(me, "update", "neck_ultrasound", id);
        return dto;
    }

    @DeleteMapping("/patient/ultrasounds/{id}")
    public Map<String, Boolean> deleteUltrasound(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        ultrasounds.delete(me.getId(), id);
        audit.log(me, "delete", "neck_ultrasound", id);
        return Map.of("ok", true);
    }

    // ----- patient: documents -----
    @GetMapping("/patient/documents")
    public List<DocumentDto> myDocuments(@AuthenticationPrincipal User me) {
        return documents.list(me.getId());
    }

    @PostMapping(value = "/patient/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentDto upload(@RequestPart("file") MultipartFile file, @RequestParam String category,
                              @RequestParam(required = false) String title,
                              @RequestParam(name = "document_date", required = false) LocalDate documentDate,
                              @RequestParam(required = false) String notes, @AuthenticationPrincipal User me) {
        DocumentDto dto = documents.upload(me.getId(), file, category, title, documentDate, notes);
        audit.log(me, "upload", "medical_document", dto.id());
        return dto;
    }

    @DeleteMapping("/patient/documents/{id}")
    public Map<String, Boolean> deleteDocument(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        documents.delete(me.getId(), id);
        audit.log(me, "delete", "medical_document", id);
        return Map.of("ok", true);
    }

    @GetMapping("/patient/documents/{id}/file")
    public ResponseEntity<byte[]> myFile(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        return file(documents.download(me.getId(), id));
    }

    @GetMapping("/patient/notes")
    public List<NoteDto> myNotes(@AuthenticationPrincipal User me) {
        return notes.forPatient(me.getId());
    }

    // ----- physician (assigned patients only) -----
    @GetMapping("/physician/patients/{id}/ultrasounds")
    public List<UltrasoundDto> patientUltrasounds(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "view_ultrasounds");
        return ultrasounds.list(id);
    }

    @GetMapping("/physician/patients/{id}/documents")
    public List<DocumentDto> patientDocuments(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "view_documents");
        return documents.list(id);
    }

    @GetMapping("/physician/patients/{id}/documents/{docId}/file")
    public ResponseEntity<byte[]> patientFile(@PathVariable UUID id, @PathVariable UUID docId, @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "download_document");
        FileBlob blob = documents.download(id, docId);
        audit.log(me, "download", "medical_document", docId);
        return file(blob);
    }

    @GetMapping("/physician/patients/{id}/notes")
    public List<NoteDto> patientNotes(@PathVariable UUID id, @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "view_notes");
        return notes.forPatient(id);
    }

    @PostMapping("/physician/patients/{id}/notes")
    public NoteDto addNote(@PathVariable UUID id, @Valid @RequestBody NoteRequest body, @AuthenticationPrincipal User me) {
        access.assignedPatient(me, id, "create_note");
        NoteDto dto = notes.create(me, id, body);
        audit.log(me, "create", "physician_note", dto.id());
        return dto;
    }

    @PutMapping("/physician/notes/{noteId}")
    public NoteDto editNote(@PathVariable UUID noteId, @Valid @RequestBody NoteUpdateRequest body, @AuthenticationPrincipal User me) {
        NoteDto dto = notes.update(me, noteId, body.body());
        audit.log(me, "update", "physician_note", noteId);
        return dto;
    }

    @DeleteMapping("/physician/notes/{noteId}")
    public Map<String, Boolean> deleteNote(@PathVariable UUID noteId, @AuthenticationPrincipal User me) {
        notes.delete(me, noteId);
        audit.log(me, "delete", "physician_note", noteId);
        return Map.of("ok", true);
    }

    private static ResponseEntity<byte[]> file(FileBlob b) {
        String encoded = URLEncoder.encode(b.filename(), StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(b.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encoded)
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(b.data());
    }
}
