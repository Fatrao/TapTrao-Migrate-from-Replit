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
import type { LcFields, LcDocument, LcDocumentType } from "@shared/schema";

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
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 60 }} data-testid="lc-check-page">

        {/* HERO BANNER */}
        <div className="lc-hero">
          <div className="lc-hero-top">
            <div className="lc-hero-tag">Compliance &rsaquo; LC Check &rsaquo; New Check</div>
            <span className="lc-price-pill">
              {isFreeCheck ? "First Check FREE" : "$19.99 per check"}
            </span>
          </div>
          <div className="lc-hero-title">LC Document<br />Checker</div>
          <div className="lc-hero-sub">Cross-check supplier docs against your LC &mdash; UCP 600 &amp; ISBP 745 applied.</div>
        </div>

        {/* STEPPER */}
        <div className="lc-stepper-wrap">
          <div className="lc-stepper">
            {LC_STEP_LABELS.map((label, i) => {
              const s = i + 1;
              const cls = step > s ? "done" : step === s ? "active" : "pend";
              return (
                <div key={s} style={{ display: "contents" }}>
                  <div className="lc-stp">
                    <div className={`lc-stp-n ${cls}`} data-testid={`step-indicator-${s}`}>
                      {step > s ? "\u2713" : s}
                    </div>
                    <div className={`lc-stp-l ${cls}`}>{label}</div>
                  </div>
                  {s < 4 && <div className={`lc-stp-line${step > s ? " done" : ""}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div>

          {showPrefillBanner && prefillData && (
            <div className="lc-note" style={{ margin: "0 24px 14px" }} data-testid="banner-lc-prefill">
              <span className="lc-note-ic">
                <ExternalLink size={14} style={{ color: "var(--green)" }} />
              </span>
              <div className="lc-note-txt" style={{ flex: 1 }}>
                <strong>Pre-filled from your compliance lookup</strong><br />
                {prefillData.commodity_name} &mdash; {prefillData.origin_name} &rarr; {prefillData.dest_name}
                {prefillData.lookup_id && (
                  <>
                    {" "}&middot;{" "}
                    <Link href="/trades" style={{ color: "var(--green)", textDecoration: "underline" }} data-testid="link-view-lookup">
                      View lookup &rarr;
                    </Link>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowPrefillBanner(false)}
                style={{ color: "var(--txt3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                data-testid="button-dismiss-prefill-banner"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* -- STEP 1: LC TERMS -- */}
          {step === 1 && (
            <div className="lc-fadein">
              {/* Card 1: LC Key Terms */}
              <div className="lc-wc">
                <div className="lc-wc-head">
                  <div>
                    <div className="lc-wc-title">
                      <span style={{ fontSize: 16 }}>📋</span> Letter of Credit &mdash; Key Terms
                    </div>
                    <div className="lc-wc-sub">Enter exactly as they appear on your LC.</div>
                  </div>
                </div>

                <div className="lc-fg2">
                  <div className="lc-field">
                    <label>LC Reference</label>
                    <Input value={lcFields.lcReference} onChange={e => updateLcField("lcReference", e.target.value)} placeholder="e.g. LC/2026/0001234" data-testid="input-lc-reference" />
                  </div>
                  <div className="lc-field">
                    <label>Issuing Bank</label>
                    <Input placeholder="e.g. Standard Chartered" data-testid="input-issuing-bank" />
                  </div>
                </div>

                <div className="lc-fg2">
                  <div className="lc-field">
                    <label>Beneficiary / Supplier <span className="req">*</span></label>
                    <Input value={lcFields.beneficiaryName} onChange={e => updateLcField("beneficiaryName", e.target.value)} placeholder="e.g. SARL AGRO EXPORT CI" data-testid="input-beneficiary-name" />
                  </div>
                  <div className="lc-field">
                    <label>Applicant / Buyer <span className="req">*</span></label>
                    <Input value={lcFields.applicantName} onChange={e => updateLcField("applicantName", e.target.value)} placeholder="e.g. Euro Trading GmbH" data-testid="input-applicant-name" />
                  </div>
                </div>

                <div className="lc-fg2">
                  <div className="lc-field lc-f-full">
                    <label>Goods Description <span className="req">*</span></label>
                    <Input value={lcFields.goodsDescription} onChange={e => updateLcField("goodsDescription", e.target.value)} placeholder="e.g. Raw Cashew Nuts in shell, crop 2025/26" data-testid="input-goods-description" />
                  </div>
                </div>

                {/* Row: Quantity, Amount, Currency */}
                <div className="lc-fg3">
                  <div className="lc-field">
                    <label>Quantity <span className="req">*</span></label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Input type="number" value={lcFields.quantity || ""} onChange={e => updateLcField("quantity", parseFloat(e.target.value) || 0)} placeholder="500" style={{ flex: 1 }} data-testid="input-quantity" />
                      <Select value={lcFields.quantityUnit} onValueChange={v => updateLcField("quantityUnit", v)}>
                        <SelectTrigger style={{ width: 80 }} data-testid="select-quantity-unit"><SelectValue /></SelectTrigger>
                        <SelectContent>{QUANTITY_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="lc-field">
                    <label>LC Amount <span className="req">*</span></label>
                    <Input type="number" value={lcFields.totalAmount || ""} onChange={e => updateLcField("totalAmount", parseFloat(e.target.value) || 0)} placeholder="e.g. 250,000.00" data-testid="input-total-amount" />
                  </div>
                  <div className="lc-field">
                    <label>Currency</label>
                    <Select value={lcFields.currency} onValueChange={v => updateLcField("currency", v)}>
                      <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row: Ports, Origin */}
                <div className="lc-fg3">
                  <div className="lc-field">
                    <label>Port of Loading</label>
                    <Input value={lcFields.portOfLoading} onChange={e => updateLcField("portOfLoading", e.target.value)} placeholder="e.g. Abidjan" data-testid="input-port-loading" />
                  </div>
                  <div className="lc-field">
                    <label>Port of Discharge</label>
                    <Input value={lcFields.portOfDischarge} onChange={e => updateLcField("portOfDischarge", e.target.value)} placeholder="e.g. Felixstowe" data-testid="input-port-discharge" />
                  </div>
                  <div className="lc-field">
                    <label>Country of Origin</label>
                    <Input value={lcFields.countryOfOrigin} onChange={e => updateLcField("countryOfOrigin", e.target.value)} placeholder="e.g. Côte d'Ivoire" data-testid="input-country-origin" />
                  </div>
                </div>

                {/* Row: Dates, Incoterms */}
                <div className="lc-fg3">
                  <div className="lc-field">
                    <label>Latest Shipment Date <span className="req">*</span></label>
                    <Input type="date" value={lcFields.latestShipmentDate} onChange={e => updateLcField("latestShipmentDate", e.target.value)} data-testid="input-latest-shipment-date" />
                  </div>
                  <div className="lc-field">
                    <label>LC Expiry Date <span className="req">*</span></label>
                    <Input type="date" value={lcFields.lcExpiryDate} onChange={e => updateLcField("lcExpiryDate", e.target.value)} data-testid="input-lc-expiry-date" />
                  </div>
                  <div className="lc-field">
                    <label>Incoterms</label>
                    <Select value={lcFields.incoterms} onValueChange={v => updateLcField("incoterms", v)}>
                      <SelectTrigger data-testid="select-incoterms"><SelectValue /></SelectTrigger>
                      <SelectContent>{INCOTERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Toggle switches */}
                <div>
                  <div className="lc-tog-row">
                    <div>
                      <div className="lc-tog-lbl">Partial Shipments Allowed</div>
                      <div className="lc-tog-sub">UCP 600 Art. 31</div>
                    </div>
                    <label className="lc-tog">
                      <input type="checkbox" checked={lcFields.partialShipmentsAllowed} onChange={e => updateLcField("partialShipmentsAllowed", e.target.checked)} data-testid="toggle-partial-shipments" />
                      <span className="lc-tog-sl" />
                    </label>
                  </div>
                  <div className="lc-tog-row">
                    <div>
                      <div className="lc-tog-lbl">Transhipment Allowed</div>
                      <div className="lc-tog-sub">UCP 600 Art. 20</div>
                    </div>
                    <label className="lc-tog">
                      <input type="checkbox" checked={lcFields.transhipmentAllowed} onChange={e => updateLcField("transhipmentAllowed", e.target.checked)} data-testid="toggle-transhipment" />
                      <span className="lc-tog-sl" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 2: Upload LC as PDF */}
              <div className="lc-wc">
                <div className="lc-wc-head">
                  <div>
                    <div className="lc-wc-title"><span style={{ fontSize: 16 }}>📤</span> Or Upload LC as PDF</div>
                    <div className="lc-wc-sub">Attach your LC document for reference alongside manual entry.</div>
                  </div>
                </div>
                <UploadZone
                  icon="📄"
                  title="Drop your LC here"
                  subtitle="Browse or drop PDF"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onFileSelect={(f) => setLcPdfFile({ file: f, name: f.name, size: f.size })}
                />
                {lcPdfFile && (
                  <FilePill name={lcPdfFile.name} size={lcPdfFile.size} onRemove={() => setLcPdfFile(null)} />
                )}
                <div className="lc-note" style={{ marginTop: 12 }}>
                  <span className="lc-note-ic">💡</span>
                  <div className="lc-note-txt">
                    <strong>Auto-extraction coming soon</strong> &mdash; enter fields manually for now. Your PDF is attached for reference.
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="lc-btn-row">
                <button
                  className="lc-btn-green"
                  disabled={!canProceedStep1}
                  onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  data-testid="button-next-step-2"
                >
                  Continue to Supplier Docs &rarr;
                </button>
                <button className="lc-btn-grey">Save Draft</button>
              </div>
            </div>
          )}

          {/* -- STEP 2: SUPPLIER DOCUMENTS -- */}
          {step === 2 && (
            <div className="lc-fadein">
              <div className="lc-wc">
                <div className="lc-wc-head">
                  <div>
                    <div className="lc-wc-title"><span style={{ fontSize: 16 }}>📦</span> Supplier Documents</div>
                    <div className="lc-wc-sub">Upload up to 6 documents. Any language &mdash; manual entry required.</div>
                  </div>
                </div>

                {/* Document tabs */}
                <div className="lc-doc-tabs">
                  {documents.map((doc, i) => (
                    <button
                      key={i}
                      className={`lc-dt${activeDocTab === i ? " active" : ""}`}
                      onClick={() => setActiveDocTab(i)}
                      data-testid={`button-doc-tab-${i}`}
                    >
                      <span>{getDocEmoji(docTypeLabel(doc.documentType))}</span>
                      {docTypeLabel(doc.documentType)}
                      <span className="lc-dtn">{i + 1}</span>
                    </button>
                  ))}
                  {documents.length < 6 && (
                    <button className="lc-dt-add" onClick={addDocument} data-testid="button-add-document">
                      + Add doc
                    </button>
                  )}
                </div>

                {/* Active document panel */}
                {documents[activeDocTab] && (
                  <div>
                    <UploadZone
                      icon={getDocEmoji(docTypeLabel(documents[activeDocTab].documentType))}
                      title={docTypeLabel(documents[activeDocTab].documentType)}
                      subtitle="Browse or drop PDF"
                      onFileSelect={(f) => setDocFiles(prev => ({ ...prev, [activeDocTab]: { file: f, name: f.name, size: f.size } }))}
                    />
                    {docFiles[activeDocTab] && (
                      <FilePill
                        name={docFiles[activeDocTab]!.name}
                        size={docFiles[activeDocTab]!.size}
                        onRemove={() => setDocFiles(prev => { const next = { ...prev }; delete next[activeDocTab]; return next; })}
                      />
                    )}

                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                        <div className="lc-field" style={{ flex: 1, minWidth: 180 }}>
                          <label>Document Type</label>
                          <Select
                            value={documents[activeDocTab].documentType}
                            onValueChange={(v: string) => updateDocType(activeDocTab, v as LcDocumentType)}
                          >
                            <SelectTrigger data-testid="select-doc-type"><SelectValue /></SelectTrigger>
                            <SelectContent>{DOC_TYPES.map(dt => <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {documents.length > 1 && (
                          <button
                            onClick={() => removeDocument(activeDocTab)}
                            style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                            data-testid="button-remove-document"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="lc-fg2">
                        {getDocFields(documents[activeDocTab].documentType).map(field => (
                          <div key={field.key} className="lc-field">
                            <label>{field.label}</label>
                            <Input
                              type={field.type}
                              value={documents[activeDocTab].fields[field.key] || ""}
                              onChange={e => updateDocField(activeDocTab, field.key, e.target.value)}
                              data-testid={`input-doc-${field.key}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="lc-btn-row">
                <button className="lc-btn-grey" onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="button-back-step-1">
                  &larr; Back
                </button>
                <button
                  className="lc-btn-green"
                  disabled={!canProceedStep2}
                  onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  data-testid="button-next-step-3"
                >
                  Continue to Review &rarr;
                </button>
              </div>
            </div>
          )}

          {/* -- STEP 3: REVIEW -- */}
          {step === 3 && !checkMutation.data && (
            <div className="lc-fadein">
              <div className="lc-wc">
                <div className="lc-wc-head">
                  <div>
                    <div className="lc-wc-title"><span style={{ fontSize: 16 }}>🔍</span> Review Before Check</div>
                    <div className="lc-wc-sub">Correct any errors now &mdash; changes cannot be made after the credit is consumed.</div>
                  </div>
                </div>

                <div className="lc-warn-note">
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                  <div className="lc-note-txt">
                    Check all extracted fields carefully. Confirm dates and names match exactly what&apos;s on your LC.
                  </div>
                </div>

                <div className="lc-fg2">
                  <div className="lc-field">
                    <label>LC Reference</label>
                    <Input value={lcFields.lcReference} onChange={e => updateLcField("lcReference", e.target.value)} data-testid="review-lc-reference" />
                  </div>
                  <div className="lc-field">
                    <label>Beneficiary</label>
                    <Input value={lcFields.beneficiaryName} onChange={e => updateLcField("beneficiaryName", e.target.value)} data-testid="review-beneficiary" />
                  </div>
                  <div className="lc-field">
                    <label>LC Amount</label>
                    <Input value={`${lcFields.currency} ${lcFields.totalAmount}`} readOnly data-testid="review-amount" />
                  </div>
                  <div className="lc-field">
                    <label>Goods Description</label>
                    <Input value={lcFields.goodsDescription} onChange={e => updateLcField("goodsDescription", e.target.value)} data-testid="review-goods" />
                  </div>
                  <div className="lc-field">
                    <label>Latest Shipment Date</label>
                    <Input type="date" value={lcFields.latestShipmentDate} onChange={e => updateLcField("latestShipmentDate", e.target.value)} data-testid="review-shipment-date" />
                  </div>
                  <div className="lc-field">
                    <label>LC Expiry Date</label>
                    <Input type="date" value={lcFields.lcExpiryDate} onChange={e => updateLcField("lcExpiryDate", e.target.value)} data-testid="review-expiry-date" />
                  </div>
                </div>

                {/* Documents status */}
                <div style={{ marginTop: 16, padding: "12px 14px", background: "#f5f5f5", borderRadius: 10 }}>
                  <label style={{ marginBottom: 8, display: "block" }}>Documents</label>
                  <div className="lc-doc-status">
                    {documents.map((doc, i) => {
                      const hasFields = Object.values(doc.fields).some(v => v.trim() !== "");
                      return (
                        <span key={i} className={`lc-doc-badge ${hasFields ? "filled" : "empty"}`}>
                          {hasFields ? "✓" : "–"} {docTypeLabel(doc.documentType)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="lc-btn-row">
                <button className="lc-btn-grey" onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid="button-back-step-2">
                  &larr; Back
                </button>
                <button
                  className="lc-btn-green"
                  disabled={checkMutation.isPending}
                  onClick={() => {
                    checkMutation.mutate(undefined, {
                      onSuccess: () => { setStep(4); window.scrollTo({ top: 0, behavior: "smooth" }); },
                    });
                  }}
                  data-testid="button-run-lc-check"
                >
                  {checkMutation.isPending ? "⏳ Checking..." : (
                    <>▶ Run LC Check &mdash; {isFreeCheck ? "Free" : "1 credit"}</>
                  )}
                </button>
                <button className="lc-btn-ghost">Save &amp; check later</button>
              </div>
            </div>
          )}

          {/* -- STEP 4: RESULTS -- */}
          {step === 4 && checkMutation.data && (
            <div className="lc-fadein" data-testid="section-lc-results">

              {/* Verdict banner */}
              <div className={`lc-verdict ${verdictClass}`}>
                <div className="lc-v-ic">{verdictEmoji}</div>
                <div style={{ flex: 1 }}>
                  <div className="lc-v-title">{verdictTitle}</div>
                  <div className="lc-v-sub">{verdictSub}</div>
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

              {(checkMutation.data.summary.verdict === "COMPLIANT" || checkMutation.data.summary.verdict === "COMPLIANT_WITH_NOTES") && (
                <div style={{ margin: "0 24px" }}>
                  <InsuranceGapAlert />
                </div>
              )}

              {/* Results card with grouped rows */}
              <div className="lc-wc">
                <div className="lc-wc-head">
                  <div>
                    <div className="lc-wc-title"><span style={{ fontSize: 16 }}>📋</span> Field-by-Field Results</div>
                    <div className="lc-wc-sub">{checkMutation.data.summary.totalChecks} checks performed</div>
                  </div>
                </div>

                {/* Critical */}
                {criticalResults.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      🔴 Critical &mdash; Bank will reject
                    </div>
                    {criticalResults.map((r, i) => (
                      <div key={`fail-${i}`} className="lc-rr fail" data-testid={`result-item-fail-${i}`}>
                        <div className="lc-rr-dot fail" />
                        <div>
                          <div className="lc-rr-field">{r.fieldName} &mdash; {r.documentType}</div>
                          <div className="lc-rr-detail">
                            LC: <span className="lc-rr-lc">&ldquo;{r.lcValue}&rdquo;</span> &middot; Document: <span className="lc-rr-doc">&ldquo;{r.documentValue}&rdquo;</span>
                          </div>
                          <div className="lc-rr-rule">{r.ucpRule}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {warningResults.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      🟡 Warnings
                    </div>
                    {warningResults.map((r, i) => (
                      <div key={`warn-${i}`} className="lc-rr warn" data-testid={`result-item-warn-${i}`}>
                        <div className="lc-rr-dot warn" />
                        <div>
                          <div className="lc-rr-field">{r.fieldName} &mdash; {r.documentType}</div>
                          <div className="lc-rr-detail">
                            LC: <span className="lc-rr-lc">&ldquo;{r.lcValue}&rdquo;</span> &middot; Document: <span className="lc-rr-doc">&ldquo;{r.documentValue}&rdquo;</span>
                          </div>
                          <div className="lc-rr-rule">{r.ucpRule}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Matched */}
                {matchedResults.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      🟢 Matched
                    </div>
                    {matchedResults.map((r, i) => (
                      <div key={`ok-${i}`} className="lc-rr ok" data-testid={`result-item-ok-${i}`}>
                        <div className="lc-rr-dot ok" />
                        <div>
                          <div className="lc-rr-field">{r.fieldName}</div>
                          <div className="lc-rr-detail">{r.explanation}</div>
                          <div className="lc-rr-rule">{r.ucpRule}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Correction email card */}
              {checkMutation.data.summary.criticals > 0 && checkMutation.data.correctionEmail && (
                <div className="lc-wc">
                  <div className="lc-wc-head">
                    <div>
                      <div className="lc-wc-title"><span style={{ fontSize: 16 }}>✉️</span> Supplier Correction Request</div>
                      <div className="lc-wc-sub">Ready to send &mdash; {checkMutation.data.summary.criticals} correction{checkMutation.data.summary.criticals > 1 ? "s" : ""} needed</div>
                    </div>
                  </div>
                  <div className="lc-email-box" data-testid={`text-correction-${correctionTab}`}>
                    {correctionTab === "email" ? (checkMutation.data.correctionEmail || "") : (checkMutation.data.correctionWhatsApp || "")}
                  </div>
                  <div className="lc-copy-btns">
                    <button
                      className={`lc-copy-btn email${correctionTab === "email" ? "" : ""}`}
                      onClick={() => {
                        setCorrectionTab("email");
                        navigator.clipboard.writeText(checkMutation.data!.correctionEmail || "");
                      }}
                      data-testid="button-correction-email-tab"
                    >
                      📋 Copy Email
                    </button>
                    <button
                      className="lc-copy-btn whatsapp"
                      onClick={() => {
                        setCorrectionTab("whatsapp");
                        navigator.clipboard.writeText(checkMutation.data!.correctionWhatsApp || "");
                      }}
                      data-testid="button-correction-whatsapp-tab"
                    >
                      💬 Copy WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* Integrity hash */}
              <div style={{ background: "#f7f7f7", border: "1px solid #e8e8e8", borderRadius: 10, padding: "14px 16px", margin: "0 24px 12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Hash size={16} style={{ color: "var(--txt3)", marginTop: 2, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }} data-testid="text-lc-check-ref">
                      LC check ref: TT-LC-{new Date().getFullYear()}-{checkMutation.data.integrityHash.substring(0, 6).toUpperCase()}
                    </p>
                    <p style={{ fontFamily: "var(--fb)", fontSize: 10, color: "var(--txt3)", wordBreak: "break-all" }} data-testid="text-lc-integrity-hash">
                      Integrity hash: sha256:{checkMutation.data.integrityHash}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--txt3)" }} data-testid="text-lc-check-timestamp">
                      Checked: {new Date(checkMutation.data.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="lc-btn-row">
                <button
                  className="lc-btn-green"
                  onClick={() => setStep(2)}
                  data-testid="button-edit-documents"
                >
                  Upload Corrected Docs &rarr;
                </button>
                {checkMutation.data.correctionWhatsApp && (
                  <button
                    className="lc-btn-grey"
                    style={{ background: "rgba(37,211,102,.12)", color: "#25D366", border: "1px solid rgba(37,211,102,.2)" }}
                    onClick={() => {
                      const text = encodeURIComponent(checkMutation.data!.correctionWhatsApp || "");
                      window.open(`https://wa.me/?text=${text}`, "_blank");
                    }}
                    data-testid="button-results-send-whatsapp"
                  >
                    <MessageCircle size={14} style={{ marginRight: 4 }} /> Send via WhatsApp
                  </button>
                )}
                <button className="lc-btn-grey" onClick={() => {
                  setStep(1);
                  checkMutation.reset();
                  setShowCorrection(false);
                  setLcPdfFile(null);
                  setDocFiles({});
                  setLcFields({
                    beneficiaryName: "", applicantName: "", goodsDescription: "", hsCode: "",
                    quantity: 0, quantityUnit: "MT", unitPrice: 0, currency: "USD", totalAmount: 0,
                    countryOfOrigin: "", portOfLoading: "", portOfDischarge: "",
                    latestShipmentDate: "", lcExpiryDate: "", incoterms: "FOB",
                    partialShipmentsAllowed: false, transhipmentAllowed: false, lcReference: "",
                  });
                  setDocuments([{ documentType: "commercial_invoice", fields: {} }]);
                  setActiveDocTab(0);
                }} data-testid="button-new-check">
                  New Check
                </button>
              </div>
            </div>
          )}

          {/* Error display */}
          {checkMutation.isError && checkMutation.error.message !== "Insufficient tokens" && checkMutation.error.message !== "LC re-check required" && step !== 4 && (
            <div style={{ background: "#fff5f5", borderRadius: 10, padding: "12px 15px", display: "flex", alignItems: "center", gap: 10, margin: "12px 24px 0" }}>
              <XCircle size={16} style={{ color: "var(--red)", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "var(--red)" }}>{checkMutation.error.message}</p>
            </div>
          )}
        </div>

        {/* Token Modal */}
        <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trade Pack Required</DialogTitle>
              <DialogDescription>
                LC checks are included in every trade pack. Purchase a trade pack to run your LC check.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end flex-wrap">
              <Button variant="outline" onClick={() => setShowTokenModal(false)} data-testid="button-lc-modal-cancel">Cancel</Button>
              <Button onClick={() => navigate("/pricing")} data-testid="button-lc-modal-buy-tokens">Buy Trade Pack</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recheck Modal */}
        <Dialog open={showRecheckModal} onOpenChange={setShowRecheckModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>LC Re-check Required</DialogTitle>
              <DialogDescription>
                You've already run an LC check for this trade. Re-check after supplier corrections &mdash; $9.99.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end flex-wrap">
              <Button variant="outline" onClick={() => setShowRecheckModal(false)} data-testid="button-recheck-modal-cancel">Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    const res = await apiRequest("POST", "/api/tokens/lc-recheck-checkout", { sourceLookupId: recheckLookupId });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  } catch { navigate("/pricing"); }
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
