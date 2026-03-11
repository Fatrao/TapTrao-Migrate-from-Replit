import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ComplianceResult, EnhancedEudrData, ScenarioResult, RiskFactorSummary, EnhancedScoreBreakdown } from "@shared/schema";

const STEP_KEYS = ["step.geolocation", "step.evidence", "step.supplier", "step.riskSubmit"] as const;

const s = {
  page: { maxWidth: 780, margin: "0 auto", padding: "24px 16px" } as React.CSSProperties,
  card: { background: "var(--card)", borderRadius: 14, padding: "24px", marginBottom: 16 } as React.CSSProperties,
  heading: { fontFamily: "var(--fh)", fontSize: 20, fontWeight: 900, color: "var(--t1)", margin: "0 0 4px" } as React.CSSProperties,
  sub: { fontSize: 15, color: "var(--t3)", marginBottom: 20 } as React.CSSProperties,
  label: { fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)", marginBottom: 6, display: "block" } as React.CSSProperties,
  input: { width: "100%", padding: "10px 12px", background: "var(--card2)", border: "none", borderRadius: 8, color: "var(--t1)", fontSize: 15, outline: "none" } as React.CSSProperties,
  select: { width: "100%", padding: "10px 12px", background: "var(--card2)", border: "none", borderRadius: 8, color: "var(--t1)", fontSize: 15, outline: "none", appearance: "none" as const, WebkitAppearance: "none" as const } as React.CSSProperties,
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } as React.CSSProperties,
  field: { marginBottom: 12 } as React.CSSProperties,
  btnPrimary: { background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "var(--fb)", fontWeight: 600, fontSize: 15, cursor: "pointer" } as React.CSSProperties,
  btnSecondary: { background: "transparent", color: "var(--t2)", border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "var(--fb)", fontWeight: 600, fontSize: 15, cursor: "pointer" } as React.CSSProperties,
  btnDanger: { background: "var(--red)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "var(--fb)", fontWeight: 600, fontSize: 15, cursor: "pointer" } as React.CSSProperties,
  check: { width: 18, height: 18, marginRight: 8, verticalAlign: "middle", accentColor: "var(--blue)" } as React.CSSProperties,
};

type EudrDraft = {
  coordType: "point" | "polygon";
  lat: string;
  lng: string;
  polygonPoints: { lat: string; lng: string }[];
  plotCountryIso2: string;
  plotCountryValid: boolean | null;
  evidenceType: string;
  evidenceReference: string;
  evidenceDate: string;
  supplierName: string;
  supplierAddress: string;
  supplierRegNumber: string;
  sanctionsChecked: boolean;
  sanctionsClear: boolean | null;
  riskLevel: string;
  highRiskReason: string;
};

const emptyDraft: EudrDraft = {
  coordType: "point",
  lat: "", lng: "",
  polygonPoints: [{ lat: "", lng: "" }],
  plotCountryIso2: "",
  plotCountryValid: null,
  evidenceType: "",
  evidenceReference: "",
  evidenceDate: "",
  supplierName: "",
  supplierAddress: "",
  supplierRegNumber: "",
  sanctionsChecked: false,
  sanctionsClear: null,
  riskLevel: "standard",
  highRiskReason: "",
};

// ── Risk Dashboard Helpers ──

function bandColor(band: string | null): { bg: string; text: string } {
  switch (band) {
    case "negligible": return { bg: "rgba(74,222,128,0.15)", text: "#4ade80" };
    case "low": return { bg: "rgba(74,222,128,0.15)", text: "#22c55e" };
    case "medium": return { bg: "rgba(234,179,8,0.15)", text: "#eab308" };
    case "high": return { bg: "rgba(239,68,68,0.15)", text: "#ef4444" };
    default: return { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.5)" };
  }
}

function trendIcon(trend: string): string {
  return trend === "RISING" ? "\u2197" : trend === "DECLINING" ? "\u2198" : "\u2192";
}

function scoreBarColor(score: number): string {
  if (score < 25) return "#4ade80";
  if (score < 45) return "#22c55e";
  if (score < 70) return "#eab308";
  return "#ef4444";
}

function verdictColor(verdict: string): string {
  return verdict === "likely_pass" ? "#4ade80" : verdict === "likely_fail" ? "#ef4444" : "#eab308";
}

function impactColor(impact: string): string {
  return impact === "high" ? "#ef4444" : impact === "medium" ? "#eab308" : "#4ade80";
}

