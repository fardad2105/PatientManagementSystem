import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Pencil, Search, Power } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/Field";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useInvalidateAdmin } from "@/components/admin/ApprovalQueue";
import { EditUserDialog, ResetDialog } from "@/components/admin/UserDialogs";
import { api, apiError } from "@/lib/api";
import { toFa } from "@/lib/date";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/labels";

const ROLE_STYLE = { patient: "bg-blue-50 text-blue-700", physician: "bg-green-50 text-green-700", admin: "bg-purple-50 text-purple-700" };
const AVATAR = { patient: "bg-blue-700", physician: "bg-green-700", admin: "bg-purple-700" };
const DOT = { active: "bg-green-500 text-green-700", pending: "bg-amber-500 text-amber-700", rejected: "bg-rose-500 text-rose-700", disabled: "bg-slate-300 text-slate-500" };
const PREFIX = { patient: "P", physician: "D", admin: "ADM" };

const code = (u) => `${PREFIX[u.role]}-${u.id.replace(/-/g, "").slice(0, 5).toUpperCase()}`;
const ago = (iso) => {
  if (!iso) return "—";
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return "امروز";
  if (days === 1) return "دیروز";
  if (days < 7) return `${toFa(days)} روز پیش`;
  if (days < 30) return `${toFa(Math.floor(days / 7))} هفته پیش`;
  return `${toFa(Math.floor(days / 30))} ماه پیش`;
};
const iconBtn = "rounded-full p-2 transition-colors";

const Row = ({ u, onEdit, onReset, onStatus, onDelete }) => (
  <tr className="border-b border-slate-100 last:border-0" data-testid={`user-row-${u.id}`}>
    <td className="px-4 py-3">
      <span className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${AVATAR[u.role]}`}>{u.name.trim()[0]}</span>
        <span className="font-semibold text-slate-800">{u.name}</span>
      </span>
    </td>
    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500" dir="ltr">{code(u)}</td>
    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_STYLE[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
    <td className="px-4 py-3 text-xs text-slate-500" dir="ltr">{u.email}</td>
    <td className="px-4 py-3">
      <span className={`flex items-center gap-1.5 text-xs ${DOT[u.status].split(" ")[1]}`} data-testid={`user-status-${u.id}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${DOT[u.status].split(" ")[0]}`} />{STATUS_LABELS[u.status]}
      </span>
    </td>
    <td className="px-4 py-3 text-xs text-slate-500" data-testid={`user-last-login-${u.id}`}>{ago(u.last_login_at)}</td>
    <td className="px-4 py-3">
      <span className="flex items-center gap-1">
        <button onClick={() => onEdit(u)} aria-label="ویرایش" data-testid={`edit-user-${u.id}`} className={`${iconBtn} bg-blue-50 text-blue-700 hover:bg-blue-100`}><Pencil className="h-4 w-4" /></button>
        {u.role !== "admin" && (
          <>
            <button onClick={() => onReset(u)} aria-label="رمز عبور" data-testid={`reset-password-user-${u.id}`} className={`${iconBtn} text-slate-500 hover:bg-slate-100`}><KeyRound className="h-4 w-4" /></button>
            {["active", "disabled"].includes(u.status) && (
              <button onClick={() => onStatus(u.id, u.status === "active" ? "disabled" : "active")} aria-label={u.status === "active" ? "غیرفعال‌سازی" : "فعال‌سازی"}
                data-testid={`${u.status === "active" ? "disable" : "activate"}-user-${u.id}`} className={`${iconBtn} ${u.status === "active" ? "text-amber-600 hover:bg-amber-50" : "text-green-700 hover:bg-green-50"}`}><Power className="h-4 w-4" /></button>
            )}
            <ConfirmDelete title={`حذف حساب «${u.name}» و همه‌ی داده‌های آن؟`} onConfirm={() => onDelete(u.id)} testId={`delete-user-${u.id}`} />
          </>
        )}
      </span>
    </td>
  </tr>
);

export default function UserManagement() {
  const invalidate = useInvalidateAdmin();
  const [role, setRole] = useState("all");
  const [q, setQ] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const { data = [] } = useQuery({
    queryKey: ["admin", "users", role, q],
    queryFn: () => api.get("/admin/users", { params: { ...(role === "all" ? {} : { role }), ...(q.trim() ? { q } : {}) } }).then((r) => r.data),
  });
  const run = (fn, msg) => async (...args) => {
    try {
      await fn(...args);
      toast.success(msg);
      invalidate();
    } catch (err) {
      toast.error(apiError(err));
    }
  };
  const setStatus = run((id, status) => api.patch(`/admin/users/${id}/status`, { status }), "وضعیت حساب به‌روزرسانی شد");
  const remove = run((id) => api.delete(`/admin/users/${id}`), "حساب حذف شد");

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی کاربر..." className="h-11 rounded-xl border-slate-200 bg-white pr-10" data-testid="users-search-input" />
        </div>
        <div className="w-40"><OptionSelect value={role} onChange={setRole} options={{ all: "همه نقش‌ها", ...ROLE_LABELS }} testId="users-role-filter" /></div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white" data-testid="users-list">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-right text-xs text-slate-500">
            <tr>{["نام", "شناسه", "نقش", "ایمیل", "وضعیت", "آخرین ورود", "عملیات"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((u) => <Row key={u.id} u={u} onEdit={setEditUser} onReset={setResetUser} onStatus={setStatus} onDelete={remove} />)}
          </tbody>
        </table>
        {data.length === 0 && <p className="p-8 text-center text-sm text-slate-500" data-testid="users-empty">کاربری یافت نشد.</p>}
      </div>
      {editUser && <EditUserDialog user={editUser} onClose={() => setEditUser(null)} onSaved={invalidate} />}
      {resetUser && <ResetDialog user={resetUser} onClose={() => setResetUser(null)} />}
    </div>
  );
}
