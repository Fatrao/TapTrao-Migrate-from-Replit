import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ComplianceResult, EnhancedEudrData, ScenarioResult, RiskFactorSummary, EnhancedScoreBreakdown } from "@shared/schema";
import '../styles/eudr-step4.css';

const STEP_KEYS = ["step.geolocation", "step.evidence", "step.supplier", "step.riskSubmit"] as const;

// ── Form styles (steps 1-3) ──

const s = {
  page: { maxWidth: 780, margin: "0 auto", padding: "24px 16px" } as React.CSSProperties,
  card: { background: "var(--card)", borderRadius: 14, padding: "24px", marginBottom: 16, boxShadow: "var(--shd)" } as React.CSSProperties,
  heading: { fontFamily: "var(--fh)", fontSize: 20, fontWeight: 700, color: "var(--t1)", margin: "0 0 4px" } as React.CSSProperties,
  sub: { fontSize: 13, color: "var(--t3)", marginBottom: 20 } as React.CSSProperties,
  label: { fontFamily: "var(--fb)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "var(--t3)", marginBottom: 6, display: "block" } as React.CSSProperties,
  input: { width: "100%", padding: "10px 12px", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--t1)", fontSize: 14, outline: "none" } as React.CSSProperties,
  select: { width: "100%", padding: "10px 12px", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--t1)", fontSize: 14, outline: "none", appearance: "none" as const, WebkitAppearance: "none" as const } as React.CSSProperties,
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } as React.CSSProperties,
  field: { marginBottom: 12 } as React.CSSProperties,
  btnPrimary: { background: "var(--dark)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: "var(--fb)", fontWeight: 600, fontSize: 13, cursor: "pointer" } as React.CSSProperties,
  btnSecondary: { background: "var(--bg)", color: "var(--t2)", border: "none", borderRadius: 10, padding: "10px 24px", fontFamily: "var(--fb)", fontWeight: 500, fontSize: 13, cursor: "pointer" } as React.CSSProperties,
  btnDanger: { background: "var(--red)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "var(--fb)", fontWeight: 600, fontSize: 13, cursor: "pointer" } as React.CSSProperties,
  check: { width: 16, height: 16, marginRight: 8, verticalAlign: "middle" } as React.CSSProperties,
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

// ── Dashboard helpers ──

function bandConfig(band: string | null) {
  switch (band) {
    case "negligible": return { label: "NEGLIGIBLE", bg: "rgba(74,124,94,.2)", border: "rgba(74,124,94,.3)", text: "#6db89a", dot: "#6db89a" };
    case "low": return { label: "LOW RISK", bg: "rgba(196,136,42,.2)", border: "rgba(196,136,42,.3)", text: "#f0b060", dot: "#f0b060" };
    case "medium": return { label: "MEDIUM", bg: "rgba(196,136,42,.35)", border: "rgba(196,136,42,.45)", text: "#e09030", dot: "#e09030" };
    case "high": return { label: "HIGH RISK", bg: "rgba(196,78,58,.2)", border: "rgba(196,78,58,.3)", text: "#e06050", dot: "#e06050" };
    default: return { label: "\u2014", bg: "rgba(255,255,255,.1)", border: "rgba(255,255,255,.15)", text: "rgba(255,255,255,.5)", dot: "rgba(255,255,255,.3)" };
  }
}

function barStyle(value: number, max: number): { bg: string; scoreColor: string } {
  if (value === 0) return { bg: "#6db89a", scoreColor: "#4a7c5e" };
  const pct = max > 0 ? value / max : 0;
  if (pct <= 0.4) return { bg: "#6db89a", scoreColor: "#4a7c5e" };
  if (pct <= 0.65) return { bg: "#c4882a", scoreColor: "#c4882a" };
  return { bg: "#c44e3a", scoreColor: "#c44e3a" };
}

function scenarioStyle(verdict: string) {
  if (verdict === "likely_pass") return { bg: "#eef6f1", color: "#4a7c5e", barBg: "#6db89a" };
  if (verdict === "likely_fail") return { bg: "#fde8e6", color: "#c44e3a", barBg: "#c44e3a" };
  return { bg: "#fdf0d8", color: "#c4882a", barBg: "#c4882a" };
}

function factorDotColor(impact: string) {
  return impact === "high" ? "#c44e3a" : impact === "medium" ? "#c4882a" : "#6db89a";
}

function getInsightCallout(bd: EnhancedScoreBreakdown) {
  if (bd.commodityRiskCategory === "very_high") {
    return {
      highlight: `${bd.commodityRiskLabel} carries maximum commodity risk (${bd.commodityRiskPoints}/10) under EUDR.`,
      body: `This score is fixed regardless of your documentation \u2014 all ${bd.commodityRiskLabel.toLowerCase()} imports require enhanced supply chain traceability to offset this baseline exposure.`,
    };
  }
  if (bd.countryRiskTier === "high") {
    return {
      highlight: `Origin country classified as high-risk for deforestation.`,
      body: `This significantly increases scrutiny during customs inspection. Enhanced due diligence documentation is strongly recommended.`,
    };
  }
  return null;
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
  const [assessError, setAssessError] = useState<string | null>(null);
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

  // Fetch document extractions for auto-fill (supplier name from LC/invoice)
  const extractionsQuery = useQuery<any[]>({
    queryKey: ["/api/extractions"],
    enabled: !!lookupId,
  });

  useEffect(() => {
    if (eudrQuery.data) {
      setEudrId(eudrQuery.data.id);
      if (eudrQuery.data.status === "complete") {
        setStep(4);
        if (!assessmentData && !assessing) runAssessment();
      }
      const rec = eudrQuery.data;
      const coords = rec.plotCoordinates;
      // Auto-fill plot country from trade origin if not yet set
      const originIso2 = resultJson?.origin?.iso2 || "";
      setDraft((prev) => ({
        ...prev,
        coordType: coords?.type === "polygon" ? "polygon" : "point",
        lat: coords?.lat?.toString() || "",
        lng: coords?.lng?.toString() || "",
        polygonPoints: coords?.points?.length
          ? coords.points.map((p: any) => ({ lat: String(p.lat), lng: String(p.lng) }))
          : [{ lat: "", lng: "" }],
        plotCountryIso2: rec.plotCountryIso2 || originIso2,
        plotCountryValid: rec.plotCountryValid ?? null,
        evidenceType: rec.evidenceType || "",
        evidenceReference: rec.evidenceReference || "",
        evidenceDate: rec.evidenceDate ? rec.evidenceDate.split("T")[0] : "",
        supplierName: rec.supplierName || (() => {
          // Auto-fill from document extractions (beneficiaryName = supplier)
          for (const ext of (extractionsQuery.data || [])) {
            const f = ext.fields || {};
            if (f.beneficiaryName) return f.beneficiaryName;
            if (f.supplierName) return f.supplierName;
          }
          return "";
        })(),
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
    setAssessError(null);
    try {
      const res = await apiRequest("POST", `/api/eudr/${lookupId}/assess`);
      const data = await res.json();
      setAssessmentData(data);
      if (data.enhanced?.autoRiskLevel) {
        setDraft(d => ({ ...d, riskLevel: data.enhanced.autoRiskLevel }));
      }
    } catch (e: any) {
      setAssessError(e?.message || "Assessment failed. Please try again.");
    }
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
  const bd = enhanced?.breakdown;
  const bc = bandConfig(assessmentData?.band);

  // ── Render ──


  // Year bars ref for useEffect
  const yearBarsRef = useRef<HTMLDivElement>(null);

  // Build year bars via useEffect (from eudr-step4-v2.html script)
  const years: { year: number; lossHa: number }[] = geoData?.lossYearBreakdown || [];
  useEffect(() => {
    if (!yearBarsRef.current || years.length === 0) return;
    const container = yearBarsRef.current;
    container.innerHTML = '';
    const maxHa = Math.max(...years.map(d => d.lossHa), 0.1);
    years.forEach(d => {
      const pct = (d.lossHa / maxHa) * 100;
      const isPost = d.year >= 2021;
      const isHigh = d.lossHa > 15;
      const cls = isHigh ? 'hi' : (isPost ? 'post' : 'pre');
      const bar = document.createElement('div');
      bar.className = `eudr-yb ${cls}`;
      bar.style.height = `${Math.max(pct, 3)}%`;
      bar.title = `${d.year}: ${d.lossHa.toFixed(1)} ha`;
      container.appendChild(bar);
    });
  }, [years, step]);

  // Derived values for the dashboard
  const firstYear = years[0]?.year ?? 2001;
  const lastYear = years[years.length - 1]?.year ?? 2024;
  const insight = bd ? getInsightCallout(bd) : null;

  // Score breakdown rows
  const breakdownRows = bd ? [
    { label: "Regulatory checks", sub: null, value: bd.deterministicBase, max: 35, complete: false },
    { label: "Country risk", sub: `${resultJson?.origin?.countryName || bd.countryRiskTier} · ${bd.countryRiskTier.charAt(0).toUpperCase() + bd.countryRiskTier.slice(1)}`, value: bd.countryRiskPoints, max: 12, complete: false },
    { label: "Commodity risk", sub: `${bd.commodityRiskLabel} · ${bd.commodityRiskCategory === "very_high" ? "Max" : bd.commodityRiskCategory.charAt(0).toUpperCase() + bd.commodityRiskCategory.slice(1)}`, value: bd.commodityRiskPoints, max: 10, complete: false },
    { label: "Evidence freshness", sub: `${bd.evidenceAgeYears} yrs · ${Math.round(bd.evidenceFreshness * 100)}%`, value: bd.temporalDecayPoints, max: 10, complete: false },
    { label: "Data completeness", sub: bd.completenessPoints === 0 ? null : `${bd.missingFields.length} missing`, value: bd.completenessPoints, max: 15, complete: bd.completenessPoints === 0 },
    { label: "Geospatial", sub: `${bd.geospatialSource === "gfw" ? "GFW" : bd.geospatialSource === "openepi" ? "OpenEPI" : "None"} · ${bd.geospatialSource !== "none" ? "Plot verified" : "Unverified"}`, value: bd.geospatialPoints ?? 0, max: 15, complete: false },
  ] : [];

  // Step 4: Two-panel dashboard (rebuilt from eudr-step4-v2.html using CSS classes)
  if (step === 4) {
    return (
      <AppShell contentClassName="eudr-dashboard-shell">
        <div className="eudr-mn">

          {/* Loading state */}
          {assessing && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="eudr-card" style={{ padding: "40px 60px", textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 8 }}>Running risk assessment...</div>
                <div style={{ fontSize: 12, color: "var(--t4)" }}>Analyzing geolocation, evidence, supplier data, country risk, and commodity profile</div>
              </div>
            </div>
          )}

          {!assessing && assessError && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="eudr-card" style={{ padding: "40px 60px", textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "var(--red)", marginBottom: 8 }}>Assessment failed</div>
                <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 16 }}>{assessError}</div>
                <button onClick={runAssessment} className="eudr-btn-p">Retry Assessment</button>
              </div>
            </div>
          )}

          {!assessing && !assessError && enhanced && bd && (<>

          {/* hdr */}
          <div className="eudr-hdr">
            <div>
              <a className="eudr-back" onClick={() => navigate(`/trades/${lookupId}`)} data-testid="eudr-back">
                ← {t("backToLookup")}
              </a>
              <h1>{t("title")}</h1>
              <div className="eudr-sub">
                {resultJson
                  ? `EU Reg 2023/1115 — ${resultJson.commodity?.name} · ${resultJson.origin?.countryName} → ${resultJson.destination?.countryName}`
                  : t("regulationRef")}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 2 }}>
              <div className="eudr-step-nav">
                {STEP_KEYS.map((key, i) => {
                  const num = i + 1;
                  return (
                    <div
                      key={num}
                      className={`eudr-sp ${num < 4 ? "done" : num === 4 ? "active" : "pending"}`}
                      data-testid={`eudr-step-${num}`}
                      style={{ cursor: num < step ? "pointer" : "default" }}
                      onClick={() => num < step && setStep(num)}
                    >
                      {num}. {t(key)} {num < 4 ? "✓" : ""}
                    </div>
                  );
                })}
              </div>
              <button className="eudr-hbtn" onClick={() => navigate("/alerts")}>🔔</button>
              <button className="eudr-ntb" onClick={() => navigate("/new-check")}>+ New Trade</button>
            </div>
          </div>

          {/* Two panels */}
          <div className="eudr-panels">

            {/* LEFT PANEL */}
            <div className="eudr-pl">

              {/* Score */}
              <div className="eudr-card-score">
                <div className="eudr-sc-top">
                  <div>
                    <div className="eudr-sc-label">Trade Risk Score</div>
                    <div className="eudr-sc-band" style={{ background: bc.bg, borderColor: bc.border, color: bc.text }}>
                      <span className="eudr-sc-band-dot" style={{ background: bc.dot }} />
                      {bc.label}
                    </div>
                  </div>
                </div>
                <div className="eudr-sc-num">
                  <span className="eudr-sc-big">{bd.compositeScore}</span>
                  <span className="eudr-sc-denom">/100</span>
                </div>
                <div className="eudr-sc-trend">
                  <span className="eudr-sc-trend-pill">● {enhanced.trend}</span>
                  {enhanced.trendReason.length > 50 ? enhanced.trendReason.slice(0, 50) + "..." : enhanced.trendReason}
                </div>
                <div className="eudr-sc-divider" />
                <div className="eudr-sc-footer">
                  <span className="eudr-sc-art-label">Article 10 Classification</span>
                  <span className="eudr-sc-art-val">
                    {enhanced.autoRiskLevel === "low" ? "Low Risk" : enhanced.autoRiskLevel === "high" ? "High Risk" : "Standard Risk"}
                  </span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="eudr-card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div className="eudr-ct">Score Breakdown</div>
                <div className="eudr-bk-list">
                  {breakdownRows.map((bar) => {
                    const bs = barStyle(bar.value, bar.max);
                    const pct = bar.max > 0 ? Math.min(100, (bar.value / bar.max) * 100) : 0;
                    const colorClass = bs.scoreColor === "#4a7c5e" ? "good" : bs.scoreColor === "#c4882a" ? "warn" : bs.scoreColor === "#c44e3a" ? "bad" : "";
                    const barColorClass = bs.bg === "#6db89a" ? "eudr-b-green" : bs.bg === "#c4882a" ? "eudr-b-amber" : "eudr-b-red";
                    return (
                      <div className="eudr-bk-item" key={bar.label}>
                        <div className="eudr-bk-row">
                          <span className="eudr-bk-label">
                            {bar.label}
                            {bar.complete && <span className="eudr-complete-tag">✓ Complete</span>}
                            {bar.sub && !bar.complete && <span className="eudr-bk-sub">{bar.sub}</span>}
                          </span>
                          <span className={`eudr-bk-score ${colorClass}`}>
                            {bar.value}<span style={{ color: "var(--t4)", fontWeight: 400 }}>/{bar.max}</span>
                          </span>
                        </div>
                        <div className="eudr-bar-track">
                          <div
                            className={`eudr-bar-fill ${barColorClass}`}
                            style={{
                              width: bar.value === 0 ? "100%" : `${pct}%`,
                              opacity: bar.value === 0 ? 0.2 : 1,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="eudr-card-actions eudr-card">
                {isComplete ? (
                  <>
                    <div className="eudr-complete-banner">
                      <span className="eudr-complete-banner-icon">✓</span>
                      <div className="eudr-complete-banner-text">
                        <strong>Statement generated</strong>
                        {eudrQuery.data?.statementJson?.reference && (
                          <span style={{ fontWeight: 400, color: "var(--t3)", marginLeft: 6 }}>
                            Ref: {(eudrQuery.data.statementJson as any).reference}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="eudr-btn-p"
                      data-testid="eudr-redownload"
                      onClick={generateStatement}
                      disabled={generatingPdf}
                    >
                      {generatingPdf ? t("risk.generating") : "Re-download Statement"}
                    </button>
                  </>
                ) : (
                  <>
                    {overrideMode && (
                      <div className="eudr-override-panel">
                        <div className="eudr-override-radios">
                          {(["low", "standard", "high"] as const).map((lvl) => (
                            <label key={lvl} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, cursor: "pointer", fontWeight: 500, color: "var(--t2)" }}>
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
                                color: lvl === "low" ? "#4a7c5e" : lvl === "high" ? "#c44e3a" : "#c4882a",
                              }}>
                                {t(`risk.${lvl}`)}
                              </span>
                            </label>
                          ))}
                        </div>
                        {draft.riskLevel === "high" && (
                          <textarea
                            data-testid="eudr-high-risk-reason"
                            style={{ ...s.input, minHeight: 50, resize: "vertical", fontSize: 11 }}
                            placeholder={t("risk.highReasonPlaceholder")}
                            value={draft.highRiskReason}
                            onChange={e => setDraft(d => ({ ...d, highRiskReason: e.target.value }))}
                          />
                        )}
                        <button className="eudr-override-cancel" onClick={() => setOverrideMode(false)}>Cancel override</button>
                      </div>
                    )}
                    <button
                      className="eudr-btn-p"
                      data-testid="eudr-generate-statement"
                      onClick={generateStatement}
                      disabled={generatingPdf || (draft.riskLevel === "high" && !draft.highRiskReason)}
                      style={{
                        opacity: (draft.riskLevel === "high" && !draft.highRiskReason) ? 0.5 : 1,
                        cursor: (draft.riskLevel === "high" && !draft.highRiskReason) ? "not-allowed" : "pointer",
                      }}
                    >
                      {generatingPdf ? t("generate.generating") : "Submit Due Diligence Statement →"}
                    </button>
                    <button className="eudr-btn-s" onClick={generateStatement} disabled={generatingPdf}>
                      Export Report (PDF)
                    </button>
                    {!overrideMode && (
                      <button className="eudr-override-trigger" onClick={() => setOverrideMode(true)}>
                        Override risk classification
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>
            {/* end left */}

            {/* RIGHT PANEL */}
            <div className="eudr-pr">

              {/* Complete banner */}
              {isComplete && (
                <div className="eudr-complete-banner">
                  <span className="eudr-complete-banner-icon">✅</span>
                  <div className="eudr-complete-banner-text">
                    <strong>Due diligence statement generated successfully.</strong>{" "}
                    {eudrQuery.data?.retentionUntil && `Retained until ${eudrQuery.data.retentionUntil.split("T")[0]}.`}
                  </div>
                </div>
              )}

              {/* Commodity callout — surfaced insight */}
              {insight && (
                <div className="eudr-callout">
                  <span className="eudr-callout-icon">⚠</span>
                  <div className="eudr-callout-text">
                    <strong>{insight.highlight}</strong> {insight.body}
                  </div>
                </div>
              )}

              {/* Satellite Deforestation Analysis */}
              {geoData && geoData.source !== "none" && (
                <div className="eudr-card">
                  <div className="eudr-ct">Satellite Deforestation Analysis</div>
                  <div className="eudr-sat-meta">
                    <div className="eudr-sat-dot" />
                    {geoData.source === "gfw" ? "Global Forest Watch" : "OpenEPI"}
                    {geoData.bufferRadiusKm && ` · ${geoData.bufferRadiusKm} km buffer`}
                    {geoData.queriedAt && ` · queried ${new Date(geoData.queriedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                  </div>
                  <div className="eudr-sat-stats">
                    <div className="eudr-ss">
                      <div className="eudr-ss-val">{geoData.totalLossHa?.toFixed(1) ?? "—"}</div>
                      <div className="eudr-ss-unit">ha</div>
                      <div className="eudr-ss-lbl">Total loss {firstYear}–{lastYear}</div>
                    </div>
                    <div className={`eudr-ss${(geoData.lossAfterCutoff ?? 0) > 1 ? " flag" : ""}`}>
                      <div className="eudr-ss-val">{geoData.lossAfterCutoff?.toFixed(1) ?? "0"}</div>
                      <div className="eudr-ss-unit">{(geoData.lossAfterCutoff ?? 0) > 1 ? "ha" : "ha"}</div>
                      <div className="eudr-ss-lbl">Post-2020 loss {(geoData.lossAfterCutoff ?? 0) > 1 ? "↑ flagged" : ""}</div>
                    </div>
                    <div className="eudr-ss">
                      <div className="eudr-ss-val">{geoData.alertCount ?? 0}</div>
                      <div className="eudr-ss-unit">—</div>
                      <div className="eudr-ss-lbl">Active alerts</div>
                    </div>
                  </div>

                  {/* Year bar chart */}
                  {geoData.source === "gfw" && years.length > 0 && (
                    <>
                      <div className="eudr-yc-label">Annual tree cover loss (ha) · {firstYear}–{lastYear}</div>
                      <div className="eudr-yc-bars" ref={yearBarsRef} id="yearBars" />
                      <div className="eudr-yc-axis">
                        <span>{firstYear}</span>
                        {firstYear < 2005 && <span>2005</span>}
                        {firstYear < 2010 && <span>2010</span>}
                        {firstYear < 2015 && <span>2015</span>}
                        <span>2020</span>
                        <span>{lastYear}</span>
                      </div>
                      <div className="eudr-yc-legend">
                        <div className="eudr-ycl"><div className="eudr-ycl-sw" style={{ background: "var(--sage-pale)" }} /> Pre-2020</div>
                        <div className="eudr-ycl"><div className="eudr-ycl-sw" style={{ background: "var(--amber)" }} /> Post-2020 (EUDR cutoff)</div>
                        <div className="eudr-ycl"><div className="eudr-ycl-sw" style={{ background: "var(--red)" }} /> High loss year</div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Customs Inspection Scenarios */}
              <div className="eudr-card">
                <div className="eudr-ct">Customs Inspection Scenarios</div>
                <div className="eudr-sc-grid">
                  {(enhanced.scenarios || []).map((sc) => {
                    const verdictClass = sc.verdict === "likely_pass" ? "pass" : sc.verdict === "likely_fail" ? "fail" : "uncert";
                    return (
                      <div key={sc.scenario} className={`eudr-scn ${verdictClass}`}>
                        <div className="eudr-scn-type">
                          {sc.scenario === "standard" ? "Standard" : sc.scenario === "enhanced" ? "Enhanced" : "High-Risk"}
                        </div>
                        <div className="eudr-scn-pct">{sc.approvalProbability}<span className="eudr-scn-unit">%</span></div>
                        <div className="eudr-scn-bar"><div className="eudr-scn-bar-fill" style={{ width: `${sc.approvalProbability}%` }} /></div>
                        <div className="eudr-scn-verdict">
                          {sc.verdict === "likely_pass" ? "Likely to pass" : sc.verdict === "likely_fail" ? "At risk" : "Uncertain"}
                        </div>
                        <div className="eudr-scn-desc">{sc.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Risk Drivers */}
              {(enhanced.riskFactorsSummary || []).length > 0 && (
                <div className="eudr-card">
                  <div className="eudr-ct">Top Risk Drivers</div>
                  <div className="eudr-factors">
                    {(enhanced.riskFactorsSummary || []).map((rf, i) => {
                      const dotClass = rf.impact === "high" ? "h" : rf.impact === "medium" ? "m" : "l";
                      return (
                        <div className="eudr-factor" key={i}>
                          <div className={`eudr-f-dot ${dotClass}`} />
                          <div>
                            <div className="eudr-f-title">{rf.factor}</div>
                            <div className="eudr-f-detail">{rf.detail}</div>
                            <div className="eudr-f-remedy">→ {rf.remediation}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Compliance Checks */}
              <div className="eudr-card">
                <div className="eudr-ct">Compliance Checks</div>
                <div className="eudr-checks">
                  {(assessmentData?.checksRun || []).map((c: any, i: number) => {
                    const passed = c.passed;
                    const isCritical = !passed && c.severity === "critical";
                    const iconClass = passed ? "p" : isCritical ? "f" : "w";
                    const badgeClass = passed ? "eudr-b-pass" : isCritical ? "eudr-b-high" : "eudr-b-med";
                    return (
                      <div className="eudr-chk" key={i}>
                        <div className={`eudr-chk-ic ${iconClass}`}>
                          {passed ? "✓" : isCritical ? "✗" : "!"}
                        </div>
                        <span className="eudr-chk-label">{c.label}</span>
                        <span className={`eudr-chk-badge ${badgeClass}`}>
                          {passed ? "Pass" : isCritical ? "High" : "Medium"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
            {/* end right */}

          </div>

          </>)}

          {/* Legacy fallback when no assessment data */}
          {!assessing && !assessError && !enhanced && !isComplete && (
            <div style={{ maxWidth: 600, margin: "40px auto" }}>
              <div style={s.card}>
                <div style={s.field}>
                  <label style={s.label}>{t("risk.levelLabel")}</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["low", "standard", "high"] as const).map((lvl) => (
                      <label key={lvl} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t1)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
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
                          color: lvl === "low" ? "#4a7c5e" : lvl === "high" ? "#c44e3a" : "#c4882a",
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
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // ── Steps 1-3: Standard form layout ──

  return (
    <AppShell>
      <div className="eudr-form-page">
        <button data-testid="eudr-back" onClick={() => navigate(`/trades/${lookupId}`)} style={{ background: "none", border: "none", color: "#8a857f", cursor: "pointer", fontSize: 13, marginBottom: 18, padding: 0 }}>
          ← {t("backToLookup")}
        </button>

        <h1 style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 600, lineHeight: 1.2, marginBottom: 5 }}>{t("title")}</h1>
        <p style={{ fontSize: 13, color: "#8a857f", lineHeight: 1.6, marginBottom: 24 }}>
          {t("regulationRef")}
          {resultJson && t("tradeContext", { commodity: resultJson.commodity?.name, origin: resultJson.origin?.countryName, destination: resultJson.destination?.countryName })}
        </p>

        {/* Step progress — stepper tray */}
        <div className="eudr-stepper-tray">
          <div className="eudr-stepper">
            {STEP_KEYS.map((key, i) => {
              const num = i + 1;
              const state = num < step ? "completed" : num === step ? "active" : "upcoming";
              return (
                <div
                  key={num}
                  className={`eudr-step eudr-step--${state}`}
                  onClick={() => num < step && setStep(num)}
                  style={{ cursor: num < step ? "pointer" : "default" }}
                  data-testid={`eudr-step-${num}`}
                >
                  <div className="eudr-step__bar" />
                  <div className="eudr-step__body">
                    <div className="eudr-step__circle">
                      {num < step ? (
                        <svg className="eudr-step__check" viewBox="0 0 14 14"><polyline points="2,7 6,11 12,3"/></svg>
                      ) : num}
                    </div>
                    <span className="eudr-step__name">{t(key)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Geolocation */}
        {step === 1 && (
          <div className="eudr-form-card">
            <h2 className="eudr-form-title">{t("geo.title")}</h2>
            <p className="eudr-form-desc">{t("geo.subtitle")}</p>

            <div style={s.field}>
              <label style={s.label}>{t("geo.coordType")}</label>
              <div style={{ display: "flex", gap: 12 }}>
                {(["point", "polygon"] as const).map((ct) => (
                  <label key={ct} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t1)", fontSize: 13, cursor: "pointer", fontWeight: 500, textTransform: "none", letterSpacing: 0, marginBottom: 0 }}>
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
                <button style={{ ...s.btnSecondary, fontSize: 13, padding: "6px 12px" }} onClick={() => setDraft(d => ({ ...d, polygonPoints: [...d.polygonPoints, { lat: "", lng: "" }] }))} data-testid="eudr-add-point">
                  {t("geo.addPoint")}
                </button>
              </div>
            )}

            <div style={{ ...s.field, marginTop: 16 }}>
              <label style={s.label}>{t("geo.plotCountry")}</label>
              <input data-testid="eudr-plot-country" style={{ ...s.input, width: 100 }} maxLength={2} placeholder="GH" value={draft.plotCountryIso2} onChange={e => setDraft(d => ({ ...d, plotCountryIso2: e.target.value.toUpperCase() }))} />
              {draft.plotCountryValid === false && (
                <p style={{ color: "var(--red)", fontSize: 13, marginTop: 6 }}>
                  {t("geo.mismatchWarning", { originIso2: resultJson?.origin?.iso2 })}
                </p>
              )}
            </div>

            {/* Geospatial verification status */}
            {geoLoading && (
              <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 12 }}>
                Verifying plot against satellite deforestation data...
              </p>
            )}
            {geoData && geoData.source !== "none" && (
              <div style={{
                marginTop: 14, padding: "12px 16px",
                background: (geoData.lossAfterCutoff ?? 0) > 1 ? "var(--red-xs)" : "var(--sage-xs)",
                borderRadius: 10, fontSize: 12,
                border: `1px solid ${(geoData.lossAfterCutoff ?? 0) > 1 ? "rgba(196,78,58,.18)" : "rgba(74,124,94,.18)"}`,
              }}>
                <div style={{ fontWeight: 600, color: "var(--t1)", marginBottom: 4, fontSize: 11 }}>
                  Satellite Verification ({geoData.source === "gfw" ? "Global Forest Watch" : "OpenEPI"})
                </div>
                <div style={{ color: "var(--t2)" }}>
                  Total loss: {geoData.totalLossHa?.toFixed(1) ?? "—"} ha
                  {(geoData.lossAfterCutoff ?? 0) > 0 && ` | Post-2020: ${geoData.lossAfterCutoff?.toFixed(1) ?? "0"} ha`}
                  {geoData.alertCount > 0 && ` | ${geoData.alertCount} active alert(s)`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Evidence */}
        {step === 2 && (
          <div className="eudr-form-card">
            <h2 className="eudr-form-title">{t("evidence.title")}</h2>
            <p className="eudr-form-desc">{t("evidence.subtitle")}</p>

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
                <p style={{ color: "var(--red)", fontSize: 13, marginTop: 6 }}>
                  {t("evidence.dateWarning")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Supplier Verification */}
        {step === 3 && (
          <div className="eudr-form-card">
            <h2 className="eudr-form-title">{t("supplier.title")}</h2>
            <p className="eudr-form-desc">{t("supplier.subtitle")}</p>

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

            <div style={{ ...s.field, marginTop: 16, padding: "14px 16px", background: "var(--bg)", borderRadius: 8 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--t1)", fontSize: 13, cursor: "pointer", fontWeight: 500, textTransform: "none", letterSpacing: 0, marginBottom: 0 }}>
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

        {/* Navigation buttons */}
        {!isComplete && (
          <div className="eudr-form-nav">
            {step > 1 ? (
              <button data-testid="eudr-prev" className="eudr-btn-prev" onClick={() => setStep(step - 1)}>
                {t("nav.previous")}
              </button>
            ) : <div />}
            {step < 4 && (
              <button
                data-testid="eudr-next"
                className="eudr-btn-next"
                style={{ opacity: canAdvance() ? 1 : 0.5 }}
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
