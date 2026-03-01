import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { AppShell } from "@/components/AppShell";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  usePageTitle("Forgot Password");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell contentClassName="content-area">
      <div className="green-hero-box" style={{ margin: "4px 24px 16px" }}>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
          Forgot Password
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          Enter your email to receive a password reset link
        </p>
      </div>

      <div className="form-card" style={{ margin: "0 24px 20px", maxWidth: 420 }}>
        {submitted ? (
          <div>
            <div style={{ background: "rgba(107,144,128,0.12)", border: "1px solid var(--sage)", borderRadius: 8, padding: "14px 16px", marginBottom: 16, fontSize: 13, color: "var(--sage)" }}>
              If an account with that email exists, we've sent a password reset link. Please check your inbox.
            </div>
            <p style={{ fontSize: 13, color: "#888", textAlign: "center" }}>
              <a href="/login" style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "none" }}>
                Back to Log In
              </a>
            </p>
          </div>
        ) : (
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

            {error && (
              <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 12 }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              style={{
                background: "var(--sage)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "11px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                opacity: loading || !email ? 0.5 : 1,
                width: "100%",
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p style={{ fontSize: 13, color: "#888", marginTop: 16, textAlign: "center" }}>
          Remember your password?{" "}
          <a href="/login" style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "none" }}>
            Log In
          </a>
        </p>
      </div>
    </AppShell>
  );
}
