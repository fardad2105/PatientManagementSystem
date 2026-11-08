import { ScanLine, Pencil } from "lucide-react";
import { formatJalali, toFa } from "@/lib/date";
import { BED_STATUS, LOCATIONS, LYMPH, REASONS, YES_NO, YES_NO_UNKNOWN, pick } from "@/lib/ultrasound";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { NotesThread } from "@/components/notes/NotesThread";
import { FileChip } from "@/components/documents/DocumentList";

const Item = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2">
    <p className="text-[11px] text-slate-500">{label}</p>
    <p className="text-sm font-semibold text-slate-800">{value || "—"}</p>
  </div>
);
const mm = (v) => (v === null || v === undefined ? "—" : toFa(v));

const Findings = ({ rows, id }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full min-w-[520px] text-xs" data-testid={`us-findings-${id}`}>
      <thead className="bg-slate-50 text-right text-slate-500">
        <tr>{["محل", "نوع یافته", "طول", "عرض", "ارتفاع", "توضیحات"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((f) => (
          <tr key={f.id} className="border-t border-slate-100">
            <td className="px-3 py-2 font-semibold text-slate-700">{pick(LOCATIONS, f.location)}{f.location_text ? ` — ${f.location_text}` : ""}</td>
            <td className="px-3 py-2">{f.finding_type || "—"}</td>
            <td className="px-3 py-2" dir="ltr">{mm(f.length_mm)}</td>
            <td className="px-3 py-2" dir="ltr">{mm(f.width_mm)}</td>
            <td className="px-3 py-2" dir="ltr">{mm(f.height_mm)}</td>
            <td className="px-3 py-2 text-slate-600">{f.description || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const UltrasoundCard = ({ u, fileUrl, notes, patientId, canWrite, onEdit, onDelete }) => (
  <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid={`us-card-${u.id}`}>
    <header className="flex flex-wrap items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ScanLine className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-800">سونوگرافی گردن · {formatJalali(u.exam_date)}</p>
        <p className="text-xs text-slate-500">{[u.imaging_center, u.radiologist_name, u.reason === "other" ? u.reason_text : u.reason && pick(REASONS, u.reason)].filter(Boolean).join(" · ") || "—"}</p>
      </div>
      {onEdit && (
        <span className="flex gap-1">
          <button onClick={() => onEdit(u)} aria-label="ویرایش" data-testid={`us-edit-${u.id}`} className="rounded-full bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"><Pencil className="h-4 w-4" /></button>
          <ConfirmDelete title="حذف این سونوگرافی؟" onConfirm={() => onDelete(u.id)} testId={`us-delete-${u.id}`} />
        </span>
      )}
    </header>
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <Item label="وضعیت بستر تیروئید" value={u.thyroid_bed_status && pick(BED_STATUS, u.thyroid_bed_status)} />
      <Item label="بافت باقی‌مانده" value={u.residual_tissue && pick(YES_NO_UNKNOWN, u.residual_tissue)} />
      <Item label="یافته در بستر تیروئید" value={u.bed_finding && pick(YES_NO, u.bed_finding)} />
      <Item label="غدد لنفاوی گردن" value={u.lymph_node_status && pick(LYMPH, u.lymph_node_status)} />
      <Item label="محل یافته" value={[u.finding_location && pick(LOCATIONS, u.finding_location), u.finding_location_text].filter(Boolean).join(" — ")} />
      <Item label="اندازه یافته" value={u.finding_size_mm !== null && u.finding_size_mm !== undefined ? `${toFa(u.finding_size_mm)} میلی‌متر` : null} />
    </div>
    {u.descriptive_features && <div><p className="mb-1 text-xs font-bold text-slate-500">ویژگی‌های توصیفی</p><p className="whitespace-pre-line text-sm text-slate-700">{u.descriptive_features}</p></div>}
    {u.radiologist_conclusion && <div className="rounded-xl border-r-4 border-blue-600 bg-blue-50/50 px-4 py-3"><p className="mb-1 text-xs font-bold text-blue-800">نتیجه‌گیری رادیولوژیست</p><p className="whitespace-pre-line text-sm text-slate-700" data-testid={`us-conclusion-${u.id}`}>{u.radiologist_conclusion}</p></div>}
    {u.findings.length > 0 && <Findings rows={u.findings} id={u.id} />}
    {u.report_document && <FileChip doc={u.report_document} url={fileUrl(u.report_document.id)} testId={`us-report-${u.id}`} />}
    <NotesThread notes={notes} targetType="ultrasound" targetId={u.id} patientId={patientId} canWrite={canWrite} />
  </article>
);
