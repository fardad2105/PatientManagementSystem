export const ROLE_LABELS = { patient: "بیمار", physician: "پزشک", admin: "مدیر سیستم" };

export const STATUS_LABELS = { pending: "در انتظار تأیید", active: "فعال", rejected: "ردشده", disabled: "غیرفعال" };

export const GENDER = { male: "مرد", female: "زن", other: "سایر" };

export const CANCER_TYPE = { papillary: "پاپیلاری", follicular: "فولیکولار", unknown: "نامشخص" };

export const SURGERY_TYPE = {
  total: "تیروئیدکتومی کامل",
  near_total: "تیروئیدکتومی تقریباً کامل",
  lobectomy: "لوبکتومی",
  completion: "تیروئیدکتومی تکمیلی",
  unknown: "نامشخص",
};

export const TRI = { yes: "بله", no: "خیر", unknown: "نمی‌دانم" };

export const label = (map, key) => (key ? map[key] || key : "—");
