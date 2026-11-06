import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatJalali } from "@/lib/date";
import { ROLE_LABELS, actionLabel, resourceLabel } from "@/lib/labels";

export default function AuditLog() {
  const { data = [], isLoading } = useQuery({ queryKey: ["admin", "audit"], queryFn: () => api.get("/admin/audit-logs", { params: { limit: 200 } }).then((r) => r.data) });
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white" data-testid="audit-log-table">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-slate-50 text-right text-xs text-slate-500">
          <tr>{["زمان", "کاربر", "عملیات", "منبع", "نتیجه", "آدرس IP"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((l) => (
            <tr key={l.id} className="border-b border-slate-100 last:border-0" data-testid={`audit-row-${l.id}`}>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{formatJalali(l.created_at, true)}</td>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-800">{l.actor_name || <span dir="ltr">{l.actor_email || l.details || "—"}</span>}</p>
                {l.actor_role && <p className="text-[11px] text-slate-400">{ROLE_LABELS[l.actor_role]}</p>}
              </td>
              <td className="px-4 py-3 text-slate-700" title={l.action}>{actionLabel(l.action)}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{resourceLabel(l.resource_type)}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs ${l.outcome === "allow" ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"}`}>{l.outcome === "allow" ? "مجاز" : "رد شد"}</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500" dir="ltr">{l.ip_address || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <p className="p-8 text-center text-sm text-slate-500" data-testid="audit-log-empty">{isLoading ? "در حال بارگذاری…" : "رویدادی ثبت نشده است."}</p>}
    </div>
  );
}
