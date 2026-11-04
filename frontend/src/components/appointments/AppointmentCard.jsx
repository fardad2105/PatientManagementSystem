import { toast } from "sonner";
import { CalendarClock, Pencil, Check, Ban, BellRing, MapPin } from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { api, apiError } from "@/lib/api";
import { formatJalali } from "@/lib/date";
import { APPT_STATUS, APPT_TYPE, REMIND_OPTIONS } from "@/lib/labels";

const STATUS_STYLE = { scheduled: "bg-teal-50 text-teal-700", done: "bg-emerald-50 text-emerald-700", cancelled: "bg-slate-100 text-slate-500", missed: "bg-rose-50 text-rose-700" };

export default function AppointmentCard({ appt, onEdit, onChanged, readOnly = false }) {
  const run = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      onChanged();
    } catch (err) {
      toast.error(apiError(err));
    }
  };
  const setStatus = (status) => run(() => api.patch(`/patient/appointments/${appt.id}/status`, { status }), "وضعیت نوبت به‌روزرسانی شد");
  const overdue = appt.status === "scheduled" && new Date(appt.scheduled_at) <= new Date();
  const reminderDue = appt.status === "scheduled" && appt.reminder_at && new Date(appt.reminder_at) <= new Date() && new Date(appt.scheduled_at) > new Date();

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5" data-testid={`appointment-card-${appt.id}`}>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><CalendarClock className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-800" data-testid={`appointment-title-${appt.id}`}>{appt.title}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[appt.status]}`} data-testid={`appointment-status-${appt.id}`}>{overdue ? "زمان گذشته — وضعیت را ثبت کنید" : APPT_STATUS[appt.status]}</span>
            {reminderDue && <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-800"><BellRing className="h-3 w-3" /> یادآور</span>}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-700" data-testid={`appointment-when-${appt.id}`}>{formatJalali(appt.scheduled_at, true)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {APPT_TYPE[appt.appointment_type]}{appt.physician_name && ` · ${appt.physician_name}`}
            {appt.remind_before_minutes != null && ` · یادآور: ${REMIND_OPTIONS[appt.remind_before_minutes] || ""}`}
          </p>
          {appt.location && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{appt.location}</p>}
          {appt.notes && <p className="mt-2 text-xs leading-relaxed text-slate-500">{appt.notes}</p>}
        </div>
        {!readOnly && (
          <div className="flex shrink-0">
            <button onClick={() => onEdit(appt)} aria-label="ویرایش" data-testid={`appointment-edit-${appt.id}`} className="rounded-full p-2 text-slate-400 hover:bg-teal-50 hover:text-teal-700"><Pencil className="h-4 w-4" /></button>
            <ConfirmDelete title={`حذف نوبت «${appt.title}»؟`} onConfirm={() => run(() => api.delete(`/patient/appointments/${appt.id}`), "نوبت حذف شد")} testId={`appointment-delete-${appt.id}`} />
          </div>
        )}
      </div>
      {!readOnly && appt.status === "scheduled" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setStatus("done")} data-testid={`appointment-done-${appt.id}`} className="flex items-center gap-1.5 rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"><Check className="h-3.5 w-3.5" /> انجام شد</button>
          <button onClick={() => setStatus("cancelled")} data-testid={`appointment-cancel-${appt.id}`} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"><Ban className="h-3.5 w-3.5" /> لغو</button>
          {overdue && <button onClick={() => setStatus("missed")} data-testid={`appointment-missed-${appt.id}`} className="flex items-center gap-1.5 rounded-full border border-rose-200 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50">از دست رفت</button>}
        </div>
      )}
      {!readOnly && appt.status !== "scheduled" && (
        <button onClick={() => setStatus("scheduled")} data-testid={`appointment-reopen-${appt.id}`} className="mt-3 text-xs text-teal-700 hover:underline">بازگرداندن به «در پیش رو»</button>
      )}
    </article>
  );
}
