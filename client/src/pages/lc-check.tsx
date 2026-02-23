import { useState, useCallback, useEffect } from "react";
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
          <div style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: "clamp(48px, 6vw, 64px)", letterSpacing: -4, color: "var(--t1)", lineHeight: 1 }}>
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

  const breadcrumb = prefillData ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--t2)" }}>
      <span>{prefillData.commodity_name}</span>
      <span style={{ color: "var(--t3)" }}>·</span>
      <span>{prefillData.origin_name} → {prefillData.dest_name}</span>
      <span style={{ color: "var(--t3)" }}>·</span>
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
              letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 7,
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
          <div style={{ margin: "14px 14px 0", background: "rgba(74,140,111,0.06)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 12, position: "relative" }} data-testid="banner-lc-prefill">
            <ExternalLink size={18} style={{ color: "var(--green)", flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }} data-testid="text-prefill-info">
                Pre-filled from your compliance lookup
              </p>
              <p style={{ fontSize: 13, color: "#666" }}>
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
              style={{ color: "#999", background: "none", border: "none", cursor: "pointer" }}
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
                        fontFamily: "var(--fh)", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em",
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
                <InsuranceGapAlert />
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
