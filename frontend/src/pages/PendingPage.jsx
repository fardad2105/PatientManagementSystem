import { Navigate, useNavigate } from "react-router-dom";
import { Hourglass, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { homeFor } from "@/lib/api";
import { FullScreenLoader } from "@/components/ProtectedRoute";

export default function PendingPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  if (user === null) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.status === "active") return <Navigate to={homeFor(user.role)} replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-sm" data-testid="pending-approval-card">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Hourglass className="h-8 w-8" />
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">حساب شما در انتظار تأیید است</h1>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600">
          {user.name} عزیز، ثبت‌نام شما با موفقیت انجام شد. برای حفظ امنیت اطلاعات سلامت، دسترسی به پرونده پس از بررسی و تأیید
          مدیر سامانه فعال می‌شود.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={refreshUser} data-testid="pending-refresh-button"
            className="flex items-center justify-center gap-2 rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition-colors">
            <RefreshCw className="h-4 w-4" /> بررسی دوباره
          </button>
          <button onClick={async () => { await logout(); navigate("/login"); }} data-testid="pending-logout-button"
            className="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
      </div>
    </div>
  );
}
