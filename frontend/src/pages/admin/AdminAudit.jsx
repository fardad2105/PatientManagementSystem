import AuditLog from "@/components/admin/AuditLog";

export default function AdminAudit() {
  return (
    <div className="space-y-6" data-testid="admin-audit-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-500">ثبت تمام فعالیت‌های سامانه (۲۰۰ رویداد اخیر)</p>
      </div>
      <AuditLog />
    </div>
  );
}
