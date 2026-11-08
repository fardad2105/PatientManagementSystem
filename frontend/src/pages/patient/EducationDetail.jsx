import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Eye, ExternalLink } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { formatJalali, toFa } from "@/lib/date";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import { CONTENT_TYPES } from "@/components/admin/EducationDialog";
import { TYPE_ICON } from "@/pages/patient/Education";

const Media = ({ type, url }) => {
  if (!url) return null;
  if (type === "infographic" && /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url)) {
    return <img src={url} alt="" className="w-full rounded-2xl border border-slate-200" data-testid="education-detail-image" />;
  }
  if (type === "video" && /\.(mp4|webm)(\?.*)?$/i.test(url)) {
    return <video src={url} controls className="w-full rounded-2xl bg-black" data-testid="education-detail-video" />;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" data-testid="education-detail-media-link"
      className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
      <ExternalLink className="h-4 w-4" /> مشاهده {CONTENT_TYPES[type]}
    </a>
  );
};

export default function EducationDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: c, isLoading, error } = useQuery({ queryKey: ["education-item", id], queryFn: () => api.get(`/patient/education/${id}`).then((r) => r.data) });
  useEffect(() => {
    if (!c) { return; }
    qc.invalidateQueries({ queryKey: ["education-unread"] });
    qc.invalidateQueries({ queryKey: ["education-library"] });
  }, [c, qc]);

  const back = (
    <Link to="/patient/education" className="inline-flex items-center gap-2 text-sm text-blue-700 hover:underline" data-testid="education-back-link">
      <ArrowRight className="h-4 w-4" /> بازگشت به آموزش
    </Link>
  );
  if (error) return <div className="space-y-4">{back}<p className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700" data-testid="education-detail-error">{apiError(error)}</p></div>;
  if (isLoading || !c) return <FullScreenLoader />;
  const Icon = TYPE_ICON[c.content_type];
  return (
    <article className="space-y-5" data-testid="education-detail-page">
      {back}
      <header className="rounded-3xl bg-gradient-to-l from-blue-600 to-blue-800 p-6 sm:p-8 text-white">
        <p className="flex items-center gap-2 text-sm text-blue-100"><Icon className="h-4 w-4" /> {CONTENT_TYPES[c.content_type]}</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold leading-relaxed" data-testid="education-detail-title">{c.title}</h1>
        {c.summary && <p className="mt-2 text-sm text-blue-50/90">{c.summary}</p>}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1" data-testid="education-detail-reviewer"><ShieldCheck className="h-3.5 w-3.5" /> بازبینی‌شده توسط {c.reviewer_name}{c.reviewed_at && ` · ${formatJalali(c.reviewed_at)}`}</span>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1" data-testid="education-detail-views"><Eye className="h-3.5 w-3.5" /> {toFa(c.view_count)} بازدید</span>
        </div>
      </header>
      <Media type={c.content_type} url={c.media_url} />
      {c.body && <div className="whitespace-pre-line rounded-2xl border border-slate-200 bg-white p-6 text-[15px] leading-8 text-slate-700" data-testid="education-detail-body">{c.body}</div>}
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">این محتوا جنبه‌ی آموزشی دارد و جایگزین نظر پزشک معالج شما نیست.</p>
    </article>
  );
}
