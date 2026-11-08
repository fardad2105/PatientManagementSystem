import { useQuery } from "@tanstack/react-query";
import { ScanLine, FolderOpen } from "lucide-react";
import { api } from "@/lib/api";
import { UltrasoundCard } from "@/components/ultrasound/UltrasoundCard";
import { DocumentList } from "@/components/documents/DocumentList";
import { NotesThread } from "@/components/notes/NotesThread";

const get = (url) => () => api.get(url).then((r) => r.data);

export const PhysicianRecords = ({ patientId }) => {
  const base = `/physician/patients/${patientId}`;
  const { data: us = [] } = useQuery({ queryKey: ["ultrasounds", patientId], queryFn: get(`${base}/ultrasounds`) });
  const { data: docs = [] } = useQuery({ queryKey: ["documents", patientId], queryFn: get(`${base}/documents`) });
  const { data: notes = [] } = useQuery({ queryKey: ["notes", patientId], queryFn: get(`${base}/notes`) });
  const fileUrl = (id) => `${base}/documents/${id}/file`;
  return (
    <div className="space-y-6" data-testid="physician-records">
      <section className="space-y-3 rounded-2xl border border-green-200 bg-white p-5">
        <NotesThread notes={notes} targetType="general" targetId={null} patientId={patientId} canWrite />
      </section>
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-800"><ScanLine className="h-5 w-5 text-blue-700" /> پیگیری سونوگرافی گردن</h3>
        {us.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500" data-testid="physician-us-empty">سونوگرافی ثبت نشده است.</p>
          : us.map((u) => <UltrasoundCard key={u.id} u={u} fileUrl={fileUrl} notes={notes} patientId={patientId} canWrite />)}
      </section>
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-800"><FolderOpen className="h-5 w-5 text-blue-700" /> مدارک پزشکی بیمار</h3>
        <DocumentList docs={docs} fileUrl={fileUrl} notes={notes} patientId={patientId} canWrite />
      </section>
    </div>
  );
};
