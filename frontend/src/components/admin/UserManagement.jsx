import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OptionSelect, inputCls } from "@/components/Field";
import { useInvalidateAdmin } from "@/components/admin/ApprovalQueue";
import { api, apiError } from "@/lib/api";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/labels";

const STATUS_STYLE = {
  active: "bg-emerald-50 text-emerald-700", pending: "bg-amber-50 text-amber-700",
  rejected: "bg-rose-50 text-rose-700", disabled: "bg-slate-100 text-slate-600",
};

const ResetDialog = ({ user, onClose }) => {
  const [pw, setPw] = useState("");
  const submit = async () => {
    try {
      await api.post(`/admin/users/${user.id}/reset-password`, { new_password: pw });
      toast.success("رمز عبور جدید ثبت شد");
      onClose();
    } catch (err) {
      toast.error(apiError(err));
    }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir="rtl" data-testid="reset-password-dialog">
        <DialogHeader><DialogTitle className="text-right">بازنشانی رمز عبور — {user.name}</DialogTitle></DialogHeader>
        <Input type="password" dir="ltr" placeholder="حداقل ۸ کاراکتر" className={inputCls} value={pw}
          onChange={(e) => setPw(e.target.value)} data-testid="reset-password-input" />
        <button onClick={submit} disabled={pw.length < 8} data-testid="reset-password-submit"
          className="rounded-full bg-teal-700 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">ثبت رمز جدید</button>
      </DialogContent>
    </Dialog>
  );
};

export default function UserManagement() {
  const invalidate = useInvalidateAdmin();
  const [role, setRole] = useState("all");
  const [resetUser, setResetUser] = useState(null);
  const { data = [] } = useQuery({
    queryKey: ["admin", "users", role],
    queryFn: () => api.get("/admin/users", { params: role === "all" ? {} : { role } }).then((r) => r.data),
  });

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { status });
      toast.success("وضعیت حساب به‌روزرسانی شد");
      invalidate();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="w-56">
        <OptionSelect value={role} onChange={setRole} options={{ all: "همه نقش‌ها", ...ROLE_LABELS }} testId="users-role-filter" />
      </div>
      <ul className="divide-y divide-slate-100" data-testid="users-list">
        {data.map((u) => (
          <li key={u.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between" data-testid={`user-row-${u.id}`}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-800">{u.name}</p>
                <Badge variant="outline" className="rounded-full">{ROLE_LABELS[u.role]}</Badge>
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[u.status]}`} data-testid={`user-status-${u.id}`}>{STATUS_LABELS[u.status]}</span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500" dir="ltr">{u.email}</p>
            </div>
            {u.role !== "admin" && (
              <div className="flex flex-wrap gap-2">
                {u.status === "active" ? (
                  <button onClick={() => setStatus(u.id, "disabled")} data-testid={`disable-user-${u.id}`}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">غیرفعال‌سازی</button>
                ) : (
                  <button onClick={() => setStatus(u.id, "active")} data-testid={`activate-user-${u.id}`}
                    className="rounded-full bg-teal-700 px-4 py-2 text-xs text-white hover:bg-teal-800">فعال‌سازی</button>
                )}
                <button onClick={() => setResetUser(u)} data-testid={`reset-password-user-${u.id}`}
                  className="flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">
                  <KeyRound className="h-3.5 w-3.5" /> رمز عبور
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {resetUser && <ResetDialog user={resetUser} onClose={() => setResetUser(null)} />}
    </div>
  );
}
