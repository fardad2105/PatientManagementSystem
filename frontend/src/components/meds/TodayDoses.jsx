import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pill, Check, X, ChevronLeft, CircleCheck, CircleX } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { toFa } from "@/lib/date";

const timeOf = (iso) => toFa(new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" }));

const Dose = ({ d, onLog, pending }) => (
  <li className="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 p-4" data-testid={`today-dose-${d.medication_id}`}>
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Pill className="h-5 w-5" /></span>
    <div className="min-w-0 flex-1">
      <p className="font-bold text-slate-800">{d.name}</p>
      <p className="text-xs text-slate-500">{d.dose_text} · {d.frequency_text}</p>
    </div>
    {d.status === "taken" && (
      <span className="flex items-center gap-1.5 text-sm font-semibold text-green-700" data-testid={`today-dose-status-${d.medication_id}`}><CircleCheck className="h-7 w-7" /> ساعت {timeOf(d.logged_at)}</span>
    )}
    {d.status === "missed" && (
      <span className="flex items-center gap-1.5 text-sm font-semibold text-rose-600" data-testid={`today-dose-status-${d.medication_id}`}><CircleX className="h-7 w-7" /> مصرف نشد</span>
    )}
    {!d.status && (
      <div className="flex w-full gap-2 sm:w-auto">
        <button onClick={() => onLog(d.medication_id, "taken")} disabled={pending} data-testid={`today-dose-taken-${d.medication_id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:flex-none">
          <Check className="h-4 w-4" /> مصرف کردم
        </button>
        <button onClick={() => onLog(d.medication_id, "missed")} disabled={pending} data-testid={`today-dose-missed-${d.medication_id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 sm:flex-none">
          <X className="h-4 w-4" /> فراموش کردم
        </button>
      </div>
    )}
  </li>
);

export const TodayDoses = () => {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["med-today"], queryFn: () => api.get("/patient/medications/today").then((r) => r.data) });
  const log = useMutation({
    mutationFn: ({ id, status }) => api.post(`/patient/medications/${id}/today`, { status }).then((r) => r.data),
    onSuccess: (rows, { status }) => {
      qc.setQueryData(["med-today"], rows);
      ["med-week", "med-logs", "medications", "patient-dashboard"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      toast.success(status === "taken" ? "مصرف امروز ثبت شد" : "ثبت شد");
    },
    onError: (e) => { toast.error(apiError(e)); qc.invalidateQueries({ queryKey: ["med-today"] }); },
  });
  if (!data || data.length === 0) return null;
  const done = data.filter((d) => d.status).length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid="today-doses-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base md:text-lg font-bold text-slate-800"><Pill className="h-5 w-5 text-blue-700" /> امروز دارویت را ثبت کرده‌ای؟</h2>
          <p className="mt-0.5 text-xs text-slate-500" data-testid="today-doses-progress">{toFa(done)} از {toFa(data.length)} دارو ثبت شده</p>
        </div>
        <Link to="/patient/medications" className="flex shrink-0 items-center gap-1 text-xs text-blue-700" data-testid="today-doses-manage-link">مدیریت دارو <ChevronLeft className="h-3.5 w-3.5" /></Link>
      </div>
      <ul className="space-y-2">
        {data.map((d) => <Dose key={d.medication_id} d={d} pending={log.isPending} onLog={(id, status) => log.mutate({ id, status })} />)}
      </ul>
      <p className="mt-3 text-[11px] text-slate-400">زمان ثبت، همین لحظه در نظر گرفته می‌شود. برای ثبت زمان دیگر از صفحه‌ی داروها استفاده کنید.</p>
    </section>
  );
};
