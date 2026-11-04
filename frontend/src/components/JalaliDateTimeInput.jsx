import { Input } from "@/components/ui/input";
import { inputCls } from "@/components/Field";
import { JalaliDateInput } from "@/components/JalaliDateInput";

export const JalaliDateTimeInput = ({ date, time, onChange, testId, allowFuture = false }) => (
  <div className="grid grid-cols-[1fr_7.5rem] gap-2">
    <JalaliDateInput value={date} onChange={(v) => onChange({ date: v, time })} testId={`${testId}-date`} allowFuture={allowFuture} />
    <Input type="time" dir="ltr" required className={inputCls} value={time || ""} onChange={(e) => onChange({ date, time: e.target.value })} data-testid={`${testId}-time`} />
  </div>
);
