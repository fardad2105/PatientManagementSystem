import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import { PatientRow } from "@/components/physician/PatientRow";

export default function PhysicianAlerts() {
  const { data, isLoading } = useQuery({ queryKey: ["physician-alerts"], queryFn: () => api.get("/physician/alerts").then((r) => r.data) });
  if (isLoading || !data) return <FullScreenLoader />;
  return (
    <div className="space-y-6" data-testid="physician-alerts-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">هشدارهای درمانی</h1>
        <p className="mt-1 text-sm text-slate-500">آخرین مقدار ثبت‌شده‌ی این بیماران خارج از محدوده‌ای است که شما تعیین کرده‌اید. این فهرست فقط مقایسه‌ی عددی است و تفسیر یا توصیه‌ای ندارد.</p>
      </div>
      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500" data-testid="physician-alerts-empty">هشداری وجود ندارد.</div>
      ) : (
        <ul className="space-y-3">{data.map((p) => <li key={p.id}><PatientRow p={p} highlight /></li>)}</ul>
      )}
    </div>
  );
}
