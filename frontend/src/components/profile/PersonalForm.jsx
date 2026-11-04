import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, inputCls, OptionSelect } from "@/components/Field";
import { JalaliDateInput } from "@/components/JalaliDateInput";
import { GENDER } from "@/lib/labels";
import { api, apiError } from "@/lib/api";

const FIELDS = ["first_name", "last_name", "national_id", "birth_date", "gender", "phone", "city", "address",
  "emergency_contact_name", "emergency_contact_relation", "emergency_contact_phone"];

const clean = (form) => Object.fromEntries(FIELDS.map((k) => [k, form[k] === "" || form[k] === undefined ? null : form[k]]));

export const SaveButton = ({ loading, testId }) => (
  <button type="submit" disabled={loading} data-testid={testId}
    className="flex items-center gap-2 rounded-full bg-teal-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60">
    {loading && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره تغییرات
  </button>
);

export default function PersonalForm({ initial, onSaved }) {
  const [form, setForm] = useState(initial || {});
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const text = (k, lbl, extra = {}) => (
    <Field label={lbl}>
      <Input className={inputCls} value={form[k] || ""} onChange={set(k)} data-testid={`personal-${k.replaceAll("_", "-")}-input`} {...extra} />
    </Field>
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/patient/profile/personal", clean(form));
      toast.success("اطلاعات فردی ذخیره شد");
      onSaved();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" data-testid="personal-form">
      <div className="grid gap-5 sm:grid-cols-2">
        {text("first_name", "نام")}
        {text("last_name", "نام خانوادگی")}
        {text("national_id", "کد ملی (اختیاری، ۱۰ رقم)", { dir: "ltr", inputMode: "numeric", maxLength: 10 })}
        <Field label="تاریخ تولد">
          <JalaliDateInput value={form.birth_date} onChange={(v) => setForm({ ...form, birth_date: v })} testId="personal-birth-date-input" />
        </Field>
        <Field label="جنسیت">
          <OptionSelect value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} options={GENDER} testId="personal-gender-select" />
        </Field>
        {text("phone", "تلفن همراه", { dir: "ltr" })}
        {text("city", "شهر")}
        {text("address", "نشانی")}
      </div>
      <div className="rounded-2xl bg-slate-50 p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-700">تماس اضطراری</h4>
        <div className="grid gap-5 sm:grid-cols-3">
          {text("emergency_contact_name", "نام")}
          {text("emergency_contact_relation", "نسبت")}
          {text("emergency_contact_phone", "تلفن", { dir: "ltr" })}
        </div>
      </div>
      <SaveButton loading={loading} testId="personal-save-button" />
    </form>
  );
}
