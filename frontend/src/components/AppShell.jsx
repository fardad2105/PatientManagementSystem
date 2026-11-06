import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell as BellIcon } from "lucide-react";
import { api } from "@/lib/api";
import { LayoutDashboard, UserRound, Users, ShieldCheck, LogOut, Activity, Pill, FlaskConical, CalendarClock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/labels";
import { toFa, todayJalali } from "@/lib/date";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";

const NAV = {
  patient: [
    { to: "/patient", label: "داشبورد", icon: LayoutDashboard, end: true, id: "dashboard" },
    { to: "/patient/medications", label: "داروها", icon: Pill, id: "medications" },
    { to: "/patient/labs", label: "آزمایش‌ها", icon: FlaskConical, id: "labs" },
    { to: "/patient/appointments", label: "نوبت‌ها", icon: CalendarClock, id: "appointments" },
    { to: "/patient/profile", label: "پرونده من", icon: UserRound, id: "profile" },
  ],
  physician: [{ to: "/physician", label: "بیماران من", icon: Users, id: "patients" }],
  admin: [{ to: "/admin", label: "مدیریت سامانه", icon: ShieldCheck, id: "admin" }],
};

const navCls = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
    isActive ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:bg-teal-50 hover:text-teal-800"
  }`;

const Brand = () => (
  <div className="flex items-center gap-2" data-testid="app-brand">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white">
      <Activity className="h-5 w-5" />
    </span>
    <span>
      <span className="block text-lg font-extrabold text-slate-800">تیروئیدکر</span>
      <span className="block text-[11px] text-slate-400">سامانه مدیریت درمان</span>
    </span>
  </div>
);

const Avatar = ({ name, className = "h-10 w-10" }) => (
  <span className={`flex shrink-0 items-center justify-center rounded-full bg-teal-700 font-bold text-white ${className}`}>{(name || "?").trim()[0]}</span>
);

const Bell = () => {
  const { data = [] } = useQuery({ queryKey: ["reminders"], queryFn: () => api.get("/patient/reminders").then((r) => r.data), refetchInterval: 60_000 });
  return (
    <Link to="/patient/appointments" aria-label="یادآورها" data-testid="header-reminders-bell" className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
      <BellIcon className="h-5 w-5" />
      {data.length > 0 && <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] text-white" data-testid="header-reminders-count">{toFa(data.length)}</span>}
    </Link>
  );
};

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[user.role] || [];
  const { pathname } = useLocation();
  const current = [...items].sort((a, b) => b.to.length - a.to.length).find((it) => pathname.startsWith(it.to));
  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-8 border-l border-slate-200 bg-white p-6 sticky top-0 h-screen">
        <Brand />
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3" data-testid="sidebar-user-card">
          <Avatar name={user.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800" data-testid="header-user-name">{user.name}</p>
            <p className="text-xs text-slate-500" data-testid="header-role-badge">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className={navCls} data-testid={`sidebar-nav-${it.id}`}>
              <it.icon className="h-5 w-5" />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={onLogout} data-testid="sidebar-logout-button" className="mt-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50">
          <LogOut className="h-5 w-5" /> خروج از حساب
        </button>
      </aside>

      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 sm:px-6 lg:px-8 backdrop-blur-lg">
          <div className="lg:hidden"><Brand /></div>
          <div className="hidden lg:block">
            <p className="text-xl font-extrabold text-slate-800" data-testid="header-page-title">{current?.label || ""}</p>
            <p className="text-xs text-slate-400" data-testid="header-today">{todayJalali()}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role === "patient" && <Bell />}
            <span className="hidden lg:flex"><Avatar name={user.name} className="h-9 w-9 text-sm" /></span>
            <button onClick={onLogout} data-testid="logout-button" aria-label="خروج"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 lg:hidden">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
          <DisclaimerBanner />
          {children}
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-lg">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            data-testid={`bottom-nav-${it.id}`}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${isActive ? "text-teal-700" : "text-slate-500"}`
            }
          >
            <it.icon className="h-5 w-5" />
            {it.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
