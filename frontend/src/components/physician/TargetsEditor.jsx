import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, apiError } from "@/lib/api";
import { toEn } from "@/lib/date";
import { LAB_TESTS } from "@/lib/labels";
import { OptionSelect } from "@/components/Field";

const empty = () => Object.fromEntries(Object.entries(LAB_TESTS).map(([k, t]) => [k, { unit: t.units[0], low: "", high: "" }]));
const num = (v) => (v === "" || v === null ? null : Number(toEn(String(v)).trim()));

export const TargetsEditor = ({ patientId }) => {
  const qc = useQueryClient();
  const [rows, setRows] = useState(empty);
  const [ready, setReady] = useState(false);
  const { data } = useQuery({ queryKey: ["physician-targets", patientId], queryFn: () => api.get(`/physician/patients/${patientId}/targets`).then((r) => r.data) });
  useEffect(() => {
    if (!data || ready) { return; }
    setReady(true);
    const next = empty();
    data.forEach((t) => { next[t.test_type] = { unit: t.unit, low: t.target_low ?? "", high: t.target_high ?? "" }; });
    setRows(next);
  }, [data]);
  const submit = () => {
    const bad = Object.values(rows).some((r) => [r.low, r.high].some((v) => v !== "" && v !== null && Number.isNaN(num(v))));
    if (bad) { toast.error("لطفاً فقط عدد وارد کنید"); return; }
    save.mutate();
  };
  const save = useMutation({
    mutationFn: () => api.put(`/physician/patients/${patientId}/targets`, {
      targets: Object.entries(rows).map(([k, r]) => ({ test_type: k, unit: r.unit, target_low: num(r.low), target_high: num(r.high) })),
    }),
    onSuccess: () => {
      toast.success("محدوده‌ها ذخیره شد");
      ["physician-targets", "physician-alerts", "physician-patients", "physician-dashboard"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const set = (k, field) => (v) => setRows((s) => ({ ...s, [k]: { ...s[k], [field]: v } }));

  return (
    <section className="rounded-2xl border border-green-200 bg-white p-5 sm:p-6" data-testid="targets-editor">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-800"><Target className="h-5 w-5 text-green-700" /> محدوده‌های هدف (تعیین پزشک)</h3>
      <p className="mt-1 mb-4 text-xs text-slate-500">مقادیر خارج از این محدوده‌ها فقط در فهرست هشدارهای شما علامت می‌خورند و به بیمار توصیه‌ای نمایش داده نمی‌شود. برای حذف، هر دو خانه را خالی کنید.</p>
      <div className="space-y-3">
        {Object.entries(LAB_TESTS).map(([k, t]) => (
          <div key={k} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[90px_1fr_1fr_140px]">
            <span className="col-span-2 text-sm font-bold text-slate-700 sm:col-span-1">{t.label}</span>
            <Input value={rows[k].low} onChange={(e) => set(k, "low")(e.target.value)} placeholder="حد پایین" disabled={!ready} inputMode="decimal" className="h-10 rounded-xl" data-testid={`target-low-${k}`} />
            <Input value={rows[k].high} onChange={(e) => set(k, "high")(e.target.value)} placeholder="حد بالا" disabled={!ready} inputMode="decimal" className="h-10 rounded-xl" data-testid={`target-high-${k}`} />
            <div className="col-span-2 sm:col-span-1"><OptionSelect value={rows[k].unit} onChange={set(k, "unit")} options={Object.fromEntries(t.units.map((u) => [u, u]))} testId={`target-unit-${k}`} /></div>
          </div>
        ))}
      </div>
      <Button onClick={submit} disabled={!ready || save.isPending} className="mt-4 rounded-full bg-green-700 hover:bg-green-800" data-testid="targets-save-button">ذخیره محدوده‌ها</Button>
    </section>
  );
};
