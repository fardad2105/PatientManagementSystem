import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Users, Stethoscope, LogIn, BookOpen, CircleCheck, Database, UserPlus, ShieldAlert, Eye } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, apiError } from "@/lib/api";
import { toFa } from "@/lib/date";
import { actionLabel, resourceLabel } from "@/lib/labels";
import { FullScreenLoader } from "@/components/ProtectedRoute";

const jal = (d, f) => toFa(dayjs(d).calendar("jalali").locale("fa").format(f));
const timeOf = (iso) => toFa(new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));

const monthly = (base, days) => {
  const out = [];
  let total = base;
  days.forEach((d) => {
    total += d.count;
    const key = jal(d.date, "YYYY/MM");
    if (out.length && out[out.length - 1].key === key) out[out.length - 1].value = total;
    else out.push({ key, label: jal(d.date, "MMMM"), value: total });
  });
  return out.slice(-6);
};

const HeroStat = ({ icon: Icon, value, text, testId }) => (
  <div className="rounded-2xl bg-white/15 px-3 py-4 text-center" data-testid={testId}>
    <Icon className="mx-auto h-4 w-4 text-purple-100" />
    <p className="mt-1 text-2xl font-extrabold">{toFa(value)}</p>
    <p className="text-xs text-purple-100">{text}</p>
  </div>
);

const Hero = ({ d }) => (
  <section className="rounded-3xl bg-gradient-to-l from-fuchsia-700 to-purple-800 p-6 sm:p-8 text-white" data-testid="admin-hero">
    <p className="text-sm text-purple-100">پنل مدیریت</p>
    <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold">تیروئیدکر</h1>
    <p className="mt-1 text-sm text-purple-50/90">سامانه خودمراقبتی بیماران سرطان تمایزیافته تیروئید</p>
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <HeroStat icon={Users} value={d.patients_active} text="بیماران فعال" testId="admin-stat-patients" />
      <HeroStat icon={Stethoscope} value={d.physicians_active} text="پزشکان" testId="admin-stat-physicians" />
      <HeroStat icon={LogIn} value={d.logins_today} text="ورود امروز" testId="admin-stat-logins" />
      <HeroStat icon={BookOpen} value={d.content_published} text="محتوای منتشرشده" testId="admin-stat-content" />
    </div>
  </section>
);

const Health = ({ icon: Icon, title, value, tone, to, testId }) => {
  const body = (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-purple-300" data-testid={testId}>
      <p className="flex items-center gap-2 text-xs text-slate-500"><Icon className={`h-4 w-4 ${tone}`} /> {title}</p>
      <p className={`mt-2 text-base font-bold ${tone}`}>{value}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

const ChartCard = ({ title, children, testId }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5" data-testid={testId}>
    <h2 className="mb-4 text-base font-bold text-slate-800">{title}</h2>
    <div dir="ltr" className="h-56 w-full"><ResponsiveContainer>{children}</ResponsiveContainer></div>
  </section>
);

const axis = { tick: { fontSize: 11, fill: "#64748b" } };

const Recent = ({ items }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="admin-recent-activity">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800"><Eye className="h-5 w-5 text-purple-700" /> آخرین فعالیت‌ها</h2>
      <Link to="/admin/audit" className="text-xs text-purple-700" data-testid="admin-recent-all-link">مشاهده همه</Link>
    </div>
    <ul className="space-y-2">
      {items.map((l) => (
        <li key={l.id} className="grid grid-cols-[48px_1fr_1fr] items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm sm:grid-cols-[56px_1.2fr_1fr_1fr]" data-testid={`admin-activity-${l.id}`}>
          <span className="text-xs text-slate-400">{timeOf(l.created_at)}</span>
          <span className="truncate font-semibold text-slate-800">{l.actor_name || l.actor_email || l.details || "—"}</span>
          <span className="truncate text-slate-600">{actionLabel(l.action)}</span>
          <span className="hidden truncate text-xs text-slate-400 sm:block">{resourceLabel(l.resource_type)}</span>
        </li>
      ))}
    </ul>
  </section>
);

export default function AdminDashboard() {
  const { data: d, isLoading, error } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => api.get("/admin/dashboard").then((r) => r.data), refetchInterval: 60_000 });
  if (error) return <p className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700" data-testid="admin-dashboard-error">{apiError(error)}</p>;
  if (isLoading || !d) return <FullScreenLoader />;
  const reg = monthly(d.registrations_base, d.registrations);
  const logins = d.logins.map((x) => ({ label: jal(x.date, "M/D"), value: x.count }));
  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <Hero d={d} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Health icon={CircleCheck} title="وضعیت سرور" value="عملیاتی" tone="text-green-700" testId="admin-health-server" />
        <Health icon={Database} title="پایگاه داده" value={d.database_healthy ? `سالم · ${toFa(d.database_latency_ms)} ms` : "خطا در اتصال"} tone={d.database_healthy ? "text-green-700" : "text-rose-600"} testId="admin-health-db" />
        <Health icon={UserPlus} title="در انتظار تأیید" value={`${toFa(d.patients_pending)} مورد`} tone={d.patients_pending ? "text-amber-600" : "text-slate-600"} to="/admin/users?tab=approvals" testId="admin-health-pending" />
        <Health icon={ShieldAlert} title="ورود ناموفق امروز" value={`${toFa(d.failed_logins_today)} مورد`} tone={d.failed_logins_today ? "text-rose-600" : "text-slate-600"} to="/admin/audit" testId="admin-health-failed" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="روند بیماران ثبت‌شده (تجمعی)" testId="admin-chart-registrations">
          <BarChart data={reg} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" {...axis} reversed />
            <YAxis allowDecimals={false} tickFormatter={toFa} width={30} {...axis} orientation="right" />
            <Tooltip formatter={(v) => [toFa(v), "بیماران"]} />
            <Bar dataKey="value" fill="#7b1fa2" radius={[6, 6, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartCard>
        <ChartCard title="ورودهای روزانه (۱۴ روز اخیر)" testId="admin-chart-logins">
          <LineChart data={logins} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="label" {...axis} reversed interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tickFormatter={toFa} width={30} {...axis} orientation="right" />
            <Tooltip formatter={(v) => [toFa(v), "ورود"]} />
            <Line type="monotone" dataKey="value" stroke="#1565c0" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
          </LineChart>
        </ChartCard>
      </div>
      <Recent items={d.recent} />
    </div>
  );
}
