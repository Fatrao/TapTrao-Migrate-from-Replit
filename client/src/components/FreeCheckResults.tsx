/**
 * FreeCheckResults — Isolated, read-only compliance results for the
 * public (unauthenticated) free check page.
 *
 * Shows ONLY: risk badge, readiness score, duty estimate, demurrage estimate.
 * Zero upload, zero document lists, zero action buttons, zero trade workflow.
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { estimateDemurrageRange } from "@/lib/demurrage-utils";
import { translateCommodity } from "@/lib/commodity-i18n";
import type { ComplianceResult, ReadinessFactors } from "@shared/schema";

/* ── SHA-256 hash (self-contained, no import from Lookup) ── */
async function computeSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ── Evidence Hash (read-only) ── */
function EvidenceHash({ result }: { result: ComplianceResult }) {
  const [hash, setHash] = useState<string | null>(null);
  const [timestamp] = useState(() => new Date().toISOString());

  useEffect(() => {
    const stableObj = {
      commodity: result.commodity.id,
      origin: result.origin.id,
      destination: result.destination.id,
      triggers: result.triggers,
      requirements: result.requirements,
      afcftaEligible: result.afcftaEligible,
      timestamp,
    };
    computeSHA256(JSON.stringify(stableObj)).then(setHash);
  }, [result, timestamp]);

  if (!hash) return null;

  const year = new Date().getFullYear();
  const shortRef = `TT-${year}-${hash.substring(0, 6).toUpperCase()}`;

  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "rgba(109,184,154,0.8)" }}>
        {shortRef}
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "var(--t4)", wordBreak: "break-all", marginTop: 2 }}>
        sha256:{hash}
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "var(--t4)", marginTop: 2 }}>
        {new Date(timestamp).toLocaleString()}
      </p>
    </div>
  );
}

