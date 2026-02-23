import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AppShell } from "@/components/AppShell";
import { StepNav } from "@/components/StepNav";
import { TabBar } from "@/components/TabBar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Globe,
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Mail,
  MessageCircle,
  Copy,
  Check,
  Hash,
  ClipboardCheck,
  Hexagon,
  X,
  ExternalLink,
  Shield,
  Upload,
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

const INCOTERMS = ["FOB", "CIF", "CFR", "FCA", "EXW", "DDP", "DAP", "CPT", "CIP", "FAS"];
const CURRENCIES = ["USD", "EUR", "GBP", "CNY", "AED", "TRY", "XOF", "ZAR", "GHS", "NGN", "KES"];
const QUANTITY_UNITS = ["kg", "MT", "bags", "pieces", "cartons", "drums", "litres", "CBM"];

const DOC_TYPES: { value: LcDocumentType; label: string }[] = [
  { value: "commercial_invoice", label: "Commercial Invoice" },
  { value: "bill_of_lading", label: "Bill of Lading" },
  { value: "certificate_of_origin", label: "Certificate of Origin" },
  { value: "phytosanitary_certificate", label: "Phytosanitary Certificate" },
  { value: "packing_list", label: "Packing List" },
  { value: "other", label: "Other" },
];

type LcCheckResponse = {
  id: string;
  results: CheckResultItem[];
  summary: LcCheckSummary;
  integrityHash: string;
  timestamp: string;
  correctionEmail: string;
  correctionWhatsApp: string;
};

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} data-testid={`button-copy-${label}`}>
      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function getDocFields(docType: LcDocumentType): { key: string; label: string; type: string }[] {
  switch (docType) {
    case "commercial_invoice":
      return [
        { key: "beneficiaryName", label: "Beneficiary Name", type: "text" },
        { key: "goodsDescription", label: "Goods Description", type: "text" },
        { key: "quantity", label: "Quantity", type: "text" },
        { key: "unitPrice", label: "Unit Price", type: "text" },
        { key: "totalAmount", label: "Total Amount", type: "text" },
        { key: "currency", label: "Currency", type: "text" },
        { key: "incoterms", label: "Incoterms", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
    case "bill_of_lading":
      return [
        { key: "shipperName", label: "Shipper Name", type: "text" },
        { key: "consignee", label: "Consignee", type: "text" },
        { key: "portOfLoading", label: "Port of Loading", type: "text" },
        { key: "portOfDischarge", label: "Port of Discharge", type: "text" },
        { key: "shippedOnBoardDate", label: "Shipped on Board Date", type: "date" },
        { key: "vesselName", label: "Vessel Name", type: "text" },
        { key: "blNumber", label: "B/L Number", type: "text" },
        { key: "quantity", label: "Quantity", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
    case "certificate_of_origin":
      return [
        { key: "exporterName", label: "Exporter Name", type: "text" },
        { key: "originCountry", label: "Origin Country", type: "text" },
        { key: "goodsDescription", label: "Goods Description", type: "text" },
        { key: "languageOfDocument", label: "Language of Document", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
    case "phytosanitary_certificate":
      return [
        { key: "exporterName", label: "Exporter Name", type: "text" },
        { key: "originCountry", label: "Origin Country", type: "text" },
        { key: "commodityDescription", label: "Commodity Description", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
    case "packing_list":
      return [
        { key: "quantity", label: "Quantity", type: "text" },
        { key: "grossWeight", label: "Gross Weight", type: "text" },
        { key: "netWeight", label: "Net Weight", type: "text" },
        { key: "numberOfPackages", label: "Number of Packages", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
    default:
      return [
        { key: "description", label: "Description", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
  }
}

function InsuranceGapAlert() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("insurance_alert_dismissed") === "1"; } catch { return false; }
  });
  if (dismissed) return null;
  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem("insurance_alert_dismissed", "1"); } catch {}
  };
  return (
    <div
      data-testid="insurance-gap-alert"
      style={{
        background: "rgba(74,140,111,.06)",
        borderRadius: 14,
        padding: "14px 18px",
        marginBottom: 20,
        position: "relative",
      }}
    >
      <button
        data-testid="insurance-gap-dismiss"
        onClick={dismiss}
        style={{
          position: "absolute", top: 10, right: 12,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--t3)", fontSize: 16, lineHeight: 1,
        }}
      >
        <X size={14} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Shield size={16} style={{ color: "var(--blue)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>
          Insurance gap — check your policy covers this trade
        </span>
      </div>

      <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.65, marginBottom: 12 }}>
        Standard cargo insurance (Institute Cargo Clauses A/B/C) covers physical
        loss and damage. It does NOT cover goods rejected at port due to regulatory
        non-compliance — which is a separate and common risk for agricultural and
        mineral commodities on African corridors.
      </p>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        background: "var(--card2)", borderRadius: 6, padding: "10px 14px",
        fontFamily: "'DM Mono', monospace", fontSize: 11, marginBottom: 12,
      }}>
        <div>
          <div style={{ fontWeight: 600, color: "var(--t1)", marginBottom: 6 }}>NOT covered by standard policy:</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: "var(--t2)", lineHeight: 1.8 }}>
            <li>Regulatory rejection at border</li>
            <li>Phytosanitary detention and destruction</li>
            <li>EUDR non-compliance refusal</li>
            <li>Aflatoxin / contamination seizure</li>
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "var(--t1)", marginBottom: 6 }}>Ask your insurer about:</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: "var(--t2)", lineHeight: 1.8 }}>
            <li>Trade disruption insurance</li>
            <li>Rejection / condemnation clause</li>
            <li>Commodity-specific contamination cover</li>
            <li>Political risk (for certain corridors)</li>
          </ul>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "var(--t3)", lineHeight: 1.5 }}>
        This applies regardless of Incoterms. Even under CIF or CIP, the seller's
        insurance does not cover destination regulatory rejection.
      </p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "GREEN") {
    return <Badge variant="secondary" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--gbg)", border: "1px solid var(--gbd)", color: "var(--green)" }} data-testid="badge-severity-green"><CheckCircle2 className="w-3 h-3 mr-1" />Match</Badge>;
  }
  if (severity === "AMBER") {
    return <Badge variant="secondary" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--abg)", border: "1px solid var(--abd)", color: "var(--amber)" }} data-testid="badge-severity-amber"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
  }
  return <Badge variant="destructive" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--rbg)", border: "1px solid var(--rbd)", color: "var(--red)" }} data-testid="badge-severity-red"><XCircle className="w-3 h-3 mr-1" />Critical</Badge>;
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "COMPLIANT") {
    return <Badge variant="secondary" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--gbg)", border: "1px solid var(--gbd)", color: "var(--green)" }} data-testid="badge-verdict">COMPLIANT</Badge>;
  }
  if (verdict === "COMPLIANT_WITH_NOTES") {
    return <Badge variant="secondary" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--abg)", border: "1px solid var(--abd)", color: "var(--amber)" }} data-testid="badge-verdict">COMPLIANT WITH NOTES</Badge>;
  }
  return <Badge variant="destructive" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "var(--rbg)", border: "1px solid var(--rbd)", color: "var(--red)" }} data-testid="badge-verdict">DISCREPANCIES FOUND</Badge>;
}

