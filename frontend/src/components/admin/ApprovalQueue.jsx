import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Inbox } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { formatJalali } from "@/lib/date";

export const useInvalidateAdmin = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin"] });
};

export default function ApprovalQueue() {
  const invalidate = useInvalidateAdmin();
  const { data = [] } = useQuery({
    queryKey: ["admin", "users", "pending"],
    queryFn: () => api.get("/admin/users", { params: { status: "pending" } }).then((r) => r.data),
  });

  const act = async (id, status) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { status });
      toast.success(status === "active" ? "حساب کاربر تأیید شد" : "درخواست رد شد");
      invalidate();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-slate-500" data-testid="approval-queue-empty">
        <Inbox className="h-10 w-10 text-slate-300" />
        <p className="text-sm">درخواست در انتظاری وجود ندارد.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100" data-testid="approval-queue-list">
      {data.map((u) => (
        <li key={u.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between" data-testid={`approval-row-${u.id}`}>
          <div>
            <p className="font-semibold text-slate-800">{u.name}</p>
            <p className="text-xs text-slate-500"><span dir="ltr">{u.email}</span> · ثبت‌نام: {formatJalali(u.created_at, true)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => act(u.id, "active")} data-testid={`approve-user-${u.id}`}
              className="flex items-center gap-1.5 rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors">
              <Check className="h-4 w-4" /> تأیید
            </button>
            <button onClick={() => act(u.id, "rejected")} data-testid={`reject-user-${u.id}`}
              className="flex items-center gap-1.5 rounded-full border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
              <X className="h-4 w-4" /> رد
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
