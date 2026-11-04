import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import { CalendarDays } from "lucide-react";

const toPicker = (iso) =>
  iso ? new DateObject({ date: iso, format: "YYYY-MM-DD", calendar: gregorian, locale: gregorian_en }).convert(persian, persian_fa) : null;

export const JalaliDateInput = ({ value, onChange, testId, disabled }) => (
  <div className="relative" data-testid={testId}>
    <DatePicker
      calendar={persian}
      locale={persian_fa}
      value={toPicker(value)}
      disabled={disabled}
      onChange={(d) => onChange(d ? new DateObject(d).convert(gregorian, gregorian_en).format("YYYY-MM-DD") : null)}
      calendarPosition="bottom-right"
      containerClassName="w-full"
      inputClass="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pe-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/40"
      placeholder="انتخاب تاریخ"
    />
    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
);
