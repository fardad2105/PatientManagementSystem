import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Field = ({ label, hint, children, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    <Label className="text-xs sm:text-sm font-medium text-slate-600">{label}</Label>
    {children}
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

export const inputCls = "h-11 rounded-xl border-slate-200 bg-white focus-visible:ring-teal-600/40";

export const OptionSelect = ({ value, onChange, options, testId, placeholder = "انتخاب کنید" }) => (
  <Select dir="rtl" value={value || ""} onValueChange={onChange}>
    <SelectTrigger data-testid={testId} className={inputCls}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {Object.entries(options).map(([key, text]) => (
        <SelectItem key={key} value={key} data-testid={`${testId}-option-${key}`}>{text}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);
