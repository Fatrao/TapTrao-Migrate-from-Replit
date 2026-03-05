import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";
import { AppShell } from "@/components/AppShell";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation("auth");

  usePageTitle(t("resetPassword.title"));

  const token = new URLSearchParams(window.location.search).get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("resetPassword.passwordsMismatch"));
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      let msg = err?.message || t("resetPassword.errorDefault");
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
            {t("resetPassword.invalidLinkTitle")}
          </h1>
        </div>
        <div className="form-card" style={{ margin: "0 24px 20px", maxWidth: 420 }}>
          <p style={{ fontSize: 15, color: "#888", marginBottom: 16 }}>
            {t("resetPassword.invalidLinkMessage")}
          </p>
          <a href="/forgot-password" style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "none", fontSize: 15 }}>
            {t("resetPassword.requestNewLink")}
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell contentClassName="content-area">
      <div className="green-hero-box" style={{ margin: "4px 24px 16px" }}>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
          {t("resetPassword.title")}
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          {t("resetPassword.subtitle")}
        </p>
      </div>

      <div className="form-card" style={{ margin: "0 24px 20px", maxWidth: 420 }}>
        {success ? (
          <div>
            <div style={{ background: "rgba(14,78,69,0.12)", border: "1px solid var(--sage)", borderRadius: 8, padding: "14px 16px", marginBottom: 16, fontSize: 15, color: "var(--sage)" }}>
              {t("resetPassword.successMessage")}
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
                fontSize: 15,
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {t("resetPassword.goToLogin")}
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t("resetPassword.newPasswordLabel")}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("resetPassword.newPasswordPlaceholder")}
                required
                minLength={8}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>{t("resetPassword.confirmPasswordLabel")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div style={{ fontSize: 15, color: "var(--red)", marginBottom: 12 }}>{error}</div>
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
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                opacity: loading || !newPassword || !confirmPassword ? 0.5 : 1,
                width: "100%",
              }}
            >
              {loading ? t("resetPassword.submitting") : t("resetPassword.submit")}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
