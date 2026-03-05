import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Shield } from "lucide-react";

export function InsuranceGapAlert() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("insurance_alert_dismissed") === "1"; } catch { return false; }
  });
  const { t } = useTranslation("lcCheck");
  if (dismissed) return null;
  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem("insurance_alert_dismissed", "1"); } catch {}
  };
  return (
    <div
      data-testid="insurance-gap-alert"
      style={{
        background: "rgba(93,217,193,.06)",
        borderRadius: 14,
        padding: "14px 18px",
        marginBottom: 20,
        position: "relative",
      }}
    >
      <button
        data-testid="insurance-gap-dismiss"
        onClick={dismiss}
        style={{
          position: "absolute", top: 10, right: 12,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--app-regent)", fontSize: 16, lineHeight: 1,
        }}
      >
        <X size={14} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Shield size={16} style={{ color: "var(--app-acapulco)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--app-text-heading)" }}>
          {t("insurance.title")}
        </span>
      </div>

      <p style={{ fontSize: 14, color: "var(--app-regent)", lineHeight: 1.65, marginBottom: 12 }}>
        {t("insurance.body")}
      </p>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        background: "#f5f5f5", borderRadius: 6, padding: "10px 14px",
        fontFamily: "var(--fb)", fontSize: 13, marginBottom: 12,
      }}>
        <div>
          <div style={{ fontWeight: 600, color: "var(--app-text-heading)", marginBottom: 6 }}>{t("insurance.notCoveredTitle")}</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: "var(--app-regent)", lineHeight: 1.8 }}>
            <li>{t("insurance.notCovered1")}</li>
            <li>{t("insurance.notCovered2")}</li>
            <li>{t("insurance.notCovered3")}</li>
            <li>{t("insurance.notCovered4")}</li>
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "var(--app-text-heading)", marginBottom: 6 }}>{t("insurance.askInsurerTitle")}</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: "var(--app-regent)", lineHeight: 1.8 }}>
            <li>{t("insurance.askInsurer1")}</li>
            <li>{t("insurance.askInsurer2")}</li>
            <li>{t("insurance.askInsurer3")}</li>
            <li>{t("insurance.askInsurer4")}</li>
          </ul>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "var(--app-regent)", lineHeight: 1.5 }}>
        {t("insurance.incotermsNote")}
      </p>
    </div>
  );
}
