import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Field, inputCls } from "@/components/Field";
import { SaveButton } from "@/components/profile/PersonalForm";
import { useInvalidateAdmin } from "@/components/admin/ApprovalQueue";
import { api, apiError } from "@/lib/api";

const EMPTY = { name: "", email: "", password: "", specialty: "فوق‌تخصص غدد درون‌ریز", phone: "" };

export default function CreatePhysician() {
  const invalidate = useInvalidateAdmin();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/physicians", { ...form, phone: form.phone || null });
      toast.success("حساب پزشک ایجاد شد");
      setForm(EMPTY);
      invalidate();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5" data-testid="create-physician-form">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="نام و نام خانوادگی">
          <Input required className={inputCls} value={form.name} onChange={set("name")} data-testid="physician-name-input" />
        </Field>
        <Field label="تخصص">
          <Input className={inputCls} value={form.specialty} onChange={set("specialty")} data-testid="physician-specialty-input" />
        </Field>
        <Field label="ایمیل">
          <Input type="email" dir="ltr" required className={inputCls} value={form.email} onChange={set("email")} data-testid="physician-email-input" />
        </Field>
        <Field label="رمز عبور اولیه" hint="حداقل ۸ کاراکتر؛ از پزشک بخواهید پس از ورود آن را تغییر دهد.">
          <Input type="password" dir="ltr" required minLength={8} className={inputCls} value={form.password} onChange={set("password")} data-testid="physician-password-input" />
        </Field>
        <Field label="تلفن (اختیاری)">
          <Input dir="ltr" className={inputCls} value={form.phone} onChange={set("phone")} data-testid="physician-phone-input" />
        </Field>
      </div>
      <SaveButton loading={loading} testId="create-physician-submit" />
    </form>
  );
}
