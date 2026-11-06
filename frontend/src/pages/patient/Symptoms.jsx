import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Activity } from "lucide-react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, apiError } from "@/lib/api";
import { SYMPTOMS } from "@/lib/labels";
import { JalaliDateInput } from "@/components/JalaliDateInput";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import { MoodPicker, SymptomSlider } from "@/components/symptoms/SymptomInputs";
import { SymptomTrend } from "@/components/symptoms/SymptomTrend";

const zeros = () => Object.fromEntries(Object.keys(SYMPTOMS).map((k) => [k, 0]));

export default function Symptoms() {
  const qc = useQueryClient();
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [mood, setMood] = useState(null);
  const [scores, setScores] = useState(zeros);
  const [notes, setNotes] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["symptoms"], queryFn: () => api.get("/patient/symptoms").then((r) => r.data) });

  useEffect(() => {
    if (!data) { return; }
    const e = data.find((x) => x.entry_date === date);
    setMood(e?.mood ?? null);
    setScores({ ...zeros(), ...(e?.scores || {}) });
    setNotes(e?.notes ?? "");
  }, [data, date]);

  const save = useMutation({
    mutationFn: () => api.put("/patient/symptoms", { entry_date: date, mood, scores, notes: notes || null }),
    onSuccess: () => { toast.success("علائم ثبت شد"); qc.invalidateQueries({ queryKey: ["symptoms"] }); },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading || !data) return <FullScreenLoader />;
  const existing = data.some((x) => x.entry_date === date);

  return (
    <div className="space-y-5" data-testid="symptoms-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">ثبت علائم</h1>
          <p className="mt-1 text-sm text-slate-500">علائم روز را بر اساس شدت ثبت کنید (۰ = بدون علامت، ۱۰ = بسیار شدید)</p>
        </div>
        <div className="flex items-center gap-2 sm:w-60">
          <Activity className="h-4 w-4 shrink-0 text-blue-700" />
          <div className="flex-1"><JalaliDateInput value={date} onChange={(v) => v && setDate(v)} testId="symptoms-date-input" /></div>
        </div>
      </div>
      <MoodPicker value={mood} onChange={setMood} />
      <div className="grid gap-3 lg:grid-cols-2">
        {Object.keys(SYMPTOMS).map((k) => (
          <SymptomSlider key={k} k={k} value={scores[k]} onChange={(v) => setScores((s) => ({ ...s, [k]: v }))} />
        ))}
      </div>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="یادداشت (اختیاری)" className="rounded-2xl bg-white" data-testid="symptoms-notes-input" />
      <Button onClick={() => save.mutate()} disabled={!mood || save.isPending} data-testid="symptoms-save-button"
        className="h-14 w-full rounded-2xl bg-blue-700 text-base font-bold hover:bg-blue-800">
        <Save className="h-5 w-5" /> {existing ? "به‌روزرسانی علائم این روز" : "ثبت علائم امروز"}
      </Button>
      {!mood && <p className="-mt-3 text-center text-xs text-slate-400" data-testid="symptoms-mood-hint">برای ثبت، ابتدا حال کلی را انتخاب کنید.</p>}
      <SymptomTrend entries={data} />
    </div>
  );
}
