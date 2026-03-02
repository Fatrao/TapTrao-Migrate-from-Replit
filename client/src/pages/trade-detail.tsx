import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { usePageTitle } from "@/hooks/use-page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Shield,
  Upload,
  Hash,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Package,
  Anchor,
  Archive,
  ExternalLink,
  Eye,
  Flag,
  Sparkles,
  Loader2,
} from "lucide-react";
import { iso2ToFlag } from "@/components/CountryFlagBadge";
import { estimateDemurrageRange } from "@/lib/demurrage-utils";

/* ── Map common country/region names to ISO2 for flag display ── */
const nameToIso2: Record<string, string> = {
  "European Union": "EU", "United Kingdom": "GB", "Germany": "DE", "France": "FR",
  "Italy": "IT", "Spain": "ES", "Switzerland": "CH", "Austria": "AT",
  "United States": "US", "China": "CN", "United Arab Emirates": "AE", "Turkey": "TR",
  "Côte d'Ivoire": "CI", "Ghana": "GH", "Ethiopia": "ET", "Kenya": "KE",
  "Tanzania": "TZ", "Uganda": "UG", "Nigeria": "NG", "Cameroon": "CM",
  "Rwanda": "RW", "Senegal": "SN", "Democratic Republic of the Congo": "CD",
  "Malawi": "MW", "Zambia": "ZM", "Zimbabwe": "ZW", "Madagascar": "MG",
  "Mozambique": "MZ", "Burundi": "BI", "South Africa": "ZA",
};
function nameFlag(name: string | null | undefined): string {
  if (!name) return "";
  const iso2 = nameToIso2[name];
  return iso2 ? iso2ToFlag(iso2) : "";
}

/* ── Types matching the API response ── */
type TradeDetail = {
  lookup: any;
  lcCase: any | null;
  latestLcCheck: any | null;
  supplierRequest: any | null;
  supplierUploads: any[];
  eudrRecord: any | null;
  twinlog: { ref: string | null; hash: string | null; lockedAt: string | null };
  tradeStatus: string;
  auditTrail: AuditEvent[];
  chainValid: boolean;
};

type AuditEvent = {
  id: string;
  lookupId: string;
  sessionId: string;
  eventType: string;
  eventData: any;
  previousHash: string | null;
  eventHash: string;
  createdAt: string;
};

/* ── Status badge colors ── */
const statusConfig: Record<string, { label: string; bg: string; text: string; icon: typeof Package }> = {
  active: { label: "Active", bg: "rgba(74,222,128,0.1)", text: "#16a34a", icon: Package },
  in_transit: { label: "In Transit", bg: "rgba(59,130,246,0.1)", text: "#3b82f6", icon: Anchor },
  arrived: { label: "Arrived", bg: "rgba(139,92,246,0.1)", text: "#8b5cf6", icon: Anchor },
  cleared: { label: "Cleared", bg: "rgba(34,197,94,0.1)", text: "#22c55e", icon: CheckCircle2 },
  closed: { label: "Closed", bg: "rgba(107,114,128,0.1)", text: "#6b7280", icon: Archive },
  archived: { label: "Archived", bg: "rgba(107,114,128,0.1)", text: "#9ca3af", icon: Archive },
};

/* ── Event type display config ── */
const eventConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  compliance_check: { icon: Shield, color: "#0e4e45", label: "Compliance Check" },
  account_created: { icon: CheckCircle2, color: "#4ade80", label: "Account Created" },
  lc_check: { icon: FileText, color: "#3b82f6", label: "LC Check" },
  lc_recheck: { icon: FileText, color: "#8b5cf6", label: "LC Re-check" },
  correction_sent: { icon: ArrowRight, color: "#f59e0b", label: "Correction Sent" },
  supplier_link_created: { icon: ExternalLink, color: "#0e4e45", label: "Supplier Link Created" },
  supplier_doc_uploaded: { icon: Upload, color: "#22c55e", label: "Document Uploaded" },
  buyer_doc_uploaded: { icon: Upload, color: "#0e4e45", label: "Document Uploaded (Buyer)" },
  doc_verified: { icon: ShieldCheck, color: "#16a34a", label: "Document Verified" },
  doc_flagged: { icon: Flag, color: "#ef4444", label: "Document Flagged" },
  doc_ai_scanned: { icon: Sparkles, color: "#8b5cf6", label: "AI Document Scan" },
  supplier_complete: { icon: CheckCircle2, color: "#16a34a", label: "Supplier Submission Complete" },
  status_change: { icon: ArrowRight, color: "#3b82f6", label: "Status Changed" },
  eta_set: { icon: Clock, color: "#8b5cf6", label: "ETA Set" },
  arrival: { icon: Anchor, color: "#22c55e", label: "Shipment Arrived" },
  customs_cleared: { icon: CheckCircle2, color: "#16a34a", label: "Customs Cleared" },
  twinlog_generated: { icon: Hash, color: "#0e4e45", label: "TwinLog Generated" },
  eudr_created: { icon: Shield, color: "#059669", label: "EUDR Record Created" },
  trade_archived: { icon: Archive, color: "#9ca3af", label: "Trade Archived" },
  trade_closed: { icon: Archive, color: "#6b7280", label: "Trade Closed" },
  trade_value_set: { icon: Package, color: "#0e4e45", label: "Trade Value Set" },
};

