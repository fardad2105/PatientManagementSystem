import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, inputCls } from "@/components/Field";
import { JalaliDateInput } from "@/components/JalaliDateInput";
import { SaveButton } from "@/components/profile/PersonalForm";
import { api, apiError } from "@/lib/api";

const FIELDS = ["name", "dose_text", "frequency_text", "instructions", "prescriber_name", "start_date", "end_date", "notes"];
const payload = (f) => ({ ...Object.fromEntries(FIELDS.map((k) => [k, f[k] || null])), active: f.active !== false });

export default function MedicationDialog({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || { active: true });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initial?.id) await api.put(`/patient/medications/${initial.id}`, payload(form));
      else await api.post("/patient/medications", payload(form));
      toast.success("دارو ذخیره شد");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-testid="medication-dialog">
        <DialogHeader><DialogTitle className="text-right">{initial?.id ? "ویرایش دارو" : "افزودن دارو"}</DialogTitle></DialogHeader>
        <p className="rounded-xl bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900">
          نام و دوز را دقیقاً مطابق نسخه‌ی پزشک وارد کنید. سامانه هیچ دوزی پیشنهاد یا تغییر نمی‌دهد.
        </p>
        <form onSubmit={onSubmit} className="space-y-4" data-testid="medication-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام دارو">
              <Input required className={inputCls} value={form.name || ""} onChange={set("name")} data-testid="medication-name-input" />
            </Field>
            <Field label="دوز (مطابق نسخه)">
              <Input required className={inputCls} value={form.dose_text || ""} onChange={set("dose_text")} data-testid="medication-dose-input" />
            </Field>
            <Field label="دفعات مصرف">
              <Input className={inputCls} placeholder="مثلاً روزی یک بار صبح" value={form.frequency_text || ""} onChange={set("frequency_text")} data-testid="medication-frequency-input" />
            </Field>
            <Field label="پزشک تجویزکننده">
              <Input className={inputCls} value={form.prescriber_name || ""} onChange={set("prescriber_name")} data-testid="medication-prescriber-input" />
            </Field>
            <Field label="تاریخ شروع">
              <JalaliDateInput value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} testId="medication-start-date-input" allowFuture />
            </Field>
            <Field label="تاریخ پایان (اختیاری)">
              <JalaliDateInput value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} testId="medication-end-date-input" allowFuture />
            </Field>
            <Field label="دستور مصرف" className="sm:col-span-2">
              <Input className={inputCls} placeholder="مثلاً ناشتا با یک لیوان آب" value={form.instructions || ""} onChange={set("instructions")} data-testid="medication-instructions-input" />
            </Field>
            <Field label="یادداشت" className="sm:col-span-2">
              <Textarea className="rounded-xl border-slate-200" value={form.notes || ""} onChange={set("notes")} data-testid="medication-notes-input" />
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <Switch checked={form.active !== false} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="medication-active-switch" />
            در حال مصرف
          </label>
          <SaveButton loading={loading} testId="medication-save-button" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
