import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatJalali, formatJalaliShort, toFa } from "@/lib/date";

const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div dir="rtl" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-slate-800">{toFa(p.value)} {p.unit}</p>
      <p className="text-slate-500">{formatJalali(p.sample_date)}</p>
    </div>
  );
};

export default function LabChart({ rows, testId }) {
  const units = [...new Set(rows.map((r) => r.unit))];
  const [unit, setUnit] = useState(units[0]);
  const active = units.includes(unit) ? unit : units[0];
  const data = rows.filter((r) => r.unit === active).map((r) => ({ ...r, value: Number(r.value), t: new Date(`${r.sample_date}T00:00:00`).getTime() }));
  if (data.length < 2) {
    return <p className="py-10 text-center text-sm text-slate-500" data-testid={`${testId}-empty`}>برای نمایش روند، دست‌کم دو نتیجه با یک واحد لازم است.</p>;
  }
  return (
    <div data-testid={testId}>
      {units.length > 1 && (
        <div className="mb-3 flex gap-2 text-xs">
          {units.map((u) => (
            <button key={u} onClick={() => setUnit(u)} dir="ltr" data-testid={`${testId}-unit-${u}`}
              className={`rounded-full px-3 py-1 ${u === active ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>{u}</button>
          ))}
        </div>
      )}
      <div dir="ltr" className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={formatJalaliShort} tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis tickFormatter={(v) => toFa(v)} tick={{ fontSize: 11, fill: "#64748b" }} width={44} />
            <Tooltip content={<ChartTip />} />
            <Line type="linear" dataKey="value" stroke="#0f766e" strokeWidth={2.5} isAnimationActive={false} dot={{ r: 4, fill: "#0f766e" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-400">نمودار فقط مقادیر ثبت‌شده را نشان می‌دهد و تفسیری ارائه نمی‌کند. واحد: <span dir="ltr">{active}</span></p>
    </div>
  );
}
