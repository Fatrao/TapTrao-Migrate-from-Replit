import { useState } from "react";
import { X, Shield } from "lucide-react";

export function InsuranceGapAlert() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("insurance_alert_dismissed") === "1"; } catch { return false; }
  });
  if (dismissed) return null;
  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem("insurance_alert_dismissed", "1"); } catch {}
  };
  return (
    <div
      data-testid="insurance-gap-alert"
      style={{
        background: "rgba(107,144,128,.06)",
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
          color: "#666", fontSize: 16, lineHeight: 1,
        }}
      >
        <X size={14} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Shield size={16} style={{ color: "var(--green)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
          Insurance gap — check your policy covers this trade
        </span>
      </div>

      <p style={{ fontSize: 12, color: "#555", lineHeight: 1.65, marginBottom: 12 }}>
        Standard cargo insurance (Institute Cargo Clauses A/B/C) covers physical
        loss and damage. It does NOT cover goods rejected at port due to regulatory
        non-compliance — which is a separate and common risk for agricultural and
        mineral commodities on African corridors.
      </p>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        background: "#f5f5f5", borderRadius: 6, padding: "10px 14px",
        fontFamily: "var(--fb)", fontSize: 11, marginBottom: 12,
      }}>
        <div>
          <div style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>NOT covered by standard policy:</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: "#555", lineHeight: 1.8 }}>
            <li>Regulatory rejection at border</li>
            <li>Phytosanitary detention and destruction</li>
            <li>EUDR non-compliance refusal</li>
            <li>Aflatoxin / contamination seizure</li>
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>Ask your insurer about:</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: "#555", lineHeight: 1.8 }}>
            <li>Trade disruption insurance</li>
            <li>Rejection / condemnation clause</li>
            <li>Commodity-specific contamination cover</li>
            <li>Political risk (for certain corridors)</li>
          </ul>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>
        This applies regardless of Incoterms. Even under CIF or CIP, the seller&apos;s
        insurance does not cover destination regulatory rejection.
      </p>
    </div>
  );
}
