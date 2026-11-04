import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { toFa } from "@/lib/date";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import { MedicalSummary, PersonalSummary } from "@/components/ProfileSummary";

export default function PhysicianPatientDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["physician-patient", id],
    queryFn: () => api.get(`/physician/patients/${id}`).then((r) => r.data),
    retry: false,
  });
  const back = (
    <Link to="/physician" className="inline-flex items-center gap-2 text-sm text-teal-700 hover:underline" data-testid="physician-back-link">
      <ArrowRight className="h-4 w-4" /> بازگشت به فهرست بیماران
    </Link>
  );
  if (isLoading) return <FullScreenLoader />;
  if (error) {
    return (
      <div className="space-y-4">
        {back}
        <p className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700" data-testid="physician-patient-error">{apiError(error)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="physician-patient-detail">
      {back}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900" data-testid="physician-patient-name">{data.patient.name}</h1>
          <p className="mt-2 text-sm text-slate-500" dir="ltr">{data.patient.email}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs text-slate-600">
          فقط مشاهده · تکمیل پرونده {toFa(data.completeness)}٪
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PersonalSummary personal={data.profile.personal} prefix="physician" />
        <MedicalSummary medical={data.profile.medical} prefix="physician" />
      </div>
    </div>
  );
}
