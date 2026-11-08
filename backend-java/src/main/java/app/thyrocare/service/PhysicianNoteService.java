package app.thyrocare.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.PhysicianNote;
import app.thyrocare.domain.User;
import app.thyrocare.repository.Repositories.MedicalDocumentRepository;
import app.thyrocare.repository.Repositories.NeckUltrasoundRepository;
import app.thyrocare.repository.Repositories.PhysicianNoteRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.web.Phase7Dtos.NoteDto;
import app.thyrocare.web.Phase7Dtos.NoteRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Physician notes on an assigned patient's ultrasound/document/record. Only the author can edit or delete. */
@Service
@RequiredArgsConstructor
public class PhysicianNoteService {
    private final PhysicianNoteRepository repo;
    private final UserRepository users;
    private final NeckUltrasoundRepository ultrasounds;
    private final MedicalDocumentRepository documents;
    private final AccessService access;

    @Transactional(readOnly = true)
    public List<NoteDto> forPatient(UUID patientId) {
        return repo.findByPatient_IdOrderByCreatedAtDesc(patientId).stream().map(NoteDto::from).toList();
    }

    @Transactional
    public NoteDto create(User me, UUID patientId, NoteRequest r) {
        if (!"general".equals(r.targetType())) {
            if (r.targetId() == null) throw ApiException.badRequest("مورد یادداشت مشخص نیست");
            boolean ok = "ultrasound".equals(r.targetType())
                    ? ultrasounds.findByIdAndPatient_Id(r.targetId(), patientId).isPresent()
                    : documents.findByIdAndPatient_IdAndDeletedFalse(r.targetId(), patientId).isPresent();
            if (!ok) throw ApiException.notFound("مورد یادداشت یافت نشد");
        }
        PhysicianNote n = new PhysicianNote();
        n.setPhysician(users.getReferenceById(me.getId()));
        n.setPatient(users.getReferenceById(patientId));
        n.setTargetType(r.targetType());
        n.setTargetId("general".equals(r.targetType()) ? null : r.targetId());
        n.setBody(r.body().trim());
        return NoteDto.from(repo.saveAndFlush(n));
    }

    @Transactional
    public NoteDto update(User me, UUID noteId, String body) {
        PhysicianNote n = own(me, noteId);
        n.setBody(body.trim());
        n.setUpdatedAt(Instant.now());
        return NoteDto.from(n);
    }

    @Transactional
    public UUID delete(User me, UUID noteId) {
        PhysicianNote n = own(me, noteId);
        UUID patientId = n.getPatient().getId();
        repo.delete(n);
        return patientId;
    }

    private PhysicianNote own(User me, UUID noteId) {
        PhysicianNote n = repo.findByIdAndPhysician_Id(noteId, me.getId()).orElseThrow(() -> ApiException.notFound("یادداشت یافت نشد"));
        access.assignedPatient(me, n.getPatient().getId(), "edit_note");
        return n;
    }
}
