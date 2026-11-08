import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, OptionSelect, inputCls } from "@/components/Field";
import { JalaliDateInput } from "@/components/JalaliDateInput";
import { api, apiError } from "@/lib/api";
import { toEn } from "@/lib/date";
import { BED_STATUS, LOCATIONS, LYMPH, REASONS, YES_NO, YES_NO_UNKNOWN } from "@/lib/ultrasound";
import { uploadDocument } from "@/lib/files";
import { ACCEPT, checkFile } from "@/components/documents/UploadDialog";
import { FindingsEditor } from "@/components/ultrasound/FindingsEditor";

const NONE = "__none";
const opt = (map) => ({ [NONE]: "—", ...map });
const num = (v) => (v === "" || v === null || v === undefined ? null : Number(toEn(String(v)).trim()));
const str = (v) => (v === null || v === undefined ? "" : String(v));

const fromDto = (u) => ({
  exam_date: u?.exam_date || null, imaging_center: str(u?.imaging_center), radiologist_name: str(u?.radiologist_name),
  reason: u?.reason || NONE, reason_text: str(u?.reason_text), thyroid_bed_status: u?.thyroid_bed_status || NONE,
  residual_tissue: u?.residual_tissue || NONE, bed_finding: u?.bed_finding || NONE, lymph_node_status: u?.lymph_node_status || NONE,
  finding_location: u?.finding_location || NONE, finding_location_text: str(u?.finding_location_text), finding_size_mm: str(u?.finding_size_mm),
  descriptive_features: str(u?.descriptive_features), radiologist_conclusion: str(u?.radiologist_conclusion),
  report: u?.report_document || null,
  findings: (u?.findings || []).map((f) => ({ ...f, location_text: str(f.location_text), finding_type: str(f.finding_type), length_mm: str(f.length_mm), width_mm: str(f.width_mm), height_mm: str(f.height_mm), description: str(f.description) })),
});

const Section = ({ title, children }) => (
  <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
    <h3 className="text-sm font-extrabold text-blue-800">{title}</h3>
    {children}
  </section>
);

const toBody = (f, reportId) => {
  const n = (v) => (v === NONE ? null : v);
  const dims = [f.finding_size_mm, ...f.findings.flatMap((x) => [x.length_mm, x.width_mm, x.height_mm])];
  if (dims.some((v) => v !== "" && Number.isNaN(num(v)))) throw new Error("ابعاد باید عدد باشند");
  return {
    exam_date: f.exam_date, imaging_center: f.imaging_center, radiologist_name: f.radiologist_name, reason: n(f.reason), reason_text: f.reason_text,
    thyroid_bed_status: n(f.thyroid_bed_status), residual_tissue: n(f.residual_tissue), bed_finding: n(f.bed_finding), lymph_node_status: n(f.lymph_node_status),
    finding_location: n(f.finding_location), finding_location_text: f.finding_location_text, finding_size_mm: num(f.finding_size_mm),
    descriptive_features: f.descriptive_features, radiologist_conclusion: f.radiologist_conclusion, report_document_id: reportId,
    findings: f.findings.map((x) => ({ ...x, length_mm: num(x.length_mm), width_mm: num(x.width_mm), height_mm: num(x.height_mm) })),
  };
};

