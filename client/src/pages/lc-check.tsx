import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
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
import { CorrectionsTab } from "./lc-check/CorrectionsTab";


export default function LcCheck() {
  const { t } = useTranslation("lcCheck");
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
    issuingBank: "",
    advisingBank: "",
    issuingBankSwift: "",
    advisingBankSwift: "",
    tolerancePercent: 5,
  });

  const [documents, setDocuments] = useState<LcDocument[]>([
    { documentType: "commercial_invoice", fields: {} },
  ]);

  const [activeDocTab, setActiveDocTab] = useState(0);
  const [lcPdfFile, setLcPdfFile] = useState<UploadedFile | null>(null);
  const [docFiles, setDocFiles] = useState<Record<number, UploadedFile | null>>({});

  // Loaded existing results (when navigating from My Trades to an existing case)
  const [loadedResults, setLoadedResults] = useState<LcCheckResponse | null>(null);

  // LC extraction state
  type FieldConfidence = "high" | "medium" | "low";
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "extracting" | "done" | "error">("idle");
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [fieldConfidence, setFieldConfidence] = useState<Record<string, FieldConfidence>>({});
  const [extractionStats, setExtractionStats] = useState<{ count: number; total: number } | null>(null);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);

  // Per-document extraction state (Step 2)
  const [docExtractionStatus, setDocExtractionStatus] = useState<Record<number, "idle" | "extracting" | "done" | "error">>({});
  const [docExtractionError, setDocExtractionError] = useState<Record<number, string | null>>({});
  const [docFieldConfidence, setDocFieldConfidence] = useState<Record<number, Record<string, FieldConfidence>>>({});

  const handleLcExtraction = useCallback(async (file: File) => {
    setLcPdfFile({ file, name: file.name, size: file.size });
    setExtractionStatus("extracting");
    setExtractionError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "lc_terms");

      const res = await fetch("/api/lc-extract", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setExtractionStatus("error");
        setExtractionError(data.error || "Extraction failed");
        return;
      }

      if (data.fields) {
        const fields = data.fields as Record<string, { value: string | number | boolean; confidence: FieldConfidence }>;
        const confidenceMap: Record<string, FieldConfidence> = {};
        let filledCount = 0;
        const totalFields = Object.keys(fields).length;

        setLcFields(prev => {
          const updated = { ...prev };
          for (const [key, field] of Object.entries(fields)) {
            if (key in updated && field.value !== undefined && field.value !== null && field.value !== "") {
              (updated as any)[key] = field.value;
              confidenceMap[key] = field.confidence;
              filledCount++;
            }
          }
          return updated;
        });

        setFieldConfidence(confidenceMap);
        setExtractionStats({ count: filledCount, total: 18 });
        setExtractionWarnings(data.warnings || []);
        setExtractionStatus("done");
      } else {
        setExtractionStatus("error");
        setExtractionError(data.error || "No fields could be extracted");
      }
    } catch (err: any) {
      setExtractionStatus("error");
      setExtractionError(err.message || "Extraction failed");
    }
  }, []);

  const handleDocExtraction = useCallback(async (file: File, docIndex: number, documentType: string) => {
    setDocFiles(prev => ({ ...prev, [docIndex]: { file, name: file.name, size: file.size } }));
    setDocExtractionStatus(prev => ({ ...prev, [docIndex]: "extracting" }));
    setDocExtractionError(prev => ({ ...prev, [docIndex]: null }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const res = await fetch("/api/lc-extract", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setDocExtractionStatus(prev => ({ ...prev, [docIndex]: "error" }));
        setDocExtractionError(prev => ({ ...prev, [docIndex]: data.error || "Extraction failed" }));
        return;
      }

      if (data.fields) {
        const fields = data.fields as Record<string, { value: string | number | boolean; confidence: FieldConfidence }>;
        const confidenceMap: Record<string, FieldConfidence> = {};

        setDocuments(prev => prev.map((doc, i) => {
          if (i !== docIndex) return doc;
          const updatedFields = { ...doc.fields };
          for (const [key, field] of Object.entries(fields)) {
            if (field.value !== undefined && field.value !== null && field.value !== "") {
              updatedFields[key] = String(field.value);
              confidenceMap[key] = field.confidence;
            }
          }
          return { ...doc, fields: updatedFields };
        }));

        setDocFieldConfidence(prev => ({ ...prev, [docIndex]: confidenceMap }));
        setDocExtractionStatus(prev => ({ ...prev, [docIndex]: "done" }));
      } else {
        setDocExtractionStatus(prev => ({ ...prev, [docIndex]: "error" }));
        setDocExtractionError(prev => ({ ...prev, [docIndex]: data.error || "No fields extracted" }));
      }
    } catch (err: any) {
      setDocExtractionStatus(prev => ({ ...prev, [docIndex]: "error" }));
      setDocExtractionError(prev => ({ ...prev, [docIndex]: err.message || "Extraction failed" }));
    }
  }, []);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("lc_prefill");
      if (!stored) return;
      const data: LcPrefillData = JSON.parse(stored);
      sessionStorage.removeItem("lc_prefill");
      setPrefillData(data);
      setShowPrefillBanner(true);

      // If this is an existing case, fetch the results and jump to step 4
      if (data.load_existing && data.lookup_id) {
        fetch(`/api/lc-cases/by-lookup/${data.lookup_id}`, { credentials: "include" })
          .then(res => res.ok ? res.json() : null)
          .then(result => {
            if (result) {
              setLoadedResults(result as LcCheckResponse);
              setStep(4);
            }
          })
          .catch(() => {});
        return;
      }

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
  const freeLcCheckUsed = tokenQuery.data?.freeLcCheckUsed ?? false;
  const isFreeCheck = !freeLcCheckUsed;

  const checkMutation = useMutation<LcCheckResponse, Error, void>({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { lcFields, documents };
      if (prefillData?.lookup_id) {
        payload.sourceLookupId = prefillData.lookup_id;
      }
      const res = await fetch("/api/lc-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (res.status === 402) {
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

  // Use mutation data if available, otherwise fall back to loaded existing results
  const resultData = checkMutation.data || loadedResults;

  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionTab, setCorrectionTab] = useState<"email" | "whatsapp">("email");
  const [lcActiveTab, setLcActiveTab] = useState("Check");

  // Listen for re-check navigation event from CorrectionsTab
  useEffect(() => {
    const handler = () => {
      setLcActiveTab("Check");
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("lc-go-to-recheck", handler);
    return () => window.removeEventListener("lc-go-to-recheck", handler);
  }, []);

  const confidenceClass = (fieldKey: string) => fieldConfidence[fieldKey] ? `confidence-${fieldConfidence[fieldKey]}` : "";

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
        <CorrectionsTab prefillData={prefillData} />
      ) : (
      <div data-testid="lc-check-page">

        {/* ═══════ HERO — matches design ref .green-hero-box ═══════ */}
        <div className="green-hero-box">
          <div className="hero-row">
            <div className="breadcrumb">{t("breadcrumb")}</div>
            <div className="price-pill" data-testid="text-lc-title">
              {isFreeCheck ? t("priceFree") : t("priceCredit")}
            </div>
          </div>
          <h1>{t("heroTitle").split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}</h1>
          <p className="subtitle">
            {t("heroSubtitle")}
          </p>
        </div>

        {/* ═══════ STEPPER — matches design ref .step-bar ═══════ */}
        <div className="step-bar">
          {([
            { n: 1, label: t("step.lcTerms") },
            { n: 2, label: t("step.supplierDocs") },
            { n: 3, label: t("step.review") },
            { n: 4, label: t("step.results") },
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
            <ExternalLink size={18} style={{ color: "var(--app-acapulco)", flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--app-acapulco)" }} data-testid="text-prefill-info">
                {t("prefill.title")}
              </p>
              <p style={{ fontSize: 13, color: "var(--app-regent)" }}>
                {prefillData.commodity_name} — {prefillData.origin_name} → {prefillData.dest_name}
              </p>
              {prefillData.lookup_id && (
                <Link
                  href="/trades"
                  style={{ fontSize: 13, color: "var(--app-acapulco)", textDecoration: "underline", marginTop: 4, display: "inline-block" }}
                  data-testid="link-view-lookup"
                >
                  {t("prefill.viewLookup")}
                </Link>
              )}
            </div>
            <button
              onClick={() => setShowPrefillBanner(false)}
              style={{ color: "var(--app-regent)", background: "none", border: "none", cursor: "pointer" }}
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
              <div className="form-card-header"><span>📋</span><h2>{t("step1.formTitle")}</h2></div>
              <p className="form-card-subtitle">{t("step1.formSubtitle")}</p>

              {/* Row 1: LC Reference + Issuing Bank */}
              <div className="form-row cols-2">
                <div className={`form-group ${confidenceClass("lcReference")}`}>
                  <label>{t("step1.lcReference")}</label>
                  <input type="text"
                    value={lcFields.lcReference}
                    onChange={e => updateLcField("lcReference", e.target.value)}
                    placeholder="e.g. LC/2026/0001234"
                    data-testid="input-lc-reference"
                  />
                </div>
                <div className={`form-group ${confidenceClass("issuingBank")}`}>
                  <label>{t("step1.issuingBank")}</label>
                  <input type="text"
                    value={lcFields.issuingBank}
                    onChange={e => updateLcField("issuingBank", e.target.value)}
                    placeholder="e.g. Société Générale, Abidjan"
                    data-testid="input-issuing-bank"
                  />
                </div>
              </div>

              {/* Row 1b: Advising Bank + SWIFT Codes */}
              <div className="form-row cols-2">
                <div className={`form-group ${confidenceClass("advisingBank")}`}>
                  <label>{t("step1.advisingBank")}</label>
                  <input type="text"
                    value={lcFields.advisingBank}
                    onChange={e => updateLcField("advisingBank", e.target.value)}
                    placeholder="e.g. ABN AMRO Bank N.V."
                    data-testid="input-advising-bank"
                  />
                </div>
                <div className="form-row cols-2" style={{ gap: 12 }}>
                  <div className={`form-group ${confidenceClass("issuingBankSwift")}`}>
                    <label>{t("step1.issuingBankSwift")}</label>
                    <input type="text"
                      value={lcFields.issuingBankSwift}
                      onChange={e => updateLcField("issuingBankSwift", e.target.value.toUpperCase())}
                      placeholder="e.g. ATBKCIAB"
                      data-testid="input-issuing-swift"
                      style={{ fontFamily: "'Inter', sans-serif", letterSpacing: ".05em" }}
                    />
                  </div>
                  <div className={`form-group ${confidenceClass("advisingBankSwift")}`}>
                    <label>{t("step1.advisingBankSwift")}</label>
                    <input type="text"
                      value={lcFields.advisingBankSwift}
                      onChange={e => updateLcField("advisingBankSwift", e.target.value.toUpperCase())}
                      placeholder="e.g. ABNANL2A"
                      data-testid="input-advising-swift"
                      style={{ fontFamily: "'Inter', sans-serif", letterSpacing: ".05em" }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Beneficiary + Applicant */}
              <div className="form-row cols-2">
                <div className={`form-group ${confidenceClass("beneficiaryName")}`}>
                  <label>{t("step1.beneficiary")} {req}</label>
                  <input type="text"
                    value={lcFields.beneficiaryName}
                    onChange={e => updateLcField("beneficiaryName", e.target.value)}
                    placeholder="Exact name as on LC"
                    data-testid="input-beneficiary-name"
                  />
                </div>
                <div className={`form-group ${confidenceClass("applicantName")}`}>
                  <label>{t("step1.applicant")} {req}</label>
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
                <div className={`form-group ${confidenceClass("goodsDescription")}`}>
                  <label>{t("step1.goodsDescription")} {req}</label>
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
                <div className={`form-group ${confidenceClass("quantity")}`}>
                  <label>{t("step1.quantity")} {req}</label>
                  <input type="text"
                    value={lcFields.quantity || ""}
                    onChange={e => updateLcField("quantity", parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 500 MT"
                    data-testid="input-quantity"
                  />
                </div>
                <div className={`form-group ${confidenceClass("totalAmount")}`}>
                  <label>{t("step1.lcAmount")} {req}</label>
                  <input type="number"
                    value={lcFields.totalAmount || ""}
                    onChange={e => updateLcField("totalAmount", parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 250,000.00"
                    data-testid="input-total-amount"
                  />
                </div>
                <div className={`form-group ${confidenceClass("currency")}`}>
                  <label>{t("step1.currency")}</label>
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
                <div className={`form-group ${confidenceClass("portOfLoading")}`}>
                  <label>{t("step1.portOfLoading")}</label>
                  <input type="text"
                    value={lcFields.portOfLoading}
                    onChange={e => updateLcField("portOfLoading", e.target.value)}
                    placeholder="e.g. Abidjan"
                    data-testid="input-port-loading"
                  />
                </div>
                <div className={`form-group ${confidenceClass("portOfDischarge")}`}>
                  <label>{t("step1.portOfDischarge")}</label>
                  <input type="text"
                    value={lcFields.portOfDischarge}
                    onChange={e => updateLcField("portOfDischarge", e.target.value)}
                    placeholder="e.g. Felixstowe"
                    data-testid="input-port-discharge"
                  />
                </div>
                <div className={`form-group ${confidenceClass("countryOfOrigin")}`}>
                  <label>{t("step1.countryOfOrigin")}</label>
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
                <div className={`form-group ${confidenceClass("latestShipmentDate")}`}>
                  <label>{t("step1.latestShipmentDate")} {req}</label>
                  <input type="date"
                    value={lcFields.latestShipmentDate}
                    onChange={e => updateLcField("latestShipmentDate", e.target.value)}
                    data-testid="input-latest-shipment-date"
                  />
                </div>
                <div className={`form-group ${confidenceClass("lcExpiryDate")}`}>
                  <label>{t("step1.lcExpiryDate")} {req}</label>
                  <input type="date"
                    value={lcFields.lcExpiryDate}
                    onChange={e => updateLcField("lcExpiryDate", e.target.value)}
                    data-testid="input-lc-expiry-date"
                  />
                </div>
                <div className={`form-group ${confidenceClass("incoterms")}`}>
                  <label>{t("step1.incoterms")}</label>
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
                <div className={`form-group ${confidenceClass("hsCode")}`}>
                  <label>{t("step1.hsCode")}</label>
                  <input type="text"
                    value={lcFields.hsCode}
                    onChange={e => updateLcField("hsCode", e.target.value)}
                    placeholder="e.g. 1801.00"
                    data-testid="input-hs-code"
                  />
                </div>
                <div className={`form-group ${confidenceClass("unitPrice")}`}>
                  <label>{t("step1.unitPrice")}</label>
                  <input type="number"
                    value={lcFields.unitPrice || ""}
                    onChange={e => updateLcField("unitPrice", parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 2500"
                    data-testid="input-unit-price"
                  />
                </div>
                <div className={`form-group ${confidenceClass("quantityUnit")}`}>
                  <label>{t("step1.quantityUnit")}</label>
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
                  <h4>{t("step1.partialShipmentsAllowed")}</h4>
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
                  <h4>{t("step1.transhipmentAllowed")}</h4>
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

              {/* Quantity Tolerance — SWIFT 39A/39B */}
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>{t("step1.quantityTolerance")} <span style={{ fontSize: 13, color: "#888" }}>{t("step1.quantityToleranceHint")}</span></label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={lcFields.tolerancePercent ?? 5}
                  onChange={e => updateLcField("tolerancePercent", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  data-testid="select-tolerance"
                  style={{ maxWidth: 120 }}
                />
              </div>
            </div>

            {/* Upload Card — LC PDF extraction */}
            <div className="upload-card">
              <div className="upload-card-header"><span>📎</span><h2>{t("step1.upload.title")}</h2></div>
              <p className="upload-card-subtitle">{t("step1.upload.subtitle")}</p>

              {extractionStatus === "idle" && !lcPdfFile && (
                <UploadZone
                  icon="📄"
                  title={t("step1.upload.dropTitle")}
                  subtitle={t("step1.upload.dropSubtitle")}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onFileSelect={handleLcExtraction}
                />
              )}

              {extractionStatus === "extracting" && (
                <div className="upload-note" style={{ padding: "24px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }}>🔍</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#2a3d40", marginBottom: 4 }}>{t("step1.upload.extracting")}</div>
                  <div style={{ fontSize: 14, color: "#888" }}>{t("step1.upload.extractingTime")}</div>
                </div>
              )}

              {extractionStatus === "done" && lcPdfFile && (
                <>
                  <FilePill name={lcPdfFile.name} size={lcPdfFile.size} onRemove={() => {
                    setLcPdfFile(null);
                    setExtractionStatus("idle");
                    setFieldConfidence({});
                    setExtractionStats(null);
                    setExtractionWarnings([]);
                  }} />
                  <div className="upload-note" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                    🤖 <span dangerouslySetInnerHTML={{ __html: t("step1.upload.fieldsExtracted", { count: extractionStats?.count, total: extractionStats?.total }) }} />
                  </div>
                  {extractionWarnings.length > 0 && (
                    <div className="upload-note" style={{ background: "#fffbeb", borderColor: "#fde68a", marginTop: 6 }}>
                      ⚠️ <span>{extractionWarnings[0]}</span>
                    </div>
                  )}
                </>
              )}

              {extractionStatus === "error" && (
                <>
                  {lcPdfFile && (
                    <FilePill name={lcPdfFile.name} size={lcPdfFile.size} onRemove={() => {
                      setLcPdfFile(null);
                      setExtractionStatus("idle");
                      setExtractionError(null);
                    }} />
                  )}
                  <div className="upload-note" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
                    ❌ <span>{t("step1.upload.extractionFailed", { error: extractionError || "Extraction failed" })}</span>
                  </div>
                  {!lcPdfFile && (
                    <UploadZone
                      icon="📄"
                      title={t("step1.upload.tryAgain")}
                      subtitle={t("step1.upload.dropSubtitle")}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onFileSelect={handleLcExtraction}
                    />
                  )}
                </>
              )}
            </div>

            {/* Step 1 buttons — matches design ref .action-row */}
            <div className="action-row">
              <button
                className="btn-primary"
                disabled={!canProceedStep1}
                onClick={() => goStep(2)}
                data-testid="button-next-step-2"
              >
                {t("step1.continueToSupplierDocs")}
              </button>
              <button className="btn-secondary">{t("step1.saveDraft")}</button>
            </div>
          </>
        )}

        {/* ═══════ STEP 2 — Supplier Docs ═══════ */}
        {step === 2 && (
          <>
            <div className="form-card">
              <div className="form-card-header"><span>📦</span><h2>{t("step2.formTitle")}</h2></div>
              <p className="form-card-subtitle">{t("step2.formSubtitle")}</p>

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
                    {t("step2.addDoc")}
                  </div>
                )}
              </div>

              {/* Active document fields */}
              {documents[activeDocTab] && (
                <div>
                  {/* Document Type selector */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 13 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>{t("step2.documentType")}</label>
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

                  {/* Document upload extraction */}
                  {documents[activeDocTab].documentType !== "other" && (
                    <div style={{ marginBottom: 16 }}>
                      {(!docExtractionStatus[activeDocTab] || docExtractionStatus[activeDocTab] === "idle") && !docFiles[activeDocTab] && (
                        <UploadZone
                          icon="📄"
                          title={t("step2.uploadDoc", { docType: docLabel(documents[activeDocTab].documentType) })}
                          subtitle={t("step2.autoFillFromPdf")}
                          accept=".pdf,.jpg,.jpeg,.png"
                          onFileSelect={(file) => handleDocExtraction(file, activeDocTab, documents[activeDocTab].documentType)}
                        />
                      )}
                      {docExtractionStatus[activeDocTab] === "extracting" && (
                        <div className="upload-note" style={{ padding: "16px", textAlign: "center" }}>
                          <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>🔍</span>
                          <span style={{ fontWeight: 600 }}>{t("step2.extractingFields")}</span>
                        </div>
                      )}
                      {docExtractionStatus[activeDocTab] === "done" && docFiles[activeDocTab] && (
                        <>
                          <FilePill name={docFiles[activeDocTab]!.name} size={docFiles[activeDocTab]!.size} onRemove={() => {
                            setDocFiles(prev => { const next = { ...prev }; delete next[activeDocTab]; return next; });
                            setDocExtractionStatus(prev => ({ ...prev, [activeDocTab]: "idle" }));
                            setDocFieldConfidence(prev => { const next = { ...prev }; delete next[activeDocTab]; return next; });
                          }} />
                          <div className="upload-note" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", marginBottom: 12 }}>
                            🤖 <span dangerouslySetInnerHTML={{ __html: t("step2.fieldsExtracted") }} />
                          </div>
                        </>
                      )}
                      {docExtractionStatus[activeDocTab] === "error" && (
                        <div className="upload-note" style={{ background: "#fef2f2", borderColor: "#fecaca", marginBottom: 12 }}>
                          ❌ <span>{t("step1.upload.extractionFailed", { error: docExtractionError[activeDocTab] || "Extraction failed" })}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic fields */}
                  <div className="form-row cols-2">
                    {getDocFields(documents[activeDocTab].documentType).map(field => {
                      const docConf = docFieldConfidence[activeDocTab]?.[field.key];
                      return (
                        <div key={field.key} className={`form-group${docConf ? ` confidence-${docConf}` : ""}`}>
                          <label>{field.label}</label>
                          <input
                            type={field.type}
                            value={documents[activeDocTab].fields[field.key] || ""}
                            onChange={e => updateDocField(activeDocTab, field.key, e.target.value)}
                            data-testid={`input-doc-${field.key}`}
                          />
                        </div>
                      );
                    })}
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
                {t("step2.continueToReview")}
              </button>
              <button className="btn-secondary" onClick={() => goStep(1)}>
                {t("step2.back")}
              </button>
            </div>
          </>
        )}

        {/* ═══════ STEP 3 — Review ═══════ */}
        {step === 3 && (
          <>
            <div className="form-card">
              <div className="form-card-header"><span>🔍</span><h2>{t("step3.formTitle")}</h2></div>
              <p className="form-card-subtitle">{t("step3.formSubtitle")}</p>

              {/* Warning note */}
              <div className="upload-note" style={{ marginBottom: 20, fontSize: 15, fontWeight: 600, color: "#1a1a1a", padding: "16px 18px" }}>
                ⚠️ <span>{t("step3.warning")}</span>
              </div>

              {/* Summary fields in 2-col */}
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>{t("step3.lcReference")}</label>
                  <input type="text" value={lcFields.lcReference} readOnly style={{ background: "#fff" }} />
                </div>
                <div className="form-group">
                  <label>{t("step3.beneficiary")}</label>
                  <input type="text" value={lcFields.beneficiaryName} readOnly style={{ background: "#fff" }} />
                </div>
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>{t("step3.lcAmount")}</label>
                  <input type="text" value={`${lcFields.currency} ${lcFields.totalAmount.toLocaleString()}`} readOnly style={{ background: "#fff" }} />
                </div>
                <div className="form-group">
                  <label>{t("step3.goodsDescription")}</label>
                  <input type="text" value={lcFields.goodsDescription} readOnly style={{ background: "#fff" }} />
                </div>
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>{t("step3.latestShipmentDate")}</label>
                  <input type="text" value={lcFields.latestShipmentDate} readOnly style={{ background: "#fff" }} />
                </div>
                <div className="form-group">
                  <label>{t("step3.lcExpiryDate")}</label>
                  <input type="text" value={lcFields.lcExpiryDate} readOnly style={{ background: "#fff" }} />
                </div>
              </div>

              <div className="form-row cols-2">
                <div className="form-group">
                  <label>{t("step3.incoterms")}</label>
                  <input type="text" value={lcFields.incoterms} readOnly style={{ background: "#fff" }} />
                </div>
                <div className="form-group">
                  <label>{t("step3.quantityTolerance")}</label>
                  <input type="text" value={`±${lcFields.tolerancePercent ?? 5}%`} readOnly style={{ background: "#fff" }} />
                </div>
              </div>

              {/* Documents summary */}
              <div style={{ background: "#f7f7f7", borderRadius: 9, padding: "12px 14px" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--app-regent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, width: "100%" }}>
                  {t("step3.documents")}
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
                  ? `⏳ ${t("step3.checking")}`
                  : isFreeCheck
                  ? `▶ ${t("step3.runFree")}`
                  : `▶ ${t("step3.runCredit")}`}
              </button>
              <button className="btn-secondary" onClick={() => goStep(2)}>
                {t("step3.back")}
              </button>
            </div>
          </>
        )}

        {/* ═══════ STEP 4 — Results ═══════ */}
        {step === 4 && resultData && (
          <div data-testid="section-lc-results">

            {/* Verdict banner */}
            {(() => {
              const v = resultData.summary.verdict;
              const cls = v === "COMPLIANT" ? "ok" : v === "COMPLIANT_WITH_NOTES" ? "warn" : "fail";
              return (
                <div className={`lc-verdict ${cls}`} style={{ margin: "0 32px 24px" }}>
                  <span className="lc-v-ic">
                    {cls === "fail" ? "🔴" : cls === "warn" ? "⚠️" : "✅"}
                  </span>
                  <div>
                    <div className="lc-v-title">
                      {cls === "fail" ? t("step4.verdict.discrepanciesFound") : cls === "warn" ? t("step4.verdict.compliantWithNotes") : t("step4.verdict.compliant")}
                    </div>
                    <div className="lc-v-sub">
                      {resultData.summary.criticals > 0
                        ? t("step4.verdict.criticalIssue", { count: resultData.summary.criticals })
                        : resultData.summary.warnings > 0
                        ? t("step4.verdict.warning", { count: resultData.summary.warnings })
                        : t("step4.verdict.allMatch")}
                    </div>
                  </div>
                  <div className="lc-v-stats">
                    <div className="lc-vs">
                      <div className="lc-vs-n g" data-testid="text-matches">{resultData.summary.matches}</div>
                      <div className="lc-vs-l">{t("step4.stat.match")}</div>
                    </div>
                    <div className="lc-vs">
                      <div className="lc-vs-n a" data-testid="text-warnings">{resultData.summary.warnings}</div>
                      <div className="lc-vs-l">{t("step4.stat.warning")}</div>
                    </div>
                    <div className="lc-vs">
                      <div className="lc-vs-n r" data-testid="text-criticals">{resultData.summary.criticals}</div>
                      <div className="lc-vs-l">{t("step4.stat.critical")}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Insurance gap alert */}
            {(resultData.summary.verdict === "COMPLIANT" || resultData.summary.verdict === "COMPLIANT_WITH_NOTES") && (
              <div style={{ margin: "0 32px" }}>
                <InsuranceGapAlert />
              </div>
            )}

            {/* Field-by-field Results */}
            <div className="form-card">
              <div className="form-card-header"><span>📊</span><h2>{t("step4.fieldResults")}</h2></div>
              <p className="form-card-subtitle">
                Ref: TT-LC-{new Date().getFullYear()}-{resultData.integrityHash.substring(0, 6)} · {new Date(resultData.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>

              {/* Render a severity section with sub-grouping by checkCategory */}
              {(["RED", "AMBER", "GREEN"] as const).map(severity => {
                const items = resultData.results.filter(r => r.severity === severity);
                if (items.length === 0) return null;
                const lcItems = items.filter(r => r.checkCategory !== "cross_document");
                const crossItems = items.filter(r => r.checkCategory === "cross_document");
                const label = severity === "RED" ? `\uD83D\uDD34 ${t("step4.criticalBankReject")}` : severity === "AMBER" ? `\uD83D\uDFE1 ${t("step4.warnings")}` : `\uD83D\uDFE2 ${t("step4.matched")}`;
                const cssClass = severity === "RED" ? "fail" : severity === "AMBER" ? "warn" : "ok";

                return (
                  <div key={severity} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--app-regent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                      {label}
                    </div>

                    {lcItems.length > 0 && (
                      <>
                        {crossItems.length > 0 && (
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", margin: "8px 0 4px", paddingLeft: 4 }}>
                            {t("step4.lcValidation")}
                          </div>
                        )}
                        {lcItems.map((r, i) => (
                          <div key={`${cssClass}-lc-${i}`} className={`lc-rr ${cssClass}`} data-testid={`result-item-${cssClass}-${i}`}>
                            <div className={`lc-rr-dot ${cssClass}`} />
                            <div>
                              <div className="lc-rr-field">{r.fieldName} — {r.documentType}</div>
                              {severity !== "GREEN" && (
                                <div className="lc-rr-detail">
                                  LC: <span className="lc-rr-lc">"{r.lcValue}"</span> · Doc: <span className="lc-rr-doc">"{r.documentValue}"</span>
                                </div>
                              )}
                              <div className="lc-rr-detail">{r.explanation || `${t("step4.allFieldsMatch")} \u2713`}</div>
                              {r.ucpRule && <span className="lc-rr-rule">{r.ucpRule}</span>}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {crossItems.length > 0 && (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", margin: "10px 0 4px", paddingLeft: 4 }}>
                          {t("step4.crossDocConsistency")}
                        </div>
                        {crossItems.map((r, i) => (
                          <div key={`${cssClass}-cross-${i}`} className={`lc-rr ${cssClass}`} data-testid={`result-item-${cssClass}-cross-${i}`}>
                            <div className={`lc-rr-dot ${cssClass}`} />
                            <div>
                              <div className="lc-rr-field">{r.fieldName} — {r.documentType}</div>
                              <div className="lc-rr-detail">
                                <span className="lc-rr-lc">"{r.lcValue}"</span> · <span className="lc-rr-doc">"{r.documentValue}"</span>
                              </div>
                              <div className="lc-rr-detail">{r.explanation}</div>
                              {r.ucpRule && <span className="lc-rr-rule">{r.ucpRule}</span>}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Correction Email Card */}
            {resultData.summary.criticals > 0 && resultData.correctionEmail && (
              <div className="form-card">
                <div className="form-card-header"><span>✉️</span><h2>{t("step4.correction.title")}</h2></div>
                <p className="form-card-subtitle">
                  {t("step4.correction.subtitle", { count: resultData.summary.criticals })}
                </p>

                {/* Tab toggle: Email / WhatsApp */}
                <div style={{ display: "flex", gap: 0, marginBottom: 12 }}>
                  <button
                    onClick={() => setCorrectionTab("email")}
                    data-testid="button-correction-email-tab"
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      border: correctionTab === "email" ? "1px solid var(--sage)" : "1px solid #ddd",
                      background: correctionTab === "email" ? "var(--sage-xs)" : "#fff",
                      color: correctionTab === "email" ? "var(--sage)" : "#666",
                      borderRadius: "8px 0 0 8px",
                      cursor: "pointer",
                    }}
                  >
                    📧 {t("step4.correction.emailTab")}
                  </button>
                  <button
                    onClick={() => setCorrectionTab("whatsapp")}
                    data-testid="button-correction-whatsapp-tab"
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      border: correctionTab === "whatsapp" ? "1px solid #25D366" : "1px solid #ddd",
                      background: correctionTab === "whatsapp" ? "rgba(37,211,102,0.08)" : "#fff",
                      color: correctionTab === "whatsapp" ? "#128C7E" : "#666",
                      borderRadius: "0 8px 8px 0",
                      borderLeft: "none",
                      cursor: "pointer",
                    }}
                  >
                    💬 {t("step4.correction.whatsAppTab")}
                  </button>
                </div>

                {/* Correction text */}
                <div style={{ background: "#f7f7f7", borderRadius: 10, padding: "16px 18px", border: "1px solid #e8e8e8" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>
                    {correctionTab === "email" ? t("step4.correction.emailMessage") : t("step4.correction.whatsAppMessage")}
                  </div>
                  <div className="lc-email-box" data-testid={`text-correction-${correctionTab}`}>
                    {correctionTab === "email" ? (resultData.correctionEmail || "") : (resultData.correctionWhatsApp || "")}
                  </div>
                </div>

                {/* Action buttons: Copy + Send */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                  <CopyBtn
                    text={correctionTab === "email" ? (resultData.correctionEmail || "") : (resultData.correctionWhatsApp || "")}
                    label={`correction-${correctionTab}`}
                  />
                  {correctionTab === "email" ? (
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Correction Request — LC ${lcFields.lcReference}`)}&body=${encodeURIComponent(resultData.correctionEmail || "")}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        background: "var(--sage)",
                        color: "#fff",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                      data-testid="button-send-email"
                    >
                      📧 {t("step4.correction.openEmail")}
                    </a>
                  ) : (
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(resultData.correctionWhatsApp || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        background: "#25D366",
                        color: "#fff",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                      data-testid="button-send-whatsapp"
                    >
                      💬 {t("step4.correction.sendWhatsApp")}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Integrity reference block */}
            <div style={{ background: "#f7f7f7", borderRadius: 9, padding: "14px 16px", margin: "0 32px 12px", border: "1px solid #e8e8e8" }}>
              <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
                <Hash size={18} style={{ color: "var(--app-regent)", flexShrink: 0, marginTop: 1 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }} data-testid="text-lc-check-ref">
                    {t("step4.integrityRef")} TT-LC-{new Date().getFullYear()}-{resultData.integrityHash.substring(0, 6).toUpperCase()}
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "var(--app-regent)", wordBreak: "break-all" }} data-testid="text-lc-integrity-hash">
                    {t("step4.integrityHash")} sha256:{resultData.integrityHash}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--app-regent)" }} data-testid="text-lc-check-timestamp">
                    {t("step4.checked")} {new Date(resultData.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Re-check banner */}
            {resultData.recheckNumber > 0 && (
              <div style={{ margin: "0 32px 16px", padding: "12px 16px", background: "var(--sage-xs)", border: "1px solid rgba(74,124,94,0.2)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🔄</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sage)" }}>
                  {t("step4.recheckBanner", { number: resultData.recheckNumber, remaining: resultData.freeRechecksRemaining, plural: resultData.freeRechecksRemaining !== 1 ? "s" : "" })}
                </span>
              </div>
            )}

            {/* Action buttons */}
            {resultData.summary.verdict === "DISCREPANCIES_FOUND" ? (
              <div className="action-row" style={{ flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  onClick={async () => {
                    if (resultData?.caseId) {
                      try {
                        await fetch(`/api/lc-cases/${resultData.caseId}/correction-request`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({
                            channel: correctionTab,
                            discrepancyCount: resultData.summary.criticals,
                          }),
                        });
                      } catch {}
                    }
                    // Scroll to correction card
                    document.querySelector('[data-testid="button-correction-email-tab"]')?.scrollIntoView({ behavior: "smooth" });
                  }}
                  data-testid="button-send-correction"
                >
                  ✉️ {t("step4.action.sendCorrection")}
                </button>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    if (resultData?.caseId) {
                      try {
                        await fetch(`/api/lc-cases/${resultData.caseId}/park`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                        });
                      } catch {}
                    }
                    navigate("/dashboard");
                  }}
                  data-testid="button-park-case"
                >
                  📦 {t("step4.action.parkCase")}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => goStep(2)}
                  data-testid="button-upload-corrected"
                >
                  📄 {t("step4.action.uploadCorrected")}
                </button>
                <button
                  style={{ background: "none", border: "none", color: "#999", fontSize: 14, cursor: "pointer", padding: "6px 0" }}
                  onClick={async () => {
                    if (resultData?.caseId) {
                      try {
                        await fetch(`/api/lc-cases/${resultData.caseId}/close`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ reason: "Closed by user" }),
                        });
                      } catch {}
                    }
                    navigate("/dashboard");
                  }}
                  data-testid="button-close-case"
                >
                  {t("step4.action.closeCase")}
                </button>
              </div>
            ) : (
              <div className="action-row">
                {prefillData?.lookup_id && (
                  <button className="btn-primary" onClick={() => setLcActiveTab("TwinLog Trail")} data-testid="button-view-twinlog">
                    {t("step4.action.viewTwinLog")}
                  </button>
                )}
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setStep(1);
                    checkMutation.reset();
                    setLoadedResults(null);
                    setShowCorrection(false);
                    setLcFields({
                      beneficiaryName: "", applicantName: "", goodsDescription: "", hsCode: "",
                      quantity: 0, quantityUnit: "MT", unitPrice: 0, currency: "USD", totalAmount: 0,
                      countryOfOrigin: "", portOfLoading: "", portOfDischarge: "",
                      latestShipmentDate: "", lcExpiryDate: "", incoterms: "FOB",
                      partialShipmentsAllowed: false, transhipmentAllowed: false, lcReference: "",
                      issuingBank: "", advisingBank: "", issuingBankSwift: "", advisingBankSwift: "",
                      tolerancePercent: 5,
                    });
                    setDocuments([{ documentType: "commercial_invoice", fields: {} }]);
                    setActiveDocTab(0);
                  }}
                  data-testid="button-new-check"
                >
                  {t("step4.action.newCheck")}
                </button>
                <button
                  style={{ background: "none", border: "none", color: "#999", fontSize: 14, cursor: "pointer", padding: "6px 0" }}
                  onClick={async () => {
                    if (resultData?.caseId) {
                      try {
                        await fetch(`/api/lc-cases/${resultData.caseId}/close`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ reason: "Closed — all clear" }),
                        });
                      } catch {}
                    }
                    navigate("/dashboard");
                  }}
                  data-testid="button-close-case-clear"
                >
                  {t("step4.action.closeCase")}
                </button>
              </div>
            )}

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
              <DialogTitle>{t("tokenModal.title")}</DialogTitle>
              <DialogDescription>
                {t("tokenModal.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end flex-wrap">
              <Button variant="outline" onClick={() => setShowTokenModal(false)} data-testid="button-lc-modal-cancel">
                {t("tokenModal.cancel")}
              </Button>
              <Button onClick={() => navigate("/pricing")} data-testid="button-lc-modal-buy-tokens">
                {t("tokenModal.activate")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>


      </div>
      )}
    </AppShell>
  );
}
