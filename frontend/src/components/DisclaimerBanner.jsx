import { ShieldAlert } from "lucide-react";

export const DisclaimerBanner = () => (
  <div
    data-testid="medical-disclaimer-banner"
    className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 sm:p-4 text-xs sm:text-sm font-medium text-amber-900 leading-relaxed"
  >
    <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
    <p>
      این سامانه ابزار تشخیصی، تفسیری یا تجویزی نیست و جایگزین نظر پزشک معالج شما نمی‌شود. این سامانه فقط برای ثبت و
      مدیریت اطلاعات سلامت شخصی طراحی شده است.
    </p>
  </div>
);
