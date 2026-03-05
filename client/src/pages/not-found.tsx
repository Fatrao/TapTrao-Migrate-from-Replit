import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation("errors");

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ background: "var(--card)", borderRadius: 14, maxWidth: 400, width: "100%", margin: "0 16px", padding: 24 }}>
        <div style={{ display: "flex", marginBottom: 16, gap: 8, alignItems: "center" }}>
          <AlertCircle size={28} style={{ color: "var(--red)", flexShrink: 0 }} />
          <h1 style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 22, color: "var(--t1)" }}>{t("notFound.title")}</h1>
        </div>
        <p style={{ fontSize: 13, color: "var(--t2)" }}>
          {t("notFound.description")}
        </p>
      </div>
    </div>
  );
}
