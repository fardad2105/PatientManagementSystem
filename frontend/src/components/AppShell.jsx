import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, UserRound, Users, ShieldCheck, LogOut, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/labels";
import { todayJalali } from "@/lib/date";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";

const NAV = {
  patient: [
    { to: "/patient", label: "داشبورد", icon: LayoutDashboard, end: true, id: "dashboard" },
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
    <span className="text-lg font-extrabold tracking-tight text-slate-800">تیروکر</span>
  </div>
);

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[user.role] || [];
  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-8 border-l border-slate-200 bg-white p-6 sticky top-0 h-screen">
        <Brand />
        <nav className="flex flex-col gap-1">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className={navCls} data-testid={`sidebar-nav-${it.id}`}>
              <it.icon className="h-5 w-5" />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto text-xs leading-relaxed text-slate-400">نسخه‌ی پژوهشی — فاز ۱. فقط با داده‌های ساختگی آزمایش شود.</p>
      </aside>

      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 sm:px-6 lg:px-8 backdrop-blur-lg">
          <div className="lg:hidden"><Brand /></div>
          <p className="hidden lg:block text-sm text-slate-500" data-testid="header-today">{todayJalali()}</p>
          <div className="flex items-center gap-3">
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-slate-800" data-testid="header-user-name">{user.name}</p>
              <span className="text-xs text-teal-700" data-testid="header-role-badge">{ROLE_LABELS[user.role]}</span>
            </div>
            <button
              onClick={onLogout}
              data-testid="logout-button"
              className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
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
              `flex flex-col items-center gap-1 rounded-xl px-5 py-1.5 text-xs font-medium ${isActive ? "text-teal-700" : "text-slate-500"}`
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
