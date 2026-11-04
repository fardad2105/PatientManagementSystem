import dayjs from "dayjs";
import jalaliday from "jalaliday";
import "dayjs/locale/fa";

dayjs.extend(jalaliday);

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export const toFa = (value) => String(value ?? "").replace(/\d/g, (d) => FA_DIGITS[d]);

export const toEn = (value) =>
  typeof value === "string" ? value.replace(/[۰-۹]/g, (d) => FA_DIGITS.indexOf(d)).replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632).trim() : value;

export function formatJalali(iso, withTime = false) {
  if (!iso) return "—";
  const d = dayjs(iso).calendar("jalali").locale("fa");
  return toFa(d.format(withTime ? "D MMMM YYYY، HH:mm" : "D MMMM YYYY"));
}

export const formatJalaliShort = (iso) => (iso ? toFa(dayjs(iso).calendar("jalali").locale("fa").format("YY/MM/DD")) : "");

export const todayJalali = () => toFa(dayjs().calendar("jalali").locale("fa").format("dddd D MMMM YYYY"));