type LcPrefillData = {
  lookup_id: string;
  commodity_name: string;
  hs_code: string;
  origin_iso2: string;
  origin_name: string;
  dest_iso2: string;
  dest_name: string;
  incoterms: string;
  required_docs: string[];
};

function mapDocNameToType(docName: string): LcDocumentType {
  const lower = docName.toLowerCase();
  if (lower.includes("invoice") || lower.includes("commercial")) return "commercial_invoice";
  if (lower.includes("bill of lading") || lower.includes("b/l")) return "bill_of_lading";
  if (lower.includes("certificate of origin") || lower.includes("origin cert")) return "certificate_of_origin";
  if (lower.includes("phytosanitary") || lower.includes("sps")) return "phytosanitary_certificate";
  if (lower.includes("packing list")) return "packing_list";
  return "other";
}

function getDocEmoji(docName: string): string {
  const lower = docName.toLowerCase();
  if (lower.includes("invoice") || lower.includes("commercial")) return "\u{1F4C4}";
  if (lower.includes("origin") || lower.includes("coo")) return "\u{1F30D}";
  if (lower.includes("phyto") || lower.includes("sps")) return "\u{1F33F}";
  if (lower.includes("packing")) return "\u{1F4E6}";
  if (lower.includes("bill of lading") || lower.includes("b/l")) return "\u{1F6A2}";
  return "\u{1F4CB}";
}

