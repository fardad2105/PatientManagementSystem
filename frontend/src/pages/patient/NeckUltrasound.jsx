import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ScanLine } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { toFa } from "@/lib/date";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import { UltrasoundCard } from "@/components/ultrasound/UltrasoundCard";
import UltrasoundDialog from "@/components/ultrasound/UltrasoundDialog";

export default function NeckUltrasound() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ["ultrasounds"], queryFn: () => api.get("/patient/ultrasounds").then((r) => r.data) });
  const { data: notes = [] } = useQuery({ queryKey: ["notes", "me"], queryFn: () => api.get("/patient/notes").then((r) => r.data) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["ultrasounds"] }); qc.invalidateQueries({ queryKey: ["documents"] }); };
  const remove = async (id) => {
    try {
      await api.delete(`/patient/ultrasounds/${id}`);
      toast.success("سونوگرافی حذف شد");
      refresh();
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  if (isLoading || !data) return <FullScreenLoader />;
  return (
    <div className="space-y-6" data-testid="ultrasound-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-extrabold text-slate-900"><ScanLine className="h-7 w-7 text-blue-700" /> پیگیری سونوگرافی گردن</h1>
          <p className="mt-1 text-sm text-slate-500">{toFa(data.length)} سونوگرافی ثبت‌شده · بستر تیروئید، بافت باقی‌مانده، غدد لنفاوی و یافته‌های قابل پیگیری</p>
        </div>
        <button onClick={() => setEditing({})} data-testid="us-add-button"
          className="flex items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          <Plus className="h-4 w-4" /> ثبت سونوگرافی
        </button>
      </div>
      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500" data-testid="us-empty">هنوز سونوگرافی ثبت نشده است.</div>
      ) : (
        <div className="space-y-4">
          {data.map((u) => <UltrasoundCard key={u.id} u={u} fileUrl={(id) => `/patient/documents/${id}/file`} notes={notes} canWrite={false} onEdit={setEditing} onDelete={remove} />)}
        </div>
      )}
      {editing && <UltrasoundDialog initial={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}
