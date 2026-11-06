import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatJalali, toFa } from "@/lib/date";
import { SYMPTOMS } from "@/lib/labels";
import dayjs from "dayjs";

const COLORS = { fatigue: "#1565c0", palpitations: "#d32f2f", anxiety: "#7b1fa2", weight_change: "#00897b", neck_pain: "#2e7d32", swallowing: "#5d4037", hair_loss: "#f57c00", cold_sensitivity: "#0288d1", mood_swings: "#c2185b" };
const shortDate = (t) => toFa(dayjs(t).calendar("jalali").locale("fa").format("M/D"));

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div dir="rtl" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-semibold text-slate-700">{formatJalali(payload[0].payload.entry_date)}</p>
      {payload.map((p) => <p key={p.dataKey} style={{ color: p.color }}>{SYMPTOMS[p.dataKey]}: {toFa(p.value)}</p>)}
    </div>
  );
};

export const SymptomTrend = ({ entries, testId = "symptom-trend" }) => {
  const [sel, setSel] = useState(["fatigue", "palpitations", "anxiety"]);
  const toggle = (k) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  const data = entries.map((e) => ({ ...e.scores, entry_date: e.entry_date, t: new Date(`${e.entry_date}T00:00:00`).getTime() }));
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid={testId}>
      <h3 className="mb-4 text-base font-bold text-slate-800">روند تغییر علائم</h3>
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(SYMPTOMS).map(([k, l]) => (
          <button key={k} onClick={() => toggle(k)} data-testid={`${testId}-toggle-${k}`}
            style={sel.includes(k) ? { background: COLORS[k], borderColor: COLORS[k] } : {}}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${sel.includes(k) ? "text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {!sel.includes(k) && <span className="h-2 w-2 rounded-full" style={{ background: COLORS[k] }} />}{l}
          </button>
        ))}
      </div>
      {data.length < 2 ? (
        <p className="py-10 text-center text-sm text-slate-500" data-testid={`${testId}-empty`}>برای نمایش روند، دست‌کم دو روز ثبت لازم است.</p>
      ) : (
        <div dir="ltr" className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tickFormatter={toFa} tick={{ fontSize: 11, fill: "#64748b" }} width={30} />
              <Tooltip content={<Tip />} />
              {sel.map((k) => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[k]} strokeWidth={2.5} dot={{ r: 3.5, fill: COLORS[k] }} connectNulls isAnimationActive={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">نمودار فقط شدت‌های ثبت‌شده (۰ تا ۱۰) را نشان می‌دهد و تفسیر پزشکی ارائه نمی‌کند.</p>
    </section>
  );
};
