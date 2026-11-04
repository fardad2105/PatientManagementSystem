import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, inputCls, OptionSelect } from "@/components/Field";
import { JalaliDateInput } from "@/components/JalaliDateInput";
import { SaveButton } from "@/components/profile/PersonalForm";
import { CANCER_TYPE, SURGERY_TYPE, TRI } from "@/lib/labels";
import { api, apiError } from "@/lib/api";

const FIELDS = ["cancer_type", "diagnosis_date", "surgery_date", "surgery_type", "lymph_node_dissection", "rai_received",
  "rai_sessions", "last_rai_date", "staging_text", "other_conditions", "allergies", "notes"];

const clean = (form) => {
  const out = Object.fromEntries(FIELDS.map((k) => [k, form[k] === "" || form[k] === undefined ? null : form[k]]));
  out.rai_sessions = out.rai_sessions == null ? null : Number(out.rai_sessions);
  return out;
};

export default function MedicalForm({ initial, onSaved }) {
  const [form, setForm] = useState(initial || {});
  const [loading, setLoading] = useState(false);
  const setV = (k) => (v) => setForm({ ...form, [k]: v });
  const tid = (k) => `medical-${k.replaceAll("_", "-")}`;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/patient/profile/medical", clean(form));
      toast.success("پرونده سرطان تیروئید ذخیره شد");
      onSaved();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const area = (k, lbl) => (
    <Field label={lbl} className="sm:col-span-2">
      <Textarea className="rounded-xl border-slate-200" value={form[k] || ""} onChange={(e) => setV(k)(e.target.value)} data-testid={`${tid(k)}-input`} />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6" data-testid="medical-form">
      <p className="rounded-xl bg-teal-50 p-3 text-xs sm:text-sm leading-relaxed text-teal-900">
        این اطلاعات توسط خود شما ثبت می‌شود و جنبه‌ی گزارشی دارد. سامانه هیچ تفسیر یا توصیه‌ی درمانی بر اساس آن ارائه نمی‌دهد.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="نوع سرطان تیروئید">
          <OptionSelect value={form.cancer_type} onChange={setV("cancer_type")} options={CANCER_TYPE} testId={`${tid("cancer_type")}-select`} />
        </Field>
        <Field label="تاریخ تشخیص">
          <JalaliDateInput value={form.diagnosis_date} onChange={setV("diagnosis_date")} testId={`${tid("diagnosis_date")}-input`} />
        </Field>
        <Field label="تاریخ جراحی">
          <JalaliDateInput value={form.surgery_date} onChange={setV("surgery_date")} testId={`${tid("surgery_date")}-input`} />
        </Field>
        <Field label="نوع جراحی">
          <OptionSelect value={form.surgery_type} onChange={setV("surgery_type")} options={SURGERY_TYPE} testId={`${tid("surgery_type")}-select`} />
        </Field>
        <Field label="برداشتن غدد لنفاوی گردن">
          <OptionSelect value={form.lymph_node_dissection} onChange={setV("lymph_node_dissection")} options={TRI} testId={`${tid("lymph_node_dissection")}-select`} />
        </Field>
        <Field label="درمان با ید رادیواکتیو">
          <OptionSelect value={form.rai_received} onChange={setV("rai_received")} options={TRI} testId={`${tid("rai_received")}-select`} />
        </Field>
        <Field label="تعداد نوبت‌های ید درمانی">
          <Input type="number" min={0} max={20} dir="ltr" className={inputCls} value={form.rai_sessions ?? ""}
            onChange={(e) => setV("rai_sessions")(e.target.value)} data-testid={`${tid("rai_sessions")}-input`} />
        </Field>
        <Field label="تاریخ آخرین ید درمانی">
          <JalaliDateInput value={form.last_rai_date} onChange={setV("last_rai_date")} testId={`${tid("last_rai_date")}-input`} />
        </Field>
        <Field label="مرحله‌بندی (دقیقاً مطابق گزارش پزشک)" className="sm:col-span-2">
          <Input className={inputCls} value={form.staging_text || ""} onChange={(e) => setV("staging_text")(e.target.value)} data-testid={`${tid("staging_text")}-input`} />
        </Field>
        {area("other_conditions", "بیماری‌های زمینه‌ای دیگر")}
        {area("allergies", "حساسیت‌ها")}
        {area("notes", "یادداشت")}
      </div>
      <SaveButton loading={loading} testId="medical-save-button" />
    </form>
  );
}
