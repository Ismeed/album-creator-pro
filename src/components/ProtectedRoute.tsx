import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizerProfile } from "@/hooks/useOrganizerProfile";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

/**
 * Protects routes that require organizer authentication.
 * Redirects to login if not authenticated.
 * If requireVerification is true, also redirects to a verification-required page if not verified.
 */
export const ProtectedRoute = ({ children, requireVerification = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { data: organizer, isLoading: profileLoading } = useOrganizerProfile();
  const location = useLocation();

  const loading = authLoading || (user && profileLoading);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, but save the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If verification is required and user is not verified, redirect to verification page
  if (requireVerification && organizer && !organizer.is_verified) {
    return <Navigate to="/verify-email-required" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * Redirects authenticated users away from auth pages.
 * Used for login/signup pages.
 */
export const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Redirect to dashboard or the page they came from
    const from = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
