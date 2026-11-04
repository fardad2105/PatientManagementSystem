import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Link2 } from "lucide-react";
import { Field, OptionSelect } from "@/components/Field";
import { useInvalidateAdmin } from "@/components/admin/ApprovalQueue";
import { api, apiError } from "@/lib/api";
import { formatJalali } from "@/lib/date";

const useActive = (role) =>
  useQuery({
    queryKey: ["admin", "users", "active", role],
    queryFn: () => api.get("/admin/users", { params: { role, status: "active" } }).then((r) => r.data),
  });

const toOptions = (list) => Object.fromEntries((list || []).map((u) => [u.id, `${u.name} — ${u.email}`]));

export default function Assignments() {
  const invalidate = useInvalidateAdmin();
  const [sel, setSel] = useState({ patient_id: "", physician_id: "" });
  const patients = useActive("patient");
  const physicians = useActive("physician");
  const { data = [] } = useQuery({ queryKey: ["admin", "assignments"], queryFn: () => api.get("/admin/assignments").then((r) => r.data) });

  const run = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      invalidate();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="بیمار (فعال)">
          <OptionSelect value={sel.patient_id} onChange={(v) => setSel({ ...sel, patient_id: v })} options={toOptions(patients.data)} testId="assign-patient-select" />
        </Field>
        <Field label="پزشک">
          <OptionSelect value={sel.physician_id} onChange={(v) => setSel({ ...sel, physician_id: v })} options={toOptions(physicians.data)} testId="assign-physician-select" />
        </Field>
        <button
          disabled={!sel.patient_id || !sel.physician_id}
          onClick={() => run(() => api.post("/admin/assignments", sel), "تخصیص انجام شد")}
          data-testid="assign-submit-button"
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-teal-700 px-6 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          <Link2 className="h-4 w-4" /> تخصیص
        </button>
      </div>
      <ul className="divide-y divide-slate-100" data-testid="assignments-list">
        {data.length === 0 && <p className="py-6 text-sm text-slate-500" data-testid="assignments-empty">هنوز تخصیصی ثبت نشده است.</p>}
        {data.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-4" data-testid={`assignment-row-${a.id}`}>
            <div>
              <p className="text-sm font-semibold text-slate-800">{a.patient_name} ← {a.physician_name}</p>
              <p className="text-xs text-slate-500">{formatJalali(a.created_at, true)}</p>
            </div>
            <button onClick={() => run(() => api.delete(`/admin/assignments/${a.id}`), "تخصیص حذف شد")} data-testid={`assignment-delete-${a.id}`}
              className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="حذف تخصیص">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
