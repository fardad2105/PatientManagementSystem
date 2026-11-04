import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pill, Pencil, Check, X, ChevronDown, Clock } from "lucide-react";
import LogDialog from "@/components/meds/LogDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { api, apiError } from "@/lib/api";
import { formatJalali } from "@/lib/date";
import { MED_LOG_STATUS } from "@/lib/labels";

const LOG_STYLE = { taken: "bg-emerald-50 text-emerald-700", missed: "bg-rose-50 text-rose-700", skipped: "bg-slate-100 text-slate-600" };

const LogList = ({ medId, readOnly, onChanged }) => {
  const { data = [], refetch } = useQuery({ queryKey: ["med-logs", medId], queryFn: () => api.get(`/patient/medications/${medId}/logs`).then((r) => r.data) });
  const remove = async (id) => {
    await api.delete(`/patient/medication-logs/${id}`);
    refetch();
    onChanged();
  };
  if (!data.length) return <p className="text-xs text-slate-500" data-testid={`medication-logs-empty-${medId}`}>هنوز مصرفی ثبت نشده است.</p>;
  return (
    <ul className="space-y-2" data-testid={`medication-logs-${medId}`}>
      {data.map((l) => (
        <li key={l.id} className="flex items-center justify-between gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-0.5 ${LOG_STYLE[l.status]}`}>{MED_LOG_STATUS[l.status]}</span>
          <span className="flex-1 text-slate-500">{formatJalali(l.taken_at, true)}</span>
          {!readOnly && <ConfirmDelete title="حذف این ثبت؟" onConfirm={() => remove(l.id)} testId={`medication-log-delete-${l.id}`} />}
        </li>
      ))}
    </ul>
  );
};

export default function MedicationCard({ med, onEdit, onChanged, readOnly = false }) {
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const log = async (status) => {
    try {
      await api.post(`/patient/medications/${med.id}/logs`, { status });
      toast.success(status === "taken" ? "مصرف ثبت شد" : "ثبت شد");
      onChanged();
    } catch (err) {
      toast.error(apiError(err));
    }
  };
  const remove = async () => {
    try {
      await api.delete(`/patient/medications/${med.id}`);
      toast.success("دارو حذف شد");
      onChanged();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5" data-testid={`medication-card-${med.id}`}>
      <div className="flex items-start gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${med.active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-400"}`}><Pill className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-800" data-testid={`medication-name-${med.id}`}>{med.name}</h3>
            {!med.active && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">قطع‌شده</span>}
          </div>
          <p className="mt-1 text-sm text-slate-600"><bdi>{med.dose_text}</bdi>{med.frequency_text && <> · <bdi>{med.frequency_text}</bdi></>}</p>
          {med.instructions && <p className="mt-1 text-xs text-slate-500">{med.instructions}</p>}
          <p className="mt-2 text-xs text-slate-400">
            {med.start_date && `از ${formatJalali(med.start_date)}`}{med.end_date && ` تا ${formatJalali(med.end_date)}`}
            {med.last_log && ` · آخرین ثبت: ${MED_LOG_STATUS[med.last_log.status]} ${formatJalali(med.last_log.taken_at, true)}`}
          </p>
        </div>
        {!readOnly && (
          <div className="flex shrink-0">
            <button onClick={() => onEdit(med)} aria-label="ویرایش" data-testid={`medication-edit-${med.id}`} className="rounded-full p-2 text-slate-400 hover:bg-teal-50 hover:text-teal-700"><Pencil className="h-4 w-4" /></button>
            <ConfirmDelete title={`حذف «${med.name}» و همه‌ی ثبت‌های مصرف آن؟`} onConfirm={remove} testId={`medication-delete-${med.id}`} />
          </div>
        )}
      </div>
      {!readOnly && (
        <div className="mt-4 flex flex-wrap gap-2">
          {med.active && (
            <>
              <button onClick={() => log("taken")} data-testid={`medication-log-taken-${med.id}`} className="flex items-center gap-1.5 rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"><Check className="h-3.5 w-3.5" /> مصرف کردم</button>
              <button onClick={() => log("missed")} data-testid={`medication-log-missed-${med.id}`} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"><X className="h-3.5 w-3.5" /> فراموش کردم</button>
              <button onClick={() => setLogOpen(true)} data-testid={`medication-log-custom-${med.id}`} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"><Clock className="h-3.5 w-3.5" /> زمان دیگر</button>
            </>
          )}
          <button onClick={() => setOpen(!open)} data-testid={`medication-logs-toggle-${med.id}`} className="mr-auto flex items-center gap-1 px-2 text-xs text-teal-700">
            سابقه‌ی مصرف <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}
      {open && <div className="mt-4 border-t border-slate-100 pt-4"><LogList medId={med.id} readOnly={readOnly} onChanged={onChanged} /></div>}
      {logOpen && <LogDialog med={med} onClose={() => setLogOpen(false)} onSaved={onChanged} />}
    </article>
  );
}
