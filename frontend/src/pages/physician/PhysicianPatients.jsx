import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toFa } from "@/lib/date";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import { OptionSelect } from "@/components/Field";
import { PatientRow } from "@/components/physician/PatientRow";

const FILTERS = { all: "همه", out: "خارج از محدوده", in: "در محدوده", none: "محدوده تعیین نشده" };
const match = (p, f) => {
  if (f === "out") return p.out_of_range.length > 0;
  const hasTarget = p.latest_labs.some((x) => x.target);
  if (f === "in") return p.out_of_range.length === 0 && hasTarget;
  if (f === "none") return !hasTarget;
  return true;
};

export default function PhysicianPatients() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const { data, isLoading } = useQuery({ queryKey: ["physician-patients"], queryFn: () => api.get("/physician/patients").then((r) => r.data) });
  if (isLoading || !data) return <FullScreenLoader />;
  const list = data.filter((p) => (!q || p.name.includes(q) || p.email.includes(q.toLowerCase())) && match(p, filter));

  return (
    <div className="space-y-6" data-testid="physician-patients-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">بیماران من</h1>
        <p className="mt-1 text-sm text-slate-500">{toFa(data.length)} بیمار فعال · فقط بیماران تخصیص‌یافته توسط مدیر سامانه</p>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی بیمار..."
            className="h-11 rounded-xl border-slate-200 bg-white pr-10" data-testid="physician-patient-search-input" />
        </div>
        <div className="w-44"><OptionSelect value={filter} onChange={setFilter} options={FILTERS} testId="physician-patient-filter" /></div>
      </div>
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500" data-testid="physician-patients-empty">بیماری برای نمایش وجود ندارد.</div>
      ) : (
        <ul className="space-y-3">{list.map((p) => <li key={p.id}><PatientRow p={p} /></li>)}</ul>
      )}
    </div>
  );
}
