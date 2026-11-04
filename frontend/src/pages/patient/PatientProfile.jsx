import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { FullScreenLoader } from "@/components/ProtectedRoute";
import PersonalForm from "@/components/profile/PersonalForm";
import MedicalForm from "@/components/profile/MedicalForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";

const tabCls = "rounded-full px-4 py-2 text-sm data-[state=active]:bg-teal-700 data-[state=active]:text-white";

export default function PatientProfile() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["patient-profile"], queryFn: () => api.get("/patient/profile").then((r) => r.data) });
  const onSaved = () => {
    qc.invalidateQueries({ queryKey: ["patient-profile"] });
    qc.invalidateQueries({ queryKey: ["patient-dashboard"] });
  };
  if (isLoading || !data) return <FullScreenLoader />;

  return (
    <div className="space-y-6" data-testid="patient-profile-page">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">پرونده من</h1>
        <p className="mt-2 text-sm text-slate-500">اطلاعات فردی و سابقه‌ی درمان سرطان تیروئید خود را ثبت و ویرایش کنید.</p>
      </div>
      <Tabs dir="rtl" defaultValue="personal" className="space-y-6">
        <TabsList className="h-auto flex-wrap gap-1 rounded-full bg-white p-1 border border-slate-200">
          <TabsTrigger value="personal" className={tabCls} data-testid="profile-tab-personal">اطلاعات فردی</TabsTrigger>
          <TabsTrigger value="medical" className={tabCls} data-testid="profile-tab-medical">پرونده سرطان تیروئید</TabsTrigger>
          <TabsTrigger value="security" className={tabCls} data-testid="profile-tab-security">امنیت حساب</TabsTrigger>
        </TabsList>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
          <TabsContent value="personal" className="mt-0"><PersonalForm initial={data.personal} onSaved={onSaved} /></TabsContent>
          <TabsContent value="medical" className="mt-0"><MedicalForm initial={data.medical} onSaved={onSaved} /></TabsContent>
          <TabsContent value="security" className="mt-0"><ChangePasswordForm /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
