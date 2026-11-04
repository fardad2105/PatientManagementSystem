import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, apiError } from "@/lib/api";
import { LAB_TESTS } from "@/lib/labels";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import LabChart from "@/components/labs/LabChart";
import LabTable from "@/components/labs/LabTable";
import LabDialog from "@/components/labs/LabDialog";

const tabCls = "rounded-full px-4 py-2 text-sm data-[state=active]:bg-teal-700 data-[state=active]:text-white";

export default function Labs() {
  const qc = useQueryClient();
  const [type, setType] = useState("TSH");
  const [editing, setEditing] = useState(null);
  const { data, isLoading, error } = useQuery({ queryKey: ["labs"], queryFn: () => api.get("/patient/labs").then((r) => r.data) });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["labs"] });
    qc.invalidateQueries({ queryKey: ["patient-dashboard"] });
  };
  const remove = async (row) => {
    try {
      await api.delete(`/patient/labs/${row.id}`);
      toast.success("نتیجه حذف شد");
      refresh();
    } catch (err) {
      toast.error(apiError(err));
    }
  };
  if (error) return <p className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700" data-testid="labs-error">{apiError(error)}</p>;
  if (isLoading || !data) return <FullScreenLoader />;
  const rows = data.filter((r) => r.test_type === type);

  return (
    <div className="space-y-6" data-testid="labs-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">آزمایش‌های من</h1>
          <p className="mt-2 text-sm text-slate-500">نتایج TSH، FT4، Tg و Anti-Tg را ثبت کنید و روند آن‌ها را ببینید.</p>
        </div>
        <button onClick={() => setEditing({})} data-testid="lab-add-button"
          className="flex items-center justify-center gap-2 rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800">
          <Plus className="h-4 w-4" /> ثبت نتیجه
        </button>
      </div>
      <Tabs dir="rtl" value={type} onValueChange={setType}>
        <TabsList className="h-auto flex-wrap gap-1 rounded-full border border-slate-200 bg-white p-1">
          {Object.entries(LAB_TESTS).map(([k, t]) => (
            <TabsTrigger key={k} value={k} className={tabCls} data-testid={`lab-tab-${k}`}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base md:text-lg font-bold text-slate-800">{LAB_TESTS[type].full}</h2>
        <LabChart key={type} rows={rows} testId="lab-chart" />
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <LabTable rows={rows} onEdit={setEditing} onDelete={remove} testId="lab-table" />
      </section>
      {editing && <LabDialog initial={editing.id ? editing : null} defaultType={type} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}