// ── Risk Intelligence Dashboard Component ──

function RiskDashboard({ data, band, checksRun, geoData }: {
  data: EnhancedEudrData;
  band: string | null;
  checksRun: any[];
  geoData?: any;
}) {
  const [showChecks, setShowChecks] = useState(false);
  const bd = data.breakdown;
  const bc = bandColor(band);

  const breakdownBars: { label: string; value: number; max: number }[] = [
    { label: "Deterministic checks", value: bd.deterministicBase, max: 35 },
    { label: `Country risk (${bd.countryRiskTier.toUpperCase()})`, value: bd.countryRiskPoints, max: 12 },
    { label: `Commodity (${bd.commodityRiskLabel})`, value: bd.commodityRiskPoints, max: 10 },
    { label: "Evidence freshness", value: bd.temporalDecayPoints, max: 10 },
    { label: "Data completeness", value: bd.completenessPoints, max: 15 },
    { label: `Geospatial (${(bd as any).geospatialSource || "none"})`, value: (bd as any).geospatialPoints ?? 0, max: 15 },
  ];

  const passed = checksRun.filter((c: any) => c.passed).length;
  const total = checksRun.length;

  return (
    <>
      {/* 1. Composite Score Card */}
      <div style={{ background: "linear-gradient(135deg, #0e4e45, #14574a, #1c6352)", borderRadius: 14, padding: "24px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
              Composite Risk Score
            </div>
            <div style={{ fontFamily: "var(--fh)", fontSize: 42, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
              {bd.compositeScore}
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }}>/100</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{
              display: "inline-block", padding: "5px 14px", borderRadius: 6,
              fontWeight: 700, fontSize: 13, textTransform: "uppercase",
              background: bc.bg, color: bc.text,
            }}>
              {(band || "").toUpperCase()}
            </span>
            <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              {trendIcon(data.trend)} {data.trend}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: 16, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.1)" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            width: `${bd.compositeScore}%`,
            background: scoreBarColor(bd.compositeScore),
            transition: "width 0.6s ease",
          }} />
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 8 }}>
          {data.trendReason}
        </div>
      </div>

      {/* 2. Score Breakdown */}
      <div style={s.card}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--t3)", marginBottom: 14 }}>
          Score Breakdown
        </div>
        {breakdownBars.map(bar => (
          <div key={bar.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--t2)", marginBottom: 4 }}>
              <span>{bar.label}</span>
              <span style={{ color: bar.value > 0 ? "#ef4444" : "var(--t3)", fontWeight: 600 }}>
                {bar.value}/{bar.max}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--card2)" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: bar.max > 0 ? `${Math.min(100, (bar.value / bar.max) * 100)}%` : "0%",
                background: bar.value === 0 ? "var(--t3)" : bar.value / bar.max > 0.5 ? "#ef4444" : "#eab308",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--card2)" }}>
          Raw total: {bd.rawSum}/97 {"\u2192"} Composite: {bd.compositeScore}/100
        </div>
      </div>

      {/* 2b. Geospatial Satellite Card */}
      {geoData && geoData.source !== "none" && (
        <div style={s.card}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--t3)", marginBottom: 14 }}>
            Satellite Deforestation Analysis
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              { label: "Total Loss", value: `${geoData.totalLossHa?.toFixed(1) ?? "—"} ha`, color: "var(--t1)" },
              { label: "Post-2020 Loss", value: `${geoData.lossAfterCutoff?.toFixed(1) ?? "0"} ha`,
                color: (geoData.lossAfterCutoff ?? 0) > 1 ? "#ef4444" : "#16a34a" },
              { label: "Active Alerts", value: String(geoData.alertCount ?? 0),
                color: (geoData.alertCount ?? 0) > 0 ? "#eab308" : "#16a34a" },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: "center", padding: "12px 8px", background: "var(--card2)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--fh)", color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
          {geoData.source === "gfw" && geoData.lossYearBreakdown?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {geoData.lossYearBreakdown.filter((yr: any) => yr.lossHa > 0).map((yr: any) => (
                <span key={yr.year} style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 12,
                  background: yr.year > 2020 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)",
                  color: yr.year > 2020 ? "#ef4444" : "var(--t3)",
                  fontWeight: yr.year > 2020 ? 600 : 400,
                }}>
                  {yr.year}: {yr.lossHa.toFixed(1)} ha
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--t3)" }}>
            Source: {geoData.source === "gfw" ? "Global Forest Watch (UMD/Hansen)" : "OpenEPI (basin aggregation)"}
            {" \u2022 "}Score impact: {(bd as any).geospatialPoints ?? 0}/15 points
          </div>
        </div>
      )}

      {/* 3. Top Risk Drivers */}
      {data.riskFactorsSummary.length > 0 && (
        <div style={s.card}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--t3)", marginBottom: 14 }}>
            Top Risk Drivers
          </div>
          {data.riskFactorsSummary.map((rf, i) => (
            <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < data.riskFactorsSummary.length - 1 ? "1px solid var(--card2)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                  padding: "2px 8px", borderRadius: 4,
                  background: `${impactColor(rf.impact)}22`,
                  color: impactColor(rf.impact),
                }}>
                  {rf.impact}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>{rf.factor}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 4, paddingLeft: 4 }}>{rf.detail}</div>
              <div style={{ fontSize: 13, color: "#4ade80", paddingLeft: 4 }}>
                {"\u2192"} {rf.remediation}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Scenario Simulation */}
      <div style={s.card}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--t3)", marginBottom: 14 }}>
          Compliance Scenario Simulation
        </div>
        <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 12 }}>
          Estimated approval probability under different inspection regimes
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {data.scenarios.map((sc) => {
            const vc = verdictColor(sc.verdict);
            return (
              <div key={sc.scenario} style={{
                background: "var(--card2)", borderRadius: 10, padding: 16,
                textAlign: "center",
                border: `1px solid ${vc}33`,
              }}>
                <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 8, minHeight: 30 }}>{sc.label}</div>
                <div style={{ fontFamily: "var(--fh)", fontSize: 32, fontWeight: 700, color: vc, lineHeight: 1 }}>
                  {sc.approvalProbability}%
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, marginTop: 6, textTransform: "uppercase",
                  color: vc,
                }}>
                  {sc.verdict === "likely_pass" ? "LIKELY PASS" : sc.verdict === "likely_fail" ? "AT RISK" : "UNCERTAIN"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Check Details (Collapsible) */}
      <div style={s.card}>
        <button
          onClick={() => setShowChecks(!showChecks)}
          style={{
            background: "none", border: "none", cursor: "pointer", width: "100%",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: 0, color: "var(--t1)",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--t3)" }}>
            Detailed Check Results — {passed}/{total} passed
          </span>
          <span style={{ fontSize: 16, color: "var(--t3)" }}>{showChecks ? "\u25B2" : "\u25BC"}</span>
        </button>
        {showChecks && (
          <div style={{ marginTop: 12 }}>
            {checksRun.map((c: any, i: number) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "8px 0",
                borderBottom: i < checksRun.length - 1 ? "1px solid var(--card2)" : "none",
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>
                  {c.passed ? "\u2705" : c.severity === "critical" ? "\u274C" : "\u26A0\uFE0F"}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: c.passed ? "var(--t2)" : c.severity === "critical" ? "#ef4444" : "#eab308" }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--t3)" }}>{c.detail}</div>
                  {!c.passed && c.fixSuggestion && (
                    <div style={{ fontSize: 12, color: "#4ade80", marginTop: 2 }}>{"\u2192"} {c.fixSuggestion}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Main EUDR Page ──

export default function EudrPage() {
  const { t } = useTranslation("eudr");
  const [, params] = useRoute("/eudr/:lookupId");
  const [, navigate] = useLocation();
  const lookupId = params?.lookupId;

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<EudrDraft>({ ...emptyDraft });
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [eudrId, setEudrId] = useState<string | null>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [assessing, setAssessing] = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const lookupQuery = useQuery<any>({
    queryKey: ["/api/lookups", lookupId],
    enabled: !!lookupId,
  });

  const eudrQuery = useQuery<any>({
    queryKey: ["/api/eudr", lookupId],
    enabled: !!lookupId,
  });

  useEffect(() => {
    if (eudrQuery.data) {
      setEudrId(eudrQuery.data.id);
      if (eudrQuery.data.status === "complete") {
        setStep(4);
      }
      const rec = eudrQuery.data;
      const coords = rec.plotCoordinates;
      setDraft((prev) => ({
        ...prev,
        coordType: coords?.type === "polygon" ? "polygon" : "point",
        lat: coords?.lat?.toString() || "",
        lng: coords?.lng?.toString() || "",
        polygonPoints: coords?.points?.length
          ? coords.points.map((p: any) => ({ lat: String(p.lat), lng: String(p.lng) }))
          : [{ lat: "", lng: "" }],
        plotCountryIso2: rec.plotCountryIso2 || "",
        plotCountryValid: rec.plotCountryValid ?? null,
        evidenceType: rec.evidenceType || "",
        evidenceReference: rec.evidenceReference || "",
        evidenceDate: rec.evidenceDate ? rec.evidenceDate.split("T")[0] : "",
        supplierName: rec.supplierName || "",
        supplierAddress: rec.supplierAddress || "",
        supplierRegNumber: rec.supplierRegNumber || "",
        sanctionsChecked: rec.sanctionsChecked || false,
        sanctionsClear: rec.sanctionsClear ?? null,
        riskLevel: rec.riskLevel || "standard",
        highRiskReason: rec.highRiskReason || "",
      }));
      if (rec.geospatialData && !geoData) {
        setGeoData(rec.geospatialData);
      }
    }
  }, [eudrQuery.data]);

  const lookup = lookupQuery.data;
  const resultJson = lookup?.resultJson as ComplianceResult | undefined;

  const initMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/eudr", {
        lookupId,
        commodityId: lookup?.commodityId,
        originIso2: resultJson?.origin?.iso2,
        destIso2: resultJson?.destination?.iso2,
      });
      return res.json();
    },
    onSuccess: (data: any) => setEudrId(data.id),
  });

  useEffect(() => {
    if (lookupId && !eudrId && !eudrQuery.isLoading && !eudrQuery.data) {
      initMutation.mutate();
    }
  }, [lookupId, eudrId, eudrQuery.isLoading, eudrQuery.data]);

  const saveDraft = useCallback(async (stepData: Partial<any>) => {
    if (!eudrId) return;
    setSaving(true);
    try {
      await apiRequest("PATCH", `/api/eudr/${eudrId}`, stepData);
    } catch (_e) {}
    setSaving(false);
  }, [eudrId]);

  const runAssessment = useCallback(async () => {
    if (!lookupId) return;
    setAssessing(true);
    try {
      const res = await apiRequest("POST", `/api/eudr/${lookupId}/assess`);
      const data = await res.json();
      setAssessmentData(data);
      if (data.enhanced?.autoRiskLevel) {
        setDraft(d => ({ ...d, riskLevel: data.enhanced.autoRiskLevel }));
      }
    } catch (_e) {}
    setAssessing(false);
  }, [lookupId]);

  const handleNext = async () => {
    if (step === 1) {
      const plotCoordinates = draft.coordType === "point"
        ? { type: "point", lat: parseFloat(draft.lat), lng: parseFloat(draft.lng) }
        : { type: "polygon", points: draft.polygonPoints.filter(p => p.lat && p.lng).map(p => ({ lat: parseFloat(p.lat), lng: parseFloat(p.lng) })) };

      const originIso2 = resultJson?.origin?.iso2?.toUpperCase() || "";
      const plotValid = draft.plotCountryIso2.toUpperCase() === originIso2;

      await saveDraft({
        plotCoordinates,
        plotCountryIso2: draft.plotCountryIso2,
        plotCountryValid: plotValid,
      });
      setDraft(prev => ({ ...prev, plotCountryValid: plotValid }));

      // Fire geospatial verification (non-blocking)
      setGeoLoading(true);
      apiRequest("POST", `/api/eudr/${lookupId}/geospatial`, {
        plotCoordinates,
        plotCountryIso2: draft.plotCountryIso2,
      }).then(async (res) => {
        const data = await res.json();
        setGeoData(data);
      }).catch(() => {}).finally(() => setGeoLoading(false));
    }
    if (step === 2) {
      await saveDraft({
        evidenceType: draft.evidenceType,
        evidenceReference: draft.evidenceReference,
        evidenceDate: draft.evidenceDate || null,
      });
    }
    if (step === 3) {
      await saveDraft({
        supplierName: draft.supplierName,
        supplierAddress: draft.supplierAddress,
        supplierRegNumber: draft.supplierRegNumber || null,
        sanctionsChecked: draft.sanctionsChecked,
        sanctionsClear: draft.sanctionsClear,
      });
      // Auto-trigger assessment when entering Step 4
      setStep(4);
      await runAssessment();
      return;
    }
    setStep(step + 1);
  };

  const canAdvance = (): boolean => {
    if (step === 1) {
      if (draft.coordType === "point") return !!(draft.lat && draft.lng && draft.plotCountryIso2);
      return draft.polygonPoints.filter(p => p.lat && p.lng).length >= 3 && !!draft.plotCountryIso2;
    }
    if (step === 2) return !!(draft.evidenceType && draft.evidenceReference);
    if (step === 3) return !!(draft.supplierName && draft.supplierAddress && draft.sanctionsChecked);
    return true;
  };

  const generateStatement = async () => {
    if (!eudrId) return;
    setGeneratingPdf(true);
    try {
      await saveDraft({ riskLevel: draft.riskLevel, highRiskReason: draft.highRiskReason || null });

      const res = await fetch(`/api/eudr/${eudrId}/generate-statement`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate statement");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EUDR-Statement.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ["/api/eudr", lookupId] });
    } catch (_e) {}
    setGeneratingPdf(false);
  };

  const isComplete = eudrQuery.data?.status === "complete";
  const enhanced: EnhancedEudrData | null = assessmentData?.enhanced || null;

  return (
    <AppShell>
      <div style={s.page}>
        <button data-testid="eudr-back" onClick={() => navigate(`/lookup?loadLookup=${lookupId}`)} style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: 15, marginBottom: 12 }}>
          {"\u2190"} {t("backToLookup")}
        </button>

        <h1 style={s.heading}>{t("title")}</h1>
        <p style={s.sub}>
          {t("regulationRef")}
          {resultJson && t("tradeContext", { commodity: resultJson.commodity?.name, origin: resultJson.origin?.countryName, destination: resultJson.destination?.countryName })}
        </p>

        {/* Step progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {STEP_KEYS.map((key, i) => {
            const num = i + 1;
            return (
              <div
                key={num}
                data-testid={`eudr-step-${num}`}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "8px 4px",
                  borderRadius: ".5rem",
                  background: step === num ? "var(--blue, #3B82F6)" : num < step ? "var(--green, #1B7340)" : "var(--s2, #232B3E)",
                  color: step >= num ? "#fff" : "var(--t3)",
                  fontSize: 15,
                  fontWeight: step === num ? 700 : 500,
                  cursor: num < step ? "pointer" : "default",
                  transition: "background .2s",
                }}
                onClick={() => num < step && setStep(num)}
              >
                {num}. {t(key)}
              </div>
            );
          })}
        </div>

        {/* Step 1: Geolocation */}
        {step === 1 && (
          <div style={s.card}>
            <h2 style={{ ...s.heading, fontSize: 16 }}>{t("geo.title")}</h2>
            <p style={s.sub}>{t("geo.subtitle")}</p>

            <div style={s.field}>
              <label style={s.label}>{t("geo.coordType")}</label>
              <div style={{ display: "flex", gap: 12 }}>
                {(["point", "polygon"] as const).map((ct) => (
                  <label key={ct} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t1)", fontSize: 15, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="coordType"
                      checked={draft.coordType === ct}
                      onChange={() => setDraft(d => ({ ...d, coordType: ct }))}
                      style={s.check}
                      data-testid={`eudr-coord-${ct}`}
                    />
                    {ct === "point" ? t("geo.singlePoint") : t("geo.polygon")}
                  </label>
                ))}
              </div>
            </div>

            {draft.coordType === "point" ? (
              <div style={s.row}>
                <div>
                  <label style={s.label}>{t("geo.latitude")}</label>
                  <input data-testid="eudr-lat" style={s.input} type="number" step="any" placeholder="-4.3250" value={draft.lat} onChange={e => setDraft(d => ({ ...d, lat: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>{t("geo.longitude")}</label>
                  <input data-testid="eudr-lng" style={s.input} type="number" step="any" placeholder="15.3222" value={draft.lng} onChange={e => setDraft(d => ({ ...d, lng: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div>
                {draft.polygonPoints.map((pt, i) => (
                  <div key={i} style={{ ...s.row, marginBottom: 8 }}>
                    <div>
                      <label style={s.label}>{t("geo.pointLat", { index: i + 1 })}</label>
                      <input style={s.input} type="number" step="any" value={pt.lat} onChange={e => {
                        const pts = [...draft.polygonPoints];
                        pts[i] = { ...pts[i], lat: e.target.value };
                        setDraft(d => ({ ...d, polygonPoints: pts }));
                      }} data-testid={`eudr-poly-lat-${i}`} />
                    </div>
                    <div>
                      <label style={s.label}>{t("geo.pointLng", { index: i + 1 })}</label>
                      <input style={s.input} type="number" step="any" value={pt.lng} onChange={e => {
                        const pts = [...draft.polygonPoints];
                        pts[i] = { ...pts[i], lng: e.target.value };
                        setDraft(d => ({ ...d, polygonPoints: pts }));
                      }} data-testid={`eudr-poly-lng-${i}`} />
                    </div>
                  </div>
                ))}
                <button style={{ ...s.btnSecondary, fontSize: 15, padding: "6px 12px" }} onClick={() => setDraft(d => ({ ...d, polygonPoints: [...d.polygonPoints, { lat: "", lng: "" }] }))} data-testid="eudr-add-point">
                  {t("geo.addPoint")}
                </button>
              </div>
            )}

            <div style={{ ...s.field, marginTop: 16 }}>
              <label style={s.label}>{t("geo.plotCountry")}</label>
              <input data-testid="eudr-plot-country" style={{ ...s.input, width: 100 }} maxLength={2} placeholder="GH" value={draft.plotCountryIso2} onChange={e => setDraft(d => ({ ...d, plotCountryIso2: e.target.value.toUpperCase() }))} />
              {draft.plotCountryValid === false && (
                <p style={{ color: "var(--red, #DC2626)", fontSize: 15, marginTop: 6 }}>
                  {t("geo.mismatchWarning", { originIso2: resultJson?.origin?.iso2 })}
                </p>
              )}
            </div>

            {/* Geospatial verification status */}
            {geoLoading && (
              <p style={{ fontSize: 13, color: "var(--t3, #888)", marginTop: 12 }}>
                Verifying plot against satellite deforestation data...
              </p>
            )}
            {geoData && geoData.source !== "none" && (
              <div style={{
                marginTop: 14, padding: "12px 16px",
                background: geoData.lossAfterCutoff > 1 ? "rgba(239,68,68,0.06)" : "rgba(74,222,128,0.06)",
                borderRadius: 10, fontSize: 13,
                border: `1px solid ${geoData.lossAfterCutoff > 1 ? "rgba(239,68,68,0.18)" : "rgba(74,222,128,0.18)"}`,
              }}>
                <div style={{ fontWeight: 600, color: "var(--t1, #1a1a1a)", marginBottom: 4, fontSize: 12 }}>
                  Satellite Verification ({geoData.source === "gfw" ? "Global Forest Watch" : "OpenEPI"})
                </div>
                <div style={{ color: "var(--t2, #555)" }}>
                  Total loss: {geoData.totalLossHa.toFixed(1)} ha
                  {geoData.lossAfterCutoff > 0 && ` | Post-2020: ${geoData.lossAfterCutoff.toFixed(1)} ha`}
                  {geoData.alertCount > 0 && ` | ${geoData.alertCount} active alert(s)`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Evidence */}
        {step === 2 && (
          <div style={s.card}>
            <h2 style={{ ...s.heading, fontSize: 16 }}>{t("evidence.title")}</h2>
            <p style={s.sub}>{t("evidence.subtitle")}</p>

            <div style={s.field}>
              <label style={s.label}>{t("evidence.type")}</label>
              <select data-testid="eudr-evidence-type" style={s.select} value={draft.evidenceType} onChange={e => setDraft(d => ({ ...d, evidenceType: e.target.value }))}>
                <option value="">{t("evidence.typePlaceholder")}</option>
                <option value="satellite_ref">{t("evidence.satelliteRef")}</option>
                <option value="third_party_cert">{t("evidence.thirdPartyCert")}</option>
                <option value="geo_database">{t("evidence.geoDatabase")}</option>
                <option value="other">{t("evidence.otherEvidence")}</option>
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label}>{t("evidence.reference")}</label>
              <input data-testid="eudr-evidence-ref" style={s.input} placeholder={t("evidence.referencePlaceholder")} value={draft.evidenceReference} onChange={e => setDraft(d => ({ ...d, evidenceReference: e.target.value }))} />
            </div>

            <div style={s.field}>
              <label style={s.label}>{t("evidence.date")}</label>
              <input data-testid="eudr-evidence-date" style={{ ...s.input, width: 200 }} type="date" value={draft.evidenceDate} onChange={e => setDraft(d => ({ ...d, evidenceDate: e.target.value }))} />
              {draft.evidenceDate && new Date(draft.evidenceDate) <= new Date("2020-12-31") && (
                <p style={{ color: "var(--red, #DC2626)", fontSize: 15, marginTop: 6 }}>
                  {t("evidence.dateWarning")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Supplier Verification */}
        {step === 3 && (
          <div style={s.card}>
            <h2 style={{ ...s.heading, fontSize: 16 }}>{t("supplier.title")}</h2>
            <p style={s.sub}>{t("supplier.subtitle")}</p>

            <div style={s.field}>
              <label style={s.label}>{t("supplier.name")}</label>
              <input data-testid="eudr-supplier-name" style={s.input} placeholder={t("supplier.namePlaceholder")} value={draft.supplierName} onChange={e => setDraft(d => ({ ...d, supplierName: e.target.value }))} />
            </div>

            <div style={s.field}>
              <label style={s.label}>{t("supplier.address")}</label>
              <input data-testid="eudr-supplier-address" style={s.input} placeholder={t("supplier.addressPlaceholder")} value={draft.supplierAddress} onChange={e => setDraft(d => ({ ...d, supplierAddress: e.target.value }))} />
            </div>

            <div style={s.field}>
              <label style={s.label}>{t("supplier.regNumber")}</label>
              <input data-testid="eudr-supplier-reg" style={s.input} placeholder={t("supplier.regPlaceholder")} value={draft.supplierRegNumber} onChange={e => setDraft(d => ({ ...d, supplierRegNumber: e.target.value }))} />
            </div>

            <div style={{ ...s.field, marginTop: 16, padding: "14px 16px", background: "var(--s2, #232B3E)", borderRadius: ".5rem" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--t1)", fontSize: 15, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={draft.sanctionsChecked}
                  onChange={e => setDraft(d => ({ ...d, sanctionsChecked: e.target.checked, sanctionsClear: e.target.checked ? true : null }))}
                  style={{ ...s.check, marginTop: 2 }}
                  data-testid="eudr-sanctions-check"
                />
                <span dangerouslySetInnerHTML={{ __html: t("supplier.sanctionsConfirm") }} />
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Risk Intelligence Dashboard */}
        {step === 4 && (
          <>
            <div style={s.card}>
              <h2 style={{ ...s.heading, fontSize: 16 }}>
                {isComplete ? t("risk.titleComplete") : t("risk.titleAssess")}
              </h2>
              <p style={s.sub}>
                {isComplete ? t("risk.subtitleComplete") : t("risk.subtitleAssess")}
              </p>

              {isComplete && (
                <div>
                  <div style={{ background: "var(--green, #1B7340)", borderRadius: ".75rem", padding: "16px 20px", color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{"\u2713"}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t("risk.statementGenerated")}</div>
                      <div style={{ fontSize: 15, opacity: 0.85 }}>
                        {t("risk.reference", { ref: (eudrQuery.data?.statementJson as any)?.reference || "\u2014" })}
                        {eudrQuery.data?.retentionUntil && ` | ${t("risk.retainedUntil", { date: eudrQuery.data.retentionUntil.split("T")[0] })}`}
                      </div>
                    </div>
                  </div>
                  <button data-testid="eudr-redownload" style={s.btnPrimary} onClick={generateStatement} disabled={generatingPdf}>
                    {generatingPdf ? t("risk.generating") : t("risk.redownload")}
                  </button>
                </div>
              )}
            </div>

            {/* Assessment Loading */}
            {assessing && (
              <div style={s.card}>
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--t3)" }}>
                  <div style={{ fontSize: 15, marginBottom: 8 }}>Running risk assessment...</div>
                  <div style={{ fontSize: 13, color: "var(--t4)" }}>Analyzing geolocation, evidence, supplier data, country risk, and commodity profile</div>
                </div>
              </div>
            )}

            {/* Risk Intelligence Dashboard */}
            {!assessing && enhanced && (
              <>
                <RiskDashboard
                  data={enhanced}
                  band={assessmentData?.band}
                  checksRun={assessmentData?.checksRun || []}
                  geoData={geoData}
                />

                {/* Override + Generate */}
                {!isComplete && (
                  <div style={s.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 13, color: "var(--t2)" }}>
                        Auto-classified as <strong style={{ color: draft.riskLevel === "high" ? "#ef4444" : draft.riskLevel === "low" ? "#4ade80" : "#eab308" }}>
                          {draft.riskLevel}
                        </strong> risk
                      </div>
                      <button
                        onClick={() => setOverrideMode(!overrideMode)}
                        style={{ ...s.btnSecondary, fontSize: 12, padding: "4px 12px", color: "var(--t3)" }}
                      >
                        {overrideMode ? "Cancel override" : "Override"}
                      </button>
                    </div>

                    {overrideMode && (
                      <div style={{ background: "var(--card2)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                          {(["low", "standard", "high"] as const).map((lvl) => (
                            <label key={lvl} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t1)", fontSize: 14, cursor: "pointer" }}>
                              <input
                                type="radio"
                                name="riskLevelOverride"
                                checked={draft.riskLevel === lvl}
                                onChange={() => setDraft(d => ({ ...d, riskLevel: lvl }))}
                                style={s.check}
                                data-testid={`eudr-risk-${lvl}`}
                              />
                              <span style={{
                                fontWeight: 600,
                                color: lvl === "low" ? "#4ade80" : lvl === "high" ? "#ef4444" : "#eab308",
                              }}>
                                {t(`risk.${lvl}`)}
                              </span>
                            </label>
                          ))}
                        </div>
                        {draft.riskLevel === "high" && (
                          <textarea
                            data-testid="eudr-high-risk-reason"
                            style={{ ...s.input, minHeight: 60, resize: "vertical", marginTop: 8 }}
                            placeholder={t("risk.highReasonPlaceholder")}
                            value={draft.highRiskReason}
                            onChange={e => setDraft(d => ({ ...d, highRiskReason: e.target.value }))}
                          />
                        )}
                      </div>
                    )}

                    <button
                      data-testid="eudr-generate-statement"
                      style={{
                        ...s.btnPrimary,
                        width: "100%",
                        opacity: (draft.riskLevel === "high" && !draft.highRiskReason) ? 0.5 : 1,
                        cursor: (draft.riskLevel === "high" && !draft.highRiskReason) ? "not-allowed" : "pointer",
                      }}
                      disabled={generatingPdf || (draft.riskLevel === "high" && !draft.highRiskReason)}
                      onClick={generateStatement}
                    >
                      {generatingPdf ? t("generate.generating") : t("generate.button")}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Fallback: legacy manual if no assessment */}
            {!assessing && !enhanced && !isComplete && (
              <div style={s.card}>
                <div style={s.field}>
                  <label style={s.label}>{t("risk.levelLabel")}</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["low", "standard", "high"] as const).map((lvl) => (
                      <label key={lvl} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t1)", fontSize: 15, cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="riskLevel"
                          checked={draft.riskLevel === lvl}
                          onChange={() => setDraft(d => ({ ...d, riskLevel: lvl }))}
                          style={s.check}
                          data-testid={`eudr-risk-${lvl}`}
                        />
                        <span style={{
                          fontWeight: 600,
                          color: lvl === "low" ? "var(--green, #1B7340)" : lvl === "high" ? "var(--red, #DC2626)" : "var(--amber, #F39C12)",
                        }}>
                          {t(`risk.${lvl}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {draft.riskLevel === "high" && (
                  <div style={s.field}>
                    <label style={s.label}>{t("risk.highReasonLabel")}</label>
                    <textarea
                      data-testid="eudr-high-risk-reason"
                      style={{ ...s.input, minHeight: 80, resize: "vertical" }}
                      placeholder={t("risk.highReasonPlaceholder")}
                      value={draft.highRiskReason}
                      onChange={e => setDraft(d => ({ ...d, highRiskReason: e.target.value }))}
                    />
                  </div>
                )}

                <button
                  data-testid="eudr-generate-statement"
                  style={{
                    ...s.btnPrimary,
                    opacity: (draft.riskLevel === "high" && !draft.highRiskReason) ? 0.5 : 1,
                    cursor: (draft.riskLevel === "high" && !draft.highRiskReason) ? "not-allowed" : "pointer",
                  }}
                  disabled={generatingPdf || (draft.riskLevel === "high" && !draft.highRiskReason)}
                  onClick={generateStatement}
                >
                  {generatingPdf ? t("generate.generating") : t("generate.button")}
                </button>
              </div>
            )}
          </>
        )}

        {/* Navigation buttons */}
        {!isComplete && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {step > 1 ? (
              <button data-testid="eudr-prev" style={s.btnSecondary} onClick={() => setStep(step - 1)}>
                {t("nav.previous")}
              </button>
            ) : <div />}
            {step < 4 && (
              <button
                data-testid="eudr-next"
                style={{ ...s.btnPrimary, opacity: canAdvance() ? 1 : 0.5, cursor: canAdvance() ? "pointer" : "not-allowed" }}
                disabled={!canAdvance() || saving}
                onClick={handleNext}
              >
                {saving ? t("nav.saving") : t("nav.next")}
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
