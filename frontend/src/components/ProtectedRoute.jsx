import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { homeFor } from "@/lib/api";

export const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="app-loader">
    <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
  </div>
);

export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === null) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.status !== "active") return <Navigate to="/pending" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
