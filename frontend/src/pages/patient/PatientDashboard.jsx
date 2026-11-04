import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pill, FlaskConical, CalendarClock, HeartPulse, History, FileText, BookOpen, Stethoscope, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { api, apiError } from "@/lib/api";
import { formatJalali, toFa } from "@/lib/date";
import { LAB_TESTS } from "@/lib/labels";
import { MedicalSummary } from "@/components/ProfileSummary";
import { FullScreenLoader } from "@/components/ProtectedRoute";

const MODULES = {
  medications: { label: "مدیریت داروها", icon: Pill },
  labs: { label: "آزمایش‌ها (TSH، FT4، Tg، Anti-Tg)", icon: FlaskConical },
  appointments: { label: "نوبت‌ها و یادآورها", icon: CalendarClock },
  symptoms: { label: "پیگیری علائم", icon: HeartPulse },
  timeline: { label: "سابقه و خط زمانی درمان", icon: History },
  documents: { label: "مدارک پزشکی", icon: FileText },
  education: { label: "کتابخانه آموزشی", icon: BookOpen },
};

const CareTeam = ({ team }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid="care-team-card">
    <h3 className="mb-4 text-base font-bold text-slate-800">پزشکان من</h3>
    {team.length === 0 ? (
      <p className="text-sm text-slate-500" data-testid="care-team-empty">هنوز پزشکی توسط مدیر سامانه به شما تخصیص داده نشده است.</p>
    ) : (
      <ul className="space-y-3">
        {team.map((d) => (
          <li key={d.id} className="flex items-center gap-3" data-testid={`care-team-item-${d.id}`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Stethoscope className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold text-slate-800">{d.name}</p>
              <p className="text-xs text-slate-500">{d.specialty}</p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

const HealthSummary = ({ data }) => (
  <div className="grid gap-4 lg:grid-cols-3">
    <Link to="/patient/medications" data-testid="dashboard-medications-card"
      className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-teal-300">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Pill className="h-4 w-4 text-teal-700" /> داروهای در حال مصرف</div>
      <p className="mt-2 text-4xl font-extrabold text-slate-800" data-testid="dashboard-medications-active">{toFa(data.medications_active)}</p>
      <p className="mt-2 text-xs text-slate-500" data-testid="dashboard-doses-missed">مصرف فراموش‌شده در ۷ روز گذشته: {toFa(data.doses_missed7d)}</p>
    </Link>
    <Link to="/patient/labs" data-testid="dashboard-labs-card"
      className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-teal-300">
      <div className="flex items-center gap-2 text-sm text-slate-500"><FlaskConical className="h-4 w-4 text-teal-700" /> آخرین نتایج ثبت‌شده</div>
      {data.latest_labs.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">هنوز نتیجه‌ای ثبت نشده است.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.latest_labs.map((l) => (
            <div key={l.id} data-testid={`dashboard-latest-lab-${l.test_type}`}>
              <p className="text-xs font-semibold text-teal-700">{LAB_TESTS[l.test_type].label}</p>
              <p className="mt-1 text-lg font-bold text-slate-800">{toFa(l.value)} <span className="text-xs font-normal text-slate-500" dir="ltr">{l.unit}</span></p>
              <p className="text-xs text-slate-400">{formatJalali(l.sample_date)}</p>
            </div>
          ))}
        </div>
      )}
    </Link>
  </div>
);

const ComingSoon = ({ modules }) => (
  <section className="space-y-4">
    <h2 className="text-base md:text-lg font-bold text-slate-800">بخش‌های آینده</h2>
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {modules.map((key) => {
        const M = MODULES[key];
        return (
          <div key={key} data-testid={`coming-soon-${key}`}
            className="group rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 sm:p-5 transition-colors hover:border-teal-300">
            <M.icon className="h-6 w-6 text-slate-400 transition-colors group-hover:text-teal-600" />
            <p className="mt-3 text-sm font-semibold text-slate-700 leading-relaxed">{M.label}</p>
            <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">به‌زودی</span>
          </div>
        );
      })}
    </div>
  </section>
);

export default function PatientDashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["patient-dashboard"], queryFn: () => api.get("/patient/dashboard").then((r) => r.data) });
  if (error) return <p className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700" data-testid="dashboard-error">{apiError(error)}</p>;
  if (isLoading || !data) return <FullScreenLoader />;

  return (
    <div className="space-y-6" data-testid="patient-dashboard">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl bg-teal-800 p-6 sm:p-8 text-white">
          <p className="text-sm text-teal-100">خوش آمدید</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight" data-testid="dashboard-greeting">{data.user.name}</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-teal-50/90">
            پرونده‌ی خود را کامل کنید تا اطلاعات شما برای پزشک معالج، منظم و در دسترس باشد.
          </p>
          <Link to="/patient/profile" data-testid="dashboard-edit-profile-link"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-teal-800 transition-transform hover:-translate-x-1">
            تکمیل پرونده <ArrowLeft className="h-4 w-4" />
          </Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="profile-completeness-card">
          <p className="text-sm text-slate-500">میزان تکمیل پرونده</p>
          <p className="mt-2 text-5xl font-extrabold text-teal-700" data-testid="profile-completeness-value">{toFa(data.completeness)}٪</p>
          <Progress value={data.completeness} className="mt-4 h-2 [&>div]:bg-teal-600" />
        </section>
      </div>
      <HealthSummary data={data} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><MedicalSummary medical={data.profile.medical} prefix="dashboard" /></div>
        <CareTeam team={data.care_team} />
      </div>
      <ComingSoon modules={data.upcoming_modules} />
    </div>
  );
}
