import "@/App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute, { FullScreenLoader } from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import PendingPage from "@/pages/PendingPage";
import PatientDashboard from "@/pages/patient/PatientDashboard";
import PatientProfile from "@/pages/patient/PatientProfile";
import Medications from "@/pages/patient/Medications";
import Labs from "@/pages/patient/Labs";
import Appointments from "@/pages/patient/Appointments";
import Appointments from "@/pages/patient/Appointments";
import PhysicianPatients from "@/pages/physician/PhysicianPatients";
import PhysicianPatientDetail from "@/pages/physician/PhysicianPatientDetail";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { homeFor } from "@/lib/api";

const Home = () => {
  const { user } = useAuth();
  if (user === null) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.status === "active" ? homeFor(user.role) : "/pending"} replace />;
};

const guarded = (roles, Page) => (
  <ProtectedRoute roles={roles}>
    <AppShell><Page /></AppShell>
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/patient" element={guarded(["patient"], PatientDashboard)} />
          <Route path="/patient/profile" element={guarded(["patient"], PatientProfile)} />
          <Route path="/patient/medications" element={guarded(["patient"], Medications)} />
          <Route path="/patient/labs" element={guarded(["patient"], Labs)} />
          <Route path="/patient/appointments" element={guarded(["patient"], Appointments)} />
          <Route path="/patient/appointments" element={guarded(["patient"], Appointments)} />
          <Route path="/physician" element={guarded(["physician"], PhysicianPatients)} />
          <Route path="/physician/patients/:id" element={guarded(["physician"], PhysicianPatientDetail)} />
          <Route path="/admin" element={guarded(["admin"], AdminDashboard)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors dir="rtl" toastOptions={{ style: { fontFamily: "Vazirmatn, sans-serif" } }} />
    </AuthProvider>
  );
}

export default App;
