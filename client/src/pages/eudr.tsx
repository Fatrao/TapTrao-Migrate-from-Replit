import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ComplianceResult } from "@shared/schema";

const STEP_KEYS = ["step.geolocation", "step.evidence", "step.supplier", "step.riskSubmit"] as const;

const s = {
  page: { maxWidth: 780, margin: "0 auto", padding: "24px 16px" } as React.CSSProperties,
  card: { background: "var(--card)", borderRadius: 14, padding: "24px", marginBottom: 16 } as React.CSSProperties,
  heading: { fontFamily: "var(--fh)", fontSize: 20, fontWeight: 900, color: "var(--t1)", margin: "0 0 4px" } as React.CSSProperties,
  sub: { fontSize: 13, color: "var(--t3)", marginBottom: 20 } as React.CSSProperties,
  label: { fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)", marginBottom: 6, display: "block" } as React.CSSProperties,
  input: { width: "100%", padding: "10px 12px", background: "var(--card2)", border: "none", borderRadius: 8, color: "var(--t1)", fontSize: 13, outline: "none" } as React.CSSProperties,
  select: { width: "100%", padding: "10px 12px", background: "var(--card2)", border: "none", borderRadius: 8, color: "var(--t1)", fontSize: 13, outline: "none", appearance: "none" as const, WebkitAppearance: "none" as const } as React.CSSProperties,
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } as React.CSSProperties,
  field: { marginBottom: 12 } as React.CSSProperties,
  btnPrimary: { background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "var(--fb)", fontWeight: 600, fontSize: 13, cursor: "pointer" } as React.CSSProperties,
  btnSecondary: { background: "transparent", color: "var(--t2)", border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "var(--fb)", fontWeight: 600, fontSize: 13, cursor: "pointer" } as React.CSSProperties,
  btnDanger: { background: "var(--red)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontFamily: "var(--fb)", fontWeight: 600, fontSize: 13, cursor: "pointer" } as React.CSSProperties,
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

  return (
    <AppShell>
      <div style={s.page}>
        <button data-testid="eudr-back" onClick={() => navigate(`/lookup?loadLookup=${lookupId}`)} style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: 13, marginBottom: 12 }}>
          ← {t("backToLookup")}
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
                  fontSize: 14,
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
                  <label key={ct} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t1)", fontSize: 13, cursor: "pointer" }}>
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
                <button style={{ ...s.btnSecondary, fontSize: 14, padding: "6px 12px" }} onClick={() => setDraft(d => ({ ...d, polygonPoints: [...d.polygonPoints, { lat: "", lng: "" }] }))} data-testid="eudr-add-point">
                  {t("geo.addPoint")}
                </button>
              </div>
            )}

            <div style={{ ...s.field, marginTop: 16 }}>
              <label style={s.label}>{t("geo.plotCountry")}</label>
              <input data-testid="eudr-plot-country" style={{ ...s.input, width: 100 }} maxLength={2} placeholder="GH" value={draft.plotCountryIso2} onChange={e => setDraft(d => ({ ...d, plotCountryIso2: e.target.value.toUpperCase() }))} />
              {draft.plotCountryValid === false && (
                <p style={{ color: "var(--red, #DC2626)", fontSize: 14, marginTop: 6 }}>
                  {t("geo.mismatchWarning", { originIso2: resultJson?.origin?.iso2 })}
                </p>
              )}
            </div>
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
                <p style={{ color: "var(--red, #DC2626)", fontSize: 14, marginTop: 6 }}>
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
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "var(--t1)", fontSize: 13, cursor: "pointer" }}>
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

        {/* Step 4: Risk Assessment & Generate */}
        {step === 4 && (
          <div style={s.card}>
            <h2 style={{ ...s.heading, fontSize: 16 }}>
              {isComplete ? t("risk.titleComplete") : t("risk.titleAssess")}
            </h2>
            <p style={s.sub}>
              {isComplete ? t("risk.subtitleComplete") : t("risk.subtitleAssess")}
            </p>

            {isComplete ? (
              <div>
                <div style={{ background: "var(--green, #1B7340)", borderRadius: ".75rem", padding: "16px 20px", color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>✓</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t("risk.statementGenerated")}</div>
                    <div style={{ fontSize: 14, opacity: 0.85 }}>
                      {t("risk.reference", { ref: (eudrQuery.data?.statementJson as any)?.reference || "\u2014" })}
                      {eudrQuery.data?.retentionUntil && ` | ${t("risk.retainedUntil", { date: eudrQuery.data.retentionUntil.split("T")[0] })}`}
                    </div>
                  </div>
                </div>
                <button data-testid="eudr-redownload" style={s.btnPrimary} onClick={generateStatement} disabled={generatingPdf}>
                  {generatingPdf ? t("risk.generating") : t("risk.redownload")}
                </button>
              </div>
            ) : (
              <>
                <div style={s.field}>
                  <label style={s.label}>{t("risk.levelLabel")}</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["low", "standard", "high"] as const).map((lvl) => (
                      <label key={lvl} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--t1)", fontSize: 13, cursor: "pointer" }}>
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

                {/* Summary */}
                <div style={{ background: "var(--s2, #232B3E)", borderRadius: ".5rem", padding: 16, marginTop: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 8 }}>{t("summary.title")}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 14, color: "var(--t2)" }}>
                    <span>{t("summary.geolocation")}</span>
                    <span style={{ color: draft.plotCountryValid !== false ? "var(--green)" : "var(--red)" }}>
                      {draft.coordType === "point" ? `${draft.lat}, ${draft.lng}` : t("summary.points", { count: draft.polygonPoints.filter(p => p.lat).length })}
                      {draft.plotCountryValid === false ? ` ${t("summary.mismatch")}` : " \u2713"}
                    </span>
                    <span>{t("summary.evidence")}</span>
                    <span>{draft.evidenceType || "\u2014"} / {draft.evidenceReference || "\u2014"}</span>
                    <span>{t("summary.supplier")}</span>
                    <span>{draft.supplierName || "\u2014"}</span>
                    <span>{t("summary.sanctions")}</span>
                    <span style={{ color: draft.sanctionsChecked ? "var(--green)" : "var(--red)" }}>
                      {draft.sanctionsChecked ? `${t("summary.screened")} \u2713` : t("summary.notScreened")}
                    </span>
                  </div>
                </div>

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
              </>
            )}
          </div>
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
