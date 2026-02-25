import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { StepNav } from "@/components/StepNav";
import { TabBar } from "@/components/TabBar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trash2,
  MessageCircle,
  Hash,
  X,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTokenBalance } from "@/hooks/use-tokens";
import type {
  LcFields,
  LcDocument,
  LcDocumentType,
  CheckResultItem,
  LcCheckSummary,
  SupplierRequest,
  SupplierUpload,
} from "@shared/schema";
import {
  INCOTERMS,
  CURRENCIES,
  QUANTITY_UNITS,
  DOC_TYPES,
  WORKFLOW_STEPS,
  LC_TABS,
  LC_STEP_LABELS,
} from "./lc-check/constants";
import type { LcCheckResponse, LcPrefillData, UploadedFile } from "./lc-check/constants";
import { getDocFields, mapDocNameToType, getDocEmoji, docTypeLabel } from "./lc-check/helpers";
import { CopyBtn } from "./lc-check/Badges";
import { InsuranceGapAlert } from "./lc-check/InsuranceGapAlert";
import { UploadZone, FilePill } from "./lc-check/UploadZone";
import { SupplierDocsTab } from "./lc-check/SupplierDocsTab";
import { TwinLogTrailTab } from "./lc-check/TwinLogTrailTab";


export default function LcCheck() {
  const [step, setStep] = useState(1);
  const [prefillData, setPrefillData] = useState<LcPrefillData | null>(null);
  const [showPrefillBanner, setShowPrefillBanner] = useState(false);

  const [lcFields, setLcFields] = useState<LcFields>({
    beneficiaryName: "",
    applicantName: "",
    goodsDescription: "",
    hsCode: "",
    quantity: 0,
    quantityUnit: "MT",
    unitPrice: 0,
    currency: "USD",
    totalAmount: 0,
    countryOfOrigin: "",
    portOfLoading: "",
    portOfDischarge: "",
    latestShipmentDate: "",
    lcExpiryDate: "",
    incoterms: "FOB",
    partialShipmentsAllowed: false,
    transhipmentAllowed: false,
    lcReference: "",
  });

  const [documents, setDocuments] = useState<LcDocument[]>([
    { documentType: "commercial_invoice", fields: {} },
  ]);

  const [activeDocTab, setActiveDocTab] = useState(0);
  const [lcPdfFile, setLcPdfFile] = useState<UploadedFile | null>(null);
  const [docFiles, setDocFiles] = useState<Record<number, UploadedFile | null>>({});

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("lc_prefill");
      if (!stored) return;
      const data: LcPrefillData = JSON.parse(stored);
      setPrefillData(data);
      setShowPrefillBanner(true);

      setLcFields(prev => ({
        ...prev,
        goodsDescription: data.commodity_name,
        hsCode: data.hs_code,
        countryOfOrigin: data.origin_name,
        incoterms: data.incoterms || "FOB",
      }));

      if (data.required_docs && data.required_docs.length > 0) {
        const seen = new Set<LcDocumentType>();
        const docs: LcDocument[] = [];
        for (const docName of data.required_docs) {
          const docType = mapDocNameToType(docName);
          if (!seen.has(docType)) {
            seen.add(docType);
            docs.push({ documentType: docType, fields: {} });
          }
        }
        if (docs.length > 0) {
          setDocuments(docs);
          setActiveDocTab(0);
        }
      }

      sessionStorage.removeItem("lc_prefill");
    } catch {}
  }, []);

  const updateLcField = useCallback((field: keyof LcFields, value: string | number | boolean) => {
    setLcFields(prev => ({ ...prev, [field]: value }));
  }, []);

  const addDocument = useCallback(() => {
    if (documents.length < 6) {
      setDocuments(prev => [...prev, { documentType: "commercial_invoice", fields: {} }]);
      setActiveDocTab(documents.length);
    }
  }, [documents.length]);

  const removeDocument = useCallback((index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
    setDocFiles(prev => { const next = { ...prev }; delete next[index]; return next; });
    setActiveDocTab(prev => Math.min(prev, documents.length - 2));
  }, [documents.length]);

  const updateDocType = useCallback((index: number, type: LcDocumentType) => {
    setDocuments(prev => prev.map((d, i) => i === index ? { documentType: type, fields: {} } : d));
  }, []);

  const updateDocField = useCallback((index: number, key: string, value: string) => {
    setDocuments(prev => prev.map((d, i) => i === index ? { ...d, fields: { ...d.fields, [key]: value } } : d));
  }, []);

  const tokenQuery = useTokenBalance();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [, navigate] = useLocation();
  const balance = tokenQuery.data?.balance ?? 0;
  const freeLookupUsed = tokenQuery.data?.freeLookupUsed ?? false;
  const isFreeCheck = !freeLookupUsed;

  const [showRecheckModal, setShowRecheckModal] = useState(false);
  const [recheckLookupId, setRecheckLookupId] = useState<string | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const recheckPaidSessionId = urlParams.get("recheck_paid");

  const checkMutation = useMutation<LcCheckResponse, Error, void>({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { lcFields, documents };
      if (prefillData?.lookup_id) {
        payload.sourceLookupId = prefillData.lookup_id;
      }
      if (recheckPaidSessionId) {
        payload.recheckSessionId = recheckPaidSessionId;
      }
      const res = await fetch("/api/lc-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (data.type === "lc_recheck") {
          setRecheckLookupId(data.sourceLookupId);
          setShowRecheckModal(true);
          throw new Error("LC re-check required");
        }
        setShowTokenModal(true);
        throw new Error("Insufficient tokens");
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens/balance"] });
    },
  });

  const canProceedStep1 =
    lcFields.beneficiaryName.trim() !== "" &&
    lcFields.applicantName.trim() !== "" &&
    lcFields.goodsDescription.trim() !== "" &&
    lcFields.totalAmount > 0;

  const canProceedStep2 = documents.length > 0;

  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionTab, setCorrectionTab] = useState<"email" | "whatsapp">("email");
  const [lcActiveTab, setLcActiveTab] = useState("Check");

  // Group results by severity for Step 4
  const criticalResults = checkMutation.data?.results.filter(r => r.severity === "RED") || [];
  const warningResults = checkMutation.data?.results.filter(r => r.severity === "AMBER") || [];
  const matchedResults = checkMutation.data?.results.filter(r => r.severity === "GREEN") || [];

  const verdictClass = checkMutation.data?.summary.verdict === "COMPLIANT" ? "ok"
    : checkMutation.data?.summary.verdict === "COMPLIANT_WITH_NOTES" ? "warn" : "fail";
  const verdictEmoji = verdictClass === "ok" ? "\u2705" : verdictClass === "warn" ? "\u26A0\uFE0F" : "\u274C";
  const verdictTitle = checkMutation.data?.summary.verdict === "COMPLIANT" ? "All Clear"
    : checkMutation.data?.summary.verdict === "COMPLIANT_WITH_NOTES" ? "Compliant with Notes"
    : "Discrepancies Found";
  const verdictSub = checkMutation.data?.summary.criticals
    ? `${checkMutation.data.summary.criticals} critical issue${checkMutation.data.summary.criticals > 1 ? "s" : ""} will cause bank rejection.`
    : checkMutation.data?.summary.warnings
      ? `${checkMutation.data.summary.warnings} warning${checkMutation.data.summary.warnings > 1 ? "s" : ""} to review.`
      : "All fields match LC terms.";

  /* ── shared inline styles matching design ref ── */
  const inputS: React.CSSProperties = {
    background: "#f5f5f5", border: "1px solid #e8e8e8", borderRadius: 9,
    padding: "10px 13px", fontSize: 13, color: "#111", fontFamily: "var(--fb)",
    outline: "none", transition: "all 0.15s", width: "100%",
  };
  const labelS: React.CSSProperties = {
    fontSize: 10.5, fontWeight: 700, color: "#999",
    textTransform: "uppercase", letterSpacing: "0.08em",
  };
  const wcS: React.CSSProperties = {
    background: "#fff", borderRadius: 16, padding: "20px 22px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
    marginBottom: 12, position: "relative", overflow: "hidden",
  };
  const wcHeadS: React.CSSProperties = {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    marginBottom: 16, paddingBottom: 13, borderBottom: "1px solid #f0f0f0",
  };
  const btnGreenS = (enabled: boolean): React.CSSProperties => ({
    background: enabled ? "var(--green)" : "#ccc", color: "#000", padding: "11px 26px",
    borderRadius: 9, fontSize: 13.5, fontWeight: 700,
    cursor: enabled ? "pointer" : "not-allowed", fontFamily: "var(--fb)",
    display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
    boxShadow: enabled ? "0 4px 18px rgba(74,140,111,0.35)" : "none", border: "none",
  });
  const btnGreyS: React.CSSProperties = {
    background: "#f0f0f0", color: "#111", padding: "11px 20px", borderRadius: 9,
    fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--fb)",
    transition: "all 0.15s", border: "1px solid #e0e0e0",
  };
  const req = <span style={{ color: "var(--amber)" }}>*</span>;

  const goStep = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── helper: get doc type label ── */
  const docLabel = (dt: string) => DOC_TYPES.find(d => d.value === dt)?.label ?? dt;

  return (
    <AppShell
      contentClassName="content-area"
      topCenter={
        <div className="top-nav-links">
          <Link href="/dashboard"><span>Dashboard</span></Link>
          <Link href="/lookup"><span>Commodities</span></Link>
          <Link href="/inbox"><span>Suppliers</span></Link>
          <Link href="/lc-check"><span className="active">Compliance</span></Link>
          <Link href="/inbox"><span>Messages</span></Link>
        </div>
      }
    >
      <StepNav steps={WORKFLOW_STEPS} currentIndex={1} completedUpTo={1} />
      <TabBar tabs={LC_TABS} activeTab={lcActiveTab} onChange={setLcActiveTab} />

      {lcActiveTab === "Supplier docs" ? (
        <SupplierDocsTab prefillData={prefillData} />
      ) : lcActiveTab === "TwinLog Trail" ? (
        <TwinLogTrailTab prefillData={prefillData} />
      ) : lcActiveTab === "Corrections" ? (
        <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--t2)", fontSize: 14 }}>
          Coming in the next update.
        </div>
      ) : (
      <div style={{ flex: 1, paddingBottom: 40 }} data-testid="lc-check-page">

        {/* ═══════ HERO ═══════ */}
        <div style={{
          margin: "0 14px", borderRadius: 16, padding: "20px 24px 36px", position: "relative",
          background: "linear-gradient(180deg, #0d2218 0%, #0f2a1e 30%, #143424 55%, #1a4030 75%, rgba(26,60,44,0.7) 88%, rgba(26,60,44,0) 100%)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", overflow: "hidden",
        }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.1)", borderRadius: 24, padding: "4px 14px",
              fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 12,
              backdropFilter: "blur(6px)",
            }}>
              Compliance › LC Check › New Check
            </div>
            <div style={{
              fontFamily: "var(--fh)", fontSize: 30, fontWeight: 700, color: "#fff",
              letterSpacing: "0", lineHeight: 1.1, marginBottom: 7,
            }} data-testid="text-lc-title">
              LC Document<br />Checker
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              Cross-check supplier docs against your LC — UCP 600 &amp; ISBP 745 applied.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, paddingTop: 2, flexShrink: 0 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(74,140,111,0.15)", borderRadius: 20, padding: "5px 13px",
              fontSize: 12, color: "var(--green)", fontWeight: 600,
            }}>
              {isFreeCheck ? (
                <><span style={{ background: "var(--green)", color: "#000", padding: "1px 7px", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>FREE</span> First check · $19.99 after</>
              ) : (
                <>$19.99 per check</>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ STEPPER ═══════ */}
        <div style={{ padding: "18px 28px 8px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {([
              { n: 1, label: "LC Terms" },
              { n: 2, label: "Supplier Docs" },
              { n: 3, label: "Review" },
              { n: 4, label: "Results" },
            ] as const).map((s, i, arr) => (
              <div key={s.n} style={{ display: "contents" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 26, height: 26, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, flexShrink: 0,
                      fontFamily: "var(--fh)", transition: "all 0.2s",
                      ...(step > s.n
                        ? { background: "var(--green)", color: "#000" }
                        : step === s.n
                        ? { background: "rgba(255,255,255,0.15)", color: "#fff", border: "2px solid var(--green)" }
                        : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.1)" }),
                    }}
                    data-testid={`step-indicator-${s.n}`}
                  >
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                    color: step > s.n ? "var(--green)" : step === s.n ? "#fff" : "rgba(255,255,255,0.25)",
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div style={{
                    flex: 1, height: 1, margin: "0 10px", minWidth: 24,
                    background: step > s.n ? "var(--green)" : "rgba(255,255,255,0.1)",
                    transition: "background 0.3s",
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Prefill Banner */}
        {showPrefillBanner && prefillData && (
          <div style={{ margin: "14px 14px 0", background: "rgba(74,140,111,0.15)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 12, position: "relative" }} data-testid="banner-lc-prefill">
            <ExternalLink size={18} style={{ color: "var(--green)", flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }} data-testid="text-prefill-info">
                Pre-filled from your compliance lookup
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                {prefillData.commodity_name} — {prefillData.origin_name} → {prefillData.dest_name}
              </p>
              {prefillData.lookup_id && (
                <Link
                  href="/trades"
                  style={{ fontSize: 11, color: "var(--green)", textDecoration: "underline", marginTop: 4, display: "inline-block" }}
                  data-testid="link-view-lookup"
                >
                  View lookup →
                </Link>
              )}
            </div>
            <button
              onClick={() => setShowPrefillBanner(false)}
              style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}
              data-testid="button-dismiss-prefill-banner"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ═══════ STEP 1 — LC Terms ═══════ */}
        {step === 1 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ padding: "0 14px" }}>
              {/* LC Terms Card */}
              <div style={wcS}>
                <div style={wcHeadS}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 8 }}>
                      📋 Letter of Credit — Key Terms
                    </div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                      Enter exactly as they appear on your LC.
                    </div>
                  </div>
                </div>

                {/* Row 1: LC Reference + Issuing Bank */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginBottom: 13 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>LC Reference</label>
                    <input type="text" style={inputS}
                      value={lcFields.lcReference}
                      onChange={e => updateLcField("lcReference", e.target.value)}
                      placeholder="e.g. LC/2026/0001234"
                      data-testid="input-lc-reference"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Issuing Bank</label>
                    <input type="text" style={inputS}
                      placeholder="e.g. Société Générale, Abidjan"
                    />
                  </div>

                  {/* Row 2: Beneficiary + Applicant */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Beneficiary (Supplier) {req}</label>
                    <input type="text" style={inputS}
                      value={lcFields.beneficiaryName}
                      onChange={e => updateLcField("beneficiaryName", e.target.value)}
                      placeholder="Exact name as on LC"
                      data-testid="input-beneficiary-name"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Applicant (Buyer) {req}</label>
                    <input type="text" style={inputS}
                      value={lcFields.applicantName}
                      onChange={e => updateLcField("applicantName", e.target.value)}
                      placeholder="Exact name as on LC"
                      data-testid="input-applicant-name"
                    />
                  </div>

                  {/* Row 3: Goods Description (full width) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "1 / -1" }}>
                    <label style={labelS}>Goods Description {req}</label>
                    <input type="text" style={inputS}
                      value={lcFields.goodsDescription}
                      onChange={e => updateLcField("goodsDescription", e.target.value)}
                      placeholder="e.g. Raw Cashew Nuts in shell, crop 2025/26"
                      data-testid="input-goods-description"
                    />
                  </div>
                </div>

                {/* 3-col: Quantity, LC Amount, Currency */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13, marginBottom: 13 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Quantity {req}</label>
                    <input type="text" style={inputS}
                      value={lcFields.quantity || ""}
                      onChange={e => updateLcField("quantity", parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 500 MT"
                      data-testid="input-quantity"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>LC Amount {req}</label>
                    <input type="number" style={inputS}
                      value={lcFields.totalAmount || ""}
                      onChange={e => updateLcField("totalAmount", parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 250,000.00"
                      data-testid="input-total-amount"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Currency</label>
                    <select style={inputS}
                      value={lcFields.currency}
                      onChange={e => updateLcField("currency", e.target.value)}
                      data-testid="select-currency"
                    >
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Row 2 of 3-col */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Port of Loading</label>
                    <input type="text" style={inputS}
                      value={lcFields.portOfLoading}
                      onChange={e => updateLcField("portOfLoading", e.target.value)}
                      placeholder="e.g. Abidjan"
                      data-testid="input-port-loading"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Port of Discharge</label>
                    <input type="text" style={inputS}
                      value={lcFields.portOfDischarge}
                      onChange={e => updateLcField("portOfDischarge", e.target.value)}
                      placeholder="e.g. Felixstowe"
                      data-testid="input-port-discharge"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Country of Origin</label>
                    <input type="text" style={inputS}
                      value={lcFields.countryOfOrigin}
                      onChange={e => updateLcField("countryOfOrigin", e.target.value)}
                      placeholder="e.g. Côte d'Ivoire"
                      data-testid="input-country-origin"
                    />
                  </div>

                  {/* Row 3 of 3-col */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Latest Shipment Date {req}</label>
                    <input type="date" style={inputS}
                      value={lcFields.latestShipmentDate}
                      onChange={e => updateLcField("latestShipmentDate", e.target.value)}
                      data-testid="input-latest-shipment-date"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>LC Expiry Date {req}</label>
                    <input type="date" style={inputS}
                      value={lcFields.lcExpiryDate}
                      onChange={e => updateLcField("lcExpiryDate", e.target.value)}
                      data-testid="input-lc-expiry-date"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Incoterms</label>
                    <select style={inputS}
                      value={lcFields.incoterms}
                      onChange={e => updateLcField("incoterms", e.target.value)}
                      data-testid="select-incoterms"
                    >
                      {INCOTERMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* HS Code row (single, smaller) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13, marginBottom: 13 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>HS Code</label>
                    <input type="text" style={inputS}
                      value={lcFields.hsCode}
                      onChange={e => updateLcField("hsCode", e.target.value)}
                      placeholder="e.g. 1801.00"
                      data-testid="input-hs-code"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Unit Price</label>
                    <input type="number" style={inputS}
                      value={lcFields.unitPrice || ""}
                      onChange={e => updateLcField("unitPrice", parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 2500"
                      data-testid="input-unit-price"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Quantity Unit</label>
                    <select style={inputS}
                      value={lcFields.quantityUnit}
                      onChange={e => updateLcField("quantityUnit", e.target.value)}
                      data-testid="select-quantity-unit"
                    >
                      {QUANTITY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

                {/* Toggle: Partial Shipments */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Partial Shipments Allowed</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>UCP 600 Art. 31</div>
                  </div>
                  <label style={{ position: "relative", width: 40, height: 22, flexShrink: 0, display: "inline-block", cursor: "pointer" }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                      checked={lcFields.partialShipmentsAllowed}
                      onChange={e => updateLcField("partialShipmentsAllowed", e.target.checked)}
                      data-testid="select-partial-shipments"
                    />
                    <span style={{
                      position: "absolute", inset: 0, borderRadius: 22,
                      background: lcFields.partialShipmentsAllowed ? "rgba(74,140,111,0.15)" : "#e8e8e8",
                      cursor: "pointer", transition: "all 0.2s",
                    }}>
                      <span style={{
                        content: "''", position: "absolute", width: 15, height: 15,
                        left: lcFields.partialShipmentsAllowed ? 22 : 3, top: 3.5,
                        borderRadius: "50%",
                        background: lcFields.partialShipmentsAllowed ? "var(--green)" : "#bbb",
                        transition: "all 0.2s",
                      }} />
                    </span>
                  </label>
                </div>

                {/* Toggle: Transhipment */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Transhipment Allowed</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>UCP 600 Art. 20</div>
                  </div>
                  <label style={{ position: "relative", width: 40, height: 22, flexShrink: 0, display: "inline-block", cursor: "pointer" }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                      checked={lcFields.transhipmentAllowed}
                      onChange={e => updateLcField("transhipmentAllowed", e.target.checked)}
                      data-testid="select-transhipment"
                    />
                    <span style={{
                      position: "absolute", inset: 0, borderRadius: 22,
                      background: lcFields.transhipmentAllowed ? "rgba(74,140,111,0.15)" : "#e8e8e8",
                      cursor: "pointer", transition: "all 0.2s",
                    }}>
                      <span style={{
                        content: "''", position: "absolute", width: 15, height: 15,
                        left: lcFields.transhipmentAllowed ? 22 : 3, top: 3.5,
                        borderRadius: "50%",
                        background: lcFields.transhipmentAllowed ? "var(--green)" : "#bbb",
                        transition: "all 0.2s",
                      }} />
                    </span>
                  </label>
                </div>
              </div>

            {/* Step 1 buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", margin: "4px 0 0" }}>
              <button
                disabled={!canProceedStep1}
                onClick={() => goStep(2)}
                style={btnGreenS(canProceedStep1)}
                data-testid="button-next-step-2"
              >
                Continue to Supplier Docs →
              </button>
            </div>
          </div>
        )}

        {/* ═══════ STEP 2 — Supplier Docs ═══════ */}
        {step === 2 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ padding: "0 14px" }}>
              <div style={wcS}>
                <div style={wcHeadS}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 8 }}>
                      📦 Supplier Documents
                    </div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                      Enter the key fields from each supplier document. Add up to 6 documents.
                    </div>
                  </div>
                </div>

                {/* Document Tabs */}
                <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
                  {documents.map((doc, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveDocTab(i)}
                      style={{
                        padding: "5px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        transition: "all 0.15s",
                        ...(activeDocTab === i
                          ? { background: "var(--green)", color: "#000", border: "1px solid var(--green)" }
                          : { background: "#f5f5f5", color: "#999", border: "1px solid #e8e8e8" }),
                      }}
                      data-testid={`button-doc-tab-${i}`}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%",
                        background: "rgba(0,0,0,0.1)", fontSize: 9,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{i + 1}</span>
                      {docLabel(doc.documentType)}
                    </div>
                  ))}
                  {documents.length < 6 && (
                    <div
                      onClick={addDocument}
                      style={{
                        padding: "5px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", background: "transparent", color: "#999",
                        border: "1px dashed #ddd", transition: "all 0.15s",
                      }}
                      data-testid="button-add-document"
                    >
                      + Add doc
                    </div>
                  )}
                </div>

                {/* Active document fields */}
                {documents[activeDocTab] && (
                  <div>
                    {/* Document Type selector */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 13 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                        <label style={labelS}>Document Type</label>
                        <select style={inputS}
                          value={documents[activeDocTab].documentType}
                          onChange={e => updateDocType(activeDocTab, e.target.value as LcDocumentType)}
                          data-testid="select-doc-type"
                        >
                          {DOC_TYPES.map(dt => (
                            <option key={dt.value} value={dt.value}>{dt.label}</option>
                          ))}
                        </select>
                      </div>
                      {documents.length > 1 && (
                        <button
                          onClick={() => removeDocument(activeDocTab)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#da3c3d", marginTop: 18, padding: 6,
                          }}
                          data-testid="button-remove-document"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Dynamic fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                      {getDocFields(documents[activeDocTab].documentType).map(field => (
                        <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          <label style={labelS}>{field.label}</label>
                          <input
                            type={field.type}
                            style={inputS}
                            value={documents[activeDocTab].fields[field.key] || ""}
                            onChange={e => updateDocField(activeDocTab, field.key, e.target.value)}
                            data-testid={`input-doc-${field.key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", margin: "4px 0 0" }}>
              <button
                disabled={!canProceedStep2}
                onClick={() => goStep(3)}
                style={btnGreenS(canProceedStep2)}
                data-testid="button-next-step-3"
              >
                Continue to Review →
              </button>
              <button onClick={() => goStep(1)} style={btnGreyS}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ═══════ STEP 3 — Review ═══════ */}
        {step === 3 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ padding: "0 14px" }}>
              <div style={wcS}>
                <div style={wcHeadS}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 8 }}>
                      🔍 Review Before Check
                    </div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                      Correct any errors now — changes cannot be made after the credit is consumed.
                    </div>
                  </div>
                </div>

                {/* Warning note */}
                <div style={{
                  background: "#fffbf2", border: "1px solid #f5d8a0", borderRadius: 10,
                  padding: "12px 15px", display: "flex", gap: 10, marginBottom: 14,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: "#7a5020", lineHeight: 1.6 }}>
                    Check all extracted fields carefully. Confirm dates and names match exactly what's on your LC.
                  </span>
                </div>

                {/* Summary fields in 2-col */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginBottom: 13 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>LC Reference</label>
                    <input type="text" style={{ ...inputS, background: "#fff" }} value={lcFields.lcReference} readOnly />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Beneficiary</label>
                    <input type="text" style={{ ...inputS, background: "#fff" }} value={lcFields.beneficiaryName} readOnly />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>LC Amount</label>
                    <input type="text" style={{ ...inputS, background: "#fff" }} value={`${lcFields.currency} ${lcFields.totalAmount.toLocaleString()}`} readOnly />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Goods Description</label>
                    <input type="text" style={{ ...inputS, background: "#fff" }} value={lcFields.goodsDescription} readOnly />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>Latest Shipment Date</label>
                    <input type="text" style={{ ...inputS, background: "#fff" }} value={lcFields.latestShipmentDate} readOnly />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={labelS}>LC Expiry Date</label>
                    <input type="text" style={{ ...inputS, background: "#fff" }} value={lcFields.lcExpiryDate} readOnly />
                  </div>
                </div>

                {/* Documents summary */}
                <div style={{ background: "#f7f7f7", borderRadius: 9, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Documents
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {documents.map((doc, i) => (
                      <span key={i} style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: "rgba(74,140,111,0.1)", color: "#16a34a",
                      }}>
                        ✓ {docLabel(doc.documentType)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", margin: "4px 0 0" }}>
              <button
                disabled={checkMutation.isPending}
                onClick={() => {
                  checkMutation.mutate(undefined, {
                    onSuccess: () => goStep(4),
                  });
                }}
                style={btnGreenS(!checkMutation.isPending)}
                data-testid="button-run-lc-check"
              >
                {checkMutation.isPending
                  ? "⏳ Checking..."
                  : isFreeCheck
                  ? "▶ Run LC Check — Free"
                  : "▶ Run LC Check — $19.99"}
              </button>
              <button onClick={() => goStep(2)} style={btnGreyS}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ═══════ STEP 4 — Results ═══════ */}
        {step === 4 && checkMutation.data && (
          <div style={{ marginTop: 14 }} data-testid="section-lc-results">
            <div style={{ padding: "0 14px" }}>

              {/* Verdict banner */}
              {(() => {
                const v = checkMutation.data.summary.verdict;
                const isOk = v === "COMPLIANT";
                const isWarn = v === "COMPLIANT_WITH_NOTES";
                const isFail = v === "DISCREPANCIES_FOUND";
                const verdictStyle: React.CSSProperties = {
                  borderRadius: 14, padding: "16px 20px", marginBottom: 12,
                  display: "flex", alignItems: "center", gap: 14,
                  ...(isFail ? { background: "rgba(218,60,61,0.08)", border: "1px solid rgba(218,60,61,0.2)" }
                    : isWarn ? { background: "rgba(234,139,67,0.1)", border: "1px solid rgba(234,139,67,0.25)" }
                    : { background: "rgba(74,140,111,0.08)", border: "1px solid rgba(74,140,111,0.2)" }),
                };
                return (
                  <div style={verdictStyle}>
                    <span style={{ fontSize: 28 }}>
                      {isFail ? "🔴" : isWarn ? "⚠️" : "✅"}
                    </span>
                    <div>
                      <div style={{
                        fontFamily: "var(--fh)", fontSize: 18, fontWeight: 800, letterSpacing: "0",
                        color: isFail ? "var(--red)" : isWarn ? "var(--amber)" : "var(--green)",
                      }}>
                        {isFail ? "Discrepancies Found" : isWarn ? "Compliant With Notes" : "Fully Compliant"}
                      </div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                        {checkMutation.data.summary.criticals > 0
                          ? `${checkMutation.data.summary.criticals} critical issue${checkMutation.data.summary.criticals > 1 ? "s" : ""} will cause bank rejection.`
                          : checkMutation.data.summary.warnings > 0
                          ? `${checkMutation.data.summary.warnings} warning${checkMutation.data.summary.warnings > 1 ? "s" : ""} to review.`
                          : "All fields match LC terms."}
                      </div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 14, flexShrink: 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--fh)", lineHeight: 1, color: "var(--green)" }} data-testid="text-matches">{checkMutation.data.summary.matches}</div>
                        <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em" }}>Match</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--fh)", lineHeight: 1, color: "var(--amber)" }} data-testid="text-warnings">{checkMutation.data.summary.warnings}</div>
                        <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em" }}>Warning</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--fh)", lineHeight: 1, color: "var(--red)" }} data-testid="text-criticals">{checkMutation.data.summary.criticals}</div>
                        <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em" }}>Critical</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Insurance gap alert */}
              {(checkMutation.data.summary.verdict === "COMPLIANT" || checkMutation.data.summary.verdict === "COMPLIANT_WITH_NOTES") && (
                <div style={{ margin: "0 24px" }}>
                  <InsuranceGapAlert />
                </div>
              )}

              {/* Field-by-field Results */}
              <div style={wcS}>
                <div style={wcHeadS}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 8 }}>
                      📊 Field-by-Field Results
                    </div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                      Ref: TT-LC-{new Date().getFullYear()}-{checkMutation.data.integrityHash.substring(0, 6)} · {new Date(checkMutation.data.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>

                {/* Critical results */}
                {checkMutation.data.results.filter(r => r.severity === "RED").length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                      🔴 Critical — Bank will reject
                    </div>
                    {checkMutation.data.results.filter(r => r.severity === "RED").map((r, i) => (
                      <div key={`fail-${i}`} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "10px 12px", borderRadius: 9, marginBottom: 5,
                        background: "#fff5f5", border: "1px solid #f5c0c0",
                      }} data-testid={`result-item-fail-${i}`}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)", flexShrink: 0, marginTop: 5 }} />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111", marginBottom: 2 }}>{r.fieldName} — {r.documentType}</div>
                          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                            LC: <span style={{ color: "#2e8662", fontWeight: 600 }}>"{r.lcValue}"</span> · Doc: <span style={{ color: "var(--amber)", fontWeight: 600 }}>"{r.documentValue}"</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{r.explanation}</div>
                          <span style={{
                            display: "inline-block", fontSize: 10, color: "var(--teal)",
                            background: "rgba(46,134,98,0.1)", padding: "1px 7px", borderRadius: 20,
                            marginTop: 3, fontWeight: 600,
                          }}>{r.ucpRule}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warning results */}
                {checkMutation.data.results.filter(r => r.severity === "AMBER").length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                      🟡 Warnings
                    </div>
                    {checkMutation.data.results.filter(r => r.severity === "AMBER").map((r, i) => (
                      <div key={`warn-${i}`} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "10px 12px", borderRadius: 9, marginBottom: 5,
                        background: "#fffaf3", border: "1px solid #f5ddb0",
                      }} data-testid={`result-item-warn-${i}`}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--amber)", flexShrink: 0, marginTop: 5 }} />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111", marginBottom: 2 }}>{r.fieldName} — {r.documentType}</div>
                          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                            LC: <span style={{ color: "#2e8662", fontWeight: 600 }}>"{r.lcValue}"</span> · Doc: <span style={{ color: "var(--amber)", fontWeight: 600 }}>"{r.documentValue}"</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{r.explanation}</div>
                          <span style={{
                            display: "inline-block", fontSize: 10, color: "var(--teal)",
                            background: "rgba(46,134,98,0.1)", padding: "1px 7px", borderRadius: 20,
                            marginTop: 3, fontWeight: 600,
                          }}>{r.ucpRule}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Matched results */}
                {checkMutation.data.results.filter(r => r.severity === "GREEN").length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                      🟢 Matched
                    </div>
                    {checkMutation.data.results.filter(r => r.severity === "GREEN").map((r, i) => (
                      <div key={`ok-${i}`} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "10px 12px", borderRadius: 9, marginBottom: 5,
                        background: "#f2faf4", border: "1px solid #d0ecd8",
                      }} data-testid={`result-item-ok-${i}`}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", flexShrink: 0, marginTop: 5 }} />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111", marginBottom: 2 }}>{r.fieldName}</div>
                          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                            {r.explanation || "All fields match LC terms ✓"}
                          </div>
                          {r.ucpRule && (
                            <span style={{
                              display: "inline-block", fontSize: 10, color: "var(--teal)",
                              background: "rgba(46,134,98,0.1)", padding: "1px 7px", borderRadius: 20,
                              marginTop: 3, fontWeight: 600,
                            }}>{r.ucpRule}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Correction Email Card */}
              {checkMutation.data.summary.criticals > 0 && checkMutation.data.correctionEmail && (
                <div style={wcS}>
                  <div style={wcHeadS}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", display: "flex", alignItems: "center", gap: 8 }}>
                        ✉️ Supplier Correction Request
                      </div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                        Ready to send — {checkMutation.data.summary.criticals} correction{checkMutation.data.summary.criticals > 1 ? "s" : ""} needed
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: "#f7f7f7", borderRadius: 10, padding: "16px 18px",
                    border: "1px solid #e8e8e8",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                        {checkMutation.data.summary.criticals} amendment{checkMutation.data.summary.criticals > 1 ? "s" : ""} required
                      </div>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          onClick={() => setCorrectionTab("email")}
                          style={{
                            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                            cursor: "pointer", transition: "all 0.15s", border: "none",
                            background: correctionTab === "email" ? "rgba(66,126,255,0.1)" : "transparent",
                            color: correctionTab === "email" ? "#427EFF" : "#999",
                          }}
                          data-testid="button-correction-email-tab"
                        >
                          📋 Email
                        </button>
                        <button
                          onClick={() => setCorrectionTab("whatsapp")}
                          style={{
                            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                            cursor: "pointer", transition: "all 0.15s", border: "none",
                            background: correctionTab === "whatsapp" ? "rgba(74,140,111,0.1)" : "transparent",
                            color: correctionTab === "whatsapp" ? "var(--green)" : "#999",
                          }}
                          data-testid="button-correction-whatsapp-tab"
                        >
                          💬 WhatsApp
                        </button>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12, color: "#666", lineHeight: 1.75,
                        whiteSpace: "pre-wrap", maxHeight: 160, overflowY: "auto",
                      }}
                      data-testid={`text-correction-${correctionTab}`}
                    >
                      {correctionTab === "email" ? (checkMutation.data.correctionEmail || "") : (checkMutation.data.correctionWhatsApp || "")}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                    <CopyBtn
                      text={correctionTab === "email" ? (checkMutation.data.correctionEmail || "") : (checkMutation.data.correctionWhatsApp || "")}
                      label={`correction-${correctionTab}`}
                    />
                  </div>
                </div>
              )}

              {/* Integrity reference block */}
              <div style={{ background: "#f7f7f7", borderRadius: 9, padding: "14px 16px", marginBottom: 12, border: "1px solid #e8e8e8" }}>
                <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
                  <Hash size={18} style={{ color: "#999", flexShrink: 0, marginTop: 1 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }} data-testid="text-lc-check-ref">
                      LC check ref: TT-LC-{new Date().getFullYear()}-{checkMutation.data.integrityHash.substring(0, 6).toUpperCase()}
                    </p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#999", wordBreak: "break-all" }} data-testid="text-lc-integrity-hash">
                      Integrity hash: sha256:{checkMutation.data.integrityHash}
                    </p>
                    <p style={{ fontSize: 11, color: "#999" }} data-testid="text-lc-check-timestamp">
                      Checked: {new Date(checkMutation.data.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 0", margin: "4px 0 0" }}>
                <button
                  onClick={() => goStep(2)}
                  style={btnGreenS(true)}
                >
                  Upload Corrected Docs →
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    checkMutation.reset();
                    setShowCorrection(false);
                    setLcFields({
                      beneficiaryName: "", applicantName: "", goodsDescription: "", hsCode: "",
                      quantity: 0, quantityUnit: "MT", unitPrice: 0, currency: "USD", totalAmount: 0,
                      countryOfOrigin: "", portOfLoading: "", portOfDischarge: "",
                      latestShipmentDate: "", lcExpiryDate: "", incoterms: "FOB",
                      partialShipmentsAllowed: false, transhipmentAllowed: false, lcReference: "",
                    });
                    setDocuments([{ documentType: "commercial_invoice", fields: {} }]);
                    setActiveDocTab(0);
                  }}
                  style={btnGreyS}
                  data-testid="button-new-check"
                >
                  New Check
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Error display */}
        {checkMutation.isError && checkMutation.error.message !== "Insufficient tokens" && step !== 4 && (
          <div style={{
            margin: "14px 14px 0",
            background: "rgba(218,60,61,0.08)", border: "1px solid rgba(218,60,61,0.2)",
            borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <XCircle size={18} style={{ color: "var(--red)", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "var(--red)" }}>{checkMutation.error.message}</p>
          </div>
        )}

        {/* Token modal */}
        <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trade Pack Required</DialogTitle>
              <DialogDescription>
                LC checks are included in every trade pack. Purchase a trade pack to run your LC check.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end flex-wrap">
              <Button variant="outline" onClick={() => setShowTokenModal(false)} data-testid="button-lc-modal-cancel">
                Cancel
              </Button>
              <Button onClick={() => navigate("/pricing")} data-testid="button-lc-modal-buy-tokens">
                Buy Trade Pack
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recheck modal */}
        <Dialog open={showRecheckModal} onOpenChange={setShowRecheckModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>LC Re-check Required</DialogTitle>
              <DialogDescription>
                You've already run an LC check for this trade. Re-check after supplier corrections — $9.99.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end flex-wrap">
              <Button variant="outline" onClick={() => setShowRecheckModal(false)} data-testid="button-recheck-modal-cancel">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const res = await apiRequest("POST", "/api/tokens/lc-recheck-checkout", {
                      sourceLookupId: recheckLookupId,
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  } catch {
                    navigate("/pricing");
                  }
                }}
                data-testid="button-recheck-modal-pay"
              >
                Pay $9.99 and re-check
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
      )}
    </AppShell>
  );
}