function getDocIssuer(docName: string): string {
  const lower = docName.toLowerCase();
  if (lower.includes("invoice")) return "Exporter";
  if (lower.includes("origin")) return "Chamber of Commerce";
  if (lower.includes("phyto")) return "Plant Protection Authority";
  if (lower.includes("packing")) return "Exporter";
  if (lower.includes("bill of lading")) return "Shipping Line";
  if (lower.includes("eudr")) return "Competent Authority";
  if (lower.includes("export license")) return "Trade Ministry";
  return "Issuing Authority";
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type SupplierDocsResponse = {
  requestId: string;
  uploadToken: string;
  uploadUrl: string;
  supplierRequest: SupplierRequest;
};

function SupplierDocsTab({ prefillData }: { prefillData: LcPrefillData | null }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const lookupId = prefillData?.lookup_id;

  const createOrGetMutation = useMutation({
    mutationFn: async (lid: string) => {
      const res = await apiRequest("POST", "/api/supplier-requests/create-or-get", { lookupId: lid });
      return res.json() as Promise<SupplierDocsResponse>;
    },
  });

  const logSendMutation = useMutation({
    mutationFn: async ({ requestId, channel }: { requestId: string; channel: string }) => {
      await apiRequest("POST", `/api/supplier-requests/${requestId}/log-send`, { channel });
    },
  });

  useEffect(() => {
    if (lookupId && !createOrGetMutation.data && !createOrGetMutation.isPending) {
      createOrGetMutation.mutate(lookupId);
    }
  }, [lookupId]);

  const supplierData = createOrGetMutation.data;
  const sr = supplierData?.supplierRequest;
  const docsRequired: string[] = sr ? (sr.docsRequired as string[]) : (prefillData?.required_docs || []);
  const docsReceived: string[] = sr ? (sr.docsReceived as string[]) : [];

  const uploadsQuery = useQuery<SupplierUpload[]>({
    queryKey: ["/api/supplier-requests", sr?.id, "uploads"],
    queryFn: async () => {
      if (!sr?.id) return [];
      const res = await fetch(`/api/supplier-requests/${sr.id}/uploads`);
      return res.json();
    },
    enabled: !!sr?.id,
  });
  const uploads = uploadsQuery.data || [];

  const receivedCount = docsReceived.length;
  const totalCount = docsRequired.length;
  const progressPct = totalCount > 0 ? (receivedCount / totalCount) * 100 : 0;

  const handleSendWhatsApp = async () => {
    if (!lookupId) return;
    const data = createOrGetMutation.data || await createOrGetMutation.mutateAsync(lookupId);
    await logSendMutation.mutateAsync({ requestId: data.requestId, channel: "whatsapp" });
    const commodity = prefillData?.commodity_name || "goods";
    const origin = prefillData?.origin_name || "";
    const dest = prefillData?.dest_name || "";
    const message = `Please upload your documents for ${commodity} (${origin} \u2192 ${dest}) here: ${data.uploadUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleSendEmail = async () => {
    if (!lookupId) return;
    const data = createOrGetMutation.data || await createOrGetMutation.mutateAsync(lookupId);
    await logSendMutation.mutateAsync({ requestId: data.requestId, channel: "email" });
    const commodity = prefillData?.commodity_name || "goods";
    const origin = prefillData?.origin_name || "";
    const dest = prefillData?.dest_name || "";
    const docs = docsRequired.map((d, i) => `${i + 1}. ${d}`).join("\n");
    const subject = `Document request \u2014 ${commodity} ${origin} \u2192 ${dest}`;
    const body = `Hi,\n\nPlease prepare and upload the following documents for ${commodity} (${origin} \u2192 ${dest}):\n\n${docs}\n\nUpload here: ${data.uploadUrl}\n\nThank you.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCopyLink = async () => {
    if (!lookupId) return;
    const data = createOrGetMutation.data || await createOrGetMutation.mutateAsync(lookupId);
    await logSendMutation.mutateAsync({ requestId: data.requestId, channel: "link" });
    try {
      await navigator.clipboard.writeText(data.uploadUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = data.uploadUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!lookupId) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--t2)", fontSize: 14 }}>
        <p style={{ marginBottom: 8 }}>No lookup linked to this LC check.</p>
        <p>Run a compliance lookup first, then start an LC check from the results page.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 292px", height: "calc(100vh - 52px - 40px - 40px)", overflow: "hidden" }} data-testid="supplier-docs-tab">
      {/* LEFT PANEL */}
      <div style={{ padding: "24px 28px", overflowY: "auto" }}>
        {/* SEND BRIEF CARD */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 14,
            padding: "18px 20px",
            position: "relative",
            overflow: "hidden",
            marginBottom: 24,
          }}
          data-testid="send-brief-card"
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, var(--blue-glow), transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <h3 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 16, color: "var(--t1)", marginBottom: 6 }}>
              Send document request to supplier
            </h3>
            <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5, marginBottom: 14 }}>
              {sr?.lastSentAt
                ? `Last sent via ${(sr.sentVia as string[])?.slice(-1)[0] || "link"} \u00B7 ${relativeTime(sr.lastSentAt as unknown as string)} \u00B7 ${sr.status}`
                : "Generate a secure upload link and send it to your supplier. They can upload directly \u2014 no account required."}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={handleSendWhatsApp}
                disabled={createOrGetMutation.isPending || logSendMutation.isPending}
                style={{
                  background: "rgba(37,211,102,.12)",
                  color: "#25D366",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "9px 16px",
                  borderRadius: 7,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
                data-testid="button-send-whatsapp"
              >
                <MessageCircle size={14} /> Send via WhatsApp
              </button>
              <button
                onClick={handleSendEmail}
                disabled={createOrGetMutation.isPending || logSendMutation.isPending}
                style={{
                  background: "var(--blue-dim)",
                  color: "var(--blue)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "9px 16px",
                  borderRadius: 7,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
                data-testid="button-send-email"
              >
                <Mail size={14} /> Send via Email
              </button>
              <button
                onClick={handleCopyLink}
                disabled={createOrGetMutation.isPending || logSendMutation.isPending}
                style={{
                  background: "var(--card2)",
                  color: "var(--t2)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "9px 16px",
                  borderRadius: 7,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
                data-testid="button-copy-link"
              >
                {copiedLink ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy upload link</>}
              </button>
            </div>
          </div>
        </div>

        {/* DOCUMENT CHECKLIST */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--t3)", whiteSpace: "nowrap" }}>
            Required documents ({totalCount})
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {docsRequired.map((docName, idx) => {
          const isReceived = docsReceived.includes(docName);
          const upload = uploads.find(u => u.docType === docName);
          const isVerified = upload?.verified;
          const hasFinding = upload && !upload.verified && upload.finding;

          let statusLabel: string;
          let statusColor: string;
          let iconBg: string;
          let iconBd: string;

          if (isVerified) {
            statusLabel = "\u2713 Verified";
            statusColor = "var(--green)";
            iconBg = "var(--gbg)";
            iconBd = "var(--gbd)";
          } else if (hasFinding) {
            statusLabel = "\u2297 Needs amendment";
            statusColor = "var(--red)";
            iconBg = "var(--rbg)";
            iconBd = "var(--rbd)";
          } else if (isReceived || upload) {
            statusLabel = "\u25CF Awaiting upload";
            statusColor = "var(--amber)";
            iconBg = "var(--abg)";
            iconBd = "var(--abd)";
          } else {
            statusLabel = "\u25CB Not yet sent";
            statusColor = "var(--t3)";
            iconBg = "var(--card2)";
            iconBd = "var(--border)";
          }

          return (
            <div
              key={idx}
              style={{
                background: "var(--card)",
                borderRadius: 14,
                marginBottom: 6,
                overflow: "hidden",
              }}
              data-testid={`doc-card-${idx}`}
            >
              {/* HEADER ROW */}
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: iconBg,
                    
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {getDocEmoji(docName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{docName}</div>
                  <div style={{ fontSize: 10, color: "var(--t3)", fontFamily: "'DM Mono', monospace" }}>{getDocIssuer(docName)}</div>
                </div>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    color: statusColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {statusLabel}
                </span>
              </div>

              {/* FINDING ROW */}
              {hasFinding && (
                <div
                  style={{
                    background: "var(--rbg)",
                    
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 9,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", marginTop: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, flex: 1 }}>{upload!.finding}</span>
                  {upload!.ucpRule && (
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        background: "var(--blue-dim)",
                        
                        color: "var(--blue)",
                        padding: "1px 6px",
                        borderRadius: 3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {upload!.ucpRule}
                    </span>
                  )}
                </div>
              )}

              {/* FILE ROW */}
              <div
                style={{
                  padding: "8px 14px",
                  background: "var(--card2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {upload ? (
                  <>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)", flex: 1 }}>
                      {upload.originalFilename}
                      {upload.filesizeBytes ? ` \u00B7 ${(upload.filesizeBytes / 1024).toFixed(0)}KB` : ""}
                      {upload.uploadedAt ? ` \u00B7 ${relativeTime(upload.uploadedAt as unknown as string)}` : ""}
                    </span>
                  </>
                ) : (
                  <span style={{ fontStyle: "italic", fontSize: 11, color: "var(--t3)", flex: 1 }}>Not yet uploaded</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          background: "var(--card)",
          padding: "20px 18px",
          overflowY: "auto",
        }}
      >
        <h3 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 15, color: "var(--t1)", marginBottom: 4 }}>
          Document progress
        </h3>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)", marginBottom: 16 }}>
          {prefillData?.commodity_name || "Commodity"} \u00B7 {prefillData?.origin_name || ""} \u2192 {prefillData?.dest_name || ""}
        </p>

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)", marginBottom: 6 }}>
          {receivedCount} of {totalCount} received
        </div>
        <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: progressPct >= 100 ? "var(--green)" : "var(--amber)",
              borderRadius: 2,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, marginBottom: 16 }}>
          {receivedCount === 0
            ? "No documents received yet. Send a request to your supplier to get started."
            : receivedCount === totalCount
              ? "All documents received and ready for review."
              : `${totalCount - receivedCount} document${totalCount - receivedCount > 1 ? "s" : ""} still pending from supplier.`}
        </p>

        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--t3)", marginBottom: 10 }}>
          Activity
        </div>

        {sr?.lastSentAt && (
          <div style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--blue)", marginTop: 3, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--t2)" }}>
                Supplier brief sent via {(sr.sentVia as string[])?.slice(-1)[0] || "link"}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)" }}>
                {relativeTime(sr.lastSentAt as unknown as string)}
              </div>
            </div>
          </div>
        )}

        {uploads.map((upload, idx) => (
          <div key={idx} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: upload.verified ? "var(--green)" : "var(--amber)", marginTop: 3, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--t2)" }}>
                {upload.verified ? `${upload.docType} verified` : `${upload.docType} uploaded`}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)" }}>
                {upload.uploadedAt ? relativeTime(upload.uploadedAt as unknown as string) : ""}
              </div>
            </div>
          </div>
        ))}

        {!sr?.lastSentAt && uploads.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--t3)", fontStyle: "italic", padding: "8px 0" }}>
            No activity yet
          </div>
        )}

        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--t3)", marginBottom: 6 }}>
          Supplier
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>
          {sr?.supplierName || "Not yet assigned"}
        </div>
        {sr?.uploadToken && (
          <button
            onClick={() => {
              if (supplierData?.uploadUrl) {
                window.open(supplierData.uploadUrl, "_blank");
              }
            }}
            style={{
              width: "100%",
              marginTop: 10,
              background: "transparent",
              color: "var(--t2)",
              fontSize: 11,
              fontWeight: 500,
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "center",
            }}
            data-testid="button-view-upload-page"
          >
            View upload page \u2192
          </button>
        )}
      </div>
    </div>
  );
}

