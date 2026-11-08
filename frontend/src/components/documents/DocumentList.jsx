import { FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { formatJalali } from "@/lib/date";
import { DOC_CATEGORIES, pick } from "@/lib/ultrasound";
import { fileSize, openFile } from "@/lib/files";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { NotesThread } from "@/components/notes/NotesThread";

export const FileChip = ({ doc, url, testId }) => (
  <button type="button" onClick={() => openFile(url)} data-testid={testId}
    className="inline-flex max-w-full items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
    {doc.content_type === "application/pdf" ? <FileText className="h-4 w-4 shrink-0" /> : <ImageIcon className="h-4 w-4 shrink-0" />}
    <span className="truncate">{doc.original_filename}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" />
  </button>
);

export const DocumentList = ({ docs, fileUrl, notes, patientId, canWrite, onDelete }) => {
  if (docs.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500" data-testid="documents-empty">هنوز فایلی بارگذاری نشده است.</p>;
  }
  return (
    <ul className="space-y-3">
      {docs.map((d) => (
        <li key={d.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" data-testid={`document-${d.id}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              {d.content_type === "application/pdf" ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-800">{d.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{pick(DOC_CATEGORIES, d.category)} · {d.document_date ? formatJalali(d.document_date) : `بارگذاری ${formatJalali(d.created_at)}`} · {fileSize(d.size_bytes)}</p>
              {d.notes && <p className="mt-1 text-xs text-slate-600">{d.notes}</p>}
            </div>
            <span className="flex shrink-0 items-center gap-1">
              <FileChip doc={{ ...d, original_filename: "مشاهده" }} url={fileUrl(d.id)} testId={`document-open-${d.id}`} />
              {onDelete && <ConfirmDelete title={`حذف «${d.title}»؟`} onConfirm={() => onDelete(d.id)} testId={`document-delete-${d.id}`} />}
            </span>
          </div>
          <NotesThread notes={notes} targetType="document" targetId={d.id} patientId={patientId} canWrite={canWrite} />
        </li>
      ))}
    </ul>
  );
};
