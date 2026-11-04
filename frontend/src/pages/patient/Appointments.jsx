import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CalendarClock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, apiError } from "@/lib/api";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import AppointmentDialog from "@/components/appointments/AppointmentDialog";
import { RemindersCard } from "@/components/appointments/RemindersCard";

const tabCls = "rounded-full px-4 py-2 text-sm data-[state=active]:bg-teal-700 data-[state=active]:text-white";

export default function Appointments() {
  const qc = useQueryClient();
  const [scope, setScope] = useState("upcoming");
  const [editing, setEditing] = useState(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["appointments", scope],
    queryFn: () => api.get("/patient/appointments", { params: { scope } }).then((r) => r.data),
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["appointments"] });
    qc.invalidateQueries({ queryKey: ["reminders"] });
    qc.invalidateQueries({ queryKey: ["patient-dashboard"] });
  };
  if (error) return <p className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700" data-testid="appointments-error">{apiError(error)}</p>;
  const list = scope === "past" ? [...(data || [])].reverse() : data || [];

  return (
    <div className="space-y-6" data-testid="appointments-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">نوبت‌ها و یادآورها</h1>
          <p className="mt-2 text-sm text-slate-500">نوبت‌های پیگیری را ثبت کنید تا پیش از موعد یادآوری شوند.</p>
        </div>
        <button onClick={() => setEditing({})} data-testid="appointment-add-button"
          className="flex items-center justify-center gap-2 rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800">
          <Plus className="h-4 w-4" /> افزودن نوبت
        </button>
      </div>
      <RemindersCard />
      <Tabs dir="rtl" value={scope} onValueChange={setScope}>
        <TabsList className="h-auto gap-1 rounded-full border border-slate-200 bg-white p-1">
          <TabsTrigger value="upcoming" className={tabCls} data-testid="appointments-tab-upcoming">در پیش رو</TabsTrigger>
          <TabsTrigger value="past" className={tabCls} data-testid="appointments-tab-past">گذشته و بسته‌شده</TabsTrigger>
        </TabsList>
      </Tabs>
      {isLoading ? <FullScreenLoader /> : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center" data-testid="appointments-empty">
          <CalendarClock className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">نوبتی در این بخش وجود ندارد.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((a) => <AppointmentCard key={a.id} appt={a} onEdit={setEditing} onChanged={refresh} />)}
        </div>
      )}
      {editing && <AppointmentDialog initial={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={refresh} />}
    </div>
  );
}
