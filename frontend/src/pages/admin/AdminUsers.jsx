import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toFa } from "@/lib/date";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import UserManagement from "@/components/admin/UserManagement";
import CreatePhysician from "@/components/admin/CreatePhysician";
import Assignments from "@/components/admin/Assignments";

const TABS = [
  { value: "users", label: "همه کاربران", C: UserManagement },
  { value: "approvals", label: "صف تأیید", C: ApprovalQueue, badge: true },
  { value: "physician", label: "ثبت پزشک", C: CreatePhysician },
  { value: "assign", label: "تخصیص پزشک", C: Assignments },
];
const tabCls = "rounded-full px-4 py-2 text-sm data-[state=active]:bg-purple-700 data-[state=active]:text-white";

export default function AdminUsers() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get("tab")) ? params.get("tab") : "users";
  const { data: stats } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => api.get("/admin/stats").then((r) => r.data) });
  return (
    <div className="space-y-6" data-testid="admin-users-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">مدیریت کاربران</h1>
        <p className="mt-1 text-sm text-slate-500">مدیر سامانه به پرونده‌های بالینی بیماران دسترسی ندارد؛ فقط حساب‌ها و تخصیص‌ها را مدیریت می‌کند.</p>
      </div>
      <Tabs dir="rtl" value={tab} onValueChange={(v) => setParams({ tab: v })} className="space-y-5">
        <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-3xl border border-slate-200 bg-white p-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className={tabCls} data-testid={`admin-tab-${t.value}`}>
              {t.label}
              {t.badge && stats?.patients_pending > 0 && <span className="mr-1.5 rounded-full bg-amber-500 px-1.5 text-[11px] text-white" data-testid="admin-pending-count">{toFa(stats.patients_pending)}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-0">
            <div className={t.value === "users" ? "" : "rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"}><t.C /></div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
