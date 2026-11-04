import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, inputCls, OptionSelect } from "@/components/Field";
import { JalaliDateInput } from "@/components/JalaliDateInput";
import { SaveButton } from "@/components/profile/PersonalForm";
import { api, apiError } from "@/lib/api";
import { toEn } from "@/lib/date";
import { LAB_TESTS } from "@/lib/labels";

const num = (v) => (v === "" || v == null ? null : Number(toEn(String(v))));

export default function LabDialog({ initial, defaultType, onClose, onSaved }) {
  const [form, setForm] = useState(initial || { test_type: defaultType, unit: LAB_TESTS[defaultType].units[0] });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const units = Object.fromEntries(LAB_TESTS[form.test_type].units.map((u) => [u, u]));

  const onSubmit = async (e) => {
    e.preventDefault();
    const body = { ...form, value: num(form.value), ref_low: num(form.ref_low), ref_high: num(form.ref_high) };
    if (Number.isNaN(body.value) || Number.isNaN(body.ref_low) || Number.isNaN(body.ref_high)) return toast.error("مقادیر عددی معتبر نیستند");
    if (!body.sample_date) return toast.error("تاریخ نمونه‌گیری را انتخاب کنید");
    setLoading(true);
    try {
      if (initial?.id) await api.put(`/patient/labs/${initial.id}`, body);
      else await api.post("/patient/labs", body);
      toast.success("نتیجه آزمایش ذخیره شد");
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
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-xl" data-testid="lab-dialog">
        <DialogHeader><DialogTitle className="text-right">{initial?.id ? "ویرایش نتیجه" : "ثبت نتیجه آزمایش"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" data-testid="lab-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نوع آزمایش">
              <OptionSelect value={form.test_type} testId="lab-type-select"
                options={Object.fromEntries(Object.entries(LAB_TESTS).map(([k, t]) => [k, t.full]))}
                onChange={(v) => setForm({ ...form, test_type: v, unit: LAB_TESTS[v].units[0] })} />
            </Field>
            <Field label="تاریخ نمونه‌گیری">
              <JalaliDateInput value={form.sample_date} onChange={(v) => setForm({ ...form, sample_date: v })} testId="lab-sample-date-input" />
            </Field>
            <Field label="مقدار">
              <Input required dir="ltr" inputMode="decimal" className={inputCls} value={form.value ?? ""} onChange={set("value")} data-testid="lab-value-input" />
            </Field>
            <Field label="واحد">
              <OptionSelect value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} options={units} testId="lab-unit-select" />
            </Field>
            <Field label="حد پایین محدوده‌ی مرجع آزمایشگاه">
              <Input dir="ltr" inputMode="decimal" className={inputCls} value={form.ref_low ?? ""} onChange={set("ref_low")} data-testid="lab-ref-low-input" />
            </Field>
            <Field label="حد بالای محدوده‌ی مرجع آزمایشگاه">
              <Input dir="ltr" inputMode="decimal" className={inputCls} value={form.ref_high ?? ""} onChange={set("ref_high")} data-testid="lab-ref-high-input" />
            </Field>
            <Field label="نام آزمایشگاه">
              <Input className={inputCls} value={form.lab_name || ""} onChange={set("lab_name")} data-testid="lab-name-input" />
            </Field>
            <Field label="یادداشت">
              <Input className={inputCls} value={form.notes || ""} onChange={set("notes")} data-testid="lab-notes-input" />
            </Field>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">محدوده‌ی مرجع را از برگه‌ی آزمایشگاه وارد کنید. سامانه نتیجه را تفسیر نمی‌کند.</p>
          <SaveButton loading={loading} testId="lab-save-button" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
