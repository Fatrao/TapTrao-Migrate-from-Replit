import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { AppShell } from "@/components/AppShell";
import PromoCodeRedeem from "@/components/promo-code-redeem";

const REGIONS = [
  { value: "EU", label: "EU (Amsterdam)", flag: "\u{1F1EA}\u{1F1FA}", description: "GDPR-compliant EU data residency" },
  { value: "US", label: "US (Virginia)", flag: "\u{1F1FA}\u{1F1F8}", description: "US data residency" },
] as const;

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dataRegion, setDataRegion] = useState<"EU" | "US">("EU");
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
      const result = await register({ email, password, displayName: displayName || undefined, dataRegion });
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

  const selectedRegion = REGIONS.find(r => r.value === dataRegion)!;

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

          {/* Data Region Selector */}
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {t("register.dataRegionLabel", "Data Region")}
              <span style={{ fontSize: 11, color: "#999", fontWeight: 400 }}>
                ({t("register.dataRegionPermanent", "cannot be changed later")})
              </span>
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {REGIONS.map((region) => (
                <button
                  key={region.value}
                  type="button"
                  onClick={() => setDataRegion(region.value as "EU" | "US")}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "12px 8px",
                    borderRadius: 10,
                    border: dataRegion === region.value
                      ? "2px solid var(--sage)"
                      : "2px solid #e0e0e0",
                    background: dataRegion === region.value
                      ? "rgba(74, 124, 89, 0.06)"
                      : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{region.flag}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: dataRegion === region.value ? "var(--sage)" : "#555" }}>
                    {region.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#888", textAlign: "center", lineHeight: 1.3 }}>
                    {region.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Region confirmation banner */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", marginBottom: 16, borderRadius: 8,
            background: "rgba(74, 124, 89, 0.08)", border: "1px solid rgba(74, 124, 89, 0.15)",
            fontSize: 13, color: "#555",
          }}>
            <span style={{ fontSize: 16 }}>{selectedRegion.flag}</span>
            <span>{t("register.dataRegionInfo", { region: selectedRegion.label })}</span>
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
