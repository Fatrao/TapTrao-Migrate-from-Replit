import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { AppShell } from "@/components/AppShell";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { register, registerPending, isAuthenticated } = useAuth();

  usePageTitle("Create Account");

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await register({ email, password, displayName: displayName || undefined });
      if (result?.needsLogin) {
        // Account created but auto-login failed — redirect to login page
        navigate("/login?registered=1");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg = err?.message || "Registration failed";
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
          Create Account
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          Save your compliance checks and trade data securely
        </p>
      </div>

      <div className="form-card" style={{ margin: "0 24px 20px", maxWidth: 420 }}>
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
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label>Company / Name <span style={{ color: "#999", fontWeight: 400 }}>(optional)</span></label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your company or name"
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 12 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={registerPending || !email || !password || password.length < 8}
            style={{
              background: "var(--sage)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              opacity: registerPending || !email || !password || password.length < 8 ? 0.5 : 1,
              width: "100%",
            }}
          >
            {registerPending ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "#888", marginTop: 16, textAlign: "center" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "none" }}>
            Log in
          </a>
        </p>
      </div>
    </AppShell>
  );
}
