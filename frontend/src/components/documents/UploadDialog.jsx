import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, OptionSelect, inputCls } from "@/components/Field";
import { JalaliDateInput } from "@/components/JalaliDateInput";
import { apiError } from "@/lib/api";
import { DOC_CATEGORIES } from "@/lib/ultrasound";
import { uploadDocument } from "@/lib/files";

export const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
export const MAX = 10 * 1024 * 1024;

export const checkFile = (f) => {
  if (!f) return false;
  if (!ACCEPT.split(",").includes(f.type)) { toast.error("فقط فایل PDF، JPG، PNG یا WEBP مجاز است"); return false; }
  if (f.size > MAX) { toast.error("حجم فایل حداکثر ۱۰ مگابایت است"); return false; }
  return true;
};

export default function UploadDialog({ onClose, onDone }) {
  const [f, setF] = useState({ file: null, category: "lab", title: "", date: null, notes: "" });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await uploadDocument(f);
      toast.success("فایل بارگذاری شد");
      onDone();
      onClose();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto" data-testid="upload-dialog">
        <DialogHeader><DialogTitle className="text-right">بارگذاری مدرک پزشکی</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center text-sm text-blue-800 hover:bg-blue-50">
            <Upload className="h-6 w-6" />
            {f.file ? <span className="font-semibold" data-testid="upload-file-name">{f.file.name}</span> : <span>انتخاب فایل (PDF یا تصویر، حداکثر ۱۰ مگابایت)</span>}
            <input type="file" accept={ACCEPT} className="hidden" data-testid="upload-file-input"
              onChange={(e) => { const file = e.target.files?.[0]; if (checkFile(file)) setF((s) => ({ ...s, file })); e.target.value = ""; }} />
          </label>
          <Field label="نوع مدرک"><OptionSelect value={f.category} onChange={(v) => setF((s) => ({ ...s, category: v }))} options={DOC_CATEGORIES} testId="upload-category-select" /></Field>
          <Field label="عنوان (اختیاری)"><Input className={inputCls} value={f.title} maxLength={160} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} data-testid="upload-title-input" /></Field>
          <Field label="تاریخ مدرک (اختیاری)"><JalaliDateInput value={f.date} onChange={(v) => setF((s) => ({ ...s, date: v }))} testId="upload-date-input" /></Field>
          <Field label="توضیحات (اختیاری)"><Textarea value={f.notes} maxLength={1000} onChange={(e) => setF((s) => ({ ...s, notes: e.target.value }))} className="rounded-xl" data-testid="upload-notes-input" /></Field>
          <button onClick={submit} disabled={!f.file || busy} data-testid="upload-submit-button"
            className="w-full rounded-full bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{busy ? "در حال بارگذاری…" : "بارگذاری"}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
