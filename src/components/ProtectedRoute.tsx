import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/contexts/AuthContext";
import { getRolePath, isProfileRole, type ProfileRole } from "@/lib/auth";

function AuthLoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f4f1] px-5 text-center">
      <div>
        <BrandMark />
        <p className="mt-8 text-sm font-semibold text-[#77736e]">Checking your FixPoint workspace...</p>
      </div>
    </main>
  );
}

export function ProtectedRoute({ children, requiredRole }: { children: ReactNode; requiredRole?: ProfileRole }) {
  const { session, profile, profileStatus, isLoading, isInitializingInvite, isInviteSession, signOut } = useAuth();
  const location = useLocation();
  const needsSignOut = Boolean(!isInitializingInvite && !isInviteSession && session && !isLoading && profileStatus !== "loading" && (!profile || !profile.is_active || !isProfileRole(profile.role)));

  useEffect(() => {
    if (needsSignOut) void signOut();
  }, [needsSignOut, signOut]);

  if (isInitializingInvite || isLoading || (session && profileStatus === "loading")) return <AuthLoadingState />;
  if (isInviteSession) return <Navigate to="/auth/complete-invite" replace />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (needsSignOut || !profile || !profile.is_active || !isProfileRole(profile.role)) return <AuthLoadingState />;

  if (requiredRole && profile.role !== requiredRole) {
    return <Navigate to={getRolePath(profile.role)} replace />;
  }

  return children;
}
