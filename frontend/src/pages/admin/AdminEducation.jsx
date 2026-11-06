import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Plus, Pencil, PlayCircle, Image } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { formatJalali, toFa } from "@/lib/date";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import EducationDialog, { CONTENT_STATUS, CONTENT_TYPES } from "@/components/admin/EducationDialog";

const STATUS_STYLE = { published: "bg-green-50 text-green-700", in_review: "bg-amber-50 text-amber-700", draft: "bg-slate-100 text-slate-600" };
const ICON = { article: BookOpen, video: PlayCircle, infographic: Image };

const Item = ({ c, onEdit, onDelete }) => {
  const Icon = ICON[c.content_type] || BookOpen;
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5" data-testid={`education-item-${c.id}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-800">{c.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {CONTENT_TYPES[c.content_type]} · {toFa(c.view_count)} بازدید
          {c.reviewer_name && <> · بازبین: {c.reviewer_name}{c.reviewed_at && ` (${formatJalali(c.reviewed_at)})`}</>}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[c.status]}`} data-testid={`education-status-${c.id}`}>{CONTENT_STATUS[c.status]}</span>
      <button onClick={() => onEdit(c)} aria-label="ویرایش" data-testid={`education-edit-${c.id}`} className="rounded-full bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"><Pencil className="h-4 w-4" /></button>
      <ConfirmDelete title={`حذف «${c.title}»؟`} onConfirm={() => onDelete(c.id)} testId={`education-delete-${c.id}`} />
    </li>
  );
};

export default function AdminEducation() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "education"], queryFn: () => api.get("/admin/education").then((r) => r.data) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const remove = async (id) => {
    try {
      await api.delete(`/admin/education/${id}`);
      toast.success("محتوا حذف شد");
      refresh();
    } catch (err) {
      toast.error(apiError(err));
    }
  };
  if (isLoading || !data) return <FullScreenLoader />;
  return (
    <div className="space-y-6" data-testid="admin-education-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">محتوای آموزشی</h1>
          <p className="mt-1 text-sm text-slate-500">{toFa(data.length)} محتوای آموزشی · هر محتوا پیش از انتشار باید توسط متخصص بازبینی شود</p>
        </div>
        <button onClick={() => setEditing({})} data-testid="education-add-button"
          className="flex items-center justify-center gap-2 rounded-full bg-purple-700 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-800">
          <Plus className="h-4 w-4" /> محتوای جدید
        </button>
      </div>
      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500" data-testid="education-empty">هنوز محتوایی ثبت نشده است.</div>
      ) : (
        <ul className="space-y-3">{data.map((c) => <Item key={c.id} c={c} onEdit={setEditing} onDelete={remove} />)}</ul>
      )}
      {editing && <EducationDialog initial={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}
