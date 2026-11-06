import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, Activity, UserRound, Stethoscope, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, inputCls } from "@/components/Field";
import { useAuth } from "@/context/AuthContext";
import { apiError, homeFor } from "@/lib/api";

const STATS = [["۴", "آزمایش پیگیری"], ["۳", "نقش کاربری"], ["۱۱", "ماژول برنامه‌ریزی‌شده"]];
const FEATURES = ["ثبت و پیگیری نتایج آزمایش", "مدیریت دارو و یادآور", "پیگیری نوبت‌های درمانی", "ارتباط ساختاریافته با پزشک"];

export const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50/40 lg:grid lg:grid-cols-2">
    <div className="hidden lg:flex flex-col items-center justify-center gap-6 p-12 text-center" data-testid="auth-brand-panel">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-blue-200"><Activity className="h-8 w-8" /></span>
      <h2 className="text-4xl font-extrabold text-slate-800">تیروئیدکر</h2>
      <p className="max-w-sm text-base leading-relaxed text-slate-500">سامانه جامع خودمراقبتی و مدیریت درمان برای بیماران مبتلا به سرطان تیروئید</p>
      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        {STATS.map(([n, t]) => (
          <div key={t} className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <p className="text-2xl font-extrabold text-teal-700">{n}</p>
            <p className="mt-1 text-xs text-slate-500">{t}</p>
          </div>
        ))}
      </div>
      <ul className="w-full max-w-md space-y-2">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-3 rounded-xl bg-white/70 px-4 py-2.5 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-teal-600" />{f}
          </li>
        ))}
      </ul>
    </div>
    <div className="flex min-h-screen items-center justify-center p-5 sm:p-10">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-6 sm:p-8 shadow-xl shadow-blue-100/60">
        <div className="flex items-center justify-center gap-2 lg:hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white"><Activity className="h-5 w-5" /></span>
          <span className="text-xl font-extrabold text-slate-800">تیروئیدکر</span>
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 leading-relaxed">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  </div>
);

const ROLES = [
  { id: "patient", title: "بیمار", desc: "دسترسی به پرونده و ماژول‌های درمانی", icon: UserRound, tone: "bg-blue-50 text-blue-700" },
  { id: "physician", title: "پزشک", desc: "مدیریت بیماران و پرونده‌های پزشکی", icon: Stethoscope, tone: "bg-emerald-50 text-emerald-700" },
  { id: "admin", title: "مدیر سیستم", desc: "مدیریت سیستم، کاربران و محتوا", icon: ShieldCheck, tone: "bg-purple-50 text-purple-700" },
];

const RolePicker = ({ onPick }) => (
  <div className="space-y-3" data-testid="login-role-picker">
    {ROLES.map((r) => (
      <button key={r.id} onClick={() => onPick(r)} data-testid={`login-role-${r.id}`}
        className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-right transition-colors hover:border-blue-300 hover:bg-blue-50/40">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${r.tone}`}><r.icon className="h-5 w-5" /></span>
        <span className="flex-1">
          <span className="block font-bold text-slate-800">{r.title}</span>
          <span className="block text-xs text-slate-500">{r.desc}</span>
        </span>
        <span className="h-4 w-4 rounded-full border-2 border-slate-300" />
      </button>
    ))}
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
  const [role, setRole] = useState(null);
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
    <AuthLayout title={role ? `ورود به عنوان ${role.title}` : "ورود به سامانه"} subtitle={role ? "ایمیل و رمز عبور خود را وارد کنید" : "نقش خود را انتخاب کنید"}>
      {!role ? <RolePicker onPick={setRole} /> : (
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
        <SubmitButton loading={loading} testId="login-submit-button">ورود به سامانه</SubmitButton>
        <button type="button" onClick={() => setRole(null)} data-testid="login-change-role" className="w-full text-center text-xs text-slate-500 hover:text-blue-700">تغییر نقش</button>
        <p className="text-center text-sm text-slate-500">
          حساب ندارید؟{" "}
          <Link to="/register" className="font-semibold text-teal-700 hover:underline" data-testid="login-register-link">ثبت‌نام بیمار</Link>
        </p>
      </form>
      )}
    </AuthLayout>
  );
}
