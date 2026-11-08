import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquareText, Pencil } from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { api, apiError } from "@/lib/api";
import { formatJalali } from "@/lib/date";

const Note = ({ n, mine, onSaved }) => {
  const [edit, setEdit] = useState(false);
  const [body, setBody] = useState(n.body);
  const run = async (fn) => {
    try {
      await fn();
      setEdit(false);
      onSaved();
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  return (
    <li className="rounded-xl border border-green-100 bg-green-50/60 p-3 text-sm" data-testid={`note-${n.id}`}>
      <p className="mb-1 flex items-center justify-between gap-2 text-[11px] text-green-800">
        <span className="font-semibold">{n.physician_name} · {formatJalali(n.updated_at, true)}</span>
        {mine && !edit && (
          <span className="flex gap-1">
            <button onClick={() => setEdit(true)} aria-label="ویرایش" data-testid={`note-edit-${n.id}`} className="rounded p-1 hover:bg-green-100"><Pencil className="h-3.5 w-3.5" /></button>
            <ConfirmDelete title="حذف این یادداشت؟" onConfirm={() => run(() => api.delete(`/physician/notes/${n.id}`))} testId={`note-delete-${n.id}`} />
          </span>
        )}
      </p>
      {edit ? (
        <div className="space-y-2">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} className="bg-white" data-testid={`note-edit-input-${n.id}`} />
          <button onClick={() => run(() => api.put(`/physician/notes/${n.id}`, { body }))} disabled={!body.trim()} data-testid={`note-edit-save-${n.id}`}
            className="rounded-full bg-green-700 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50">ذخیره</button>
        </div>
      ) : <p className="whitespace-pre-line text-slate-700">{n.body}</p>}
    </li>
  );
};

export const NotesThread = ({ notes, targetType, targetId, patientId, canWrite }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const list = notes.filter((n) => n.target_type === targetType && (targetType === "general" || n.target_id === targetId));
  const refresh = () => qc.invalidateQueries({ queryKey: ["notes"] });
  const add = async () => {
    try {
      await api.post(`/physician/patients/${patientId}/notes`, { target_type: targetType, target_id: targetId, body });
      setBody("");
      toast.success("یادداشت ثبت شد");
      refresh();
    } catch (e) {
      toast.error(apiError(e));
    }
  };
  if (!canWrite && list.length === 0) return null;
  const tid = targetId || "general";
  return (
    <div className="space-y-2" data-testid={`notes-${tid}`}>
      <p className="flex items-center gap-1.5 text-xs font-bold text-green-800"><MessageSquareText className="h-4 w-4" /> یادداشت پزشک</p>
      {list.length > 0 && <ul className="space-y-2">{list.map((n) => <Note key={n.id} n={n} mine={canWrite && n.physician_id === user.id} onSaved={refresh} />)}</ul>}
      {canWrite && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="یادداشت شما برای بیمار..." className="min-h-[44px] flex-1 bg-white" data-testid={`note-input-${tid}`} />
          <button onClick={add} disabled={!body.trim()} data-testid={`note-add-${tid}`}
            className="shrink-0 rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50">ثبت یادداشت</button>
        </div>
      )}
    </div>
  );
};
