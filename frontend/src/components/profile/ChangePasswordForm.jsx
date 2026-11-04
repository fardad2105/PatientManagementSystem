import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Field, inputCls } from "@/components/Field";
import { SaveButton } from "@/components/profile/PersonalForm";
import { api, apiError } from "@/lib/api";

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.next.length < 8) return toast.error("رمز عبور جدید باید حداقل ۸ کاراکتر باشد");
    if (form.next !== form.confirm) return toast.error("تکرار رمز عبور یکسان نیست");
    setLoading(true);
    try {
      await api.post("/auth/change-password", { current_password: form.current, new_password: form.next });
      toast.success("رمز عبور تغییر کرد");
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-5" data-testid="change-password-form">
      <Field label="رمز عبور فعلی">
        <Input type="password" dir="ltr" required className={inputCls} value={form.current} onChange={set("current")} data-testid="change-password-current-input" />
      </Field>
      <Field label="رمز عبور جدید">
        <Input type="password" dir="ltr" required className={inputCls} value={form.next} onChange={set("next")} data-testid="change-password-new-input" />
      </Field>
      <Field label="تکرار رمز عبور جدید">
        <Input type="password" dir="ltr" required className={inputCls} value={form.confirm} onChange={set("confirm")} data-testid="change-password-confirm-input" />
      </Field>
      <SaveButton loading={loading} testId="change-password-save-button" />
    </form>
  );
}
