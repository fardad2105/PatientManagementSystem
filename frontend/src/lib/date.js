import dayjs from "dayjs";
import jalaliday from "jalaliday";
import "dayjs/locale/fa";

dayjs.extend(jalaliday);

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export const toFa = (value) => String(value ?? "").replace(/\d/g, (d) => FA_DIGITS[d]);

export const toEn = (value) =>
  typeof value === "string" ? value.replace(/[۰-۹]/g, (d) => FA_DIGITS.indexOf(d)).replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632).replace(/٫/g, ".").trim() : value;

export function formatJalali(iso, withTime = false) {
  if (!iso) return "—";
  const d = dayjs(iso).calendar("jalali").locale("fa");
  return toFa(d.format(withTime ? "D MMMM YYYY، HH:mm" : "D MMMM YYYY"));
}

export const formatJalaliShort = (iso) => (iso ? toFa(dayjs(iso).calendar("jalali").locale("fa").format("YYYY/MM")) : "");

export const todayJalali = () => toFa(dayjs().calendar("jalali").locale("fa").format("dddd D MMMM YYYY"));

export const splitLocal = (iso) => {
  const d = dayjs(iso || undefined);
  const m = iso ? d.minute() : Math.floor(d.minute() / 5) * 5;
  return { date: d.format("YYYY-MM-DD"), time: `${d.format("HH")}:${String(Math.round(m / 5) * 5 % 60).padStart(2, "0")}` };
};

export const joinLocal = (date, time) => new Date(`${date}T${time || "00:00"}:00`).toISOString();

