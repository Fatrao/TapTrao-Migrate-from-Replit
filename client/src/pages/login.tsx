import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { AppShell } from "@/components/AppShell";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { login, loginPending, isAuthenticated } = useAuth();

  usePageTitle("Log In");

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login({ email, password });
      // Get redirect URL from query params, default to /dashboard
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/dashboard";
      navigate(redirect);
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      // Try to extract server message from response
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.message || msg);
      } catch {
        setError(msg);
      }
    }
  };

  return (
    <AppShell contentClassName="content-area">
      <div className="green-hero-box" style={{ margin: "4px 24px 16px" }}>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
          Log In
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          Access your trades, documents, and compliance data
        </p>
      </div>

      <div className="form-card" style={{ margin: "0 24px 20px", maxWidth: 420 }}>
        {new URLSearchParams(window.location.search).get("registered") === "1" && (
          <div style={{ background: "rgba(107,144,128,0.12)", border: "1px solid var(--sage)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--sage)" }}>
            ✓ Account created successfully! Please log in.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 12 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loginPending || !email || !password}
            style={{
              background: "var(--sage)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              opacity: loginPending || !email || !password ? 0.5 : 1,
              width: "100%",
            }}
          >
            {loginPending ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "#888", marginTop: 16, textAlign: "center" }}>
          Don't have an account?{" "}
          <a href="/register" style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "none" }}>
            Create one free
          </a>
        </p>
      </div>
    </AppShell>
  );
}