/* ── Readiness Score Banner (read-only) ── */
function ReadinessScoreBanner({
  score,
  verdict,
  summary,
  factors,
  primaryRiskFactor,
}: {
  score: number;
  verdict: "GREEN" | "AMBER" | "RED";
  summary: string;
  factors: ReadinessFactors;
  primaryRiskFactor: string;
}) {
  const { t } = useTranslation("lookup");
  const verdictStyles = {
    GREEN: { badgeBg: "rgba(109,184,154,0.2)", badgeBorder: "rgba(109,184,154,0.25)", badgeColor: "var(--sage)", label: t("readiness.lowRisk") },
    AMBER: { badgeBg: "rgba(234,179,8,0.12)", badgeBorder: "rgba(234,179,8,0.25)", badgeColor: "#eab308", label: t("readiness.attentionNeeded") },
    RED: { badgeBg: "rgba(239,68,68,0.12)", badgeBorder: "rgba(239,68,68,0.25)", badgeColor: "#ef4444", label: t("readiness.highRiskAction") },
  };

  const v = verdictStyles[verdict];

  const barColors: Record<string, string> = {
    regulatory_complexity: "#60a5fa",
    hazard_exposure: "#eab308",
    document_volume: "var(--t4)",
    trade_restriction: "#ef4444",
  };

  const factorRows = [
    { key: "regulatory_complexity", label: t("readiness.regulatoryRequirements"), penalty: factors.regulatory_complexity.penalty, max: factors.regulatory_complexity.max },
    { key: "hazard_exposure", label: t("readiness.productControls"), penalty: factors.hazard_exposure.penalty, max: factors.hazard_exposure.max },
    { key: "document_volume", label: t("readiness.documentVolume"), penalty: factors.document_volume.penalty, max: factors.document_volume.max },
    { key: "trade_restriction", label: t("readiness.tradeRestrictions"), penalty: factors.trade_restriction.penalty, max: factors.trade_restriction.max },
  ];

  return (
    <div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 12 }}>
        {t("readiness.title")}
      </div>
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "var(--fh)",
              fontWeight: 900,
              fontSize: "clamp(48px, 6vw, 64px)",
              letterSpacing: 0,
              color: "var(--t1)",
              lineHeight: 1,
            }}
          >
            {score}
          </div>
          <span
            style={{
              display: "inline-block",
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 4,
              background: v.badgeBg,
              border: `1px solid ${v.badgeBorder}`,
              color: v.badgeColor,
              width: "fit-content",
            }}
          >
            {v.label}
          </span>
          <p
            style={{
              fontSize: 15,
              color: "var(--t2)",
              lineHeight: 1.65,
              marginTop: 6,
              maxWidth: 260,
            }}
          >
            {summary}
          </p>
        </div>

        {/* Factor breakdown — blurred in free preview */}
        <div style={{ flex: 1, paddingLeft: 28, position: "relative" }}>
          <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }}>
            {factorRows.map((f) => {
              const pct = f.max > 0 ? (f.penalty / f.max) * 100 : 0;
              return (
                <div
                  key={f.key}
                  style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}
                >
                  <span style={{ width: 120, fontSize: 15, color: "var(--t2)", textAlign: "right", flexShrink: 0 }}>
                    {f.label}
                  </span>
                  <div style={{ flex: 1, height: 3, background: "rgba(0,0,0,0.07)", borderRadius: 2, position: "relative" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        borderRadius: 2,
                        background: barColors[f.key] || "var(--t4)",
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, width: 48, textAlign: "right", color: "var(--t3)", flexShrink: 0 }}>
                    {`${f.penalty}/${f.max}`}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: 12, fontWeight: 600, color: "var(--sage)",
              background: "#fff", padding: "4px 12px", borderRadius: 6,
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)",
            }}>
              Unlock breakdown with Shield
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function FreeCheckResults({ result }: { result: ComplianceResult }) {
  const { t, i18n } = useTranslation("lookup");
  const lang = i18n.language;

  const hasStopFlags = result.stopFlags && Object.keys(result.stopFlags).length > 0;
  const triggerCount = Object.values(result.triggers).filter(Boolean).length;
  const riskLevel = hasStopFlags ? "STOP" : triggerCount >= 3 ? "HIGH" : triggerCount >= 1 ? "MEDIUM" : "LOW";

  const riskInlineStyles: Record<string, React.CSSProperties> = {
    STOP: { background: "var(--rbg)", border: "1px solid var(--rbd)", color: "var(--red)" },
    HIGH: { background: "var(--rbg)", border: "1px solid var(--rbd)", color: "var(--red)" },
    MEDIUM: { background: "var(--abg)", border: "1px solid var(--abd)", color: "var(--amber)" },
    LOW: { background: "var(--gbg)", border: "1px solid var(--gbd)", color: "var(--green)" },
  };
  const riskLabels: Record<string, string> = {
    STOP: t("risk.tradeRestricted"),
    HIGH: t("risk.highRisk"),
    MEDIUM: t("risk.moderateRisk"),
    LOW: t("risk.lowRisk"),
  };

  const dkCard: React.CSSProperties = {
    background: "rgba(109,184,154,0.06)",
    borderRadius: 14,
    border: "1px solid rgba(109,184,154,0.2)",
    padding: "20px 24px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }} data-testid="section-free-check-result">
      {/* ── Title ── */}
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 22, color: "var(--t1)", margin: "0 0 6px" }}>
          {t("result.preShipmentReport")}
        </h2>
        <p style={{ fontSize: 15, color: "var(--t2)", margin: 0 }}>
          {"📦"} {translateCommodity(result.commodity.name, lang)} › {result.origin.countryName} › {result.destination.countryName}
        </p>
      </div>

      {/* ── Risk Level Badge ── */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Badge
          className="text-base px-6 py-2 no-default-hover-elevate no-default-active-elevate"
          style={{
            ...riskInlineStyles[riskLevel],
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            borderRadius: 4,
          }}
          data-testid="badge-risk-level"
        >
          {riskLabels[riskLevel]}
        </Badge>
      </div>

      {/* ── Readiness Score + Duty Estimate (two-column) ── */}
      <div className="lookup-score-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Readiness Score */}
        <div style={dkCard}>
          {result.readinessScore ? (
            <ReadinessScoreBanner
              score={result.readinessScore.score}
              verdict={result.readinessScore.verdict}
              summary={result.readinessScore.summary}
              factors={result.readinessScore.factors}
              primaryRiskFactor={result.readinessScore.factors.primary_risk_factor}
            />
          ) : (
            <p style={{ fontSize: 15, color: "var(--t3)" }}>{t("readiness.unavailable")}</p>
          )}
        </div>

        {/* Duty Estimate — blurred values in free preview */}
        <div style={{ ...dkCard, position: "relative" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 12 }}>
            {t("duty.title")}
          </div>
          <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }}>
            {Array.isArray(result.destination.preferenceSchemes) && (result.destination.preferenceSchemes as string[]).length > 0 && (
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em",
                background: "rgba(109,184,154,0.2)", color: "var(--sage)",
                padding: "3px 8px", borderRadius: 4, display: "inline-block", marginBottom: 12,
              }}>
                {(result.destination.preferenceSchemes as string[]).join(" · ")}
              </span>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <span style={{ fontSize: 15, color: "var(--t2)" }}>{t("duty.vatImport")}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>{result.destination.vatRate}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <span style={{ fontSize: 15, color: "var(--t2)" }}>{t("duty.tariffSource")}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>{result.destination.tariffSource}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <span style={{ fontSize: 15, color: "var(--t2)" }}>{t("duty.spsRegime")}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>{result.destination.spsRegime || t("duty.standard")}</span>
            </div>
          </div>
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 20, display: "flex", justifyContent: "center",
          }}>
            <span style={{
              fontSize: 12, fontWeight: 600, color: "var(--sage)",
              background: "#fff", padding: "4px 12px", borderRadius: 6,
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.06)",
            }}>
              Unlock duty details with Shield
            </span>
          </div>
        </div>
      </div>

      {/* ── Demurrage Exposure Estimate ── */}
      {(() => {
        const estimate = estimateDemurrageRange(
          result.destination.iso2,
          result.readinessScore?.verdict || "AMBER",
        );
        if (!estimate) return (
          <div style={{ textAlign: "right", margin: "4px 0 8px" }}>
            <Link href="/demurrage">
              <span style={{ fontSize: 15, color: "var(--sage)", cursor: "pointer", fontWeight: 600 }}>
                {t("demurrage.calculatorLink")}
              </span>
            </Link>
          </div>
        );
        const verdictColor = result.readinessScore?.verdict === "RED" ? "#ef4444"
          : result.readinessScore?.verdict === "AMBER" ? "#d97706" : "var(--sage)";
        return (
          <div
            data-testid="demurrage-estimate-card"
            style={{
              ...dkCard,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18, marginTop: 1 }}>⚓</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: 0 }}>
                {t("demurrage.estimatedPortDemurrage")}
              </p>
              <p style={{ fontSize: 15, color: "var(--t2)", margin: "4px 0 0", lineHeight: 1.6 }}>
                At <strong style={{ color: "var(--t1)" }}>{estimate.port.label}</strong>
                {estimate.allPorts.length > 1 && (
                  <span style={{ color: "var(--t3)", fontSize: 15 }}> ({t("demurrage.morePorts", { count: estimate.allPorts.length - 1 })})</span>
                )}
                {t("demurrage.costExplanation")}
                <span style={{ color: verdictColor, fontWeight: 600 }}>{estimate.delayLabel}</span>
                {t("demurrage.basedOnReadiness")}
                <strong style={{ color: "var(--t1)" }}>${estimate.minCost.toLocaleString()} – ${estimate.maxCost.toLocaleString()}</strong>.
              </p>
              <Link href="/demurrage">
                <span style={{ fontSize: 15, color: "var(--sage)", cursor: "pointer", fontWeight: 600, marginTop: 4, display: "inline-block" }}>
                  {t("demurrage.openFullCalculator", { count: estimate.allPorts.length, plural: estimate.allPorts.length !== 1 ? "s" : "" })}
                </span>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* ── Conversion banner ── */}
      <div style={{
        ...dkCard,
        background: "linear-gradient(135deg, rgba(109,184,154,0.1), rgba(109,184,154,0.06))",
        border: "1px solid rgba(109,184,154,0.15)",
        textAlign: "center",
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", fontFamily: "'Clash Display', sans-serif", margin: "0 0 8px" }}>
          {t("conversion.activateShield")}
        </h3>
        <p style={{ fontSize: 15, color: "var(--t2)", lineHeight: 1.6, margin: "0 0 12px" }}>
          {t("conversion.activateDescription")}
        </p>
        <Link href="/pricing">
          <button
            style={{
              background: "var(--sage)",
              color: "#fff",
              borderRadius: 10,
              border: "none",
              padding: "10px 24px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {t("conversion.viewShield")}
          </button>
        </Link>
      </div>
    </div>
  );
}
