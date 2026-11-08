import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { toFa } from "@/lib/date";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import { MedicalSummary, PersonalSummary } from "@/components/ProfileSummary";
import MedicationCard from "@/components/meds/MedicationCard";
import LabChart from "@/components/labs/LabChart";
import LabTable from "@/components/labs/LabTable";
import { LAB_TESTS } from "@/lib/labels";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import { TargetsEditor } from "@/components/physician/TargetsEditor";
import { WeeklyAdherence } from "@/components/meds/WeeklyAdherence";
import { PhysicianRecords } from "@/components/physician/PhysicianRecords";
import { SymptomTrend } from "@/components/symptoms/SymptomTrend";

const useSub = (id, path) =>
  useQuery({ queryKey: ["physician-patient", id, path], queryFn: () => api.get(`/physician/patients/${id}/${path}`).then((r) => r.data), retry: false });

const ClinicalRecords = ({ id }) => {
  const meds = useSub(id, "medications");
  const labs = useSub(id, "labs");
  const appts = useSub(id, "appointments");
  const symptoms = useSub(id, "symptoms");
  return (
    <div className="space-y-4">
      <TargetsEditor patientId={id} />
      <PhysicianRecords patientId={id} />
      <WeeklyAdherence url={`/physician/patients/${id}/medications/week`} testId="physician-weekly-adherence" />
      <SymptomTrend entries={symptoms.data || []} testId="physician-symptom-trend" />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid="physician-appointments-section">
        <h3 className="mb-4 text-base font-bold text-slate-800">نوبت‌های پیگیری (ثبت بیمار)</h3>
        {(appts.data || []).length === 0 ? <p className="text-sm text-slate-500">نوبتی ثبت نشده است.</p> : (
          <div className="grid gap-3 lg:grid-cols-2">{appts.data.map((a) => <AppointmentCard key={a.id} appt={a} readOnly onEdit={() => {}} onChanged={() => {}} />)}</div>
        )}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid="physician-medications-section">
        <h3 className="mb-4 text-base font-bold text-slate-800">داروها (ثبت بیمار)</h3>
        {(meds.data || []).length === 0 ? <p className="text-sm text-slate-500">دارویی ثبت نشده است.</p> : (
          <div className="grid gap-3 lg:grid-cols-2">{meds.data.map((m) => <MedicationCard key={m.id} med={m} readOnly onEdit={() => {}} onChanged={() => {}} />)}</div>
        )}
      </section>
      {Object.entries(LAB_TESTS).map(([k, t]) => {
        const rows = (labs.data || []).filter((r) => r.test_type === k);
        return (
          <section key={k} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid={`physician-labs-${k}`}>
            <h3 className="mb-4 text-base font-bold text-slate-800">{t.full}</h3>
            {rows.length > 0 && <LabChart rows={rows} testId={`physician-lab-chart-${k}`} />}
            <LabTable rows={rows} readOnly testId={`physician-lab-table-${k}`} />
          </section>
        );
      })}
    </div>
  );
};

export default function PhysicianPatientDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["physician-patient", id],
    queryFn: () => api.get(`/physician/patients/${id}`).then((r) => r.data),
    retry: false,
  });
  const back = (
    <Link to="/physician/patients" className="inline-flex items-center gap-2 text-sm text-green-700 hover:underline" data-testid="physician-back-link">
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
      <ClinicalRecords id={id} />
    </div>
  );
}
