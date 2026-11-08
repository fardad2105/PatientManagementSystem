import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FolderOpen } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { toFa } from "@/lib/date";
import { DOC_CATEGORIES } from "@/lib/ultrasound";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import { DocumentList } from "@/components/documents/DocumentList";
import UploadDialog from "@/components/documents/UploadDialog";

export default function Documents() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("all");
  const { data, isLoading } = useQuery({ queryKey: ["documents"], queryFn: () => api.get("/patient/documents").then((r) => r.data) });
  const { data: notes = [] } = useQuery({ queryKey: ["notes", "me"], queryFn: () => api.get("/patient/notes").then((r) => r.data) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["documents"] });
  const remove = async (id) => {
    try {
      await api.delete(`/patient/documents/${id}`);
      toast.success("فایل حذف شد");
      refresh();
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  if (isLoading || !data) return <FullScreenLoader />;
  const list = cat === "all" ? data : data.filter((d) => d.category === cat);
  return (
    <div className="space-y-6" data-testid="documents-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-extrabold text-slate-900"><FolderOpen className="h-7 w-7 text-blue-700" /> مدارک پزشکی</h1>
          <p className="mt-1 text-sm text-slate-500">{toFa(data.length)} فایل · جواب آزمایش‌ها، گزارش‌ها و تصاویر شما؛ پزشک معالج تخصیص‌یافته هم آن‌ها را می‌بیند</p>
        </div>
        <button onClick={() => setOpen(true)} data-testid="documents-upload-button"
          className="flex items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          <Upload className="h-4 w-4" /> بارگذاری فایل
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries({ all: "همه", ...DOC_CATEGORIES }).map(([k, l]) => (
          <button key={k} onClick={() => setCat(k)} data-testid={`documents-filter-${k}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${cat === k ? "bg-blue-700 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{l}</button>
        ))}
      </div>
      <DocumentList docs={list} fileUrl={(id) => `/patient/documents/${id}/file`} notes={notes} canWrite={false} onDelete={remove} />
      {open && <UploadDialog onClose={() => setOpen(false)} onDone={refresh} />}
    </div>
  );
}
