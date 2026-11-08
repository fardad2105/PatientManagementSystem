import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { NotesThread } from "@/components/notes/NotesThread";

export const GeneralNotesCard = () => {
  const { data: notes = [] } = useQuery({ queryKey: ["notes", "me"], queryFn: () => api.get("/patient/notes").then((r) => r.data) });
  if (!notes.some((n) => n.target_type === "general")) return null;
  return (
    <section className="rounded-2xl border border-green-200 bg-white p-5 sm:p-6" data-testid="general-notes-card">
      <NotesThread notes={notes} targetType="general" targetId={null} canWrite={false} />
    </section>
  );
};
