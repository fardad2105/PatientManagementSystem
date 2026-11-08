export const REASONS = { routine_followup: "پیگیری دوره‌ای", tg_change: "تغییر Tg طبق نظر پزشک", physician_request: "درخواست پزشک", symptom: "علامت یا شکایت", other: "سایر" };
export const BED_STATUS = { normal: "بدون یافته گزارش‌شده", post_surgical: "تغییرات پس از جراحی", finding: "دارای یافته", unclear: "نامشخص" };
export const YES_NO_UNKNOWN = { yes: "بله", no: "خیر", unknown: "نامشخص" };
export const YES_NO = { yes: "بله", no: "خیر" };
export const LYMPH = { normal: "طبیعی", finding: "دارای یافته", unclear: "نامشخص" };
export const LOCATIONS = {
  thyroid_bed: "بستر تیروئید", right_bed: "بستر تیروئید سمت راست", left_bed: "بستر تیروئید سمت چپ", central: "مرکزی",
  right_lateral: "لترال راست گردن", left_lateral: "لترال چپ گردن", other: "سایر",
};
export const DOC_CATEGORIES = { lab: "جواب آزمایش", ultrasound: "گزارش سونوگرافی", pathology: "پاتولوژی", imaging: "تصویر پزشکی", report: "سایر گزارش‌ها", other: "سایر" };
export const pick = (map, k) => (k ? map[k] || k : "—");
