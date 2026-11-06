import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { formatJalali, toFa } from "@/lib/date";
import { CANCER_TYPE, FLAG, LAB_TESTS, label } from "@/lib/labels";

export const ageOf = (birth) => (birth ? Math.floor((Date.now() - new Date(birth).getTime()) / 31557600000) : null);

export const FlagChips = ({ items, testId }) => (
  <div className="flex flex-wrap gap-1.5" data-testid={testId}>
    {items.map((f) => (
      <span key={f.lab.id} className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
        {LAB_TESTS[f.lab.test_type].label} {FLAG[f.flag]}
      </span>
    ))}
  </div>
);

export const RangeBadge = ({ p }) => {
  const hasTarget = p.latest_labs.some((f) => f.target);
  const [cls, text] = p.out_of_range.length
    ? ["bg-amber-50 text-amber-700", "خارج از محدوده"]
    : hasTarget ? ["bg-green-50 text-green-700", "در محدوده"] : ["bg-slate-100 text-slate-500", "محدوده تعیین نشده"];
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`} data-testid={`range-badge-${p.id}`}>{text}</span>;
};

const valueOf = (p, type) => p.latest_labs.find((f) => f.lab.test_type === type);

export const PatientRow = ({ p, highlight }) => {
  const age = ageOf(p.birth_date);
  return (
    <Link to={`/physician/patients/${p.id}`} data-testid={`physician-patient-row-${p.id}`}
      className={`flex gap-4 rounded-2xl border bg-white p-5 transition-colors hover:border-green-400 ${highlight ? "border-blue-300" : "border-slate-200"}`}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white">{p.name.trim()[0]}</span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="font-bold text-slate-800">{p.name}</span>
          {age !== null && <span className="text-xs text-slate-500">{toFa(age)} ساله</span>}
        </p>
        <p className="text-xs font-semibold text-slate-500">{label(CANCER_TYPE, p.cancer_type)}{p.staging_text ? ` — ${p.staging_text}` : ""}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          <span>آخرین ویزیت: {formatJalali(p.last_visit)}</span>
          <span>ویزیت بعدی: {formatJalali(p.next_appointment)}</span>
        </p>
        {p.out_of_range.length > 0 && <FlagChips items={p.out_of_range} testId={`patient-flags-${p.id}`} />}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
        <RangeBadge p={p} />
        {["TSH", "TG"].map((t) => {
          const f = valueOf(p, t);
          return (
            <span key={t} className="text-slate-500" dir="ltr">
              {LAB_TESTS[t].label}: <b className={f && ["above", "below"].includes(f.flag) ? "text-rose-600" : "text-blue-700"}>{f ? toFa(f.lab.value) : "—"}</b>
            </span>
          );
        })}
      </div>
    </Link>
  );
};
