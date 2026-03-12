import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ComplianceResult } from "@shared/schema";
import '../styles/cbam-step4.css';

const STEP_KEYS = ["cbam.step1", "cbam.step2", "cbam.step3", "cbam.step4"] as const;

type CbamDraft = {
  embeddedEmissions: string;
  quantity: string;
  emissionsSource: "actual" | "default";
  installationName: string;
  installationCountry: string;
  reportingPeriod: string;
  carbonPricePaid: string;
  carbonPriceCurrency: string;
};

const emptyDraft: CbamDraft = {
  embeddedEmissions: "",
  quantity: "",
  emissionsSource: "default",
  installationName: "",
  installationCountry: "",
  reportingPeriod: "",
  carbonPricePaid: "",
  carbonPriceCurrency: "EUR",
};

// ── Dashboard helpers ──
function bandClass(band: string | null) {
  if (band === "negligible") return "negligible";
  if (band === "low") return "low";
  if (band === "high") return "high";
  return ""; // medium = default gold
}
function bandLabel(band: string | null) {
  if (band === "negligible") return "NEGLIGIBLE";
  if (band === "low") return "LOW RISK";
  if (band === "medium") return "MEDIUM RISK";
  if (band === "high") return "HIGH RISK";
  return "\u2014";
}
function urgencyClass(urgency: string) {
  if (urgency === "overdue") return "cbam-urgency-red";
  if (urgency === "urgent") return "cbam-urgency-amber";
  if (urgency === "upcoming") return "cbam-urgency-amber";
  return "cbam-urgency-blue";
}
function breakdownBarColor(pct: number) {
  if (pct >= 80) return "blue";
  if (pct >= 50) return "amber";
  return "red";
}

// CBAM Annex III transitional default emission factors (tCO₂e per ton of product)
const CBAM_DEFAULT_FACTORS: Record<string, { factor: number; label: string }> = {
  "72": { factor: 1.85, label: "Iron & steel (crude/semi-finished)" },
  "73": { factor: 1.85, label: "Articles of iron/steel" },
  "76": { factor: 8.50, label: "Aluminium" },
  "31": { factor: 2.70, label: "Fertilisers" },
  "28": { factor: 1.20, label: "Inorganic chemicals / hydrogen" },
  "25": { factor: 0.75, label: "Cement / clinker" },
  "2716": { factor: 0.40, label: "Electricity (tCO₂e/MWh)" },
};

function getDefaultFactor(hsCode: string): { factor: number; label: string } | null {
  const hs = hsCode.replace(/\./g, "");
  for (const prefix of ["2716", "72", "73", "76", "31", "28", "25"]) {
    if (hs.startsWith(prefix)) return CBAM_DEFAULT_FACTORS[prefix];
  }
  return null;
}

