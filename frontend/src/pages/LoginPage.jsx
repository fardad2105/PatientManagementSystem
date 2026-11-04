import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, inputCls } from "@/components/Field";
import { useAuth } from "@/context/AuthContext";
import { apiError, homeFor } from "@/lib/api";

export const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
    <div className="flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white"><Activity className="h-5 w-5" /></span>
          <span className="text-xl font-extrabold text-slate-800">تیروکر</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
    <div className="relative hidden lg:block">
      <img src="/auth-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-teal-900/30 to-transparent" />
      <div className="absolute bottom-0 p-12 text-white space-y-3">
        <p className="text-2xl font-bold leading-relaxed">همراه شما در دوران پیگیری پس از درمان سرطان تمایزیافته‌ی تیروئید</p>
        <p className="text-sm text-teal-50/90">آموزش، مدیریت داروها، آزمایش‌ها و نوبت‌ها — در یک پرونده‌ی منظم و امن.</p>
      </div>
    </div>
  </div>
);

export const SubmitButton = ({ loading, children, testId }) => (
  <button
    type="submit"
    disabled={loading}
    data-testid={testId}
    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-teal-700 text-sm font-semibold text-white transition-colors duration-200 hover:bg-teal-800 disabled:opacity-60"
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
);

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.status === "active" ? homeFor(user.role) : "/pending"} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const u = await login(form.email, form.password);
      navigate(u.status === "active" ? homeFor(u.role) : "/pending");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="ورود به حساب" subtitle="برای دسترسی به پرونده‌ی سلامت خود وارد شوید.">
      <form onSubmit={onSubmit} className="space-y-5" data-testid="login-form">
        <Field label="ایمیل">
          <Input dir="ltr" type="email" required className={inputCls} data-testid="login-email-input"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="رمز عبور">
          <Input dir="ltr" type="password" required className={inputCls} data-testid="login-password-input"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" data-testid="login-error">{error}</p>}
        <SubmitButton loading={loading} testId="login-submit-button">ورود</SubmitButton>
        <p className="text-center text-sm text-slate-500">
          حساب ندارید؟{" "}
          <Link to="/register" className="font-semibold text-teal-700 hover:underline" data-testid="login-register-link">ثبت‌نام بیمار</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
