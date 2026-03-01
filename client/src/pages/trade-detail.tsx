import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { iso2ToFlag } from "@/components/CountryFlagBadge";

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
  compliance_check: { icon: Shield, color: "#6b9080", label: "Compliance Check" },
  account_created: { icon: CheckCircle2, color: "#4ade80", label: "Account Created" },
  lc_check: { icon: FileText, color: "#3b82f6", label: "LC Check" },
  lc_recheck: { icon: FileText, color: "#8b5cf6", label: "LC Re-check" },
  correction_sent: { icon: ArrowRight, color: "#f59e0b", label: "Correction Sent" },
  supplier_link_created: { icon: ExternalLink, color: "#6b9080", label: "Supplier Link Created" },
  supplier_doc_uploaded: { icon: Upload, color: "#22c55e", label: "Document Uploaded" },
  supplier_complete: { icon: CheckCircle2, color: "#16a34a", label: "Supplier Submission Complete" },
  status_change: { icon: ArrowRight, color: "#3b82f6", label: "Status Changed" },
  eta_set: { icon: Clock, color: "#8b5cf6", label: "ETA Set" },
  arrival: { icon: Anchor, color: "#22c55e", label: "Shipment Arrived" },
  customs_cleared: { icon: CheckCircle2, color: "#16a34a", label: "Customs Cleared" },
  twinlog_generated: { icon: Hash, color: "#6b9080", label: "TwinLog Generated" },
  eudr_created: { icon: Shield, color: "#059669", label: "EUDR Record Created" },
  trade_archived: { icon: Archive, color: "#9ca3af", label: "Trade Archived" },
  trade_closed: { icon: Archive, color: "#6b7280", label: "Trade Closed" },
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
                  isComplete ? "#6b9080" :
                  isCurrent ? "#4ade80" : "rgba(0,0,0,0.06)",
                color: isArchived ? "#9ca3af" :
                  (isComplete || isCurrent) ? "#fff" : "#999",
                transition: "all 0.2s",
              }}>
                {isComplete ? <CheckCircle2 size={14} /> : (i + 1)}
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: isCurrent ? 600 : 400,
                color: isCurrent ? "#1a1a1a" : "#999",
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
                background: isComplete ? "#6b9080" : "rgba(0,0,0,0.08)",
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
        <p style={{ fontSize: 13, color: "#999", textAlign: "center", padding: 20 }}>
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
            background: "rgba(0,0,0,0.06)",
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
                  background: "#fff",
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
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
                      {cfg.label}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontFamily: "monospace",
                      color: "rgba(0,0,0,0.3)",
                      background: "rgba(0,0,0,0.03)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}>
                      {event.eventHash.slice(0, 8)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                    {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" at "}
                    {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {/* Event-specific details */}
                  {event.eventType === "status_change" && event.eventData?.from && (
                    <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                      {event.eventData.from} → {event.eventData.to}
                    </div>
                  )}
                  {event.eventType === "lc_check" && event.eventData?.verdict && (
                    <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                      Verdict: {event.eventData.verdict}
                    </div>
                  )}
                  {event.eventType === "supplier_doc_uploaded" && event.eventData?.docType && (
                    <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                      {event.eventData.docType} — {event.eventData.filename}
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

  const { data, isLoading, error } = useQuery<TradeDetail>({
    queryKey: [`/api/trades/${tradeId}`],
    enabled: !!tradeId,
  });

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
              {iso2ToFlag(data.lookup.originName?.slice(-3, -1) || "") || ""} {data.lookup.originName}
              {" → "}
              {iso2ToFlag(data.lookup.destinationName?.slice(-3, -1) || "") || ""} {data.lookup.destinationName}
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
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
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
                      background: "rgba(107,144,128,0.06)",
                      marginBottom: 12,
                    }}>
                      <div style={{
                        fontFamily: "'Clash Display', sans-serif",
                        fontWeight: 700,
                        fontSize: 28,
                        color: "#6b9080",
                      }}>
                        {data.lookup.readinessScore}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
                          Readiness Score
                        </div>
                        <div style={{ fontSize: 12, color: "#888" }}>
                          {data.lookup.readinessVerdict || "—"}
                        </div>
                      </div>
                    </div>
                  )}

                  {data.lookup.readinessSummary && (
                    <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>
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
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
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
                          <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                            {data.lcCase.recheckCount} re-check{data.lcCase.recheckCount > 1 ? "s" : ""} performed
                          </p>
                        )}

                        {data.lcCase.correctionRequests && (data.lcCase.correctionRequests as any[]).length > 0 && (
                          <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                            {(data.lcCase.correctionRequests as any[]).length} correction request{(data.lcCase.correctionRequests as any[]).length > 1 ? "s" : ""} sent
                          </p>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: "#999" }}>
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
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
                      Supplier Documents
                    </h3>
                    {!data.supplierRequest && (
                      <Link href={`/lookup?lookupId=${data.lookup.id}`}>
                        <Button variant="outline" size="sm" style={{ fontSize: 12 }}>
                          Send Upload Link
                        </Button>
                      </Link>
                    )}
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

                      {/* Required vs received */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>
                            Required
                          </div>
                          {(data.supplierRequest.docsRequired as string[] || []).map((doc: string) => (
                            <div key={doc} style={{ fontSize: 12, color: "#666", padding: "3px 0" }}>
                              {doc}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>
                            Received
                          </div>
                          {data.supplierUploads.length > 0 ? data.supplierUploads.map((upload: any) => (
                            <div key={upload.id} style={{
                              fontSize: 12,
                              color: "#16a34a",
                              padding: "3px 0",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}>
                              <CheckCircle2 size={11} />
                              {upload.docType}
                            </div>
                          )) : (
                            <p style={{ fontSize: 12, color: "#999" }}>None yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "#999" }}>
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
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
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

            {/* RIGHT COLUMN — Audit Timeline */}
            <div>
              <Card>
                <CardContent className="p-5">
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: "0 0 16px" }}>
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
                      <Hash size={14} style={{ color: "#6b9080" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>TwinLog Reference</span>
                    </div>
                    <div style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#6b9080",
                      background: "rgba(107,144,128,0.06)",
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
                        color: "#999",
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
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>
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
