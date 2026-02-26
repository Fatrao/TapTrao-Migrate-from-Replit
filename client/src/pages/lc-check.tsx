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

  const req = <span className="req">*</span>;

  const goStep = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const docLabel = (dt: string) => DOC_TYPES.find(d => d.value === dt)?.label ?? dt;

  return (
    <AppShell
      contentClassName="content-area"
      topCenter={
        <>
          <Link href="/dashboard"><a>Dashboard</a></Link>
          <Link href="/lookup"><a>Commodities</a></Link>
          <Link href="/inbox"><a>Suppliers</a></Link>
          <Link href="/lc-check"><a className="active">Compliance</a></Link>
          <Link href="/inbox"><a>Messages</a></Link>
        </>
      }
    >
      {lcActiveTab === "Supplier docs" ? (
        <SupplierDocsTab prefillData={prefillData} />
      ) : lcActiveTab === "TwinLog Trail" ? (
        <TwinLogTrailTab prefillData={prefillData} />
      ) : lcActiveTab === "Corrections" ? (
        <div style={{ padding: "80px 24px", textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
          Coming in the next update.
        </div>
      ) : (
      <div data-testid="lc-check-page">

        {/* ═══════ HERO — matches design ref .green-hero-box ═══════ */}
        <div className="green-hero-box">
          <div className="hero-row">
            <div className="breadcrumb">Compliance › LC Check › New Check</div>
            <div className="price-pill" data-testid="text-lc-title">
              {isFreeCheck ? "FREE" : "$19.99 per check"}
            </div>
          </div>
          <h1>LC Document<br />Checker</h1>
          <p className="subtitle">
            Cross-check supplier docs against your LC — UCP 600 &amp; ISBP 745 applied.
          </p>
        </div>

        {/* ═══════ STEPPER — matches design ref .step-bar ═══════ */}
        <div className="step-bar">
          {([
            { n: 1, label: "LC Terms" },
            { n: 2, label: "Supplier Docs" },
            { n: 3, label: "Review" },
            { n: 4, label: "Results" },
          ] as const).map((s, i, arr) => (
            <div key={s.n} style={{ display: "contents" }}>
              <div className={`step ${step >= s.n ? "active" : "inactive"}`}>
                <div className="step-number" data-testid={`step-indicator-${s.n}`}>
                  {step > s.n ? "✓" : s.n}
                </div>
                <div className="step-label">{s.label}</div>
              </div>
              {i < arr.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* Prefill Banner */}
        {showPrefillBanner && prefillData && (
          <div className="upload-note" style={{ margin: "14px 32px 0" }} data-testid="banner-lc-prefill">
            <ExternalLink size={18} style={{ color: "#4ade80", flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#4ade80" }} data-testid="text-prefill-info">
                Pre-filled from your compliance lookup
              </p>
              <p style={{ fontSize: 13, color: "var(--card-body)" }}>
                {prefillData.commodity_name} — {prefillData.origin_name} → {prefillData.dest_name}
              </p>
              {prefillData.lookup_id && (
                <Link
                  href="/trades"
                  style={{ fontSize: 11, color: "#4ade80", textDecoration: "underline", marginTop: 4, display: "inline-block" }}
                  data-testid="link-view-lookup"
                >
                  View lookup →
                </Link>
              )}
            </div>
            <button
              onClick={() => setShowPrefillBanner(false)}
              style={{ color: "var(--card-muted)", background: "none", border: "none", cursor: "pointer" }}
              data-testid="button-dismiss-prefill-banner"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ═══════ STEP 1 — LC Terms ═══════ */}
        {step === 1 && (
          <>
            <div className="form-card">
              <div className="form-card-header"><span>📋</span><h2>Letter of Credit — Key Terms</h2></div>
              <p className="form-card-subtitle">Enter exactly as they appear on your LC.</p>

              {/* Row 1: LC Reference + Issuing Bank */}
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>LC Reference</label>
                  <input type="text"
                    value={lcFields.lcReference}
                    onChange={e => updateLcField("lcReference", e.target.value)}
                    placeholder="e.g. LC/2026/0001234"
                    data-testid="input-lc-reference"
                  />
                </div>
                <div className="form-group">
                  <label>Issuing Bank</label>
                  <input type="text" placeholder="e.g. Société Générale, Abidjan" />
                </div>
              </div>

              {/* Row 2: Beneficiary + Applicant */}
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>Beneficiary (Supplier) {req}</label>
                  <input type="text"
                    value={lcFields.beneficiaryName}
                    onChange={e => updateLcField("beneficiaryName", e.target.value)}
                    placeholder="Exact name as on LC"
                    data-testid="input-beneficiary-name"
                  />
                </div>
                <div className="form-group">
                  <label>Applicant (Buyer) {req}</label>
                  <input type="text"
                    value={lcFields.applicantName}
                    onChange={e => updateLcField("applicantName", e.target.value)}
                    placeholder="Exact name as on LC"
                    data-testid="input-applicant-name"
                  />
                </div>
              </div>

              {/* Goods Description (full width) */}
              <div className="form-row cols-1">
                <div className="form-group">
                  <label>Goods Description {req}</label>
                  <input type="text"
                    value={lcFields.goodsDescription}
                    onChange={e => updateLcField("goodsDescription", e.target.value)}
                    placeholder="e.g. Raw Cashew Nuts in shell, crop 2025/26"
                    data-testid="input-goods-description"
                  />
                </div>
              </div>

              {/* 3-col: Quantity, LC Amount, Currency */}
              <div className="form-row cols-3">
                <div className="form-group">
                  <label>Quantity {req}</label>
                  <input type="text"
                    value={lcFields.quantity || ""}
                    onChange={e => updateLcField("quantity", parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 500 MT"
                    data-testid="input-quantity"
                  />
                </div>
                <div className="form-group">
                  <label>LC Amount {req}</label>
                  <input type="number"
                    value={lcFields.totalAmount || ""}
                    onChange={e => updateLcField("totalAmount", parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 250,000.00"
                    data-testid="input-total-amount"
                  />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={lcFields.currency}
                    onChange={e => updateLcField("currency", e.target.value)}
                    data-testid="select-currency"
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* 3-col: Ports + Country of Origin */}
              <div className="form-row cols-3">
                <div className="form-group">
                  <label>Port of Loading</label>
                  <input type="text"
                    value={lcFields.portOfLoading}
                    onChange={e => updateLcField("portOfLoading", e.target.value)}
                    placeholder="e.g. Abidjan"
                    data-testid="input-port-loading"
                  />
                </div>
                <div className="form-group">
                  <label>Port of Discharge</label>
                  <input type="text"
                    value={lcFields.portOfDischarge}
                    onChange={e => updateLcField("portOfDischarge", e.target.value)}
                    placeholder="e.g. Felixstowe"
                    data-testid="input-port-discharge"
                  />
                </div>
                <div className="form-group">
                  <label>Country of Origin</label>
                  <input type="text"
                    value={lcFields.countryOfOrigin}
                    onChange={e => updateLcField("countryOfOrigin", e.target.value)}
                    placeholder="e.g. Côte d'Ivoire"
                    data-testid="input-country-origin"
                  />
                </div>
              </div>

              {/* 3-col: Dates + Incoterms */}
              <div className="form-row cols-3">
                <div className="form-group">
                  <label>Latest Shipment Date {req}</label>
                  <input type="date"
                    value={lcFields.latestShipmentDate}
                    onChange={e => updateLcField("latestShipmentDate", e.target.value)}
                    data-testid="input-latest-shipment-date"
                  />
                </div>
                <div className="form-group">
                  <label>LC Expiry Date {req}</label>
                  <input type="date"
                    value={lcFields.lcExpiryDate}
                    onChange={e => updateLcField("lcExpiryDate", e.target.value)}
                    data-testid="input-lc-expiry-date"
                  />
                </div>
                <div className="form-group">
                  <label>Incoterms</label>
                  <select
                    value={lcFields.incoterms}
                    onChange={e => updateLcField("incoterms", e.target.value)}
                    data-testid="select-incoterms"
                  >
                    {INCOTERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* 3-col: HS Code, Unit Price, Quantity Unit */}
              <div className="form-row cols-3">
                <div className="form-group">
                  <label>HS Code</label>
                  <input type="text"
                    value={lcFields.hsCode}
                    onChange={e => updateLcField("hsCode", e.target.value)}
                    placeholder="e.g. 1801.00"
                    data-testid="input-hs-code"
                  />
                </div>
                <div className="form-group">
                  <label>Unit Price</label>
                  <input type="number"
                    value={lcFields.unitPrice || ""}
                    onChange={e => updateLcField("unitPrice", parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 2500"
                    data-testid="input-unit-price"
                  />
                </div>
                <div className="form-group">
                  <label>Quantity Unit</label>
                  <select
                    value={lcFields.quantityUnit}
                    onChange={e => updateLcField("quantityUnit", e.target.value)}
                    data-testid="select-quantity-unit"
                  >
                    {QUANTITY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Toggle: Partial Shipments — matches design ref .toggle-row */}
              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Partial Shipments Allowed</h4>
                  <p>UCP 600 Art. 31</p>
                </div>
                <label className="lc-tog">
                  <input type="checkbox"
                    checked={lcFields.partialShipmentsAllowed}
                    onChange={e => updateLcField("partialShipmentsAllowed", e.target.checked)}
                    data-testid="select-partial-shipments"
                  />
                  <span className="lc-tog-sl" />
                </label>
              </div>

              {/* Toggle: Transhipment */}
              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Transhipment Allowed</h4>
                  <p>UCP 600 Art. 20</p>
                </div>
                <label className="lc-tog">
                  <input type="checkbox"
                    checked={lcFields.transhipmentAllowed}
                    onChange={e => updateLcField("transhipmentAllowed", e.target.checked)}
                    data-testid="select-transhipment"
                  />
                  <span className="lc-tog-sl" />
                </label>
              </div>
            </div>

            {/* Upload Card — matches design ref .upload-card */}
            <div className="upload-card">
              <div className="upload-card-header"><span>📎</span><h2>Or Upload LC as PDF</h2></div>
              <p className="upload-card-subtitle">Attach your LC document for reference alongside manual entry.</p>
              <div className="upload-zone">
                <div className="upload-icon">📄</div>
                <div className="upload-title">Drop your LC here</div>
                <div className="upload-link">Browse or drop PDF</div>
              </div>
              <div className="upload-note">
                💡 <span><strong>Auto-extraction coming soon</strong> — enter fields manually for now.</span>
              </div>
            </div>

            {/* Step 1 buttons — matches design ref .action-row */}
            <div className="action-row">
              <button
                className="btn-primary"
                disabled={!canProceedStep1}
                onClick={() => goStep(2)}
                data-testid="button-next-step-2"
              >
                Continue to Supplier Docs →
              </button>
              <button className="btn-secondary">Save Draft</button>
            </div>
          </>
        )}

        {/* ═══════ STEP 2 — Supplier Docs ═══════ */}
        {step === 2 && (
          <>
            <div className="form-card">
              <div className="form-card-header"><span>📦</span><h2>Supplier Documents</h2></div>
              <p className="form-card-subtitle">Enter the key fields from each supplier document. Add up to 6 documents.</p>

              {/* Document Tabs */}
              <div className="lc-doc-tabs">
                {documents.map((doc, i) => (
                  <div
                    key={i}
                    className={`lc-dt${activeDocTab === i ? " active" : ""}`}
                    onClick={() => setActiveDocTab(i)}
                    data-testid={`button-doc-tab-${i}`}
                  >
                    <span className="lc-dtn">{i + 1}</span>
                    {docLabel(doc.documentType)}
                  </div>
                ))}
                {documents.length < 6 && (
                  <div className="lc-dt-add" onClick={addDocument} data-testid="button-add-document">
                    + Add doc
                  </div>
                )}
              </div>

              {/* Active document fields */}
              {documents[activeDocTab] && (
                <div>
                  {/* Document Type selector */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 13 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Document Type</label>
                      <select
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
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#da3c3d", marginTop: 18, padding: 6 }}
                        data-testid="button-remove-document"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dynamic fields */}
                  <div className="form-row cols-2">
                    {getDocFields(documents[activeDocTab].documentType).map(field => (
                      <div key={field.key} className="form-group">
                        <label>{field.label}</label>
                        <input
                          type={field.type}
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

            {/* Step 2 buttons */}
            <div className="action-row">
              <button
                className="btn-primary"
                disabled={!canProceedStep2}
                onClick={() => goStep(3)}
                data-testid="button-next-step-3"
              >
                Continue to Review →
              </button>
              <button className="btn-secondary" onClick={() => goStep(1)}>
                ← Back
              </button>
            </div>
          </>
        )}

        {/* ═══════ STEP 3 — Review ═══════ */}
        {step === 3 && (
          <>
            <div className="form-card">
              <div className="form-card-header"><span>🔍</span><h2>Review Before Check</h2></div>
              <p className="form-card-subtitle">Correct any errors now — changes cannot be made after the credit is consumed.</p>

              {/* Warning note */}
              <div className="upload-note" style={{ marginBottom: 20 }}>
                ⚠️ <span>Check all extracted fields carefully. Confirm dates and names match exactly what's on your LC.</span>
              </div>

              {/* Summary fields in 2-col */}
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>LC Reference</label>
                  <input type="text" value={lcFields.lcReference} readOnly style={{ background: "#fff" }} />
                </div>
                <div className="form-group">
                  <label>Beneficiary</label>
                  <input type="text" value={lcFields.beneficiaryName} readOnly style={{ background: "#fff" }} />
                </div>
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>LC Amount</label>
                  <input type="text" value={`${lcFields.currency} ${lcFields.totalAmount.toLocaleString()}`} readOnly style={{ background: "#fff" }} />
                </div>
                <div className="form-group">
                  <label>Goods Description</label>
                  <input type="text" value={lcFields.goodsDescription} readOnly style={{ background: "#fff" }} />
                </div>
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>Latest Shipment Date</label>
                  <input type="text" value={lcFields.latestShipmentDate} readOnly style={{ background: "#fff" }} />
                </div>
                <div className="form-group">
                  <label>LC Expiry Date</label>
                  <input type="text" value={lcFields.lcExpiryDate} readOnly style={{ background: "#fff" }} />
                </div>
              </div>

              {/* Documents summary */}
              <div style={{ background: "#f7f7f7", borderRadius: 9, padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--card-label)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, width: "100%" }}>
                  Documents
                </div>
                {documents.map((doc, i) => (
                  <span key={i} className="lc-doc-badge filled">
                    ✓ {docLabel(doc.documentType)}
                  </span>
                ))}
              </div>
            </div>

            {/* Step 3 buttons */}
            <div className="action-row">
              <button
                className="btn-primary"
                disabled={checkMutation.isPending}
                onClick={() => {
                  checkMutation.mutate(undefined, {
                    onSuccess: () => goStep(4),
                  });
                }}
                data-testid="button-run-lc-check"
              >
                {checkMutation.isPending
                  ? "⏳ Checking..."
                  : isFreeCheck
                  ? "▶ Run LC Check — Free"
                  : "▶ Run LC Check — $19.99"}
              </button>
              <button className="btn-secondary" onClick={() => goStep(2)}>
                ← Back
              </button>
            </div>
          </>
        )}

        {/* ═══════ STEP 4 — Results ═══════ */}
        {step === 4 && checkMutation.data && (
          <div data-testid="section-lc-results">

            {/* Verdict banner */}
            {(() => {
              const v = checkMutation.data.summary.verdict;
              const cls = v === "COMPLIANT" ? "ok" : v === "COMPLIANT_WITH_NOTES" ? "warn" : "fail";
              return (
                <div className={`lc-verdict ${cls}`} style={{ margin: "0 32px 24px" }}>
                  <span className="lc-v-ic">
                    {cls === "fail" ? "🔴" : cls === "warn" ? "⚠️" : "✅"}
                  </span>
                  <div>
                    <div className="lc-v-title">
                      {cls === "fail" ? "Discrepancies Found" : cls === "warn" ? "Compliant With Notes" : "Fully Compliant"}
                    </div>
                    <div className="lc-v-sub">
                      {checkMutation.data.summary.criticals > 0
                        ? `${checkMutation.data.summary.criticals} critical issue${checkMutation.data.summary.criticals > 1 ? "s" : ""} will cause bank rejection.`
                        : checkMutation.data.summary.warnings > 0
                        ? `${checkMutation.data.summary.warnings} warning${checkMutation.data.summary.warnings > 1 ? "s" : ""} to review.`
                        : "All fields match LC terms."}
                    </div>
                  </div>
                  <div className="lc-v-stats">
                    <div className="lc-vs">
                      <div className="lc-vs-n g" data-testid="text-matches">{checkMutation.data.summary.matches}</div>
                      <div className="lc-vs-l">Match</div>
                    </div>
                    <div className="lc-vs">
                      <div className="lc-vs-n a" data-testid="text-warnings">{checkMutation.data.summary.warnings}</div>
                      <div className="lc-vs-l">Warning</div>
                    </div>
                    <div className="lc-vs">
                      <div className="lc-vs-n r" data-testid="text-criticals">{checkMutation.data.summary.criticals}</div>
                      <div className="lc-vs-l">Critical</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Insurance gap alert */}
            {(checkMutation.data.summary.verdict === "COMPLIANT" || checkMutation.data.summary.verdict === "COMPLIANT_WITH_NOTES") && (
              <div style={{ margin: "0 32px" }}>
                <InsuranceGapAlert />
              </div>
            )}

            {/* Field-by-field Results */}
            <div className="form-card">
              <div className="form-card-header"><span>📊</span><h2>Field-by-Field Results</h2></div>
              <p className="form-card-subtitle">
                Ref: TT-LC-{new Date().getFullYear()}-{checkMutation.data.integrityHash.substring(0, 6)} · {new Date(checkMutation.data.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>

              {/* Critical results */}
              {checkMutation.data.results.filter(r => r.severity === "RED").length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--card-label)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                    🔴 Critical — Bank will reject
                  </div>
                  {checkMutation.data.results.filter(r => r.severity === "RED").map((r, i) => (
                    <div key={`fail-${i}`} className="lc-rr fail" data-testid={`result-item-fail-${i}`}>
                      <div className="lc-rr-dot fail" />
                      <div>
                        <div className="lc-rr-field">{r.fieldName} — {r.documentType}</div>
                        <div className="lc-rr-detail">
                          LC: <span className="lc-rr-lc">"{r.lcValue}"</span> · Doc: <span className="lc-rr-doc">"{r.documentValue}"</span>
                        </div>
                        <div className="lc-rr-detail">{r.explanation}</div>
                        <span className="lc-rr-rule">{r.ucpRule}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Warning results */}
              {checkMutation.data.results.filter(r => r.severity === "AMBER").length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--card-label)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                    🟡 Warnings
                  </div>
                  {checkMutation.data.results.filter(r => r.severity === "AMBER").map((r, i) => (
                    <div key={`warn-${i}`} className="lc-rr warn" data-testid={`result-item-warn-${i}`}>
                      <div className="lc-rr-dot warn" />
                      <div>
                        <div className="lc-rr-field">{r.fieldName} — {r.documentType}</div>
                        <div className="lc-rr-detail">
                          LC: <span className="lc-rr-lc">"{r.lcValue}"</span> · Doc: <span className="lc-rr-doc">"{r.documentValue}"</span>
                        </div>
                        <div className="lc-rr-detail">{r.explanation}</div>
                        <span className="lc-rr-rule">{r.ucpRule}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Matched results */}
              {checkMutation.data.results.filter(r => r.severity === "GREEN").length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--card-label)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                    🟢 Matched
                  </div>
                  {checkMutation.data.results.filter(r => r.severity === "GREEN").map((r, i) => (
                    <div key={`ok-${i}`} className="lc-rr ok" data-testid={`result-item-ok-${i}`}>
                      <div className="lc-rr-dot ok" />
                      <div>
                        <div className="lc-rr-field">{r.fieldName}</div>
                        <div className="lc-rr-detail">
                          {r.explanation || "All fields match LC terms ✓"}
                        </div>
                        {r.ucpRule && <span className="lc-rr-rule">{r.ucpRule}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Correction Email Card */}
            {checkMutation.data.summary.criticals > 0 && checkMutation.data.correctionEmail && (
              <div className="form-card">
                <div className="form-card-header"><span>✉️</span><h2>Supplier Correction Request</h2></div>
                <p className="form-card-subtitle">
                  Ready to send — {checkMutation.data.summary.criticals} correction{checkMutation.data.summary.criticals > 1 ? "s" : ""} needed
                </p>

                <div style={{ background: "#f7f7f7", borderRadius: 10, padding: "16px 18px", border: "1px solid #e8e8e8" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                      {checkMutation.data.summary.criticals} amendment{checkMutation.data.summary.criticals > 1 ? "s" : ""} required
                    </div>
                    <div className="lc-copy-btns">
                      <button
                        className={`lc-copy-btn email`}
                        onClick={() => setCorrectionTab("email")}
                        style={correctionTab !== "email" ? { opacity: 0.5 } : {}}
                        data-testid="button-correction-email-tab"
                      >
                        📋 Email
                      </button>
                      <button
                        className={`lc-copy-btn whatsapp`}
                        onClick={() => setCorrectionTab("whatsapp")}
                        style={correctionTab !== "whatsapp" ? { opacity: 0.5 } : {}}
                        data-testid="button-correction-whatsapp-tab"
                      >
                        💬 WhatsApp
                      </button>
                    </div>
                  </div>
                  <div className="lc-email-box" data-testid={`text-correction-${correctionTab}`}>
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
            <div style={{ background: "var(--card-inset)", borderRadius: 9, padding: "14px 16px", margin: "0 32px 12px", border: "1px solid var(--card-inset-border)" }}>
              <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
                <Hash size={18} style={{ color: "var(--card-muted)", flexShrink: 0, marginTop: 1 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }} data-testid="text-lc-check-ref">
                    LC check ref: TT-LC-{new Date().getFullYear()}-{checkMutation.data.integrityHash.substring(0, 6).toUpperCase()}
                  </p>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--card-muted)", wordBreak: "break-all" }} data-testid="text-lc-integrity-hash">
                    Integrity hash: sha256:{checkMutation.data.integrityHash}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--card-muted)" }} data-testid="text-lc-check-timestamp">
                    Checked: {new Date(checkMutation.data.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="action-row">
              <button className="btn-primary" onClick={() => goStep(2)}>
                Upload Corrected Docs →
              </button>
              <button
                className="btn-secondary"
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
                data-testid="button-new-check"
              >
                New Check
              </button>
            </div>

          </div>
        )}

        {/* Error display */}
        {checkMutation.isError && checkMutation.error.message !== "Insufficient tokens" && step !== 4 && (
          <div className="lc-verdict fail" style={{ margin: "14px 32px 0" }}>
            <XCircle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#ef4444" }}>{checkMutation.error.message}</p>
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
