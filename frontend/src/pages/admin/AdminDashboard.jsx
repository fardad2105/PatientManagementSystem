import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toFa } from "@/lib/date";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import UserManagement from "@/components/admin/UserManagement";
import CreatePhysician from "@/components/admin/CreatePhysician";
import Assignments from "@/components/admin/Assignments";
import AuditLog from "@/components/admin/AuditLog";

const STATS = [
  { key: "patients_pending", label: "در انتظار تأیید", accent: "text-amber-600" },
  { key: "patients_active", label: "بیماران فعال", accent: "text-teal-700" },
  { key: "physicians_active", label: "پزشکان فعال", accent: "text-slate-800" },
  { key: "assignments", label: "تخصیص‌ها", accent: "text-slate-800" },
];

const TABS = [
  { value: "approvals", label: "صف تأیید", C: ApprovalQueue },
  { value: "users", label: "کاربران", C: UserManagement },
  { value: "physician", label: "ثبت پزشک", C: CreatePhysician },
  { value: "assign", label: "تخصیص پزشک", C: Assignments },
  { value: "audit", label: "گزارش رویدادها", C: AuditLog },
];

const tabCls = "rounded-full px-4 py-2 text-sm data-[state=active]:bg-teal-700 data-[state=active]:text-white";

export default function AdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => api.get("/admin/stats").then((r) => r.data) });

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">مدیریت سامانه</h1>
        <p className="mt-2 text-sm text-slate-500">مدیر سامانه به پرونده‌های بالینی بیماران دسترسی ندارد؛ فقط حساب‌ها و تخصیص‌ها را مدیریت می‌کند.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.key} className="rounded-2xl border border-slate-200 bg-white p-5" data-testid={`admin-stat-${s.key}`}>
            <p className="text-xs sm:text-sm text-slate-500">{s.label}</p>
            <p className={`mt-2 text-3xl font-extrabold ${s.accent}`}>{stats ? toFa(stats[s.key]) : "…"}</p>
          </div>
        ))}
      </div>
      <Tabs dir="rtl" defaultValue="approvals" className="space-y-6">
        <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-3xl bg-white p-1 border border-slate-200">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className={tabCls} data-testid={`admin-tab-${t.value}`}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} className="mt-0"><t.C /></TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
