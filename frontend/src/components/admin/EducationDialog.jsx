import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, OptionSelect, inputCls } from "@/components/Field";
import { api, apiError } from "@/lib/api";

export const CONTENT_TYPES = { article: "مقاله", video: "ویدیو", infographic: "اینفوگرافیک" };
export const CONTENT_STATUS = { draft: "پیش‌نویس", in_review: "در انتظار بازبینی", published: "منتشرشده" };

const blank = { title: "", content_type: "article", summary: "", body: "", media_url: "", status: "draft", reviewer_name: "" };

export default function EducationDialog({ initial, onClose, onSaved }) {
  const [f, setF] = useState(initial ? { ...blank, ...Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, v ?? ""])) } : blank);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));
  const needsReviewer = f.status === "published" && !f.reviewer_name.trim();
  const submit = async () => {
    const body = { ...f, summary: f.summary || null, body: f.body || null, media_url: f.media_url || null, reviewer_name: f.reviewer_name || null };
    try {
      if (initial?.id) await api.put(`/admin/education/${initial.id}`, body);
      else await api.post("/admin/education", body);
      toast.success("محتوا ذخیره شد");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiError(err));
    }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-testid="education-dialog">
        <DialogHeader><DialogTitle className="text-right">{initial?.id ? "ویرایش محتوا" : "محتوای جدید"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="عنوان" className="sm:col-span-2"><Input className={inputCls} value={f.title} onChange={set("title")} maxLength={160} data-testid="education-title-input" /></Field>
          <Field label="نوع محتوا"><OptionSelect value={f.content_type} onChange={set("content_type")} options={CONTENT_TYPES} testId="education-type-select" /></Field>
          <Field label="وضعیت"><OptionSelect value={f.status} onChange={set("status")} options={CONTENT_STATUS} testId="education-status-select" /></Field>
          <Field label="خلاصه" className="sm:col-span-2"><Input className={inputCls} value={f.summary} onChange={set("summary")} maxLength={300} data-testid="education-summary-input" /></Field>
          <Field label="متن محتوا" className="sm:col-span-2"><Textarea rows={6} value={f.body} onChange={set("body")} className="rounded-xl" data-testid="education-body-input" /></Field>
          <Field label="نشانی ویدیو / تصویر (اختیاری)" className="sm:col-span-2"><Input className={inputCls} dir="ltr" value={f.media_url} onChange={set("media_url")} placeholder="https://" data-testid="education-media-input" /></Field>
          <Field label="متخصص بازبین" hint="انتشار فقط پس از ثبت نام متخصص بازبین ممکن است" className="sm:col-span-2">
            <Input className={inputCls} value={f.reviewer_name} onChange={set("reviewer_name")} maxLength={120} data-testid="education-reviewer-input" />
          </Field>
        </div>
        {needsReviewer && <p className="text-xs text-rose-600" data-testid="education-reviewer-required">برای انتشار، نام متخصص بازبین را وارد کنید.</p>}
        <button onClick={submit} disabled={!f.title.trim() || needsReviewer} data-testid="education-save-button"
          className="w-full rounded-full bg-purple-700 py-3 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50">ذخیره</button>
      </DialogContent>
    </Dialog>
  );
}
