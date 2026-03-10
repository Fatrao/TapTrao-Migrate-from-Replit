import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { AppShell } from "@/components/AppShell";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { login, loginPending, isAuthenticated } = useAuth();
  const { t } = useTranslation("auth");

  usePageTitle(t("login.title"));

  // Redirect if already logged in
  const redirectUrl = new URLSearchParams(window.location.search).get("redirect") || "/dashboard";
  if (isAuthenticated) {
    navigate(redirectUrl);
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
      const msg = err?.message || t("login.loginFailed");
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
          {t("login.title")}
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          {t("login.subtitle")}
        </p>
      </div>

      <div className="form-card" style={{ margin: "0 24px 20px", maxWidth: 420 }}>
        {new URLSearchParams(window.location.search).get("registered") === "1" && (
          <div style={{ background: "rgba(14,78,69,0.12)", border: "1px solid var(--sage)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 15, color: "var(--sage)" }}>
            ✓ {t("login.registeredSuccess")}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("login.emailLabel")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("login.emailPlaceholder")}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>{t("login.passwordLabel")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.passwordPlaceholder")}
              required
              minLength={8}
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: 4 }}>
            <a href="/forgot-password" style={{ fontSize: 15, color: "var(--sage)", textDecoration: "none" }}>
              {t("login.forgotPassword")}
            </a>
          </div>

          {error && (
            <div style={{ fontSize: 15, color: "var(--red)", marginBottom: 12 }}>{error}</div>
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
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              opacity: loginPending || !email || !password ? 0.5 : 1,
              width: "100%",
            }}
          >
            {loginPending ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <p style={{ fontSize: 15, color: "#888", marginTop: 16, textAlign: "center" }}>
          {t("login.noAccount")}{" "}
          <a href={`/register${redirectUrl !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`} style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "none" }}>
            {t("login.createOne")}
          </a>
        </p>
      </div>
    </AppShell>
  );
}
