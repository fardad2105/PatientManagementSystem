import { formatJalali, toFa } from "@/lib/date";
import { CANCER_TYPE, GENDER, SURGERY_TYPE, TRI, label } from "@/lib/labels";

const Row = ({ title, value, testId }) => (
  <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-xs sm:text-sm text-slate-500">{title}</dt>
    <dd className="text-sm font-medium text-slate-800" data-testid={testId}>{value || "—"}</dd>
  </div>
);

const Section = ({ title, children, testId }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" data-testid={testId}>
    <h3 className="mb-2 text-base font-bold text-slate-800">{title}</h3>
    <dl>{children}</dl>
  </section>
);

export const PersonalSummary = ({ personal, prefix = "view" }) => {
  const p = personal || {};
  return (
    <Section title="اطلاعات فردی" testId={`${prefix}-personal-section`}>
      <Row title="نام و نام خانوادگی" value={[p.first_name, p.last_name].filter(Boolean).join(" ")} testId={`${prefix}-full-name`} />
      <Row title="تاریخ تولد" value={p.birth_date && formatJalali(p.birth_date)} testId={`${prefix}-birth-date`} />
      <Row title="جنسیت" value={p.gender && label(GENDER, p.gender)} />
      <Row title="تلفن" value={p.phone && toFa(p.phone)} />
      <Row title="شهر" value={p.city} />
      <Row
        title="تماس اضطراری"
        value={p.emergency_contact_name && `${p.emergency_contact_name} (${p.emergency_contact_relation || "—"}) — ${toFa(p.emergency_contact_phone || "")}`}
        testId={`${prefix}-emergency-contact`}
      />
    </Section>
  );
};

export const MedicalSummary = ({ medical, prefix = "view" }) => {
  const m = medical || {};
  return (
    <Section title="پرونده سرطان تیروئید (گزارش بیمار)" testId={`${prefix}-medical-section`}>
      <Row title="نوع سرطان" value={m.cancer_type && label(CANCER_TYPE, m.cancer_type)} testId={`${prefix}-cancer-type`} />
      <Row title="تاریخ تشخیص" value={m.diagnosis_date && formatJalali(m.diagnosis_date)} />
      <Row title="تاریخ جراحی" value={m.surgery_date && formatJalali(m.surgery_date)} testId={`${prefix}-surgery-date`} />
      <Row title="نوع جراحی" value={m.surgery_type && label(SURGERY_TYPE, m.surgery_type)} />
      <Row title="برداشتن غدد لنفاوی" value={m.lymph_node_dissection && label(TRI, m.lymph_node_dissection)} />
      <Row title="درمان با ید رادیواکتیو" value={m.rai_received && label(TRI, m.rai_received)} testId={`${prefix}-rai`} />
      <Row title="تعداد نوبت‌های ید درمانی" value={m.rai_sessions != null && toFa(m.rai_sessions)} />
      <Row title="آخرین ید درمانی" value={m.last_rai_date && formatJalali(m.last_rai_date)} />
      <Row title="مرحله‌بندی (طبق گزارش پزشک)" value={m.staging_text} />
      <Row title="بیماری‌های دیگر" value={m.other_conditions} />
      <Row title="حساسیت‌ها" value={m.allergies} />
      <Row title="آخرین به‌روزرسانی" value={m.updated_at && formatJalali(m.updated_at, true)} />
    </Section>
  );
};