function TwinLogReadinessBanner({ score, verdict, summary, factors, primaryRiskFactor }: {
  score: number;
  verdict: "GREEN" | "AMBER" | "RED";
  summary: string;
  factors: any;
  primaryRiskFactor: string;
}) {
  const verdictStyles = {
    GREEN: { bg: "rgba(74,140,111,.05)", border: "rgba(74,140,111,.2)", badgeBg: "var(--gbg)", badgeBorder: "var(--gbd)", badgeColor: "var(--green)", label: "LOW RISK" },
    AMBER: { bg: "rgba(234,139,67,.05)", border: "rgba(234,139,67,.2)", badgeBg: "var(--abg)", badgeBorder: "var(--abd)", badgeColor: "var(--amber)", label: "MODERATE RISK" },
    RED: { bg: "rgba(218,60,61,.05)", border: "rgba(218,60,61,.2)", badgeBg: "var(--rbg)", badgeBorder: "var(--rbd)", badgeColor: "var(--red)", label: "HIGH RISK" },
  };
  const v = verdictStyles[verdict];
  const barColors: Record<string, string> = {
    regulatory_complexity: "var(--blue)",
    hazard_exposure: "var(--amber)",
    document_volume: "var(--t3)",
    trade_restriction: "var(--red)",
  };
  const factorRows = [
    { key: "regulatory_complexity", label: "Regulatory complexity", penalty: factors?.regulatory_complexity?.penalty ?? 0, max: factors?.regulatory_complexity?.max ?? 30 },
    { key: "hazard_exposure", label: "Hazard exposure", penalty: factors?.hazard_exposure?.penalty ?? 0, max: factors?.hazard_exposure?.max ?? 30 },
    { key: "document_volume", label: "Document volume", penalty: factors?.document_volume?.penalty ?? 0, max: factors?.document_volume?.max ?? 20 },
    { key: "trade_restriction", label: "Trade restriction", penalty: factors?.trade_restriction?.penalty ?? 0, max: factors?.trade_restriction?.max ?? 20 },
  ];
  return (
    <div style={{ borderRadius: 14, background: v.bg, padding: "22px 26px" }} data-testid="twinlog-readiness-banner">
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: "clamp(48px, 6vw, 64px)", letterSpacing: "-0.03em", color: "var(--t1)", lineHeight: 1 }}>
            {score}
          </div>
          <span style={{ display: "inline-block", fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: v.badgeBg, border: `1px solid ${v.badgeBorder}`, color: v.badgeColor, width: "fit-content", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            {v.label}
          </span>
          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.65, marginTop: 6, maxWidth: 260 }}>
            {summary}
          </p>
        </div>
        <div style={{ flex: 1, paddingLeft: 28 }}>
          {factorRows.map((f) => {
            const pct = f.max > 0 ? (f.penalty / f.max) * 100 : 0;
            const isPrimary = primaryRiskFactor === f.key && f.penalty > 10;
            return (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 120, fontSize: 11, color: "var(--t2)", textAlign: "right", flexShrink: 0 }}>{f.label}</span>
                <div style={{ flex: 1, height: 3, background: "var(--border)", borderRadius: 2, position: "relative" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: barColors[f.key] || "var(--t3)" }} />
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: isPrimary ? 9 : 10, width: 48, textAlign: "right", color: isPrimary ? "var(--amber)" : "var(--t3)", flexShrink: 0 }}>
                  {isPrimary ? "▲ primary" : `${f.penalty}/${f.max}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type TwinlogData = {
  lookup: {
    id: string;
    commodityId: string;
    commodityName: string;
    originName: string;
    destinationName: string;
    hsCode: string;
    resultJson: any;
    twinlogRef: string | null;
    twinlogHash: string | null;
    twinlogLockedAt: string | null;
    readinessScore: number | null;
    readinessVerdict: string | null;
    readinessFactors: any | null;
    readinessSummary: string | null;
    integrityHash: string | null;
    createdAt: string;
  };
  lcCheck: { id: string; verdict: string; createdAt: string } | null;
  supplierRequest: { id: string; docsRequired: string[]; docsReceived: string[]; status: string } | null;
  timeline: { event: string; timestamp: string }[];
};

function TwinLogTrailTab({ prefillData }: { prefillData: LcPrefillData | null }) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSaved, setTemplateSaved] = useState(false);
  const lookupId = prefillData?.lookup_id;

  const trailQuery = useQuery<TwinlogData>({
    queryKey: ["/api/twinlog", lookupId, "data"],
    queryFn: async () => {
      const res = await fetch(`/api/twinlog/${lookupId}/data`);
      if (!res.ok) throw new Error("Failed to load trail data");
      return res.json();
    },
    enabled: !!lookupId,
  });

  if (!lookupId) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--t2)", fontSize: 14 }}>
        Run a compliance lookup first to view the TwinLog Trail.
      </div>
    );
  }

  if (trailQuery.isLoading) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--t3)", fontSize: 13 }}>
        Loading trail data...
      </div>
    );
  }

  if (trailQuery.isError || !trailQuery.data) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--t2)", fontSize: 14 }}>
        Unable to load TwinLog Trail data.
      </div>
    );
  }

  const { lookup, lcCheck, supplierRequest, timeline } = trailQuery.data;

  const copyHash = async () => {
    if (!lookup.twinlogHash) return;
    try {
      await navigator.clipboard.writeText(lookup.twinlogHash);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = lookup.twinlogHash;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch("/api/twinlog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lookupId }),
      });
      if (res.status === 403) {
        alert("Please complete your company profile at Settings > Profile first.");
        return;
      }
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "TwinLog-Trail.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to download PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatFullDate = (ts: string) => {
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
      " " + new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const srDocsRequired = (supplierRequest?.docsRequired as string[]) || [];
  const srDocsReceived = (supplierRequest?.docsReceived as string[]) || [];

  const hashDisplay = lookup.twinlogHash
    ? `sha256: ${lookup.twinlogHash.substring(0, 12)}...${lookup.twinlogHash.slice(-8)}`
    : "";

  return (
    <div style={{ display: "flex", gap: 20, padding: "20px 0", alignItems: "flex-start" }} data-testid="twinlog-trail-tab">
      {/* Left Panel */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 26, color: "var(--t1)", marginBottom: 4 }}>
          TwinLog Trail
        </h2>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)", marginBottom: 24, lineHeight: 1.5 }}>
          {lookup.commodityName} &middot; {lookup.originName} &rarr; {lookup.destinationName}
          {lookup.twinlogLockedAt && <> &middot; locked {formatTimestamp(lookup.twinlogLockedAt)}</>}
        </p>

        {/* Included Items */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1 }}>
              Included Items
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {[
            { label: "Compliance lookup", status: "\u2713 Locked", color: "var(--green)" },
            {
              label: "LC check results",
              status: lcCheck ? "\u2713 Locked" : "\u2014",
              color: lcCheck ? "var(--green)" : "var(--t3)",
            },
            {
              label: "Supplier documents",
              status: supplierRequest ? `${srDocsReceived.length}/${srDocsRequired.length} received` : "\u2014",
              color: supplierRequest ? "var(--t2)" : "var(--t3)",
            },
            {
              label: "Readiness score",
              status: lookup.readinessScore != null ? `Score: ${lookup.readinessScore}` : "\u2014",
              color: lookup.readinessScore != null ? "var(--green)" : "var(--t3)",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: item.color === "var(--t3)" ? "var(--t3)" : item.color,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: "var(--t2)" }}>{item.label}</span>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: item.color }}>
                {item.status}
              </span>
            </div>
          ))}
        </div>

        {/* Integrity Hash Block */}
        {lookup.twinlogRef && (
          <div
            style={{
              background: "var(--card2)",
              borderRadius: 7,
              padding: "12px 14px",
              marginTop: 16,
            }}
            data-testid="integrity-hash-block"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "var(--blue)", fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  {lookup.twinlogRef}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)" }}>
                  {hashDisplay}
                </div>
              </div>
              <button
                onClick={copyHash}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--t3)",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  cursor: "pointer",
                  padding: "4px 8px",
                  whiteSpace: "nowrap",
                }}
                data-testid="button-copy-hash"
              >
                {copiedHash ? "\u2713 Copied" : "\u2197 Copy full hash"}
              </button>
            </div>
          </div>
        )}

        {/* Compliance Score Summary */}
        {lookup.readinessScore != null && lookup.readinessFactors && (
          <div style={{ marginTop: 20 }}>
            <TwinLogReadinessBanner
              score={lookup.readinessScore}
              verdict={(lookup.readinessVerdict as "GREEN" | "AMBER" | "RED") || "AMBER"}
              summary={lookup.readinessSummary || ""}
              factors={lookup.readinessFactors}
              primaryRiskFactor={lookup.readinessFactors.primary_risk_factor || "regulatory_complexity"}
            />
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div style={{ width: 292, flexShrink: 0 }}>
        <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 15, color: "var(--t1)", display: "block", marginBottom: 12 }}>
          Export
        </span>

        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          style={{
            width: "100%",
            background: "var(--blue)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            padding: "12px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            marginBottom: 16,
            minHeight: 44,
          }}
          data-testid="button-download-pdf"
        >
          {pdfLoading ? "Generating..." : "\u2193 Download TwinLog PDF"}
        </button>

        {/* Save as Template */}
        {!templateSaved ? (
          !showSaveModal ? (
            <button
              onClick={() => {
                setTemplateName(`${lookup.commodityName} ${prefillData?.origin_iso2 || ""}→${prefillData?.dest_iso2 || ""}`);
                setShowSaveModal(true);
              }}
              disabled={!lookup.commodityId || !lookup.resultJson}
              style={{
                width: "100%",
                background: "transparent",
                color: (!lookup.commodityId || !lookup.resultJson) ? "var(--t3)" : "var(--t2)",
                fontWeight: 600,
                fontSize: 13,
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                cursor: (!lookup.commodityId || !lookup.resultJson) ? "not-allowed" : "pointer",
                marginBottom: 16,
                opacity: (!lookup.commodityId || !lookup.resultJson) ? 0.5 : 1,
              }}
              data-testid="button-save-template"
            >
              Save as template
            </button>
          ) : (
            <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--card2)", borderRadius: 14 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)", marginBottom: 8 }}>Template name</div>
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "var(--card)",
                  borderRadius: 8,
                  color: "var(--t1)",
                  fontSize: 13,
                  marginBottom: 10,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                data-testid="input-template-name"
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={async () => {
                    try {
                      if (!lookup.commodityId || !lookup.resultJson) {
                        alert("Missing compliance data. Run a lookup first.");
                        return;
                      }
                      await apiRequest("POST", "/api/templates", {
                        name: templateName,
                        commodityId: lookup.commodityId,
                        originIso2: prefillData?.origin_iso2 || "",
                        destIso2: prefillData?.dest_iso2 || "",
                        snapshotJson: lookup.resultJson,
                      });
                      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/templates/count"] });
                      setTemplateSaved(true);
                      setShowSaveModal(false);
                    } catch (err: any) {
                      const msg = err?.message || "Failed to save template";
                      alert(msg.includes("409") ? "A template for this corridor already exists." : msg);
                    }
                  }}
                  disabled={!templateName.trim()}
                  style={{
                    flex: 1,
                    background: "var(--blue)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 12,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    opacity: templateName.trim() ? 1 : 0.5,
                  }}
                  data-testid="button-confirm-save-template"
                >
                  Save template
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  style={{
                    padding: "8px 12px",
                    background: "transparent",
                    borderRadius: 8,
                    color: "var(--t3)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  data-testid="button-cancel-save-template"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        ) : (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--gbg)", borderRadius: 8 }} data-testid="text-template-saved-success">
            <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
              Template saved. Find it at /templates.
            </span>
          </div>
        )}

        {/* Activity Timeline */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1 }}>
            History
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {timeline.map((entry, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "8px 0",
              borderBottom: idx < timeline.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--blue)",
              marginTop: 3,
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: 11, color: "var(--t2)" }}>{entry.event}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)" }}>
                {formatFullDate(entry.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type UploadedFile = { file: File; name: string; size: number };

function UploadZone({ icon, title, subtitle, accept, onFileSelect }: {
  icon: string;
  title: string;
  subtitle: string;
  accept?: string;
  onFileSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      className={`upload-zone${dragOver ? " drag-over" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onFileSelect(f);
      }}
      data-testid="upload-zone"
    >
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--txt)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--txt3)" }}>
        <em style={{ color: "var(--green)", fontStyle: "normal", fontWeight: 600 }}>{subtitle}</em>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept || ".pdf,.jpg,.jpeg,.png"}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); e.target.value = ""; }}
        style={{ display: "none" }}
      />
    </div>
  );
}

