import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatJalali } from "@/lib/date";
import { ROLE_LABELS } from "@/lib/labels";

export default function AuditLog() {
  const { data = [] } = useQuery({ queryKey: ["admin", "audit"], queryFn: () => api.get("/admin/audit-logs").then((r) => r.data) });
  return (
    <div className="overflow-x-auto" data-testid="audit-log-table">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-right text-xs text-slate-500">
            <th className="py-3 font-medium">زمان</th>
            <th className="py-3 font-medium">کاربر</th>
            <th className="py-3 font-medium">عملیات</th>
            <th className="py-3 font-medium">منبع</th>
            <th className="py-3 font-medium">نتیجه</th>
          </tr>
        </thead>
        <tbody>
          {data.map((l) => (
            <tr key={l.id} className="border-b border-slate-100" data-testid={`audit-row-${l.id}`}>
              <td className="py-3 text-slate-500">{formatJalali(l.created_at, true)}</td>
              <td className="py-3"><span dir="ltr">{l.actor_email || l.details || "—"}</span> {l.actor_role && <span className="text-xs text-slate-400">({ROLE_LABELS[l.actor_role]})</span>}</td>
              <td className="py-3 font-mono text-xs" dir="ltr">{l.action}</td>
              <td className="py-3 font-mono text-xs" dir="ltr">{l.resource_type}</td>
              <td className="py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs ${l.outcome === "allow" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {l.outcome === "allow" ? "مجاز" : "رد شد"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
