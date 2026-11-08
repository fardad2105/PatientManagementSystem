import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, PlayCircle, Image, Search, ShieldCheck, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toFa } from "@/lib/date";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import { CONTENT_TYPES } from "@/components/admin/EducationDialog";

export const TYPE_ICON = { article: BookOpen, video: PlayCircle, infographic: Image };
const TYPE_TONE = { article: "bg-blue-50 text-blue-700", video: "bg-rose-50 text-rose-600", infographic: "bg-amber-50 text-amber-600" };
const FILTERS = { all: "همه", ...CONTENT_TYPES };

const Card = ({ c }) => {
  const Icon = TYPE_ICON[c.content_type] || BookOpen;
  return (
    <Link to={`/patient/education/${c.id}`} data-testid={`library-item-${c.id}`}
      className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300">
      <div className="flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${TYPE_TONE[c.content_type]}`}><Icon className="h-5 w-5" /></span>
        {!c.viewed && <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white" data-testid={`library-new-${c.id}`}>جدید</span>}
      </div>
      <div className="flex-1">
        <p className="font-bold leading-relaxed text-slate-800">{c.title}</p>
        {c.summary && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.summary}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1 text-green-700"><ShieldCheck className="h-3.5 w-3.5" /> بازبینی: {c.reviewer_name}</span>
        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {toFa(c.view_count)} · {CONTENT_TYPES[c.content_type]}</span>
      </div>
    </Link>
  );
};

export default function Education() {
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["education-library"], queryFn: () => api.get("/patient/education").then((r) => r.data) });
  if (isLoading || !data) return <FullScreenLoader />;
  const list = data.filter((c) => (type === "all" || c.content_type === type) && (!q.trim() || `${c.title} ${c.summary || ""}`.includes(q.trim())));
  return (
    <div className="space-y-6" data-testid="education-library-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">آموزش</h1>
        <p className="mt-1 text-sm text-slate-500">فقط محتوایی که توسط متخصص بازبینی و منتشر شده نمایش داده می‌شود</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در مطالب آموزشی..." className="h-11 rounded-xl border-slate-200 bg-white pr-10" data-testid="library-search-input" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {Object.entries(FILTERS).map(([k, l]) => (
            <button key={k} onClick={() => setType(k)} data-testid={`library-filter-${k}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${type === k ? "bg-blue-700 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{l}</button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500" data-testid="library-empty">
          {data.length === 0 ? "هنوز محتوای آموزشی منتشر نشده است." : "موردی با این جستجو یافت نشد."}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((c) => <li key={c.id}><Card c={c} /></li>)}</ul>
      )}
    </div>
  );
}
