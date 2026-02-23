import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ComplianceResult } from "@shared/schema";

const STEPS = [
  { num: 1, label: "Geolocation" },
  { num: 2, label: "Evidence" },
  { num: 3, label: "Supplier" },
  { num: 4, label: "Risk & Submit" },
];

const s = {
  page: { maxWidth: 780, margin: "0 auto", padding: "24px 16px" } as React.CSSProperties,
  card: { background: "var(--card)", borderRadius: 14, padding: "24px", marginBottom: 16 } as React.CSSProperties,
  heading: { fontFamily: "var(--fh)", fontSize: 20, fontWeight: 900, color: "var(--t1)", margin: "0 0 4px" } as React.CSSProperties,
  sub: { fontSize: 13, color: "var(--t3)", marginBottom: 20 } as React.CSSProperties,
  label: { fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)", marginBottom: 6, display: "block" } as React.CSSProperties,
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
          ← Back to lookup results
        </button>

        <h1 style={s.heading}>EUDR Due Diligence</h1>
        <p style={s.sub}>
          EU Regulation 2023/1115 — Deforestation-free Products
          {resultJson && ` — ${resultJson.commodity?.name} from ${resultJson.origin?.countryName} to ${resultJson.destination?.countryName}`}
        </p>

        {/* Step progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {STEPS.map((st) => (
            <div
              key={st.num}
              data-testid={`eudr-step-${st.num}`}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "8px 4px",
                borderRadius: ".5rem",
                background: step === st.num ? "var(--blue, #3B82F6)" : st.num < step ? "var(--green, #1B7340)" : "var(--s2, #232B3E)",
                color: step >= st.num ? "#fff" : "var(--t3)",
                fontSize: 12,
                fontWeight: step === st.num ? 700 : 500,
                cursor: st.num < step ? "pointer" : "default",
                transition: "background .2s",
              }}
              onClick={() => st.num < step && setStep(st.num)}
            >
              {st.num}. {st.label}
            </div>
          ))}
        </div>

        {/* Step 1: Geolocation */}
        {step === 1 && (
          <div style={s.card}>
            <h2 style={{ ...s.heading, fontSize: 16 }}>Plot Geolocation</h2>
            <p style={s.sub}>Provide coordinates of the production/harvest plot to verify origin.</p>

            <div style={s.field}>
              <label style={s.label}>Coordinate type</label>
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
                    {ct === "point" ? "Single point" : "Polygon (3+ points)"}
                  </label>
                ))}
              </div>
            </div>

            {draft.coordType === "point" ? (
              <div style={s.row}>
                <div>
                  <label style={s.label}>Latitude</label>
                  <input data-testid="eudr-lat" style={s.input} type="number" step="any" placeholder="-4.3250" value={draft.lat} onChange={e => setDraft(d => ({ ...d, lat: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>Longitude</label>
                  <input data-testid="eudr-lng" style={s.input} type="number" step="any" placeholder="15.3222" value={draft.lng} onChange={e => setDraft(d => ({ ...d, lng: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div>
                {draft.polygonPoints.map((pt, i) => (
                  <div key={i} style={{ ...s.row, marginBottom: 8 }}>
                    <div>
                      <label style={s.label}>Point {i + 1} Lat</label>
                      <input style={s.input} type="number" step="any" value={pt.lat} onChange={e => {
                        const pts = [...draft.polygonPoints];
                        pts[i] = { ...pts[i], lat: e.target.value };
                        setDraft(d => ({ ...d, polygonPoints: pts }));
                      }} data-testid={`eudr-poly-lat-${i}`} />
                    </div>
                    <div>
                      <label style={s.label}>Point {i + 1} Lng</label>
                      <input style={s.input} type="number" step="any" value={pt.lng} onChange={e => {
                        const pts = [...draft.polygonPoints];
                        pts[i] = { ...pts[i], lng: e.target.value };
                        setDraft(d => ({ ...d, polygonPoints: pts }));
                      }} data-testid={`eudr-poly-lng-${i}`} />
                    </div>
                  </div>
                ))}
                <button style={{ ...s.btnSecondary, fontSize: 12, padding: "6px 12px" }} onClick={() => setDraft(d => ({ ...d, polygonPoints: [...d.polygonPoints, { lat: "", lng: "" }] }))} data-testid="eudr-add-point">
                  + Add point
                </button>
              </div>
            )}

            <div style={{ ...s.field, marginTop: 16 }}>
              <label style={s.label}>Plot country (ISO 2-letter code)</label>
              <input data-testid="eudr-plot-country" style={{ ...s.input, width: 100 }} maxLength={2} placeholder="GH" value={draft.plotCountryIso2} onChange={e => setDraft(d => ({ ...d, plotCountryIso2: e.target.value.toUpperCase() }))} />
              {draft.plotCountryValid === false && (
                <p style={{ color: "var(--red, #DC2626)", fontSize: 12, marginTop: 6 }}>
                  Warning: Plot country does not match the trade origin country ({resultJson?.origin?.iso2}).
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Evidence */}
        {step === 2 && (
          <div style={s.card}>
            <h2 style={{ ...s.heading, fontSize: 16 }}>Deforestation-free Evidence</h2>
            <p style={s.sub}>Provide evidence that the commodity was produced on land not subject to deforestation after 31 December 2020.</p>

            <div style={s.field}>
              <label style={s.label}>Evidence type</label>
              <select data-testid="eudr-evidence-type" style={s.select} value={draft.evidenceType} onChange={e => setDraft(d => ({ ...d, evidenceType: e.target.value }))}>
                <option value="">Select evidence type…</option>
                <option value="satellite_ref">Satellite imagery reference</option>
                <option value="third_party_cert">Third-party certification (e.g. FSC, RSPO)</option>
                <option value="geo_database">National geo-database / cadaster</option>
                <option value="other">Other documented evidence</option>
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label}>Reference / certificate number</label>
              <input data-testid="eudr-evidence-ref" style={s.input} placeholder="e.g. FSC-C123456 or imagery dataset ID" value={draft.evidenceReference} onChange={e => setDraft(d => ({ ...d, evidenceReference: e.target.value }))} />
            </div>

            <div style={s.field}>
              <label style={s.label}>Evidence date (must post-date 31 Dec 2020)</label>
              <input data-testid="eudr-evidence-date" style={{ ...s.input, width: 200 }} type="date" value={draft.evidenceDate} onChange={e => setDraft(d => ({ ...d, evidenceDate: e.target.value }))} />
              {draft.evidenceDate && new Date(draft.evidenceDate) <= new Date("2020-12-31") && (
                <p style={{ color: "var(--red, #DC2626)", fontSize: 12, marginTop: 6 }}>
                  Warning: Evidence date must be after 31 December 2020 (EUDR cutoff).
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Supplier Verification */}
        {step === 3 && (
          <div style={s.card}>
            <h2 style={{ ...s.heading, fontSize: 16 }}>Supplier Verification</h2>
            <p style={s.sub}>Identify the supplier and confirm sanctions screening has been performed.</p>

            <div style={s.field}>
              <label style={s.label}>Supplier name</label>
              <input data-testid="eudr-supplier-name" style={s.input} placeholder="e.g. ABC Cocoa Ltd" value={draft.supplierName} onChange={e => setDraft(d => ({ ...d, supplierName: e.target.value }))} />
            </div>

            <div style={s.field}>
              <label style={s.label}>Supplier address</label>
              <input data-testid="eudr-supplier-address" style={s.input} placeholder="Full business address" value={draft.supplierAddress} onChange={e => setDraft(d => ({ ...d, supplierAddress: e.target.value }))} />
            </div>

            <div style={s.field}>
              <label style={s.label}>Registration number (optional)</label>
              <input data-testid="eudr-supplier-reg" style={s.input} placeholder="Company registration or tax ID" value={draft.supplierRegNumber} onChange={e => setDraft(d => ({ ...d, supplierRegNumber: e.target.value }))} />
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
                <span>
                  I confirm that I have screened this supplier against applicable sanctions lists
                  (EU, UN, OFAC) and the supplier is <strong>not subject to any sanctions</strong>.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Risk Assessment & Generate */}
        {step === 4 && (
          <div style={s.card}>
            <h2 style={{ ...s.heading, fontSize: 16 }}>
              {isComplete ? "Due Diligence Complete" : "Risk Assessment & Statement"}
            </h2>
            <p style={s.sub}>
              {isComplete
                ? "Your EUDR due diligence statement has been generated and recorded."
                : "Assess the overall risk level for this trade and generate your due diligence statement."}
            </p>

            {isComplete ? (
              <div>
                <div style={{ background: "var(--green, #1B7340)", borderRadius: ".75rem", padding: "16px 20px", color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>✓</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Statement Generated</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>
                      Reference: {(eudrQuery.data?.statementJson as any)?.reference || "—"}
                      {eudrQuery.data?.retentionUntil && ` | Retained until ${eudrQuery.data.retentionUntil.split("T")[0]}`}
                    </div>
                  </div>
                </div>
                <button data-testid="eudr-redownload" style={s.btnPrimary} onClick={generateStatement} disabled={generatingPdf}>
                  {generatingPdf ? "Generating…" : "Re-download PDF"}
                </button>
              </div>
            ) : (
              <>
                <div style={s.field}>
                  <label style={s.label}>Risk level assessment</label>
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
                          {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {draft.riskLevel === "high" && (
                  <div style={s.field}>
                    <label style={s.label}>Reason for high risk (required for high risk)</label>
                    <textarea
                      data-testid="eudr-high-risk-reason"
                      style={{ ...s.input, minHeight: 80, resize: "vertical" }}
                      placeholder="Explain the reason for the high-risk assessment and any mitigating measures taken…"
                      value={draft.highRiskReason}
                      onChange={e => setDraft(d => ({ ...d, highRiskReason: e.target.value }))}
                    />
                  </div>
                )}

                {/* Summary */}
                <div style={{ background: "var(--s2, #232B3E)", borderRadius: ".5rem", padding: 16, marginTop: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 8 }}>Summary</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 12, color: "var(--t2)" }}>
                    <span>Geolocation:</span>
                    <span style={{ color: draft.plotCountryValid !== false ? "var(--green)" : "var(--red)" }}>
                      {draft.coordType === "point" ? `${draft.lat}, ${draft.lng}` : `${draft.polygonPoints.filter(p => p.lat).length} points`}
                      {draft.plotCountryValid === false ? " — Mismatch" : " ✓"}
                    </span>
                    <span>Evidence:</span>
                    <span>{draft.evidenceType || "—"} / {draft.evidenceReference || "—"}</span>
                    <span>Supplier:</span>
                    <span>{draft.supplierName || "—"}</span>
                    <span>Sanctions:</span>
                    <span style={{ color: draft.sanctionsChecked ? "var(--green)" : "var(--red)" }}>
                      {draft.sanctionsChecked ? "Screened ✓" : "Not screened"}
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
                  {generatingPdf ? "Generating Statement…" : "Generate EUDR Statement PDF"}
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
                ← Previous
              </button>
            ) : <div />}
            {step < 4 && (
              <button
                data-testid="eudr-next"
                style={{ ...s.btnPrimary, opacity: canAdvance() ? 1 : 0.5, cursor: canAdvance() ? "pointer" : "not-allowed" }}
                disabled={!canAdvance() || saving}
                onClick={handleNext}
              >
                {saving ? "Saving…" : "Next →"}
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
