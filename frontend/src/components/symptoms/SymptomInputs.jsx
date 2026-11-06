import { Smile, Meh, Frown, Annoyed, BatteryLow, HeartPulse, Brain, Scale, Bandage, GlassWater, Scissors, Snowflake, Waves } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toFa } from "@/lib/date";
import { MOODS, SYMPTOMS, severityLabel } from "@/lib/labels";

const MOOD_ICON = { good: [Smile, "text-green-600"], fair: [Meh, "text-amber-500"], bad: [Frown, "text-orange-600"], very_bad: [Annoyed, "text-rose-600"] };
const SYM_ICON = { fatigue: BatteryLow, palpitations: HeartPulse, anxiety: Brain, weight_change: Scale, neck_pain: Bandage, swallowing: GlassWater, hair_loss: Scissors, cold_sensitivity: Snowflake, mood_swings: Waves };

export const MoodPicker = ({ value, onChange }) => (
  <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:p-6" data-testid="mood-picker">
    <h3 className="text-base font-bold text-slate-800">حال کلی شما امروز چطور است؟</h3>
    <div className="mt-5 grid grid-cols-4 gap-2">
      {Object.entries(MOODS).map(([k, l]) => {
        const [Icon, color] = MOOD_ICON[k];
        const on = value === k;
        return (
          <button key={k} type="button" onClick={() => onChange(k)} data-testid={`mood-${k}`} aria-pressed={on}
            className={`flex flex-col items-center gap-2 rounded-2xl py-3 transition-all ${on ? "bg-white shadow-md ring-2 ring-blue-500" : "hover:bg-white/70"}`}>
            <Icon className={`h-9 w-9 ${color}`} strokeWidth={1.8} />
            <span className={`text-xs ${on ? "font-bold text-slate-800" : "text-slate-500"}`}>{l}</span>
          </button>
        );
      })}
    </div>
  </section>
);

const tone = (v) => (v <= 4 ? "text-green-600 bg-green-50" : v <= 6 ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50");

export const SymptomSlider = ({ k, value, onChange }) => {
  const Icon = SYM_ICON[k];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5" data-testid={`symptom-card-${k}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 font-bold text-slate-800"><Icon className="h-5 w-5 text-blue-700" /> {SYMPTOMS[k]}</span>
        <span className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone(value).split(" ")[1]} ${tone(value).split(" ")[0]}`} data-testid={`symptom-label-${k}`}>{severityLabel(value)}</span>
          <span className={`text-2xl font-extrabold ${tone(value).split(" ")[0]}`} data-testid={`symptom-value-${k}`}>{toFa(value)}</span>
        </span>
      </div>
      <Slider dir="rtl" min={0} max={10} step={1} value={[value]} onValueChange={([v]) => onChange(v)} data-testid={`symptom-slider-${k}`} aria-label={SYMPTOMS[k]} />
      <div className="mt-2 flex justify-between text-[11px]">
        <span className="text-green-600">بدون علامت</span>
        <span className="text-rose-500">بسیار شدید</span>
      </div>
    </div>
  );
};
