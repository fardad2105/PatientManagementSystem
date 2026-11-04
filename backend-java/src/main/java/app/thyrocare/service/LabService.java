package app.thyrocare.service;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import app.thyrocare.common.ApiException;
import app.thyrocare.domain.LabResult;
import app.thyrocare.domain.LabTestType;
import app.thyrocare.repository.Repositories.LabResultRepository;
import app.thyrocare.repository.Repositories.UserRepository;
import app.thyrocare.web.Dtos.LabDto;
import app.thyrocare.web.Dtos.LabRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Stores lab values and the lab's own reference range. No interpretation or flagging is performed. */
@Service
@RequiredArgsConstructor
public class LabService {
    private final LabResultRepository labs;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public List<LabDto> list(UUID patientId, LabTestType type) {
        List<LabResult> rows = type == null
                ? labs.findByPatient_IdOrderBySampleDateAscCreatedAtAsc(patientId)
                : labs.findByPatient_IdAndTestTypeOrderBySampleDateAscCreatedAtAsc(patientId, type);
        return rows.stream().map(LabDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<LabDto> latestPerType(UUID patientId) {
        return Arrays.stream(LabTestType.values())
                .flatMap(t -> labs.findFirstByPatient_IdAndTestTypeOrderBySampleDateDescCreatedAtDesc(patientId, t).stream())
                .map(LabDto::from).toList();
    }

    @Transactional
    public LabDto create(UUID patientId, LabRequest r) {
        LabResult row = new LabResult();
        row.setPatient(users.getReferenceById(patientId));
        row.setEnteredBy(patientId);
        row.setSource("patient_reported");
        apply(row, r);
        return LabDto.from(labs.save(row));
    }

    @Transactional
    public LabDto update(UUID patientId, UUID id, LabRequest r) {
        LabResult row = owned(patientId, id);
        apply(row, r);
        row.setUpdatedAt(Instant.now());
        return LabDto.from(row);
    }

    @Transactional
    public void delete(UUID patientId, UUID id) {
        labs.delete(owned(patientId, id));
    }

    private LabResult owned(UUID patientId, UUID id) {
        return labs.findByIdAndPatient_Id(id, patientId).orElseThrow(() -> ApiException.notFound("نتیجه آزمایش یافت نشد"));
    }

    private void apply(LabResult row, LabRequest r) {
        if (!r.testType().allowsUnit(r.unit())) throw ApiException.badRequest("واحد انتخاب‌شده برای این آزمایش معتبر نیست");
        if (r.refLow() != null && r.refHigh() != null && r.refLow().compareTo(r.refHigh()) > 0) {
            throw ApiException.badRequest("حد پایین محدوده مرجع نمی‌تواند بیشتر از حد بالا باشد");
        }
        row.setTestType(r.testType());
        row.setValue(r.value());
        row.setUnit(r.unit());
        row.setSampleDate(r.sampleDate());
        row.setLabName(r.labName());
        row.setRefLow(r.refLow());
        row.setRefHigh(r.refHigh());
        row.setRefText(r.refText());
        row.setNotes(r.notes());
    }
}
