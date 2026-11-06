export const ROLE_LABELS = { patient: "بیمار", physician: "پزشک", admin: "مدیر سیستم" };

export const STATUS_LABELS = { pending: "در انتظار تأیید", active: "فعال", rejected: "ردشده", disabled: "غیرفعال" };

const ACTIONS = {
  login: "ورود به سامانه", login_failed: "ورود ناموفق", logout: "خروج", register: "ثبت‌نام", upsert: "ثبت", create: "ایجاد", update: "ویرایش",
  delete: "حذف", view: "مشاهده پرونده", assign: "تخصیص پزشک", unassign: "لغو تخصیص", create_physician: "ثبت پزشک", reset_password: "بازنشانی رمز",
  change_password: "تغییر رمز", set_status: "تغییر وضعیت حساب", update_user: "ویرایش کاربر", delete_user: "حذف کاربر", create_content: "ایجاد محتوا",
  update_content: "ویرایش محتوا", delete_content: "حذف محتوا", approve: "تأیید ثبت‌نام", reject: "رد ثبت‌نام",
  update_targets: "ویرایش محدوده هدف",
};
const RESOURCES = {
  user: "حساب کاربری", symptom_entry: "ماژول علائم", lab_result: "ماژول آزمایش", medication: "ماژول دارو", medication_log: "ثبت مصرف دارو",
  appointment: "نوبت‌ها", lab_targets: "محدوده هدف", physician_assignment: "تخصیص‌ها", education_content: "محتوای آموزشی", patient: "پرونده بیمار",
  patient_profile: "پرونده شخصی", medical_profile: "پرونده پزشکی", patient_record: "پرونده بیمار",
};
export const actionLabel = (a) => {
  const base = (a || "").split(":")[0];
  return ACTIONS[base] || (base.startsWith("view") ? "مشاهده پرونده" : base);
};
export const resourceLabel = (r) => RESOURCES[r] || r;

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

export const APPT_TYPE = { visit: "ویزیت پزشک", lab: "آزمایش", imaging: "سونوگرافی / تصویربرداری", rai: "ید رادیواکتیو / اسکن", other: "سایر" };

export const APPT_STATUS = { scheduled: "در پیش رو", done: "انجام شد", cancelled: "لغو شد", missed: "از دست رفت" };

export const REMIND_OPTIONS = { none: "بدون یادآور", 60: "۱ ساعت قبل", 1440: "۱ روز قبل", 2880: "۲ روز قبل", 10080: "۱ هفته قبل" };

export const SYMPTOMS = {
  fatigue: "خستگی",
  palpitations: "تپش قلب",
  anxiety: "اضطراب",
  weight_change: "تغییر وزن",
  neck_pain: "درد گردن",
  swallowing: "مشکل بلع",
  hair_loss: "ریزش مو",
  cold_sensitivity: "حساسیت به سرما",
  mood_swings: "خلق و خو",
};

export const MOODS = { good: "خوب", fair: "متوسط", bad: "بد", very_bad: "خیلی بد" };

export const severityLabel = (v) =>
  v === 0 ? "ندارم" : v <= 2 ? "خیلی خفیف" : v <= 4 ? "خفیف" : v <= 6 ? "متوسط" : v <= 8 ? "شدید" : "بسیار شدید";

export const FLAG = {
  above: "بالاتر از محدوده تعیین‌شده",
  below: "پایین‌تر از محدوده تعیین‌شده",
  in_range: "در محدوده تعیین‌شده",
  no_target: "محدوده تعیین نشده",
  unit_mismatch: "واحد متفاوت با محدوده",
};

export const label = (map, key) => (key ? map[key] || key : "—");
