import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

/**
 * AuthGuard wraps protected routes.
 * If the user is not authenticated, redirects to /login?redirect=<currentPath>.
 * Shows nothing while auth state is loading.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location)}`);
    }
  }, [isLoading, isAuthenticated, location, navigate]);

  // While checking auth state, show nothing (prevents flash)
  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#eee9e0",
      }}>
        <div style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 18,
          color: "rgba(0,0,0,0.25)",
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
