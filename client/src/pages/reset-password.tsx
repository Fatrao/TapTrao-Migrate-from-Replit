import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { AppShell } from "@/components/AppShell";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  usePageTitle("Reset Password");

  const token = new URLSearchParams(window.location.search).get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      let msg = err?.message || "Something went wrong";
      try {
        const parsed = JSON.parse(msg);
        msg = parsed.message || msg;
      } catch {}
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AppShell contentClassName="content-area">
        <div className="green-hero-box" style={{ margin: "4px 24px 16px" }}>
          <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
            Invalid Link
          </h1>
        </div>
        <div className="form-card" style={{ margin: "0 24px 20px", maxWidth: 420 }}>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
            This password reset link is invalid. Please request a new one.
          </p>
          <a href="/forgot-password" style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
            Request a new link
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell contentClassName="content-area">
      <div className="green-hero-box" style={{ margin: "4px 24px 16px" }}>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
          Reset Password
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          Choose a new password for your account
        </p>
      </div>

      <div className="form-card" style={{ margin: "0 24px 20px", maxWidth: 420 }}>
        {success ? (
          <div>
            <div style={{ background: "rgba(107,144,128,0.12)", border: "1px solid var(--sage)", borderRadius: 8, padding: "14px 16px", marginBottom: 16, fontSize: 13, color: "var(--sage)" }}>
              Your password has been reset successfully.
            </div>
            <a
              href="/login"
              style={{
                display: "block",
                background: "var(--sage)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "11px 24px",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              Go to Log In
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 12 }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              style={{
                background: "var(--sage)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "11px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                opacity: loading || !newPassword || !confirmPassword ? 0.5 : 1,
                width: "100%",
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
