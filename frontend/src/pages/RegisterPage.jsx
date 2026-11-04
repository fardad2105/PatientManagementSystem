import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Field, inputCls } from "@/components/Field";
import { AuthLayout, SubmitButton } from "@/pages/LoginPage";
import { useAuth } from "@/context/AuthContext";
import { apiError, homeFor } from "@/lib/api";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.status === "active" ? homeFor(user.role) : "/pending"} replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
    if (form.password !== form.confirm) return setError("تکرار رمز عبور با رمز عبور یکسان نیست.");
    setLoading(true);
    setError("");
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone || null });
      navigate("/pending");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="ثبت‌نام بیمار" subtitle="پس از ثبت‌نام، حساب شما باید توسط مدیر سامانه تأیید شود.">
      <form onSubmit={onSubmit} className="space-y-4" data-testid="register-form">
        <Field label="نام و نام خانوادگی">
          <Input required className={inputCls} value={form.name} onChange={set("name")} data-testid="register-name-input" />
        </Field>
        <Field label="ایمیل">
          <Input dir="ltr" type="email" required className={inputCls} value={form.email} onChange={set("email")} data-testid="register-email-input" />
        </Field>
        <Field label="تلفن همراه (اختیاری)">
          <Input dir="ltr" className={inputCls} value={form.phone} onChange={set("phone")} data-testid="register-phone-input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="رمز عبور">
            <Input dir="ltr" type="password" required className={inputCls} value={form.password} onChange={set("password")} data-testid="register-password-input" />
          </Field>
          <Field label="تکرار رمز عبور">
            <Input dir="ltr" type="password" required className={inputCls} value={form.confirm} onChange={set("confirm")} data-testid="register-password-confirm-input" />
          </Field>
        </div>
        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" data-testid="register-error">{error}</p>}
        <SubmitButton loading={loading} testId="register-submit-button">ثبت‌نام</SubmitButton>
        <p className="text-center text-sm text-slate-500">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link to="/login" className="font-semibold text-teal-700 hover:underline" data-testid="register-login-link">ورود</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
