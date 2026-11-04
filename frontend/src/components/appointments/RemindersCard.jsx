import { useQuery } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { api } from "@/lib/api";
import { formatJalali } from "@/lib/date";

export const RemindersList = ({ items }) => (
  <section className="rounded-2xl border border-amber-300/60 bg-amber-50 p-5" data-testid="reminders-card">
    <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900"><BellRing className="h-4 w-4" /> یادآور نوبت‌های نزدیک</h2>
    <ul className="mt-3 space-y-2">
      {items.map((a) => (
        <li key={a.id} className="text-sm text-amber-900" data-testid={`reminder-item-${a.id}`}>
          <span className="font-semibold">{a.title}</span> — {formatJalali(a.scheduled_at, true)}{a.location && ` · ${a.location}`}
        </li>
      ))}
    </ul>
  </section>
);

export const RemindersCard = () => {
  const { data = [] } = useQuery({ queryKey: ["reminders"], queryFn: () => api.get("/patient/reminders").then((r) => r.data), refetchInterval: 60_000 });
  return data.length ? <RemindersList items={data} /> : null;
};
