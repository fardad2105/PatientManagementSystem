import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, OptionSelect, inputCls } from "@/components/Field";
import { LOCATIONS } from "@/lib/ultrasound";

export const emptyFinding = () => ({ location: "thyroid_bed", location_text: "", finding_type: "یافته توصیف‌شده در گزارش", length_mm: "", width_mm: "", height_mm: "", description: "" });

const Dim = ({ label, value, onChange, testId }) => (
  <Field label={label}><Input className={inputCls} dir="ltr" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId} /></Field>
);

export const FindingsEditor = ({ rows, onChange }) => {
  const set = (i, k) => (v) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v?.target ? v.target.value : v } : r)));
  return (
    <div className="space-y-3" data-testid="findings-editor">
      {rows.map((r, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4" data-testid={`finding-row-${i}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">یافته {i + 1}</p>
            <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="حذف یافته" data-testid={`finding-remove-${i}`} className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="محل یافته"><OptionSelect value={r.location} onChange={set(i, "location")} options={LOCATIONS} testId={`finding-location-${i}`} /></Field>
            <Field label="توضیح محل (اختیاری)"><Input className={inputCls} value={r.location_text} maxLength={120} onChange={set(i, "location_text")} data-testid={`finding-location-text-${i}`} /></Field>
            <Field label="نوع یافته" className="sm:col-span-2"><Input className={inputCls} value={r.finding_type} maxLength={160} onChange={set(i, "finding_type")} data-testid={`finding-type-${i}`} /></Field>
          </div>
          <p className="text-xs font-semibold text-slate-500">ابعاد (میلی‌متر)</p>
          <div className="grid grid-cols-3 gap-2">
            <Dim label="طول" value={r.length_mm} onChange={set(i, "length_mm")} testId={`finding-length-${i}`} />
            <Dim label="عرض" value={r.width_mm} onChange={set(i, "width_mm")} testId={`finding-width-${i}`} />
            <Dim label="ارتفاع" value={r.height_mm} onChange={set(i, "height_mm")} testId={`finding-height-${i}`} />
          </div>
          <Field label="توضیحات گزارش"><Textarea value={r.description} maxLength={2000} onChange={set(i, "description")} placeholder="متن توصیفی گزارش رادیولوژیست..." className="rounded-xl bg-white" data-testid={`finding-description-${i}`} /></Field>
        </div>
      ))}
      {rows.length < 10 && (
        <button type="button" onClick={() => onChange([...rows, emptyFinding()])} data-testid="finding-add-button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
          <Plus className="h-4 w-4" /> ثبت یافته سونوگرافی
        </button>
      )}
    </div>
  );
};