export default function UltrasoundDialog({ initial, onClose, onSaved }) {
  const [f, setF] = useState(() => fromDto(initial));
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));
  const sel = (k, map, id) => <OptionSelect value={f[k]} onChange={set(k)} options={opt(map)} testId={id} />;

  const submit = async () => {
    setBusy(true);
    try {
      let reportId = f.report?.id || null;
      if (file) reportId = (await uploadDocument({ file, category: "ultrasound", title: "گزارش سونوگرافی گردن", date: f.exam_date })).id;
      const body = toBody(f, reportId);
      if (initial?.id) await api.put(`/patient/ultrasounds/${initial.id}`, body);
      else await api.post("/patient/ultrasounds", body);
      toast.success("سونوگرافی ذخیره شد");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.response ? apiError(e) : e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-h-[92vh] overflow-y-auto sm:max-w-3xl" data-testid="ultrasound-dialog">
        <DialogHeader><DialogTitle className="text-right">{initial?.id ? "ویرایش سونوگرافی" : "ثبت سونوگرافی گردن"}</DialogTitle></DialogHeader>
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">اطلاعات را دقیقاً مطابق متن گزارش رادیولوژیست وارد کنید. سامانه این اطلاعات را تفسیر نمی‌کند.</p>
        <Section title="الف) اطلاعات عمومی سونوگرافی">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="تاریخ انجام سونوگرافی *"><JalaliDateInput value={f.exam_date} onChange={set("exam_date")} testId="us-date-input" /></Field>
            <Field label="مرکز تصویربرداری"><Input className={inputCls} value={f.imaging_center} maxLength={160} onChange={set("imaging_center")} data-testid="us-center-input" /></Field>
            <Field label="نام پزشک یا رادیولوژیست"><Input className={inputCls} value={f.radiologist_name} maxLength={120} onChange={set("radiologist_name")} data-testid="us-radiologist-input" /></Field>
            <Field label="علت انجام سونوگرافی">{sel("reason", REASONS, "us-reason-select")}</Field>
            {f.reason === "other" && <Field label="توضیح علت" className="sm:col-span-2"><Input className={inputCls} value={f.reason_text} maxLength={200} onChange={set("reason_text")} data-testid="us-reason-text-input" /></Field>}
          </div>
          <Field label="فایل گزارش سونوگرافی (PDF یا تصویر، توصیه‌شده)">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-blue-200 px-4 py-3 text-sm text-blue-800 hover:bg-blue-50">
              <Upload className="h-4 w-4 shrink-0" />
              <span className="truncate" data-testid="us-file-name">{file ? file.name : f.report ? `${f.report.original_filename} (جایگزینی با فایل جدید)` : "انتخاب فایل"}</span>
              <input type="file" accept={ACCEPT} className="hidden" data-testid="us-file-input"
                onChange={(e) => { const x = e.target.files?.[0]; if (checkFile(x)) setFile(x); e.target.value = ""; }} />
            </label>
          </Field>
        </Section>
        <Section title="ب) یافته‌های سونوگرافی (طبق گزارش)">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="وضعیت بستر تیروئید">{sel("thyroid_bed_status", BED_STATUS, "us-bed-status-select")}</Field>
            <Field label="وجود بافت باقی‌مانده">{sel("residual_tissue", YES_NO_UNKNOWN, "us-residual-select")}</Field>
            <Field label="وجود یافته در بستر تیروئید">{sel("bed_finding", YES_NO, "us-bed-finding-select")}</Field>
            <Field label="وضعیت غدد لنفاوی گردن">{sel("lymph_node_status", LYMPH, "us-lymph-select")}</Field>
            <Field label="محل یافته">{sel("finding_location", LOCATIONS, "us-location-select")}</Field>
            <Field label="توضیح محل"><Input className={inputCls} value={f.finding_location_text} maxLength={120} onChange={set("finding_location_text")} data-testid="us-location-text-input" /></Field>
            <Field label="اندازه یافته (میلی‌متر)"><Input className={inputCls} dir="ltr" inputMode="decimal" value={f.finding_size_mm} onChange={set("finding_size_mm")} data-testid="us-size-input" /></Field>
          </div>
          <Field label="ویژگی‌های توصیفی"><Textarea value={f.descriptive_features} maxLength={4000} onChange={set("descriptive_features")} className="rounded-xl" data-testid="us-features-input" /></Field>
          <Field label="نتیجه‌گیری رادیولوژیست (متن اصلی گزارش)"><Textarea rows={4} value={f.radiologist_conclusion} maxLength={8000} onChange={set("radiologist_conclusion")} className="rounded-xl" data-testid="us-conclusion-input" /></Field>
        </Section>
        <Section title="ج) یافته‌های مشخص قابل پیگیری">
          <FindingsEditor rows={f.findings} onChange={set("findings")} />
        </Section>
        <button onClick={submit} disabled={!f.exam_date || busy} data-testid="us-save-button"
          className="w-full rounded-full bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{busy ? "در حال ذخیره…" : "ذخیره سونوگرافی"}</button>
      </DialogContent>
    </Dialog>
  );
}
