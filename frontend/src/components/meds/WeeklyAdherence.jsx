import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Minus, ChevronRight, ChevronLeft, CalendarCheck } from "lucide-react";
import { api } from "@/lib/api";
import { formatJalali, toFa } from "@/lib/date";

const DAY_LABELS = ["ش", "۱ش", "۲ش", "۳ش", "۴ش", "۵ش", "ج"];
const TILE = {
  taken: ["bg-green-50 border-green-200 text-green-600", Check, "مصرف شد"],
  missed: ["bg-rose-50 border-rose-300 border-dashed text-rose-500", X, "مصرف نشد"],
  none: ["bg-white border-slate-300 border-dashed text-slate-400", Minus, "ثبت نشده"],
  future: ["bg-slate-50 border-slate-100 text-transparent", Minus, "آینده"],
  inactive: ["bg-slate-100 border-slate-100 text-slate-300", Minus, "خارج از دوره مصرف"],
};

const Tile = ({ d, i, today, testId }) => {
  const [cls, Icon, text] = TILE[d.status];
  return (
    <div className="flex flex-col items-center gap-1.5" data-testid={testId} title={text}>
      <div className={`flex aspect-square w-full items-center justify-center rounded-xl border-2 sm:rounded-2xl ${cls} ${d.date === today ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
      </div>
      <span className="text-xs font-semibold text-slate-600">{DAY_LABELS[i]}</span>
      <span className="h-4 text-[11px] text-slate-400" dir="ltr">{d.time ? toFa(d.time) : ""}</span>
    </div>
  );
};

const Med = ({ m, today }) => (
  <div className="space-y-3" data-testid={`week-med-${m.medication_id}`}>
    <p className="flex items-baseline justify-between gap-2 text-sm">
      <span className="font-bold text-slate-800">{m.name} <span className="font-normal text-slate-500">· {m.dose_text}</span></span>
      <span className="shrink-0 whitespace-nowrap text-xs text-slate-500" data-testid={`week-med-count-${m.medication_id}`}>{toFa(m.taken_days)} از {toFa(m.expected_days)} روز</span>
    </p>
    <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
      {m.days.map((d, i) => <Tile key={d.date} d={d} i={i} today={today} testId={`week-day-${m.medication_id}-${i}`} />)}
    </div>
  </div>
);

const navBtn = "rounded-full border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30";

export const WeeklyAdherence = ({ url = "/patient/medications/week", testId = "weekly-adherence" }) => {
  const [offset, setOffset] = useState(0);
  const { data } = useQuery({ queryKey: ["med-week", url, offset], queryFn: () => api.get(url, { params: { offset } }).then((r) => r.data) });
  if (!data) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid={testId}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base md:text-lg font-bold text-slate-800"><CalendarCheck className="h-5 w-5 text-blue-700" /> پایبندی به درمان ({offset === 0 ? "این هفته" : "هفته‌های قبل"})</h2>
          <p className="mt-0.5 text-xs text-slate-500" data-testid={`${testId}-range`}>{formatJalali(data.week_start)} تا {formatJalali(data.week_end)}</p>
        </div>
        <div className="flex items-center gap-2">
          {data.adherence_percent !== null && <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700" data-testid={`${testId}-percent`}>٪{toFa(data.adherence_percent)}</span>}
          <button onClick={() => setOffset((o) => o - 1)} disabled={offset <= -52} aria-label="هفته قبل" className={navBtn} data-testid={`${testId}-prev`}><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => setOffset((o) => o + 1)} disabled={offset >= 0} aria-label="هفته بعد" className={navBtn} data-testid={`${testId}-next`}><ChevronLeft className="h-4 w-4" /></button>
        </div>
      </div>
      {data.medications.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500" data-testid={`${testId}-empty`}>داروی فعالی برای این هفته وجود ندارد.</p>
      ) : (
        <div className="space-y-6">{data.medications.map((m) => <Med key={m.medication_id} m={m} today={data.today} />)}</div>
      )}
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 rounded-xl bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
        {["taken", "missed", "none", "inactive"].map((k) => {
          const [cls, Icon, text] = TILE[k];
          return <span key={k} className="flex items-center gap-1.5"><span className={`flex h-4 w-4 items-center justify-center rounded border ${cls}`}><Icon className="h-3 w-3" /></span>{text}</span>;
        })}
        <span className="w-full">درصد فقط از روی ثبت‌های مصرف محاسبه می‌شود و جنبه‌ی تفسیری ندارد.</span>
      </div>
    </section>
  );
};
