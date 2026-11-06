import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert, CalendarDays, FlaskConical, ChevronLeft, CircleCheck } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { formatJalali, toFa } from "@/lib/date";
import { CANCER_TYPE, FLAG, LAB_TESTS, label } from "@/lib/labels";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import { FlagChips } from "@/components/physician/PatientRow";

const Stat = ({ value, text, accent, testId }) => (
  <div className={`rounded-2xl px-4 py-4 text-center ${accent ? "bg-indigo-900/40" : "bg-white/15"}`} data-testid={testId}>
    <p className="text-2xl font-extrabold">{toFa(value)}</p>
    <p className="mt-1 text-xs text-blue-100">{text}</p>
  </div>
);

const Hero = ({ d }) => (
  <section className="rounded-3xl bg-gradient-to-l from-blue-600 to-blue-800 p-6 sm:p-8 text-white" data-testid="physician-hero">
    <p className="text-sm text-blue-100">خوش آمدید</p>
    <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold" data-testid="physician-greeting">{d.physician.name}</h1>
    {d.physician.specialty && <p className="mt-1 text-sm text-blue-50/90">{d.physician.specialty}</p>}
    <div className="mt-6 grid grid-cols-3 gap-3">
      <Stat value={d.active_patients} text="بیماران فعال" testId="stat-active-patients" />
      <Stat value={d.today_appointments} text="ویزیت امروز" testId="stat-today-appointments" />
      <Stat value={d.needs_attention} text="خارج از محدوده" accent testId="stat-needs-attention" />
    </div>
  </section>
);

const Attention = ({ items }) => (
  <section className="space-y-3" data-testid="attention-section">
    <h2 className="flex items-center gap-2 text-base md:text-lg font-bold text-slate-800"><TriangleAlert className="h-5 w-5 text-rose-500" /> بیماران نیازمند توجه</h2>
    <p className="text-xs text-slate-500">فقط بیمارانی که آخرین مقدار ثبت‌شده‌شان خارج از محدوده‌ی تعیین‌شده توسط شماست. سامانه تفسیر یا توصیه‌ای ارائه نمی‌کند.</p>
    {items.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500" data-testid="attention-empty">موردی خارج از محدوده‌های تعیین‌شده نیست.</p>
    ) : items.map((p) => (
      <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-white p-5" data-testid={`attention-item-${p.id}`}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-lg font-bold text-white">{p.name.trim()[0]}</span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-bold text-slate-800">{p.name}</p>
          <p className="text-xs text-slate-500">{label(CANCER_TYPE, p.cancer_type)}{p.staging_text ? ` — ${p.staging_text}` : ""}</p>
          <FlagChips items={p.out_of_range} testId={`attention-flags-${p.id}`} />
        </div>
        <Link to={`/physician/patients/${p.id}`} data-testid={`attention-open-${p.id}`}
          className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600">مشاهده پرونده</Link>
      </div>
    ))}
  </section>
);

const timeOf = (iso) => toFa(new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));

const Today = ({ items }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid="today-section">
    <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800"><CalendarDays className="h-5 w-5 text-blue-700" /> ویزیت‌های امروز</h2>
    {items.length === 0 ? <p className="text-sm text-slate-500" data-testid="today-empty">برای امروز نوبتی ثبت نشده است.</p> : (
      <ul className="space-y-2">
        {items.map(({ appointment: a, patient_id, patient_name }) => (
          <li key={a.id}>
            <Link to={`/physician/patients/${patient_id}`} data-testid={`today-item-${a.id}`}
              className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3 transition-colors hover:bg-blue-50">
              <span className="w-12 text-sm font-bold text-blue-700">{timeOf(a.scheduled_at)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{patient_name}</p>
                <p className="text-xs text-slate-500">{a.title}</p>
              </div>
              {a.status === "done" && <CircleCheck className="h-5 w-5 text-green-600" />}
            </Link>
          </li>
        ))}
      </ul>
    )}
  </section>
);

const chip = (flag) => (["above", "below"].includes(flag) ? "bg-rose-50 text-rose-700" : flag === "in_range" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600");

const RecentLabs = ({ items }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid="recent-labs-section">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800"><FlaskConical className="h-5 w-5 text-blue-700" /> آخرین نتایج آزمایش</h2>
      <Link to="/physician/patients" className="flex items-center gap-1 text-xs text-blue-700" data-testid="recent-labs-all-link">همه بیماران <ChevronLeft className="h-3.5 w-3.5" /></Link>
    </div>
    {items.length === 0 ? <p className="text-sm text-slate-500">نتیجه‌ای ثبت نشده است.</p> : (
      <ul className="space-y-2">
        {items.map(({ item, patient_id, patient_name }) => (
          <li key={item.lab.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3" data-testid={`recent-lab-${item.lab.id}`}>
            <div className="min-w-0 flex-1">
              <Link to={`/physician/patients/${patient_id}`} className="text-sm font-semibold text-slate-800 hover:underline">{patient_name}</Link>
              <p className="text-xs text-slate-500">{LAB_TESTS[item.lab.test_type].label} · {formatJalali(item.lab.sample_date)}</p>
            </div>
            <span title={FLAG[item.flag]} className={`rounded-full px-3 py-1 text-xs font-bold ${chip(item.flag)}`} dir="ltr">{toFa(item.lab.value)} {item.lab.unit}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default function PhysicianDashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["physician-dashboard"], queryFn: () => api.get("/physician/dashboard").then((r) => r.data) });
  if (error) return <p className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700" data-testid="physician-dashboard-error">{apiError(error)}</p>;
  if (isLoading || !data) return <FullScreenLoader />;
  return (
    <div className="space-y-6" data-testid="physician-dashboard">
      <Hero d={data} />
      <Attention items={data.attention} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Today items={data.today} />
        <RecentLabs items={data.recent_labs} />
      </div>
    </div>
  );
}
