import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { AppShell } from "@/components/AppShell";
import PromoCodeRedeem from "@/components/promo-code-redeem";

function DataRegionBanner() {
  const { t } = useTranslation("auth");
  const { data } = useQuery<{ region: string }>({
    queryKey: ["/api/region"],
    queryFn: async () => {
      const res = await fetch("/api/region");
      return res.json();
    },
    staleTime: Infinity,
  });
  const region = data?.region || "EU";
  const flag = region === "US" ? "\u{1F1FA}\u{1F1F8}" : "\u{1F1EA}\u{1F1FA}";
  const location = region === "US" ? "US (Virginia)" : "EU (Amsterdam)";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 14px", marginBottom: 16, borderRadius: 8,
      background: "rgba(74, 124, 89, 0.08)", border: "1px solid rgba(74, 124, 89, 0.15)",
      fontSize: 13, color: "#555",
    }}>
      <span style={{ fontSize: 18 }}>{flag}</span>
      <span>{t("register.dataRegionInfo", { region: location })}</span>
    </div>
  );
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { register, registerPending, isAuthenticated } = useAuth();
  const { t } = useTranslation("auth");

  usePageTitle(t("register.title"));

  // Preserve redirect URL through the auth flow
  const redirectUrl = new URLSearchParams(window.location.search).get("redirect") || "/dashboard";

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate(redirectUrl);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await register({ email, password, displayName: displayName || undefined });
      if (result?.needsLogin) {
        // Account created but auto-login failed — redirect to login page with redirect preserved
        navigate(`/login?registered=1${redirectUrl !== "/dashboard" ? `&redirect=${encodeURIComponent(redirectUrl)}` : ""}`);
      } else {
        navigate(redirectUrl);
      }
    } catch (err: any) {
      const msg = err?.message || t("register.registrationFailed");
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
          {t("register.title")}
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          {t("register.subtitle")}
        </p>
      </div>

      <div className="form-card" style={{ margin: "0 24px 20px", maxWidth: 420 }}>
        <DataRegionBanner />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("register.emailLabel")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("register.emailPlaceholder")}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>{t("register.passwordLabel")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("register.passwordPlaceholder")}
              required
              minLength={8}
            />
            {password.length > 0 && password.length < 8 && (
              <span style={{ fontSize: 12, color: "var(--amber)", marginTop: 4, display: "block" }}>
                {t("register.passwordMinLength")}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>{t("register.companyLabel")} <span style={{ color: "#999", fontWeight: 400 }}>{t("register.companyOptional")}</span></label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("register.companyPlaceholder")}
            />
          </div>

          {error && (
            <div style={{ fontSize: 15, color: "var(--red)", marginBottom: 12 }}>{error}</div>
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
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              opacity: registerPending || !email || !password || password.length < 8 ? 0.5 : 1,
              width: "100%",
            }}
          >
            {registerPending ? t("register.submitting") : t("register.submit")}
          </button>
        </form>

        <p style={{ fontSize: 15, color: "#888", marginTop: 16, textAlign: "center" }}>
          {t("register.hasAccount")}{" "}
          <a href={`/login${redirectUrl !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`} style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "none" }}>
            {t("register.logIn")}
          </a>
        </p>

        <div style={{ borderTop: "1px solid #eee", marginTop: 20, paddingTop: 20 }}>
          <PromoCodeRedeem />
        </div>
      </div>
    </AppShell>
  );
}
