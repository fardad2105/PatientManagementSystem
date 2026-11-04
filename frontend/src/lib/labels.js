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

export const LAB_TESTS = {
  TSH: { label: "TSH", full: "هورمون محرک تیروئید (TSH)", units: ["mIU/L", "µIU/mL"] },
  FT4: { label: "FT4", full: "T4 آزاد (FT4)", units: ["ng/dL", "pmol/L"] },
  TG: { label: "Tg", full: "تیروگلوبولین (Tg)", units: ["ng/mL", "µg/L"] },
  ANTI_TG: { label: "Anti-Tg", full: "آنتی‌بادی ضد تیروگلوبولین (Anti-Tg)", units: ["IU/mL", "kIU/L"] },
};

export const MED_LOG_STATUS = { taken: "مصرف شد", missed: "فراموش شد", skipped: "مصرف نشد" };

export const label = (map, key) => (key ? map[key] || key : "—");
