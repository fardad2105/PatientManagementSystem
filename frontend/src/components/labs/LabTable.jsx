import { Pencil } from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { formatJalali, toFa } from "@/lib/date";

const refRange = (r) => (r.ref_low != null || r.ref_high != null ? `${toFa(r.ref_low ?? "—")} – ${toFa(r.ref_high ?? "—")}` : "—");

export default function LabTable({ rows, onEdit, onDelete, readOnly = false, testId }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-slate-500" data-testid={`${testId}-empty`}>نتیجه‌ای ثبت نشده است.</p>;
  return (
    <div className="overflow-x-auto" data-testid={testId}>
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-right text-xs text-slate-500">
            <th className="py-3 font-medium">تاریخ</th>
            <th className="py-3 font-medium">مقدار</th>
            <th className="py-3 font-medium">محدوده‌ی مرجع آزمایشگاه</th>
            <th className="py-3 font-medium">آزمایشگاه</th>
            {!readOnly && <th className="py-3" />}
          </tr>
        </thead>
        <tbody>
          {[...rows].reverse().map((r) => (
            <tr key={r.id} className="border-b border-slate-100" data-testid={`lab-row-${r.id}`}>
              <td className="py-3 text-slate-600">{formatJalali(r.sample_date)}</td>
              <td className="py-3 font-semibold text-slate-800">{toFa(r.value)} <span className="text-xs font-normal text-slate-500" dir="ltr">{r.unit}</span></td>
              <td className="py-3 text-slate-600">{refRange(r)}</td>
              <td className="py-3 text-slate-500">{r.lab_name || "—"}</td>
              {!readOnly && (
                <td className="py-3 text-left">
                  <button onClick={() => onEdit(r)} aria-label="ویرایش" data-testid={`lab-edit-${r.id}`} className="rounded-full p-2 text-slate-400 hover:bg-teal-50 hover:text-teal-700"><Pencil className="h-4 w-4" /></button>
                  <ConfirmDelete title="حذف این نتیجه؟" onConfirm={() => onDelete(r)} testId={`lab-delete-${r.id}`} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