function FilePill({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  return (
    <div className="lc-fp">
      <span>📄</span>
      <span className="lc-fp-name">{name}</span>
      <span className="lc-fp-size">{(size / 1024).toFixed(0)}KB</span>
      <span className="lc-fp-ok">✓ Uploaded</span>
      <button className="lc-fp-x" onClick={onRemove} data-testid="button-remove-file">×</button>
    </div>
  );
}

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

  const WORKFLOW_STEPS = ["Lookup", "LC Check", "TwinLog Trail", "Archive"];
  const LC_TABS = ["Check", "Supplier docs", "TwinLog Trail", "Corrections"];
  const LC_STEP_LABELS = ["LC Terms", "Supplier Docs", "Review", "Results"];

  const breadcrumb = prefillData ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--t2)" }}>
      <span>{prefillData.commodity_name}</span>
      <span style={{ color: "var(--t3)" }}>&middot;</span>
      <span>{prefillData.origin_name} &rarr; {prefillData.dest_name}</span>
      <span style={{ color: "var(--t3)" }}>&middot;</span>
      <span
        style={{
          background: "var(--blue-dim)",
          color: "var(--blue)",
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          fontWeight: 600,
          padding: "3px 8px",
          borderRadius: 4,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
        }}
        data-testid="breadcrumb-step-badge"
      >
        LC Check
      </span>
    </div>
  ) : (
    <span style={{ fontSize: 13, color: "var(--t2)", fontWeight: 600 }}>LC Check</span>
  );

  const docTypeLabel = (dt: LcDocumentType) =>
    DOC_TYPES.find(d => d.value === dt)?.label || dt;

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
    <AppShell topCenter={breadcrumb}>
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
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 60px" }} data-testid="lc-check-page">

        {/* HERO BANNER */}
        <div className="lc-hero">
          <div>
            <div className="lc-hero-tag">Compliance &rsaquo; LC Check &rsaquo; New Check</div>
            <div className="lc-hero-title">LC Document<br />Checker</div>
            <div className="lc-hero-sub">Cross-check supplier docs against your LC &mdash; UCP 600 &amp; ISBP 745 applied.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, paddingTop: 2, flexShrink: 0 }}>
            <div className="lc-price-pill">
              {isFreeCheck && <span className="lc-free-dot">FREE</span>}
              {isFreeCheck ? "First check included" : "1 credit per check"}
            </div>
          </div>
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
        <div style={{ padding: "0 14px" }}>

          {showPrefillBanner && prefillData && (
            <div className="lc-note" style={{ marginBottom: 14 }} data-testid="banner-lc-prefill">
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

          {/* ── STEP 1: LC TERMS ── */}
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

                <div className="lc-fg2" style={{ marginTop: 13 }}>
                  <div className="lc-field">
                    <label>Beneficiary / Supplier <span className="req">*</span></label>
                    <Input value={lcFields.beneficiaryName} onChange={e => updateLcField("beneficiaryName", e.target.value)} placeholder="e.g. SARL AGRO EXPORT CI" data-testid="input-beneficiary-name" />
                  </div>
                  <div className="lc-field">
                    <label>Applicant / Buyer <span className="req">*</span></label>
                    <Input value={lcFields.applicantName} onChange={e => updateLcField("applicantName", e.target.value)} placeholder="e.g. Euro Trading GmbH" data-testid="input-applicant-name" />
                  </div>
                </div>

                <div className="lc-fg2" style={{ marginTop: 13 }}>
                  <div className="lc-field lc-f-full">
                    <label>Goods Description <span className="req">*</span></label>
                    <Input value={lcFields.goodsDescription} onChange={e => updateLcField("goodsDescription", e.target.value)} placeholder="e.g. Raw Cashew Nuts, Grade WW320" data-testid="input-goods-description" />
                  </div>
                </div>

                <div className="lc-fg3" style={{ marginTop: 13 }}>
                  <div className="lc-field">
                    <label>HS Code</label>
                    <Input value={lcFields.hsCode} onChange={e => updateLcField("hsCode", e.target.value)} placeholder="e.g. 0801.31" data-testid="input-hs-code" />
                  </div>
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
                    <Input type="number" value={lcFields.totalAmount || ""} onChange={e => updateLcField("totalAmount", parseFloat(e.target.value) || 0)} placeholder="250000" data-testid="input-total-amount" />
                  </div>
                </div>

                <div className="lc-fg3" style={{ marginTop: 13 }}>
                  <div className="lc-field">
                    <label>Currency</label>
                    <Select value={lcFields.currency} onValueChange={v => updateLcField("currency", v)}>
                      <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="lc-field">
                    <label>Unit Price</label>
                    <Input type="number" value={lcFields.unitPrice || ""} onChange={e => updateLcField("unitPrice", parseFloat(e.target.value) || 0)} placeholder="500" data-testid="input-unit-price" />
                  </div>
                  <div className="lc-field">
                    <label>Incoterms</label>
                    <Select value={lcFields.incoterms} onValueChange={v => updateLcField("incoterms", v)}>
                      <SelectTrigger data-testid="select-incoterms"><SelectValue /></SelectTrigger>
                      <SelectContent>{INCOTERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="lc-fg2" style={{ marginTop: 13 }}>
                  <div className="lc-field">
                    <label>Port of Loading</label>
                    <Input value={lcFields.portOfLoading} onChange={e => updateLcField("portOfLoading", e.target.value)} placeholder="e.g. Abidjan" data-testid="input-port-loading" />
                  </div>
                  <div className="lc-field">
                    <label>Port of Discharge</label>
                    <Input value={lcFields.portOfDischarge} onChange={e => updateLcField("portOfDischarge", e.target.value)} placeholder="e.g. Felixstowe" data-testid="input-port-discharge" />
                  </div>
                </div>

                <div className="lc-fg2" style={{ marginTop: 13 }}>
                  <div className="lc-field">
                    <label>Country of Origin</label>
                    <Input value={lcFields.countryOfOrigin} onChange={e => updateLcField("countryOfOrigin", e.target.value)} placeholder="e.g. Cote d'Ivoire" data-testid="input-country-origin" />
                  </div>
                </div>

                <div className="lc-fg2" style={{ marginTop: 13 }}>
                  <div className="lc-field">
                    <label>Latest Shipment Date <span className="req">*</span></label>
                    <Input type="date" value={lcFields.latestShipmentDate} onChange={e => updateLcField("latestShipmentDate", e.target.value)} data-testid="input-latest-shipment-date" />
                  </div>
                  <div className="lc-field">
                    <label>LC Expiry Date <span className="req">*</span></label>
                    <Input type="date" value={lcFields.lcExpiryDate} onChange={e => updateLcField("lcExpiryDate", e.target.value)} data-testid="input-lc-expiry-date" />
                  </div>
                </div>

                {/* Toggle switches */}
                <div style={{ marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
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
                    <strong>PDF attached for reference</strong> &mdash; manual field entry is required for now. Auto-extraction from uploaded documents is coming soon.
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

          {/* ── STEP 2: SUPPLIER DOCUMENTS ── */}
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

          {/* ── STEP 3: REVIEW ── */}
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
                <div style={{ marginTop: 16, padding: "12px 14px", background: "#f7f7f7", borderRadius: 10 }}>
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

          {/* ── STEP 4: RESULTS ── */}
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
                <InsuranceGapAlert />
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
              <div style={{ background: "#f7f7f7", border: "1px solid #e8e8e8", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Hash size={16} style={{ color: "var(--txt3)", marginTop: 2, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }} data-testid="text-lc-check-ref">
                      LC check ref: TT-LC-{new Date().getFullYear()}-{checkMutation.data.integrityHash.substring(0, 6).toUpperCase()}
                    </p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--txt3)", wordBreak: "break-all" }} data-testid="text-lc-integrity-hash">
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
            <div style={{ background: "#fff5f5", borderRadius: 10, padding: "12px 15px", display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
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
