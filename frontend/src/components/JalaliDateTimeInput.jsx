import { OptionSelect } from "@/components/Field";
import { JalaliDateInput } from "@/components/JalaliDateInput";
import { toFa } from "@/lib/date";

const pad = (n) => String(n).padStart(2, "0");
const HOURS = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [pad(i), toFa(pad(i))]));
const MINUTES = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [pad(i * 5), toFa(pad(i * 5))]));

export const JalaliDateTimeInput = ({ date, time, onChange, testId, allowFuture = false }) => {
  const [h = "09", m = "00"] = (time || "").split(":");
  const setTime = (hh, mm) => onChange({ date, time: `${hh}:${mm}` });
  return (
    <div className="grid grid-cols-[1fr_5rem_5rem] gap-2">
      <JalaliDateInput value={date} onChange={(v) => onChange({ date: v, time })} testId={`${testId}-date`} allowFuture={allowFuture} />
      <OptionSelect value={h} onChange={(v) => setTime(v, m)} options={HOURS} testId={`${testId}-hour`} placeholder="ساعت" />
      <OptionSelect value={m} onChange={(v) => setTime(h, v)} options={MINUTES} testId={`${testId}-minute`} placeholder="دقیقه" />
    </div>
  );
};