// ── Main CBAM Page ──
export default function CbamPage() {
  const { t } = useTranslation("trades");
  const [, params] = useRoute("/cbam/:lookupId");
  const [, navigate] = useLocation();
  const lookupId = params?.lookupId;

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CbamDraft>({ ...emptyDraft });
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [cbamId, setCbamId] = useState<string | null>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [assessing, setAssessing] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);

  const lookupQuery = useQuery<any>({
    queryKey: ["/api/lookups", lookupId],
    enabled: !!lookupId,
  });

  const cbamQuery = useQuery<any>({
    queryKey: ["/api/cbam", lookupId],
    enabled: !!lookupId,
  });

  useEffect(() => {
    if (cbamQuery.data) {
      setCbamId(cbamQuery.data.id);
      const rec = cbamQuery.data;
      setDraft((prev) => ({
        ...prev,
        embeddedEmissions: rec.embeddedEmissions?.toString() || "",
        quantity: rec.quantity?.toString() || "",
        emissionsSource: rec.emissionsSource || "default",
        installationName: rec.installationName || "",
        installationCountry: rec.installationCountry || "",
        reportingPeriod: rec.reportingPeriod || "",
        carbonPricePaid: rec.carbonPricePaid?.toString() || "",
        carbonPriceCurrency: rec.carbonPriceCurrency || "EUR",
      }));
      // Mark previously saved steps as completed
      const done = new Set<number>();
      if (rec.embeddedEmissions || rec.quantity) done.add(1);
      if (rec.installationName || rec.installationCountry || rec.reportingPeriod) done.add(2);
      if (rec.carbonPricePaid != null) done.add(3);
      if (done.size > 0) setCompletedSteps(done);
    }
  }, [cbamQuery.data]);

  const lookup = lookupQuery.data;
  const resultJson = lookup?.resultJson as ComplianceResult | undefined;
  const hsCode = lookup?.hsCode || resultJson?.hsCode || "";
  const commodityName = resultJson?.commodity?.name || "";
  const originName = resultJson?.origin?.countryName || "";
  const destName = resultJson?.destination?.countryName || "";

  // Init CBAM record if none exists
  const initMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cbam", { lookupId });
      return res.json();
    },
    onSuccess: (data: any) => setCbamId(data.id),
  });

  useEffect(() => {
    if (lookupId && !cbamId && !cbamQuery.isLoading && !cbamQuery.data) {
      initMutation.mutate();
    }
  }, [lookupId, cbamId, cbamQuery.isLoading, cbamQuery.data]);

  const saveDraft = useCallback(async (stepData: Partial<any>): Promise<boolean> => {
    if (!cbamId) return false;
    setSaving(true);
    try {
      const res = await apiRequest("PATCH", `/api/cbam/${cbamId}`, stepData);
      await res.json(); // ensure response is fully consumed before proceeding
      // Invalidate cache so navigating back to earlier steps shows saved data
      await queryClient.invalidateQueries({ queryKey: ["/api/cbam", lookupId] });
      setSaving(false);
      return true;
    } catch (_e) {
      setSaving(false);
      return false;
    }
  }, [cbamId, lookupId]);

  const runAssessment = useCallback(async () => {
    if (!lookupId) return;
    setAssessing(true);
    setAssessError(null);
    try {
      const res = await apiRequest("POST", `/api/cbam/${lookupId}/assess`);
      const data = await res.json();
      setAssessmentData(data);
    } catch (e: any) {
      setAssessError(e?.message || "Assessment failed. Please try again.");
    }
    setAssessing(false);
  }, [lookupId]);

  // Track which steps have been completed (saved)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleNext = async () => {
    let saved = false;
    if (step === 1) {
      saved = await saveDraft({
        embeddedEmissions: draft.embeddedEmissions || null,
        quantity: draft.quantity || null,
        emissionsSource: draft.emissionsSource,
      });
    }
    if (step === 2) {
      saved = await saveDraft({
        installationName: draft.installationName || null,
        installationCountry: draft.installationCountry || null,
        reportingPeriod: draft.reportingPeriod || null,
      });
    }
    if (step === 3) {
      saved = await saveDraft({
        carbonPricePaid: draft.carbonPricePaid || null,
        carbonPriceCurrency: draft.carbonPriceCurrency,
      });
      if (saved) {
        setCompletedSteps(prev => new Set([...prev, step]));
        setStep(4);
        await runAssessment();
      }
      return;
    }
    if (saved) {
      setCompletedSteps(prev => new Set([...prev, step]));
    }
    setStep(step + 1);
  };

  const generateStatement = async () => {
    if (!lookupId) return;
    setGeneratingPdf(true);
    try {
      const res = await fetch(`/api/cbam/${lookupId}/generate-statement`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to generate statement");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CBAM-Statement.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ["/api/cbam", lookupId] });
    } catch (_e) {}
    setGeneratingPdf(false);
  };

  const requestSupplierEmissions = async () => {
    if (!lookupId) return;
    try {
      const res = await apiRequest("POST", `/api/cbam/${lookupId}/supplier-invite`);
      const data = await res.json();
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
    } catch (_e) {}
  };

  const assessment = assessmentData;
  const breakdown = assessment?.breakdown || {};
  const levyBreakdown = breakdown?.levyBreakdown;
  const deadlines = breakdown?.deadlines;
  const costScenarios = breakdown?.costScenarios;
  const ukCbam = breakdown?.ukCbam;
  const isComplete = cbamQuery.data?.status === "complete";
  const stmtRef = cbamQuery.data?.statementJson?.reference;

  // Computed values for Step 1 preview
  const emFloat = parseFloat(draft.embeddedEmissions) || 0;
  const qtyFloat = parseFloat(draft.quantity) || 0;
  const totalEmissions = emFloat * qtyFloat;

  // ── Step 4: Assessment Dashboard ──
  if (step === 4) {
    return (
      <AppShell contentClassName="cbam-dashboard-shell">
        <div className="cbam-mn">

          {/* Loading */}
          {assessing && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="cbam-card" style={{ padding: "40px 60px", textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 8 }}>Running CBAM compliance assessment...</div>
                <div style={{ fontSize: 12, color: "var(--t4)" }}>Analysing emissions, levy, deadlines, and compliance checks</div>
              </div>
            </div>
          )}

          {!assessing && assessError && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="cbam-card" style={{ padding: "40px 60px", textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "var(--red)", marginBottom: 8 }}>Assessment failed</div>
                <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 16 }}>{assessError}</div>
                <button onClick={runAssessment} className="cbam-btn-gen" style={{ width: "auto", padding: "10px 24px" }}>Retry Assessment</button>
              </div>
            </div>
          )}

          {!assessing && !assessError && assessment && (<>

          {/* Top bar */}
          <div className="cbam-hdr">
            <div>
              <a className="cbam-back" onClick={() => navigate(`/trades/${lookupId}`)}>
                {"\u2190"} {t("cbam.backToTrade")}
              </a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="cbam-step-nav">
                {STEP_KEYS.map((key, i) => {
                  const num = i + 1;
                  return (
                    <div
                      key={num}
                      className={`cbam-sp ${num < 4 ? "done" : num === 4 ? "active" : "pending"}`}
                      style={{ cursor: num < step ? "pointer" : "default" }}
                      onClick={() => num < step && setStep(num)}
                    >
                      {num}. {t(key)} {num < 4 ? "\u2713" : ""}
                    </div>
                  );
                })}
              </div>
              <button className="cbam-hbtn" onClick={() => navigate("/alerts")}>
                🔔<span className="cbam-bell-dot" />
              </button>
              <button className="cbam-ntb" onClick={() => navigate("/new-check")}>+ New Trade</button>
            </div>
          </div>

          {/* Page header */}
          <div style={{ flexShrink: 0 }}>
            <div className="cbam-eyebrow">⚡ CBAM · Reg (EU) 2023/956</div>
            <h1 style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 500 }}>Carbon Border Adjustment</h1>
            <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 4 }}>
              {commodityName && `${commodityName} (HS ${hsCode})`}
              {originName && ` \u00b7 ${originName} \u2192 ${destName}`}
              {draft.reportingPeriod && ` \u00b7 ${draft.reportingPeriod}`}
            </div>
          </div>

          {/* Tab nav */}
          <div className="cbam-tabs">
            {STEP_KEYS.map((key, i) => {
              const num = i + 1;
              return (
                <button
                  key={num}
                  className={`cbam-tab ${num === 4 ? "active" : ""}`}
                  onClick={() => setStep(num)}
                >
                  <span className="cbam-tab-num">{num}</span> {t(key)}
                </button>
              );
            })}
          </div>

          {/* Statement banner */}
          {isComplete && stmtRef && (
            <div className="cbam-stmt-banner">
              <span className="cbam-stmt-icon">{"\u2713"}</span>
              <div>
                <div className="cbam-stmt-main">CBAM statement generated successfully.</div>
                <div className="cbam-stmt-ref">Ref: {stmtRef} · {draft.reportingPeriod || "Q1 2026"}</div>
              </div>
            </div>
          )}

          {/* Two-panel grid */}
          <div className="cbam-panels">

            {/* LEFT PANEL */}
            <div className="cbam-pl">

              {/* Score Card — navy gradient */}
              <div className="cbam-score-card">
                <div className="cbam-sc-label">CBAM COMPLIANCE SCORE</div>
                <div className={`cbam-sc-band ${bandClass(assessment.band)}`}>
                  <span className="cbam-sc-band-dot" />
                  {bandLabel(assessment.band)}
                </div>
                <div className="cbam-sc-num">
                  <span className="cbam-sc-big">{assessment.score ?? "\u2014"}</span>
                  <span className="cbam-sc-denom">/100</span>
                </div>
                <div className="cbam-sc-trend">
                  {"\u25CF"} STABLE {levyBreakdown?.originCarbonCredit > 0 ? " Leverage origin credit to reduce levy" : ""}
                </div>
                <div className={`cbam-sc-verdict ${assessment.canConcludeCbamCompliant ? "" : "issues"}`}>
                  ⚡ {assessment.canConcludeCbamCompliant ? "Compliant \u2014 Declaration required" : "Compliance Issues Detected"}
                </div>
                <div className="cbam-sc-footer">
                  <span>Article 35 Classification</span>
                  <span className="cbam-sc-footer-val">Standard Scrutiny</span>
                </div>
              </div>

              {/* Score Breakdown */}
              {(assessment.checksRun || []).length > 0 && (
                <div className="cbam-card">
                  <div className="cbam-ct">Score Breakdown</div>
                  {(assessment.checksRun || []).slice(0, 5).map((c: any, i: number) => {
                    const max = 20;
                    const val = c.passed ? max : Math.round(max * 0.5);
                    const pct = Math.round((val / max) * 100);
                    return (
                      <div className="cbam-bk-row" key={i}>
                        <span className="cbam-bk-label">
                          {c.label}
                          {c.passed && <small>{"\u2713"} Complete</small>}
                        </span>
                        <div className="cbam-bk-bar">
                          <div className={`cbam-bk-fill ${breakdownBarColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="cbam-bk-val">{val}/{max}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Levy Breakdown */}
              <div className="cbam-card">
                <div className="cbam-ct">💶 Levy Breakdown</div>
                {levyBreakdown ? (
                  <>
                    <div className="cbam-levy-row">
                      <span className="cbam-levy-label">📊 Gross levy</span>
                      <span className="cbam-levy-val">{"\u20AC"}{levyBreakdown.grossLevy?.toLocaleString()}</span>
                    </div>
                    {levyBreakdown.originCarbonCredit > 0 && (
                      <div className="cbam-levy-row">
                        <span className="cbam-levy-label" style={{ color: "#2e7d52" }}>↳ Origin carbon credit</span>
                        <span className="cbam-levy-val" style={{ color: "#2e7d52" }}>{"\u2212 \u20AC"}{levyBreakdown.originCarbonCredit?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="cbam-gauge-bar">
                      <div className="cbam-gauge-fill" style={{ width: `${levyBreakdown.grossLevy > 0 ? Math.round((levyBreakdown.netLevy / levyBreakdown.grossLevy) * 100) : 100}%` }} />
                    </div>
                    <div className="cbam-levy-net">
                      <div className="cbam-levy-net-label">Net CBAM levy due</div>
                      <div className="cbam-levy-net-val">{"\u20AC"}{levyBreakdown.netLevy?.toLocaleString()}</div>
                      <div className="cbam-levy-per-ton">
                        {"\u20AC"}{levyBreakdown.perTonLevy} per ton · {levyBreakdown.totalEmissions?.toLocaleString()} tCO₂e · ETS {"\u20AC"}{levyBreakdown.etsPrice}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--t3)" }}>
                    Levy requires emissions data and quantity. Default factors will be used if available.
                  </div>
                )}
              </div>

              {/* Deadlines */}
              <div className="cbam-card">
                <div className="cbam-ct">📅 Key Deadlines</div>
                {deadlines ? (
                  <>
                    <div className="cbam-dl-row">
                      <div>
                        <div className="cbam-dl-name">Quarterly CBAM Report</div>
                        <div className="cbam-dl-date">{draft.reportingPeriod || "Q1 2026"} · due {deadlines.quarterlyReportDue}</div>
                      </div>
                      <span className={`cbam-urgency ${urgencyClass(deadlines.quarterlyUrgency || "ok")}`}>
                        {deadlines.quarterlyDaysLeft != null ? `${deadlines.quarterlyDaysLeft} days` : deadlines.quarterlyReportDue}
                      </span>
                    </div>
                    <div className="cbam-dl-row">
                      <div>
                        <div className="cbam-dl-name">Annual CBAM Declaration</div>
                        <div className="cbam-dl-date">due {deadlines.annualDeclarationDue}</div>
                      </div>
                      <span className="cbam-urgency cbam-urgency-blue">
                        {deadlines.annualDaysLeft != null ? `${deadlines.annualDaysLeft} days` : deadlines.annualDeclarationDue}
                      </span>
                    </div>
                    {deadlines.ukCbamNote && (
                      <div className="cbam-dl-row">
                        <div>
                          <div className="cbam-dl-name">UK CBAM</div>
                          <div className="cbam-dl-date">{deadlines.ukCbamNote}</div>
                        </div>
                        <span className="cbam-urgency cbam-urgency-blue">Upcoming</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--t3)" }}>Set reporting period to compute deadlines.</div>
                )}
              </div>

              {/* Cost Scenarios — 5 card grid */}
              {costScenarios && costScenarios.length > 0 && (
                <div className="cbam-card">
                  <div className="cbam-ct">📈 Cost Scenarios</div>
                  <div className="cbam-ets-row">
                    <div>
                      <div className="cbam-ets-label">EU ETS price used in calculations</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="cbam-ets-price">{"\u20AC"}{levyBreakdown?.etsPrice || "71.50"} / tCO₂e</div>
                      <div className="cbam-ets-date">{levyBreakdown?.etsPriceDate || ""}</div>
                    </div>
                  </div>
                  <div className="cbam-scenario-grid">
                    {costScenarios.map((sc: any, i: number) => {
                      const isBase = i === 0;
                      const isUp = sc.delta > 0;
                      const isDown = sc.delta < 0;
                      const deltaClass = isBase ? "cbam-delta-base" : isDown ? "cbam-delta-amber" : "cbam-delta-up";
                      return (
                        <div key={i} className={`cbam-sc-card ${isBase ? "base" : ""}`}>
                          {isBase && <div className="cbam-sc-tag">BASE</div>}
                          <div className="cbam-sc-card-label">{sc.label}</div>
                          <div className="cbam-sc-card-val">{"\u20AC"}{sc.netLevy?.toLocaleString()}</div>
                          <div className={`cbam-sc-delta ${deltaClass}`}>
                            {isBase ? "\u2014" : `${isUp ? "+" : ""}${sc.deltaPercent}%`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="cbam-card">
                <button className="cbam-btn-gen" onClick={generateStatement} disabled={generatingPdf}>
                  {generatingPdf ? "Generating..." : isComplete ? "↓ Re-download CBAM Statement" : t("cbam.generateStatement")}
                </button>
                <button className="cbam-btn-supplier" onClick={requestSupplierEmissions}>
                  ✉ {t("cbam.requestSupplierEmissions")}
                </button>
              </div>

            </div>
            {/* end left */}

            {/* RIGHT PANEL */}
            <div className="cbam-pr">

              {/* UK Advisory — teal gradient */}
              {ukCbam && (
                <div className="cbam-uk-card">
                  <div className="cbam-uk-flag">🇬🇧</div>
                  <div style={{ flex: 1 }}>
                    <div className="cbam-uk-title">UK CBAM — Destination Advisory</div>
                    <div className="cbam-uk-sub">
                      {ukCbam.applicable
                        ? `Estimated UK levy: \u00A3${ukCbam.netLevyGBP?.toLocaleString()}${ukCbam.belowThreshold ? " (below \u00A350k threshold)" : ""}`
                        : "This trade routes to the United Kingdom. UK CBAM legislation is pending."}
                    </div>
                  </div>
                  <div>
                    <div className="cbam-uk-badge">Starts Jan 2027</div>
                    <div className="cbam-uk-badge-sub">Monitor for rate updates</div>
                  </div>
                </div>
              )}

              {/* Not applicable */}
              {assessment.applicable === false && (
                <div className="cbam-card" style={{ borderLeft: "3px solid var(--cbam-blue)" }}>
                  <div style={{ fontSize: 13, color: "var(--cbam-blue)" }}>
                    <strong>CBAM does not apply to this trade corridor.</strong> The commodity or destination is not in scope of EU Regulation 2023/956.
                  </div>
                </div>
              )}

              {/* Top Risk Drivers */}
              {(assessment.topDrivers || []).length > 0 && (
                <div className="cbam-card">
                  <div className="cbam-ct">⚠ Top Risk Drivers</div>
                  {(assessment.topDrivers || []).map((d: any, i: number) => {
                    const dotCls = d.severity === "critical" ? "red" : d.severity === "major" ? "amber" : "blue";
                    return (
                      <div className="cbam-risk" key={i}>
                        <div className={`cbam-risk-dot ${dotCls}`} />
                        <div>
                          <div className="cbam-risk-title">{d.reason}</div>
                          <div className="cbam-risk-desc">{d.severity} — {d.points} pts</div>
                          <div className="cbam-risk-action">{"\u2192"} {d.fix}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Compliance Checks */}
              {(assessment.checksRun || []).length > 0 && (
                <div className="cbam-card">
                  <div className="cbam-ct">{"\u2713"} Compliance Checks</div>
                  {(assessment.checksRun || []).map((c: any, i: number) => {
                    const passed = c.passed;
                    const isCritical = !passed && c.severity === "critical";
                    const isWarn = !passed && !isCritical;
                    return (
                      <div className="cbam-chk-row" key={i}>
                        <span className="cbam-chk-label">
                          <span className="cbam-chk-ic" style={{ color: passed ? "#2e7d52" : isCritical ? "#c0392b" : "#c8922a" }}>
                            {passed ? "\u2713" : isCritical ? "\u2717" : "\u26A0"}
                          </span>
                          {c.label}
                        </span>
                        <span className={passed ? "cbam-badge-pass" : isCritical ? "cbam-badge-fail" : "cbam-badge-warn"}>
                          {passed ? "PASS" : isCritical ? "FAIL" : "PENDING"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
            {/* end right */}

          </div>

          </>)}

          {/* No assessment fallback */}
          {!assessing && !assessError && !assessment && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="cbam-card" style={{ padding: "40px 60px", textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 12 }}>No assessment data yet</div>
                <button onClick={runAssessment} className="cbam-btn-gen" style={{ width: "auto" }}>Run CBAM Assessment</button>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // ── Steps 1-3: Two-column form layout ──

  const metaLine = [
    commodityName && `${commodityName} (HS ${hsCode})`,
    originName && `${originName} \u2192 ${destName}`,
  ].filter(Boolean).join(" \u00b7 ");

  return (
    <AppShell>
      <div className="cbam-form-page">

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0, paddingTop: 4 }}>
          <a className="cbam-back" onClick={() => navigate(`/trades/${lookupId}`)}>
            {"\u2190"} {t("cbam.backToTrade")}
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="cbam-step-nav">
              {STEP_KEYS.map((key, i) => {
                const num = i + 1;
                return (
                  <div
                    key={num}
                    className={`cbam-sp ${num < step ? "done" : num === step ? "active" : "pending"}`}
                    style={{ cursor: num < step ? "pointer" : "default" }}
                    onClick={() => num < step && setStep(num)}
                  >
                    {num}. {t(key)} {num < step ? "\u2713" : ""}
                  </div>
                );
              })}
            </div>
            <button className="cbam-hbtn" onClick={() => navigate("/alerts")}>
              🔔<span className="cbam-bell-dot" />
            </button>
            <button className="cbam-ntb" onClick={() => navigate("/new-check")}>+ New Trade</button>
          </div>
        </div>

        {/* Page header */}
        <div className="cbam-page-hdr">
          <div className="cbam-eyebrow">⚡ CBAM · Reg (EU) 2023/956</div>
          <h1 style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 500 }}>Carbon Border Adjustment</h1>
          {metaLine && <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 4 }}>{metaLine}</div>}
        </div>

        {/* Tab nav */}
        <div className="cbam-tabs" style={{ margin: "18px 0 20px" }}>
          {STEP_KEYS.map((key, i) => {
            const num = i + 1;
            const isDone = completedSteps.has(num);
            const isActive = num === step;
            return (
              <button
                key={num}
                className={`cbam-tab ${isActive ? "active" : isDone ? "done" : ""}`}
                onClick={() => num <= step && setStep(num)}
                style={{ cursor: num <= step ? "pointer" : "default", opacity: num > step && !isDone ? 0.5 : 1 }}
              >
                <span className={`cbam-tab-num ${isDone && !isActive ? "done" : ""}`}>
                  {isDone && !isActive ? "\u2713" : num}
                </span> {t(key)}
              </button>
            );
          })}
        </div>

        {/* Step 1: Emissions Data */}
        {step === 1 && (
          <div className="cbam-form-grid">
            <div className="cbam-form-card">
              <div className="cbam-form-title">📊 Embedded Emissions</div>
              <div className="cbam-form-group">
                <label className="cbam-form-label">{t("cbam.emissionsSource")}</label>
                <div className="cbam-toggle-row">
                  <button
                    className={`cbam-toggle-opt ${draft.emissionsSource === "actual" ? "active" : ""}`}
                    onClick={() => setDraft(d => ({ ...d, emissionsSource: "actual" }))}
                  >{t("cbam.levySource.actual")}</button>
                  <button
                    className={`cbam-toggle-opt ${draft.emissionsSource === "default" ? "active" : ""}`}
                    onClick={() => setDraft(d => ({ ...d, emissionsSource: "default" }))}
                  >Use default factor</button>
                </div>
              </div>
              <div className="cbam-form-group">
                <label className="cbam-form-label">Embedded emissions (tCO₂e / ton)</label>
                <input
                  className="cbam-form-input" type="number" step="any" placeholder="0.00"
                  value={draft.embeddedEmissions}
                  onChange={e => setDraft(d => ({ ...d, embeddedEmissions: e.target.value }))}
                />
              </div>
              <div className="cbam-form-group">
                <label className="cbam-form-label">Quantity (tons)</label>
                <input
                  className="cbam-form-input" type="number" step="any" placeholder="0"
                  value={draft.quantity}
                  onChange={e => setDraft(d => ({ ...d, quantity: e.target.value }))}
                />
              </div>
              <div className="cbam-form-actions">
                <button className="cbam-btn-save" disabled={saving} onClick={handleNext}>
                  {saving ? "Saving..." : "Save & Continue \u2192"}
                </button>
                <button className="cbam-btn-back" onClick={() => saveDraft({
                  embeddedEmissions: draft.embeddedEmissions || null,
                  quantity: draft.quantity || null,
                  emissionsSource: draft.emissionsSource,
                })}>Save draft</button>
              </div>
            </div>
            {/* Right: calculated totals */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="cbam-card">
                <div className="cbam-ct">⚡ Calculated totals</div>
                <div className="cbam-calc">
                  <div className="cbam-calc-row">
                    <span className="cbam-calc-label">Embedded rate</span>
                    <span className="cbam-calc-val">{emFloat || "\u2014"} tCO₂e / ton</span>
                  </div>
                  <div className="cbam-calc-row">
                    <span className="cbam-calc-label">Quantity</span>
                    <span className="cbam-calc-val">{qtyFloat || "\u2014"} tons</span>
                  </div>
                  <div className="cbam-calc-row" style={{ borderBottom: "none", paddingBottom: 0 }}>
                    <span className="cbam-calc-label" style={{ fontWeight: 600 }}>Total emissions</span>
                    <span />
                  </div>
                  <div className="cbam-calc-total">{totalEmissions > 0 ? `${totalEmissions.toLocaleString()} tCO₂e` : "\u2014"}</div>
                </div>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`cbam-source-badge ${draft.emissionsSource === "actual" ? "cbam-source-actual" : "cbam-source-default"}`}>
                    {draft.emissionsSource === "actual" ? "\u2713 Actual data" : "⚠ Default factor"}
                  </span>
                </div>
              </div>
              {hsCode && (() => {
                const def = getDefaultFactor(hsCode);
                return (
                  <div className="cbam-card">
                    <div style={{ fontSize: 11, color: "var(--t3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Annex III default reference</div>
                    <div className="cbam-info-box">
                      📌 CBAM Annex III default for <strong>{commodityName} (HS {hsCode})</strong>
                    </div>
                    {def ? (
                      <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: "var(--cbam-dark)" }}>{def.factor}</span>
                        <span style={{ fontSize: 13, color: "var(--t3)" }}>tCO₂e / ton</span>
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, fontSize: 12, color: "var(--t4)" }}>No default factor available for this HS code. Actual supplier data required.</div>
                    )}
                    {def && (
                      <div style={{ fontSize: 11, color: "var(--t4)", marginTop: 4 }}>{def.label} — EU transitional default value</div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Step 2: Installation */}
        {step === 2 && (
          <div className="cbam-form-grid">
            <div className="cbam-form-card">
              <div className="cbam-form-title">🏭 Installation Details</div>
              <div className="cbam-form-group">
                <label className="cbam-form-label">{t("cbam.installationName")}</label>
                <input
                  className="cbam-form-input" placeholder="e.g. ArcelorMittal Saldanha Works"
                  value={draft.installationName}
                  onChange={e => setDraft(d => ({ ...d, installationName: e.target.value }))}
                />
              </div>
              <div className="cbam-form-group">
                <label className="cbam-form-label">{t("cbam.installationCountry")}</label>
                <select
                  className="cbam-form-select"
                  value={draft.installationCountry}
                  onChange={e => setDraft(d => ({ ...d, installationCountry: e.target.value }))}
                >
                  <option value="">Select country</option>
                  <option value="ZA">🇿🇦 South Africa (ZA)</option>
                  <option value="CN">🇨🇳 China (CN)</option>
                  <option value="IN">🇮🇳 India (IN)</option>
                  <option value="TR">🇹🇷 Türkiye (TR)</option>
                  <option value="NG">🇳🇬 Nigeria (NG)</option>
                  <option value="UA">🇺🇦 Ukraine (UA)</option>
                  <option value="KZ">🇰🇿 Kazakhstan (KZ)</option>
                </select>
              </div>
              <div className="cbam-form-group">
                <label className="cbam-form-label">{t("cbam.reportingPeriod")}</label>
                <select
                  className="cbam-form-select"
                  value={draft.reportingPeriod}
                  onChange={e => setDraft(d => ({ ...d, reportingPeriod: e.target.value }))}
                >
                  <option value="">Select period</option>
                  <option value="2026-Q1">2026-Q1 (current)</option>
                  <option value="2026-Q2">2026-Q2</option>
                  <option value="2026-Q3">2026-Q3</option>
                  <option value="2026-Q4">2026-Q4</option>
                </select>
              </div>
              <div className="cbam-form-actions">
                <button className="cbam-btn-save" disabled={saving} onClick={handleNext}>
                  {saving ? "Saving..." : "Save & Continue \u2192"}
                </button>
                <button className="cbam-btn-back" onClick={() => setStep(1)}>{"\u2190"} Back</button>
              </div>
            </div>
            {/* Right: Installation summary */}
            <div className="cbam-card">
              <div className="cbam-ct">🌍 Installation summary</div>
              <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                {draft.installationCountry && <span>{draft.installationCountry}</span>}
              </div>
              <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 12 }}>
                {draft.installationName || "Not specified"}
              </div>
              {draft.installationCountry && resultJson?.origin?.iso2 && (
                draft.installationCountry.toUpperCase() === resultJson.origin.iso2.toUpperCase() ? (
                  <div className="cbam-origin-match">{"\u2713"} Installation country matches trade origin ({originName})</div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", background: "#fdf3e0", borderRadius: 8, fontSize: 12.5, color: "#c8922a", fontWeight: 500, marginTop: 8 }}>
                    ⚠ Installation country does not match origin ({originName})
                  </div>
                )
              )}
              {draft.reportingPeriod && (
                <div className="cbam-period-badge">📅 Reporting period: {draft.reportingPeriod}</div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Carbon Price */}
        {step === 3 && (
          <div className="cbam-form-grid">
            <div className="cbam-form-card">
              <div className="cbam-form-title">💶 Carbon Price at Origin</div>
              <div className="cbam-form-group">
                <label className="cbam-form-label">Carbon price paid (per tCO₂e)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="cbam-form-input" type="number" step="any" placeholder="0.00" style={{ flex: 1 }}
                    value={draft.carbonPricePaid}
                    onChange={e => setDraft(d => ({ ...d, carbonPricePaid: e.target.value }))}
                  />
                  <select
                    className="cbam-form-select" style={{ width: 90 }}
                    value={draft.carbonPriceCurrency}
                    onChange={e => setDraft(d => ({ ...d, carbonPriceCurrency: e.target.value }))}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              <div className="cbam-info-box" style={{ marginBottom: 16 }}>
                📌 If the origin country has a carbon tax, the amount paid will be credited against the EU CBAM levy.
              </div>
              <div className="cbam-form-actions">
                <button className="cbam-btn-save" disabled={saving} onClick={handleNext}>
                  {saving ? "Saving..." : "Save & Continue \u2192"}
                </button>
                <button className="cbam-btn-back" onClick={() => setStep(2)}>{"\u2190"} Back</button>
              </div>
            </div>
            {/* Right: Levy calculation preview */}
            <div className="cbam-card">
              <div className="cbam-ct">🧮 Levy Calculation</div>
              <div className="cbam-ets-row">
                <div>
                  <div className="cbam-ets-label">EU ETS Carbon Price</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="cbam-ets-price">{"\u20AC"}71.50 / tCO₂e</div>
                </div>
              </div>
              {totalEmissions > 0 && (
                <>
                  <div className="cbam-calc-row" style={{ padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                    <span className="cbam-calc-label">Gross levy <small style={{ color: "var(--t3)" }}>({totalEmissions.toLocaleString()} × {"\u20AC"}71.50)</small></span>
                    <span className="cbam-calc-val">{"\u20AC"}{Math.round(totalEmissions * 71.5).toLocaleString()}</span>
                  </div>
                  {parseFloat(draft.carbonPricePaid) > 0 && (
                    <div className="cbam-calc-row" style={{ padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                      <span className="cbam-calc-label" style={{ color: "#2e7d52" }}>Origin carbon credit <small style={{ color: "var(--t3)" }}>({totalEmissions.toLocaleString()} × {"\u20AC"}{draft.carbonPricePaid})</small></span>
                      <span className="cbam-calc-val" style={{ color: "#2e7d52" }}>{"\u2212 \u20AC"}{Math.round(totalEmissions * parseFloat(draft.carbonPricePaid)).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="cbam-levy-net" style={{ marginTop: 12 }}>
                    <div className="cbam-levy-net-label">Net CBAM levy</div>
                    <div className="cbam-levy-net-val">
                      {"\u20AC"}{Math.round(totalEmissions * (71.5 - (parseFloat(draft.carbonPricePaid) || 0))).toLocaleString()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