/* ── Status Stepper ── */
const STATUSES = ["active", "in_transit", "arrived", "cleared", "closed"];
const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  in_transit: "In Transit",
  arrived: "Arrived",
  cleared: "Cleared",
  closed: "Closed",
};

function StatusStepper({ current }: { current: string }) {
  const currentIndex = STATUSES.indexOf(current);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "0 24px 20px" }}>
      {STATUSES.map((status, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isArchived = current === "archived";

        return (
          <div key={status} style={{ display: "flex", alignItems: "center", flex: i < STATUSES.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                background: isArchived ? "rgba(156,163,175,0.15)" :
                  isComplete ? "#0e4e45" :
                  isCurrent ? "#4ade80" : "rgba(255,255,255,0.1)",
                color: isArchived ? "#9ca3af" :
                  (isComplete || isCurrent) ? "#fff" : "var(--t3)",
                transition: "all 0.2s",
              }}>
                {isComplete ? <CheckCircle2 size={14} /> : (i + 1)}
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: isCurrent ? 600 : 400,
                color: isCurrent ? "var(--t1)" : "var(--t3)",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            {i < STATUSES.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                marginBottom: 18,
                marginLeft: 6,
                marginRight: 6,
                background: isComplete ? "#0e4e45" : "rgba(255,255,255,0.1)",
                borderRadius: 1,
                transition: "background 0.2s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Audit Timeline ── */
function AuditTimeline({ events, chainValid }: { events: AuditEvent[]; chainValid: boolean }) {
  return (
    <div>
      {/* Chain integrity badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        padding: "8px 12px",
        borderRadius: 8,
        background: chainValid ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.06)",
        border: `1px solid ${chainValid ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`,
      }}>
        {chainValid ? (
          <ShieldCheck size={16} style={{ color: "#16a34a" }} />
        ) : (
          <ShieldAlert size={16} style={{ color: "#ef4444" }} />
        )}
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: chainValid ? "#16a34a" : "#ef4444",
        }}>
          {chainValid ? "Audit Chain Verified" : "Chain Integrity Warning"}
        </span>
        <span style={{ fontSize: 11, color: chainValid ? "#166534" : "#991b1b", marginLeft: "auto" }}>
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--t3)", textAlign: "center", padding: 20 }}>
          No audit events recorded yet.
        </p>
      ) : (
        <div style={{ position: "relative", paddingLeft: 24 }}>
          {/* Vertical line */}
          <div style={{
            position: "absolute",
            left: 11,
            top: 8,
            bottom: 8,
            width: 2,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 1,
          }} />

          {events.map((event, i) => {
            const cfg = eventConfig[event.eventType] || {
              icon: Clock,
              color: "#6b7280",
              label: event.eventType.replace(/_/g, " "),
            };
            const Icon = cfg.icon;
            const date = new Date(event.createdAt);

            return (
              <div key={event.id} style={{
                position: "relative",
                paddingBottom: i < events.length - 1 ? 16 : 0,
                paddingLeft: 20,
              }}>
                {/* Dot */}
                <div style={{
                  position: "absolute",
                  left: -13,
                  top: 4,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  border: `2px solid ${cfg.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon size={12} style={{ color: cfg.color }} />
                </div>

                {/* Content */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>
                      {cfg.label}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontFamily: "monospace",
                      color: "var(--t3)",
                      background: "rgba(255,255,255,0.06)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}>
                      {event.eventHash.slice(0, 8)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>
                    {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" at "}
                    {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {/* Event-specific details */}
                  {event.eventType === "status_change" && event.eventData?.from && (
                    <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 4 }}>
                      {event.eventData.from} → {event.eventData.to}
                    </div>
                  )}
                  {event.eventType === "lc_check" && event.eventData?.verdict && (
                    <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 4 }}>
                      Verdict: {event.eventData.verdict}
                    </div>
                  )}
                  {event.eventType === "supplier_doc_uploaded" && event.eventData?.docType && (
                    <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 4 }}>
                      {event.eventData.docType} — {event.eventData.filename}
                    </div>
                  )}
                  {event.eventType === "buyer_doc_uploaded" && event.eventData?.docType && (
                    <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 4 }}>
                      {event.eventData.docType} — {event.eventData.filename}
                      {event.eventData.note && (
                        <span style={{ color: "var(--t3)", marginLeft: 6 }}>({event.eventData.note})</span>
                      )}
                    </div>
                  )}
                  {event.eventType === "doc_verified" && event.eventData?.docType && (
                    <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>
                      {event.eventData.docType} — Verified
                    </div>
                  )}
                  {event.eventType === "doc_flagged" && event.eventData?.docType && (
                    <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
                      {event.eventData.docType} — {event.eventData.finding || "Issue flagged"}
                      {event.eventData.ucpRule && (
                        <span style={{ color: "var(--t3)", marginLeft: 6 }}>({event.eventData.ucpRule})</span>
                      )}
                    </div>
                  )}
                  {event.eventType === "doc_ai_scanned" && event.eventData?.docType && (
                    <div style={{ fontSize: 11, color: "#8b5cf6", marginTop: 4 }}>
                      {event.eventData.docType} — {event.eventData.verified ? "Passed" : "Issues found"}
                      {event.eventData.confidence && (
                        <span style={{ color: "var(--t3)", marginLeft: 6 }}>({event.eventData.confidence} confidence)</span>
                      )}
                    </div>
                  )}
                  {event.eventType === "trade_value_set" && event.eventData?.value && (
                    <div style={{ fontSize: 11, color: "#0e4e45", marginTop: 4 }}>
                      {event.eventData.currency || "USD"} {Number(event.eventData.value).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Page Component ── */
export default function TradeDetail() {
  const [match, params] = useRoute("/trades/:id");
  const tradeId = params?.id;

  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<TradeDetail>({
    queryKey: [`/api/trades/${tradeId}`],
    enabled: !!tradeId,
  });

  // Buyer upload on behalf state
  const [showBuyerUpload, setShowBuyerUpload] = useState(false);
  const [buyerDocType, setBuyerDocType] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [buyerUploading, setBuyerUploading] = useState(false);
  const buyerFileRef = useRef<HTMLInputElement>(null);

  // Document verification state
  const [flaggingUploadId, setFlaggingUploadId] = useState<string | null>(null);
  const [flagFinding, setFlagFinding] = useState("");
  const [flagUcpRule, setFlagUcpRule] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ uploadId: string; details: string; confidence: string } | null>(null);

  // Trade value editing state
  const [editingValue, setEditingValue] = useState(false);
  const [tradeValueInput, setTradeValueInput] = useState("");
  const [tradeValueCurrencyInput, setTradeValueCurrencyInput] = useState("USD");
  const [savingValue, setSavingValue] = useState(false);

  const handleBuyerUpload = async () => {
    const file = buyerFileRef.current?.files?.[0];
    if (!file || !buyerDocType || !data?.supplierRequest) return;
    setBuyerUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", buyerDocType);
      if (buyerNote.trim()) formData.append("note", buyerNote.trim());
      const res = await fetch(`/api/supplier-requests/${data.supplierRequest.id}/buyer-upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }
      // Reset form and refetch
      setShowBuyerUpload(false);
      setBuyerDocType("");
      setBuyerNote("");
      if (buyerFileRef.current) buyerFileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setBuyerUploading(false);
    }
  };

  const handleVerify = async (uploadId: string) => {
    setVerifyingId(uploadId);
    try {
      const res = await fetch(`/api/supplier-uploads/${uploadId}/verify`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Verify failed" }));
        throw new Error(err.message);
      }
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    } catch (err: any) {
      alert(err.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleFlag = async (uploadId: string) => {
    if (!flagFinding.trim()) {
      alert("Please describe the issue found");
      return;
    }
    setVerifyingId(uploadId);
    try {
      const res = await fetch(`/api/supplier-uploads/${uploadId}/verify`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verified: false,
          finding: flagFinding.trim(),
          ucpRule: flagUcpRule.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Flag failed" }));
        throw new Error(err.message);
      }
      setFlaggingUploadId(null);
      setFlagFinding("");
      setFlagUcpRule("");
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    } catch (err: any) {
      alert(err.message || "Flagging failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAiScan = async (uploadId: string) => {
    setScanningId(uploadId);
    setScanResult(null);
    try {
      const res = await fetch(`/api/supplier-uploads/${uploadId}/scan`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Scan failed" }));
        if (err.code === "AI_NOT_CONFIGURED") {
          alert("AI scanning is not configured. Please set ANTHROPIC_API_KEY on the server.");
          return;
        }
        throw new Error(err.message);
      }
      const result = await res.json();
      setScanResult({
        uploadId,
        details: result.scan?.details || "Scan complete",
        confidence: result.scan?.confidence || "unknown",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    } catch (err: any) {
      alert(err.message || "AI scan failed");
    } finally {
      setScanningId(null);
    }
  };

  const handleSaveTradeValue = async () => {
    if (!tradeId || !tradeValueInput.trim()) return;
    setSavingValue(true);
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeValue: tradeValueInput.trim(),
          tradeValueCurrency: tradeValueCurrencyInput,
        }),
      });
      if (!res.ok) throw new Error("Failed to save trade value");
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
      setEditingValue(false);
    } catch (err: any) {
      alert(err.message || "Failed to save trade value");
    } finally {
      setSavingValue(false);
    }
  };

  usePageTitle(
    data?.lookup?.commodityName
      ? `${data.lookup.commodityName} — Trade Detail`
      : "Trade Detail",
    "View full trade information, compliance results, and audit trail"
  );

  if (!match) return null;

  return (
    <AppShell>
      {/* Green hero */}
      <div className="green-hero" style={{ margin: "4px 24px 16px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "5px 14px",
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          marginBottom: 14,
          letterSpacing: "0.03em",
        }}>
          <Link href="/trades" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
            My Trades
          </Link>
          <ChevronRight size={12} />
          <span style={{ color: "rgba(255,255,255,0.8)" }}>
            {isLoading ? "Loading..." : data?.lookup?.commodityName || "Trade Detail"}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" style={{ background: "rgba(255,255,255,0.1)" }} />
            <Skeleton className="h-4 w-48" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        ) : data ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{
                fontFamily: "'Clash Display', sans-serif",
                fontWeight: 700,
                fontSize: 28,
                color: "#fff",
                margin: 0,
              }}>
                {data.lookup.commodityName}
              </h1>

              {/* Status badge */}
              {(() => {
                const cfg = statusConfig[data.tradeStatus] || statusConfig.active;
                return (
                  <Badge style={{
                    background: cfg.bg,
                    color: cfg.text,
                    border: "none",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                  }}>
                    {cfg.label}
                  </Badge>
                );
              })()}

              {/* Readiness score badge */}
              {data.lookup.readinessScore != null && (
                <Badge style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                }}>
                  Score: {data.lookup.readinessScore}/100
                </Badge>
              )}
            </div>

            <p style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.55)",
              margin: "6px 0 0",
            }}>
              {nameFlag(data.lookup.originName)} {data.lookup.originName}
              {" → "}
              {nameFlag(data.lookup.destinationName)} {data.lookup.destinationName}
              {data.lookup.hsCode && (
                <span style={{ marginLeft: 10, fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  HS {data.lookup.hsCode}
                </span>
              )}
            </p>
          </>
        ) : error ? (
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 28, color: "#ef4444", margin: 0 }}>
            Trade Not Found
          </h1>
        ) : null}
      </div>

      {isLoading ? (
        <div style={{ padding: "0 24px 24px" }}>
          <Skeleton className="h-48 w-full" style={{ borderRadius: 14 }} />
        </div>
      ) : error ? (
        <div style={{ padding: "0 24px" }}>
          <Card>
            <CardContent className="p-6 text-center">
              <XCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "#ef4444" }} />
              <p style={{ fontSize: 14, color: "#ef4444" }}>
                This trade was not found or you don't have access to it.
              </p>
              <Link href="/trades">
                <Button variant="outline" size="sm" style={{ marginTop: 12 }}>
                  Back to My Trades
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : data ? (
        <>
          {/* Status Stepper */}
          <StatusStepper current={data.tradeStatus} />

          {/* Content grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 16,
            padding: "0 24px 32px",
          }}>
            {/* LEFT COLUMN — Main content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Compliance Summary */}
              <Card>
                <CardContent className="p-5">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: 0 }}>
                      Compliance Summary
                    </h3>
                    <Link href={`/lookup?lookupId=${data.lookup.id}`}>
                      <Button variant="outline" size="sm" style={{ fontSize: 12 }}>
                        View Full Report
                      </Button>
                    </Link>
                  </div>

                  {data.lookup.readinessScore != null && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "12px 16px",
                      borderRadius: 10,
                      background: "rgba(14,78,69,0.06)",
                      marginBottom: 12,
                    }}>
                      <div style={{
                        fontFamily: "'Clash Display', sans-serif",
                        fontWeight: 700,
                        fontSize: 28,
                        color: "#4ade80",
                      }}>
                        {data.lookup.readinessScore}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>
                          Readiness Score
                        </div>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: data.lookup.readinessVerdict === "RED" ? "#ef4444" :
                            data.lookup.readinessVerdict === "AMBER" ? "#eab308" : "#4ade80",
                        }}>
                          {data.lookup.readinessVerdict || "—"}
                        </div>
                      </div>
                    </div>
                  )}

                  {data.lookup.readinessSummary && (
                    <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6, margin: 0 }}>
                      {data.lookup.readinessSummary}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* LC Status */}
              {data.lcCase && (
                <Card>
                  <CardContent className="p-5">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: 0 }}>
                        LC Document Check
                      </h3>
                      <Link href={`/lc-check?lookupId=${data.lookup.id}`}>
                        <Button variant="outline" size="sm" style={{ fontSize: 12 }}>
                          {data.latestLcCheck ? "View / Re-check" : "Run LC Check"}
                        </Button>
                      </Link>
                    </div>

                    {data.latestLcCheck ? (
                      <div>
                        <Badge style={{
                          background: data.latestLcCheck.verdict === "COMPLIANT" ? "rgba(34,197,94,0.1)" :
                            data.latestLcCheck.verdict === "COMPLIANT_WITH_NOTES" ? "rgba(245,158,11,0.1)" :
                            "rgba(239,68,68,0.1)",
                          color: data.latestLcCheck.verdict === "COMPLIANT" ? "#16a34a" :
                            data.latestLcCheck.verdict === "COMPLIANT_WITH_NOTES" ? "#d97706" :
                            "#ef4444",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 10,
                        }}>
                          {data.latestLcCheck.verdict?.replace(/_/g, " ")}
                        </Badge>

                        {data.lcCase.recheckCount > 0 && (
                          <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 6 }}>
                            {data.lcCase.recheckCount} re-check{data.lcCase.recheckCount > 1 ? "s" : ""} performed
                          </p>
                        )}

                        {data.lcCase.correctionRequests && (data.lcCase.correctionRequests as any[]).length > 0 && (
                          <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 4 }}>
                            {(data.lcCase.correctionRequests as any[]).length} correction request{(data.lcCase.correctionRequests as any[]).length > 1 ? "s" : ""} sent
                          </p>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: "var(--t3)" }}>
                        No LC check has been run for this trade yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Supplier Documents */}
              <Card>
                <CardContent className="p-5">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: 0 }}>
                      Supplier Documents
                    </h3>
                    <div style={{ display: "flex", gap: 6 }}>
                      {data.supplierRequest && (
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ fontSize: 11 }}
                          onClick={() => setShowBuyerUpload(!showBuyerUpload)}
                        >
                          <Upload size={12} style={{ marginRight: 4 }} />
                          Upload on behalf
                        </Button>
                      )}
                      {!data.supplierRequest && (
                        <Link href={`/lookup?lookupId=${data.lookup.id}`}>
                          <Button variant="outline" size="sm" style={{ fontSize: 12 }}>
                            Send Upload Link
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {data.supplierRequest ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <Badge style={{
                          background: data.supplierRequest.status === "complete" ? "rgba(34,197,94,0.1)" :
                            data.supplierRequest.status === "partial" ? "rgba(245,158,11,0.1)" :
                            "rgba(107,114,128,0.1)",
                          color: data.supplierRequest.status === "complete" ? "#16a34a" :
                            data.supplierRequest.status === "partial" ? "#d97706" :
                            "#6b7280",
                          border: "none",
                          fontSize: 11,
                        }}>
                          {data.supplierRequest.status}
                        </Badge>
                      </div>

                      {/* Required docs list */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>
                          Required ({(data.supplierRequest.docsRequired as string[] || []).length})
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(data.supplierRequest.docsRequired as string[] || []).map((doc: string) => {
                            const received = data.supplierUploads.some((u: any) => u.docType === doc);
                            return (
                              <span key={doc} style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: received ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.06)",
                                color: received ? "#16a34a" : "var(--t3)",
                                border: `1px solid ${received ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)"}`,
                              }}>
                                {received && <CheckCircle2 size={9} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />}
                                {doc}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Received documents with verification */}
                      {data.supplierUploads.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 8 }}>
                            Received Documents
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {data.supplierUploads.map((upload: any) => (
                              <div key={upload.id} style={{
                                padding: "10px 12px",
                                background: upload.verified === true ? "rgba(34,197,94,0.06)" :
                                  (upload.verified === false && upload.finding) ? "rgba(239,68,68,0.06)" :
                                  "rgba(255,255,255,0.03)",
                                border: `1px solid ${
                                  upload.verified === true ? "rgba(34,197,94,0.15)" :
                                  (upload.verified === false && upload.finding) ? "rgba(239,68,68,0.15)" :
                                  "rgba(255,255,255,0.06)"
                                }`,
                                borderRadius: 8,
                              }}>
                                {/* Doc header row */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    {upload.verified === true ? (
                                      <ShieldCheck size={13} style={{ color: "#16a34a" }} />
                                    ) : (upload.verified === false && upload.finding) ? (
                                      <ShieldAlert size={13} style={{ color: "#ef4444" }} />
                                    ) : (
                                      <FileText size={13} style={{ color: "var(--t3)" }} />
                                    )}
                                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--t1)" }}>
                                      {upload.docType}
                                    </span>
                                    {upload.uploadedBy === "buyer" && (
                                      <span style={{
                                        fontSize: 9, fontWeight: 600, color: "var(--t3)",
                                        background: "rgba(255,255,255,0.08)", padding: "1px 5px",
                                        borderRadius: 4,
                                      }}>
                                        Manual
                                      </span>
                                    )}
                                    {upload.verified === true && (
                                      <span style={{
                                        fontSize: 9, fontWeight: 600, color: "#16a34a",
                                        background: "rgba(34,197,94,0.1)", padding: "1px 6px",
                                        borderRadius: 4,
                                      }}>
                                        Verified
                                      </span>
                                    )}
                                    {upload.verified === false && upload.finding && (
                                      <span style={{
                                        fontSize: 9, fontWeight: 600, color: "#ef4444",
                                        background: "rgba(239,68,68,0.1)", padding: "1px 6px",
                                        borderRadius: 4,
                                      }}>
                                        Flagged
                                      </span>
                                    )}
                                  </div>

                                  {/* Action buttons */}
                                  <div style={{ display: "flex", gap: 4 }}>
                                    {scanningId === upload.id ? (
                                      <Loader2 size={14} style={{ color: "#8b5cf6", animation: "spin 1s linear infinite" }} />
                                    ) : (
                                      <button
                                        onClick={() => handleAiScan(upload.id)}
                                        title="AI Scan"
                                        style={{
                                          background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                                          borderRadius: 5, padding: "3px 6px", cursor: "pointer",
                                          display: "flex", alignItems: "center", gap: 3,
                                          fontSize: 10, color: "#8b5cf6", fontWeight: 500,
                                        }}
                                      >
                                        <Sparkles size={10} /> Scan
                                      </button>
                                    )}
                                    {verifyingId === upload.id ? (
                                      <Loader2 size={14} style={{ color: "#0e4e45", animation: "spin 1s linear infinite" }} />
                                    ) : upload.verified !== true ? (
                                      <button
                                        onClick={() => handleVerify(upload.id)}
                                        title="Mark as verified"
                                        style={{
                                          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                                          borderRadius: 5, padding: "3px 6px", cursor: "pointer",
                                          display: "flex", alignItems: "center", gap: 3,
                                          fontSize: 10, color: "#16a34a", fontWeight: 500,
                                        }}
                                      >
                                        <CheckCircle2 size={10} /> Verify
                                      </button>
                                    ) : null}
                                    <button
                                      onClick={() => {
                                        if (flaggingUploadId === upload.id) {
                                          setFlaggingUploadId(null);
                                        } else {
                                          setFlaggingUploadId(upload.id);
                                          setFlagFinding(upload.finding || "");
                                          setFlagUcpRule(upload.ucpRule || "");
                                        }
                                      }}
                                      title="Flag issue"
                                      style={{
                                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                                        borderRadius: 5, padding: "3px 6px", cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 3,
                                        fontSize: 10, color: "#ef4444", fontWeight: 500,
                                      }}
                                    >
                                      <Flag size={10} /> Flag
                                    </button>
                                  </div>
                                </div>

                                {/* File info */}
                                <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 4 }}>
                                  {upload.originalFilename}
                                  {upload.filesizeBytes && (
                                    <span style={{ marginLeft: 8 }}>
                                      {(upload.filesizeBytes / 1024).toFixed(0)} KB
                                    </span>
                                  )}
                                </div>

                                {/* Finding display */}
                                {upload.finding && (
                                  <div style={{
                                    marginTop: 6, padding: "6px 8px", borderRadius: 6,
                                    background: upload.verified === false ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)",
                                    fontSize: 11, color: upload.verified === false ? "#ef4444" : "#16a34a",
                                  }}>
                                    {upload.finding}
                                    {upload.ucpRule && (
                                      <span style={{ display: "block", marginTop: 2, fontSize: 10, color: "var(--t3)" }}>
                                        {upload.ucpRule}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* AI scan result toast */}
                                {scanResult?.uploadId === upload.id && (
                                  <div style={{
                                    marginTop: 6, padding: "6px 8px", borderRadius: 6,
                                    background: "rgba(139,92,246,0.06)",
                                    border: "1px solid rgba(139,92,246,0.12)",
                                    fontSize: 11, color: "#8b5cf6",
                                  }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                      <Sparkles size={10} />
                                      <span style={{ fontWeight: 600 }}>AI Analysis</span>
                                      <span style={{ fontSize: 9, color: "var(--t3)" }}>({scanResult?.confidence})</span>
                                    </div>
                                    {scanResult?.details}
                                  </div>
                                )}

                                {/* Flag form (inline) */}
                                {flaggingUploadId === upload.id && (
                                  <div style={{
                                    marginTop: 8, padding: 10, borderRadius: 6,
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                  }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t2)", marginBottom: 6 }}>
                                      Flag issue with this document
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Issue found — e.g. Invoice amount doesn't match LC"
                                      value={flagFinding}
                                      onChange={(e) => setFlagFinding(e.target.value)}
                                      style={{
                                        width: "100%", background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.12)", color: "var(--t1)",
                                        borderRadius: 6, padding: "6px 8px", fontSize: 11, marginBottom: 6,
                                      }}
                                    />
                                    <input
                                      type="text"
                                      placeholder="UCP rule (optional) — e.g. UCP 600 Art. 18(a)(iii)"
                                      value={flagUcpRule}
                                      onChange={(e) => setFlagUcpRule(e.target.value)}
                                      style={{
                                        width: "100%", background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.12)", color: "var(--t1)",
                                        borderRadius: 6, padding: "6px 8px", fontSize: 11, marginBottom: 8,
                                      }}
                                    />
                                    <div style={{ display: "flex", gap: 6 }}>
                                      <button
                                        onClick={() => handleFlag(upload.id)}
                                        disabled={!flagFinding.trim()}
                                        style={{
                                          background: "#ef4444", color: "#fff", border: "none",
                                          borderRadius: 6, padding: "5px 12px", fontSize: 11,
                                          fontWeight: 500, cursor: flagFinding.trim() ? "pointer" : "not-allowed",
                                          opacity: flagFinding.trim() ? 1 : 0.5,
                                        }}
                                      >
                                        Submit Flag
                                      </button>
                                      <button
                                        onClick={() => { setFlaggingUploadId(null); setFlagFinding(""); setFlagUcpRule(""); }}
                                        style={{
                                          background: "transparent", color: "var(--t3)", border: "1px solid rgba(255,255,255,0.1)",
                                          borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer",
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Buyer upload form */}
                      {showBuyerUpload && (
                        <div style={{
                          marginTop: 14,
                          padding: 14,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 10,
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)", marginBottom: 10 }}>
                            Upload document received outside TapTrao
                          </div>
                          <select
                            value={buyerDocType}
                            onChange={(e) => setBuyerDocType(e.target.value)}
                            style={{
                              width: "100%",
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              color: "var(--t1)",
                              borderRadius: 6,
                              padding: "8px 10px",
                              fontSize: 12,
                              marginBottom: 8,
                            }}
                          >
                            <option value="" style={{ background: "#1a1a1a" }}>Select document type...</option>
                            {(data.supplierRequest.docsRequired as string[] || []).map((doc: string) => (
                              <option key={doc} value={doc} style={{ background: "#1a1a1a" }}>{doc}</option>
                            ))}
                          </select>
                          <input
                            ref={buyerFileRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            style={{
                              width: "100%",
                              fontSize: 12,
                              color: "var(--t2)",
                              marginBottom: 8,
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Note (optional) — e.g. Received via email"
                            value={buyerNote}
                            onChange={(e) => setBuyerNote(e.target.value)}
                            style={{
                              width: "100%",
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              color: "var(--t1)",
                              borderRadius: 6,
                              padding: "8px 10px",
                              fontSize: 12,
                              marginBottom: 10,
                            }}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button
                              size="sm"
                              style={{ fontSize: 11, background: "#0e4e45", color: "#fff" }}
                              disabled={!buyerDocType || buyerUploading}
                              onClick={handleBuyerUpload}
                            >
                              {buyerUploading ? "Uploading..." : "Upload"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ fontSize: 11, color: "var(--t3)" }}
                              onClick={() => setShowBuyerUpload(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--t3)" }}>
                      No supplier upload link has been created yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* EUDR Status (if applicable) */}
              {data.eudrRecord && (
                <Card>
                  <CardContent className="p-5">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: 0 }}>
                        EUDR Due Diligence
                      </h3>
                      <Link href={`/eudr/${data.lookup.id}`}>
                        <Button variant="outline" size="sm" style={{ fontSize: 12 }}>
                          View / Edit
                        </Button>
                      </Link>
                    </div>
                    <Badge style={{
                      background: data.eudrRecord.status === "approved" ? "rgba(34,197,94,0.1)" :
                        "rgba(245,158,11,0.1)",
                      color: data.eudrRecord.status === "approved" ? "#16a34a" : "#d97706",
                      border: "none",
                      fontSize: 11,
                    }}>
                      {data.eudrRecord.status}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT COLUMN — Trade Info + Audit Timeline */}
            <div>
              {/* Shipment Value */}
              <Card style={{ marginBottom: 16 }}>
                <CardContent className="p-5">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: 0 }}>
                      Shipment Value
                    </h3>
                    {!editingValue && (
                      <button
                        onClick={() => {
                          setTradeValueInput(data.lookup.tradeValue || "");
                          setTradeValueCurrencyInput(data.lookup.tradeValueCurrency || "USD");
                          setEditingValue(true);
                        }}
                        style={{
                          background: "none",
                          border: "1px solid rgba(14,78,69,0.3)",
                          borderRadius: 6,
                          padding: "3px 10px",
                          fontSize: 11,
                          color: "#0e4e45",
                          cursor: "pointer",
                        }}
                      >
                        {data.lookup.tradeValue ? "Edit" : "Add Value"}
                      </button>
                    )}
                  </div>

                  {editingValue ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <select
                          value={tradeValueCurrencyInput}
                          onChange={(e) => setTradeValueCurrencyInput(e.target.value)}
                          style={{
                            width: 72,
                            padding: "6px 8px",
                            fontSize: 13,
                            borderRadius: 6,
                            border: "1px solid rgba(0,0,0,0.15)",
                            background: "#fff",
                          }}
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CHF">CHF</option>
                        </select>
                        <input
                          type="number"
                          placeholder="e.g. 125000"
                          value={tradeValueInput}
                          onChange={(e) => setTradeValueInput(e.target.value)}
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            fontSize: 13,
                            borderRadius: 6,
                            border: "1px solid rgba(0,0,0,0.15)",
                          }}
                          autoFocus
                        />
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={handleSaveTradeValue}
                          disabled={savingValue || !tradeValueInput.trim()}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            fontSize: 12,
                            fontWeight: 600,
                            borderRadius: 6,
                            border: "none",
                            background: "#0e4e45",
                            color: "#fff",
                            cursor: savingValue ? "wait" : "pointer",
                            opacity: savingValue || !tradeValueInput.trim() ? 0.5 : 1,
                          }}
                        >
                          {savingValue ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingValue(false)}
                          style={{
                            padding: "6px 14px",
                            fontSize: 12,
                            borderRadius: 6,
                            border: "1px solid rgba(0,0,0,0.15)",
                            background: "#fff",
                            color: "var(--t2)",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : data.lookup.tradeValue ? (
                    <div style={{
                      fontFamily: "'Clash Display', sans-serif",
                      fontWeight: 700,
                      fontSize: 24,
                      color: "#4ade80",
                    }}>
                      {data.lookup.tradeValueCurrency || "USD"} {Number(data.lookup.tradeValue).toLocaleString()}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--t3)", margin: 0 }}>
                      No value set yet. Click "Add Value" to record the shipment value.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Demurrage Estimate */}
              {(() => {
                const destIso2 = nameToIso2[data.lookup.destinationName];
                const verdict = data.lookup.readinessVerdict as "GREEN" | "AMBER" | "RED" | undefined;
                const estimate = destIso2 ? estimateDemurrageRange(destIso2, verdict || "AMBER") : null;
                if (!estimate) return null;
                const tradeVal = data.lookup.tradeValue ? Number(data.lookup.tradeValue) : 0;
                const pctOfCargo = tradeVal > 0 ? ((estimate.maxCost / tradeVal) * 100).toFixed(1) : null;
                const verdictColor = verdict === "RED" ? "#ef4444" : verdict === "AMBER" ? "#eab308" : "#4ade80";
                return (
                  <Card>
                    <CardContent className="p-5">
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>⚓</span> Demurrage Estimate
                      </h3>
                      <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6, marginBottom: 10 }}>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ color: "var(--t3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Port</span>
                          <div style={{ fontWeight: 500, color: "var(--t1)" }}>
                            {estimate.port.label}
                            {estimate.allPorts.length > 1 && (
                              <span style={{ color: "var(--t3)", fontSize: 11, fontWeight: 400 }}> (+ {estimate.allPorts.length - 1} more)</span>
                            )}
                          </div>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ color: "var(--t3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Estimated delay</span>
                          <div>
                            <span style={{ color: verdictColor, fontWeight: 600 }}>{estimate.delayLabel}</span>
                            <span style={{ color: "var(--t3)", fontSize: 11 }}> (based on {verdict || "AMBER"} readiness)</span>
                          </div>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ color: "var(--t3)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Cost range (20ft)</span>
                          <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 20, color: "#0e4e45" }}>
                            ${estimate.minCost.toLocaleString()} – ${estimate.maxCost.toLocaleString()}
                          </div>
                        </div>
                        {pctOfCargo && (
                          <div style={{ fontSize: 12, color: Number(pctOfCargo) > 5 ? "#ef4444" : "var(--t3)", marginTop: 2 }}>
                            ≈ {pctOfCargo}% of cargo value
                          </div>
                        )}
                      </div>
                      <Link href="/demurrage">
                        <span style={{ fontSize: 11, color: "#0e4e45", cursor: "pointer", fontWeight: 600 }}>
                          Open full calculator ({estimate.allPorts.length} port{estimate.allPorts.length !== 1 ? "s" : ""}) →
                        </span>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })()}

              <Card>
                <CardContent className="p-5">
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: "0 0 16px" }}>
                    TwinLog Audit Trail
                  </h3>
                  <AuditTimeline events={data.auditTrail} chainValid={data.chainValid} />
                </CardContent>
              </Card>

              {/* TwinLog ref */}
              {data.twinlog.ref && (
                <Card style={{ marginTop: 16 }}>
                  <CardContent className="p-4">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Hash size={14} style={{ color: "#0e4e45" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>TwinLog Reference</span>
                    </div>
                    <div style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#0e4e45",
                      background: "rgba(14,78,69,0.06)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      wordBreak: "break-all",
                    }}>
                      {data.twinlog.ref}
                    </div>
                    {data.twinlog.hash && (
                      <div style={{
                        fontFamily: "monospace",
                        fontSize: 10,
                        color: "var(--t3)",
                        marginTop: 6,
                      }}>
                        sha256:{data.twinlog.hash.slice(0, 12)}...
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card style={{ marginTop: 16 }}>
                <CardContent className="p-4 space-y-2">
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", marginBottom: 8 }}>
                    Actions
                  </h3>
                  <Link href={`/lookup?lookupId=${data.lookup.id}`}>
                    <Button variant="outline" size="sm" style={{ width: "100%", justifyContent: "flex-start", fontSize: 12 }}>
                      <Shield size={14} className="mr-2" /> View Compliance Report
                    </Button>
                  </Link>
                  {!data.lcCase && (
                    <Link href={`/lc-check?lookupId=${data.lookup.id}`}>
                      <Button variant="outline" size="sm" style={{ width: "100%", justifyContent: "flex-start", fontSize: 12, marginTop: 6 }}>
                        <FileText size={14} className="mr-2" /> Run LC Check
                      </Button>
                    </Link>
                  )}
                  {data.twinlog.ref && (
                    <Link href={`/verify/${data.twinlog.ref}`}>
                      <Button variant="outline" size="sm" style={{ width: "100%", justifyContent: "flex-start", fontSize: 12, marginTop: 6 }}>
                        <ExternalLink size={14} className="mr-2" /> Public Verify Link
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
