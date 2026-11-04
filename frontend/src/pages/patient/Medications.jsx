import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pill } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import MedicationCard from "@/components/meds/MedicationCard";
import MedicationDialog from "@/components/meds/MedicationDialog";

export default function Medications() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const { data, isLoading, error } = useQuery({ queryKey: ["medications"], queryFn: () => api.get("/patient/medications").then((r) => r.data) });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["medications"] });
    qc.invalidateQueries({ queryKey: ["med-logs"] });
    qc.invalidateQueries({ queryKey: ["patient-dashboard"] });
  };
  if (error) return <p className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700" data-testid="medications-error">{apiError(error)}</p>;
  if (isLoading || !data) return <FullScreenLoader />;

  return (
    <div className="space-y-6" data-testid="medications-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">داروهای من</h1>
          <p className="mt-2 text-sm text-slate-500">داروهای تجویزشده را ثبت کنید و مصرف روزانه را علامت بزنید.</p>
        </div>
        <button onClick={() => setEditing({})} data-testid="medication-add-button"
          className="flex items-center justify-center gap-2 rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800">
          <Plus className="h-4 w-4" /> افزودن دارو
        </button>
      </div>
      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center" data-testid="medications-empty">
          <Pill className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">هنوز دارویی ثبت نکرده‌اید.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((m) => <MedicationCard key={m.id} med={m} onEdit={setEditing} onChanged={refresh} />)}
        </div>
      )}
      {editing && <MedicationDialog initial={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}
