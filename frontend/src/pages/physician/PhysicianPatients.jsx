import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatJalali, toFa } from "@/lib/date";
import { CANCER_TYPE, label } from "@/lib/labels";
import { FullScreenLoader } from "@/components/ProtectedRoute";

export default function PhysicianPatients() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["physician-patients"], queryFn: () => api.get("/physician/patients").then((r) => r.data) });
  if (isLoading || !data) return <FullScreenLoader />;
  const list = data.filter((p) => !q || p.name.includes(q) || p.email.includes(q.toLowerCase()));

  return (
    <div className="space-y-6" data-testid="physician-patients-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">بیماران من</h1>
          <p className="mt-2 text-sm text-slate-500">
            فقط بیمارانی که مدیر سامانه به شما تخصیص داده است نمایش داده می‌شوند ({toFa(data.length)} بیمار).
          </p>
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی نام یا ایمیل"
            className="h-11 rounded-full border-slate-200 bg-white pr-10" data-testid="physician-patient-search-input" />
        </div>
      </div>
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500" data-testid="physician-patients-empty">
          بیماری برای نمایش وجود ندارد.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((p) => (
            <li key={p.id}>
              <Link to={`/physician/patients/${p.id}`} data-testid={`physician-patient-row-${p.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-300">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><UserRound className="h-6 w-6" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{p.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {label(CANCER_TYPE, p.cancer_type)} · جراحی: {p.surgery_date ? formatJalali(p.surgery_date) : "—"}
                  </p>
                </div>
                <ChevronLeft className="h-5 w-5 text-slate-400 transition-transform group-hover:-translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
