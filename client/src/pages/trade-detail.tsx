import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { usePageTitle } from "@/hooks/use-page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  ChevronDown,
  ChevronUp,
  Leaf,
  Factory,
  RefreshCw,
  MapPin,
  Calendar,
  Users,
  Boxes,
  Flame,
  Building2,
  DollarSign,
  Download,
  Pencil,
} from "lucide-react";
import { iso2ToFlag } from "@/components/CountryFlagBadge";
import { estimateDemurrageRange } from "@/lib/demurrage-utils";
import { translateCommodity } from "@/lib/commodity-i18n";
import { calculateTradeRisk } from "@/lib/risk-utils";
import "@/styles/single-trade.css";

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
  eudrAssessment: any | null;
  cbamRecord: any | null;
  cbamAssessment: any | null;
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
const statusConfig: Record<string, { labelKey: string; bg: string; text: string; icon: typeof Package }> = {
  active: { labelKey: "detail.status.active", bg: "rgba(109,184,154,0.1)", text: "#16a34a", icon: Package },
  in_transit: { labelKey: "detail.status.in_transit", bg: "rgba(59,130,246,0.1)", text: "#3b82f6", icon: Anchor },
  arrived: { labelKey: "detail.status.arrived", bg: "rgba(139,92,246,0.1)", text: "#8b5cf6", icon: Anchor },
  cleared: { labelKey: "detail.status.cleared", bg: "rgba(34,197,94,0.1)", text: "var(--sage-l)", icon: CheckCircle2 },
  closed: { labelKey: "detail.status.closed", bg: "rgba(107,114,128,0.1)", text: "#6b7280", icon: Archive },
  archived: { labelKey: "detail.status.archived", bg: "rgba(107,114,128,0.1)", text: "#9ca3af", icon: Archive },
};

/* ── Event type display config ── */
const eventConfig: Record<string, { icon: typeof CheckCircle2; color: string; labelKey: string }> = {
  compliance_check: { icon: Shield, color: "var(--sage)", labelKey: "detail.event.complianceCheck" },
  account_created: { icon: CheckCircle2, color: "var(--sage-l)", labelKey: "detail.event.accountCreated" },
  lc_check: { icon: FileText, color: "#3b82f6", labelKey: "detail.event.lcCheck" },
  lc_recheck: { icon: FileText, color: "#8b5cf6", labelKey: "detail.event.lcRecheck" },
  correction_sent: { icon: ArrowRight, color: "#f59e0b", labelKey: "detail.event.correctionSent" },
  supplier_link_created: { icon: ExternalLink, color: "var(--sage)", labelKey: "detail.event.supplierLinkCreated" },
  supplier_doc_uploaded: { icon: Upload, color: "var(--sage-l)", labelKey: "detail.event.docUploaded" },
  buyer_doc_uploaded: { icon: Upload, color: "var(--sage)", labelKey: "detail.event.docUploadedBuyer" },
  doc_verified: { icon: ShieldCheck, color: "#16a34a", labelKey: "detail.event.docVerified" },
  doc_flagged: { icon: Flag, color: "#ef4444", labelKey: "detail.event.docFlagged" },
  doc_ai_scanned: { icon: Sparkles, color: "#8b5cf6", labelKey: "detail.event.aiDocScan" },
  supplier_complete: { icon: CheckCircle2, color: "#16a34a", labelKey: "detail.event.supplierComplete" },
  status_change: { icon: ArrowRight, color: "#3b82f6", labelKey: "detail.event.statusChanged" },
  eta_set: { icon: Clock, color: "#8b5cf6", labelKey: "detail.event.etaSet" },
  arrival: { icon: Anchor, color: "var(--sage-l)", labelKey: "detail.event.arrival" },
  customs_cleared: { icon: CheckCircle2, color: "#16a34a", labelKey: "detail.event.customsCleared" },
  twinlog_generated: { icon: Hash, color: "var(--sage)", labelKey: "detail.event.twinlogGenerated" },
  eudr_created: { icon: Shield, color: "#059669", labelKey: "detail.event.eudrCreated" },
  eudr_assessed: { icon: ShieldCheck, color: "#059669", labelKey: "detail.event.eudrAssessed" },
  cbam_created: { icon: Shield, color: "#2563eb", labelKey: "detail.event.cbamCreated" },
  cbam_assessed: { icon: ShieldCheck, color: "#2563eb", labelKey: "detail.event.cbamAssessed" },
  trade_archived: { icon: Archive, color: "#9ca3af", labelKey: "detail.event.tradeArchived" },
  trade_closed: { icon: Archive, color: "#6b7280", labelKey: "detail.event.tradeClosed" },
  trade_value_set: { icon: Package, color: "var(--sage)", labelKey: "detail.event.tradeValueSet" },
};

/* ── Status Stepper ── */
const STATUSES = ["active", "in_transit", "arrived", "cleared", "closed"];
const STATUS_LABEL_KEYS: Record<string, string> = {
  active: "detail.status.active",
  in_transit: "detail.status.in_transit",
  arrived: "detail.status.arrived",
  cleared: "detail.status.cleared",
  closed: "detail.status.closed",
};

function StatusStepper({ current, tradeId, onStatusAdvanced }: { current: string; tradeId: string; onStatusAdvanced: () => void }) {
  const { t } = useTranslation("trades");
  const { toast } = useToast();
  const currentIndex = STATUSES.indexOf(current);
  const nextIndex = currentIndex + 1;
  const nextStatus = nextIndex < STATUSES.length ? STATUSES[nextIndex] : null;
  const canAdvance = nextStatus !== null && current !== "archived" && current !== "closed";

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const advanceStatus = async () => {
    if (!nextStatus) return;
    setAdvancing(true);
    try {
      await apiRequest("PATCH", `/api/trades/${tradeId}/status`, { status: nextStatus });
      toast({ title: t("detail.statusAdvanced", { status: t(STATUS_LABEL_KEYS[nextStatus]) }) });
      onStatusAdvanced();
    } catch {
      toast({ variant: "destructive", title: t("detail.statusAdvanceFailed") });
    } finally {
      setAdvancing(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "0 24px 20px" }}>
        {STATUSES.map((status, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isArchived = current === "archived";
          const isNext = i === nextIndex && canAdvance;

          return (
            <div key={status} style={{ display: "flex", alignItems: "center", flex: i < STATUSES.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div
                  onClick={isNext ? (e) => { e.stopPropagation(); setConfirmOpen(true); } : undefined}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 600,
                    background: isArchived ? "rgba(156,163,175,0.15)" :
                      isComplete ? "var(--sage)" :
                      isCurrent ? "var(--sage-l)" :
                      isNext ? "rgba(107,144,128,0.12)" : "rgba(74,124,94,0.06)",
                    color: isArchived ? "#9ca3af" :
                      (isComplete || isCurrent) ? "#fff" :
                      isNext ? "var(--sage)" : "var(--t3)",
                    border: isNext ? "2px dashed var(--sage)" : "2px solid transparent",
                    cursor: isNext ? "pointer" : "default",
                    transition: "all 0.2s",
                  }}>
                  {isComplete ? <CheckCircle2 size={14} /> : (i + 1)}
                </div>
                <span style={{
                  fontSize: 15,
                  fontWeight: isCurrent ? 600 : isNext ? 500 : 400,
                  color: isCurrent ? "var(--t1)" : isNext ? "var(--sage)" : "var(--t3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}>
                  {t(STATUS_LABEL_KEYS[status])}
                </span>
              </div>
              {i < STATUSES.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  marginBottom: 18,
                  marginLeft: 6,
                  marginRight: 6,
                  background: isComplete ? "var(--sage)" : "rgba(74,124,94,0.06)",
                  borderRadius: 1,
                  transition: "background 0.2s",
                }} />
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("detail.advanceStatusTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("detail.advanceStatusDescription", {
                from: t(STATUS_LABEL_KEYS[current]),
                to: nextStatus ? t(STATUS_LABEL_KEYS[nextStatus]) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={advancing}>{t("detail.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={advanceStatus} disabled={advancing}>
              {advancing ? <Loader2 size={14} className="animate-spin" /> : null}
              {advancing ? t("detail.advancing") : t("detail.confirmAdvance")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ── Audit Timeline ── */
function AuditTimeline({ events, chainValid }: { events: AuditEvent[]; chainValid: boolean }) {
  const { t } = useTranslation("trades");
  return (
    <div>
      {/* Event count header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        padding: "8px 12px",
        borderRadius: 8,
        background: "rgba(109,184,154,0.06)",
        border: "1px solid rgba(109,184,154,0.2)",
      }}>
        <ShieldCheck size={16} style={{ color: "var(--sage)" }} />
        <span style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--sage)",
        }}>
          {t("detail.auditTrail")}
        </span>
        <span style={{ fontSize: 15, color: "#166534", marginLeft: "auto" }}>
          {t("detail.event", { count: events.length })}
        </span>
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <p style={{ fontSize: 15, color: "var(--t3)", textAlign: "center", padding: 20 }}>
          {t("detail.noAuditEvents")}
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
            background: "rgba(74,124,94,0.06)",
            borderRadius: 1,
          }} />

          {events.map((event, i) => {
            const cfg = eventConfig[event.eventType] || {
              icon: Clock,
              color: "#6b7280",
              labelKey: "",
            };
            const Icon = cfg.icon;
            const date = new Date(event.createdAt);
            const eventLabel = cfg.labelKey ? t(cfg.labelKey) : event.eventType.replace(/_/g, " ");

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
                  background: "rgba(0,0,0,0.04)",
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
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>
                      {eventLabel}
                    </span>
                    <span style={{
                      fontSize: 15,
                      fontFamily: "monospace",
                      color: "var(--t3)",
                      background: "rgba(0,0,0,0.03)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}>
                      {event.eventHash.slice(0, 8)}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, color: "var(--t3)", marginTop: 2 }}>
                    {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {` ${t("detail.at")} `}
                    {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {/* Event-specific details */}
                  {event.eventType === "status_change" && event.eventData?.from && (
                    <div style={{ fontSize: 15, color: "var(--t2)", marginTop: 4 }}>
                      {event.eventData.from} → {event.eventData.to}
                    </div>
                  )}
                  {event.eventType === "lc_check" && event.eventData?.verdict && (
                    <div style={{ fontSize: 15, color: "var(--t2)", marginTop: 4 }}>
                      {t("detail.verdict", { verdict: event.eventData.verdict })}
                    </div>
                  )}
                  {event.eventType === "supplier_doc_uploaded" && event.eventData?.docType && (
                    <div style={{ fontSize: 15, color: "var(--t2)", marginTop: 4 }}>
                      {event.eventData.docType} — {event.eventData.filename}
                    </div>
                  )}
                  {event.eventType === "buyer_doc_uploaded" && event.eventData?.docType && (
                    <div style={{ fontSize: 15, color: "var(--t2)", marginTop: 4 }}>
                      {event.eventData.docType} — {event.eventData.filename}
                      {event.eventData.note && (
                        <span style={{ color: "var(--t3)", marginLeft: 6 }}>({event.eventData.note})</span>
                      )}
                    </div>
                  )}
                  {event.eventType === "doc_verified" && event.eventData?.docType && (
                    <div style={{ fontSize: 15, color: "#16a34a", marginTop: 4 }}>
                      {event.eventData.docType} — {t("detail.verified")}
                    </div>
                  )}
                  {event.eventType === "doc_flagged" && event.eventData?.docType && (
                    <div style={{ fontSize: 15, color: "#ef4444", marginTop: 4 }}>
                      {event.eventData.docType} — {event.eventData.finding || t("detail.issuesFlagged")}
                      {event.eventData.ucpRule && (
                        <span style={{ color: "var(--t3)", marginLeft: 6 }}>({event.eventData.ucpRule})</span>
                      )}
                    </div>
                  )}
                  {event.eventType === "doc_ai_scanned" && event.eventData?.docType && (
                    <div style={{ fontSize: 15, color: "#8b5cf6", marginTop: 4 }}>
                      {event.eventData.docType} — {event.eventData.verified ? t("detail.passed") : t("detail.issuesFlagged")}
                      {event.eventData.confidence && (
                        <span style={{ color: "var(--t3)", marginLeft: 6 }}>({event.eventData.confidence} confidence)</span>
                      )}
                    </div>
                  )}
                  {event.eventType === "trade_value_set" && event.eventData?.value && (
                    <div style={{ fontSize: 15, color: "var(--sage)", marginTop: 4 }}>
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

/* ── Shared regulatory helpers ── */

const BAND_COLORS: Record<string, { bg: string; color: string; bar: string }> = {
  negligible: { bg: "rgba(34,197,94,0.12)", color: "var(--sage-l)", bar: "#22c55e" },
  low: { bg: "rgba(234,179,8,0.12)", color: "#eab308", bar: "#eab308" },
  medium: { bg: "rgba(249,115,22,0.12)", color: "#f97316", bar: "#f97316" },
  high: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", bar: "#ef4444" },
};

function ScoreBar({ score, band }: { score: number | null; band: string | null }) {
  if (score == null || !band) return null;
  const c = BAND_COLORS[band] || BAND_COLORS.medium;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(74,124,94,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${Math.min(score, 100)}%`, height: "100%", borderRadius: 4, background: c.bar, transition: "width 0.3s ease" }} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: c.color, minWidth: 60, textAlign: "right" }}>
        {score}/100
      </span>
    </div>
  );
}

function ChecksList({ checks }: { checks: any[] }) {
  const { t } = useTranslation("trades");
  const [open, setOpen] = useState(false);
  if (!checks || checks.length === 0) return null;
  const passed = checks.filter(c => c.passed).length;
  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0, fontSize: 15, fontWeight: 500, color: "var(--t3)" }}
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {t("detail.allChecks", { total: checks.length, passed, failed: checks.length - passed })}
      </button>
      {open && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {checks.map((c: any) => (
            <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 15, color: c.passed ? "var(--sage-l)" : c.severity === "critical" ? "#ef4444" : "#eab308" }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>{c.passed ? "✅" : c.severity === "critical" ? "❌" : "⚠️"}</span>
              <div>
                <span style={{ fontWeight: 500 }}>{c.label}</span>
                <span style={{ color: "var(--t3)", marginLeft: 6 }}>{c.detail}</span>
                {!c.passed && c.fixSuggestion && (
                  <div style={{ fontSize: 15, color: "var(--app-acapulco)", marginTop: 2 }}>💡 {c.fixSuggestion}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopDrivers({ drivers }: { drivers: any[] }) {
  const { t } = useTranslation("trades");
  if (!drivers || drivers.length === 0) return null;
  return (
    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".08em" }}>{t("detail.topIssues")}</span>
      {drivers.map((d: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 15 }}>
          <span style={{ flexShrink: 0 }}>{d.severity === "critical" ? "🔴" : "🟠"}</span>
          <div>
            <span style={{ fontWeight: 500, color: "var(--t1)" }}>{d.reason}</span>
            <span style={{ color: "var(--t3)", marginLeft: 4 }}>({d.points} pts)</span>
            <div style={{ fontSize: 15, color: "var(--app-acapulco)" }}>→ {d.fix}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BreakdownRow({ breakdown }: { breakdown: any }) {
  const { t } = useTranslation("trades");
  if (!breakdown) return null;
  const items = [
    { label: t("detail.completeness"), val: breakdown.completeness, max: 55 },
    { label: t("detail.integrity"), val: breakdown.deterministic, max: 30 },
    { label: t("detail.crossDoc"), val: breakdown.crossDocument, max: 35 },
    { label: t("detail.mentions"), val: breakdown.mentions, max: 10 },
  ];
  return (
    <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
      {items.map(item => (
        <div key={item.label} style={{ fontSize: 15, color: "var(--t3)" }}>
          <span style={{ fontWeight: 500 }}>{item.label}</span>
          <span style={{ marginLeft: 4, fontWeight: 700, color: item.val > 0 ? "#ef4444" : "var(--sage-l)" }}>{item.val}</span>
          <span style={{ color: "var(--t3)" }}>/{item.max}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Collapsible form section ── */
function FormSection({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: 0, width: "100%", textAlign: "left" }}
      >
        <Icon className="w-4 h-4" style={{ color: "var(--t3)", flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", flex: 1 }}>{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "var(--t3)" }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--t3)" }} />}
      </button>
      {open && <div style={{ marginTop: 12, paddingLeft: 28 }}>{children}</div>}
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", placeholder, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="form-group" style={{ marginBottom: 10 }}>
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

/* ── EUDR Inline Box ── */
function EudrInlineBox({ data, tradeId }: { data: TradeDetail; tradeId: string }) {
  const { t } = useTranslation("trades");
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [saving, setSaving] = useState(false);

  const eudr = data.eudrRecord;
  const assessment = data.eudrAssessment;
  const bandC = assessment?.band ? BAND_COLORS[assessment.band] || BAND_COLORS.medium : null;

  // Init EUDR record if it doesn't exist
  const initEudr = useCallback(async () => {
    if (eudr) return;
    try {
      await apiRequest("POST", "/api/eudr", { lookupId: tradeId });
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    } catch {}
  }, [eudr, tradeId, queryClient]);

  const handleExpand = () => {
    if (!expanded) initEudr();
    setExpanded(!expanded);
  };

  const saveEudrField = async (fields: Record<string, any>) => {
    if (!eudr) return;
    setSaving(true);
    try {
      await apiRequest("PATCH", `/api/eudr/${eudr.id}`, fields);
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    } finally {
      setSaving(false);
    }
  };

  const runAssessment = async () => {
    setAssessing(true);
    try {
      await apiRequest("POST", `/api/eudr/${tradeId}/assess`);
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
    } finally {
      setAssessing(false);
    }
  };

  // Form state — synced from eudr record
  const [plotCoords, setPlotCoords] = useState(eudr?.plotCoordinates ? JSON.stringify(eudr.plotCoordinates) : "");
  const [plotCountry, setPlotCountry] = useState(eudr?.plotCountryIso2 || "");
  const [evidenceType, setEvidenceType] = useState(eudr?.evidenceType || "");
  const [evidenceRef, setEvidenceRef] = useState(eudr?.evidenceReference || "");
  const [evidenceDate, setEvidenceDate] = useState(eudr?.evidenceDate || "");
  const [cutoffDate, setCutoffDate] = useState(eudr?.cutoffDate || "");
  const [supplierName, setSupplierName] = useState(eudr?.supplierName || "");
  const [supplierAddr, setSupplierAddr] = useState(eudr?.supplierAddress || "");
  const [supplierReg, setSupplierReg] = useState(eudr?.supplierRegNumber || "");
  const [riskLevel, setRiskLevel] = useState(eudr?.riskLevel || "standard");

  return (
    <Card>
      <CardContent className="p-5">
        {/* Collapsed header */}
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
          onClick={handleExpand}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Leaf className="w-4 h-4" style={{ color: "#059669" }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: 0 }}>
              {t("detail.eudrDueDiligence")}
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {assessment && assessment.applicable && assessment.score != null && (
              <span style={{
                fontSize: 15, fontWeight: 600, padding: "2px 10px", borderRadius: 4,
                background: bandC?.bg || "rgba(0,0,0,0.04)",
                color: bandC?.color || "var(--t3)",
              }}>
                {assessment.score} · {assessment.band ? assessment.band.charAt(0).toUpperCase() + assessment.band.slice(1) : ""}
              </span>
            )}
            {assessment && assessment.applicable === false && (
              <span style={{ fontSize: 15, color: "var(--t3)", fontWeight: 500 }}>N/A</span>
            )}
            {!assessment && (
              <span style={{ fontSize: 15, color: "var(--app-acapulco)", fontWeight: 500 }}>{t("detail.notAssessed")}</span>
            )}
            {expanded ? <ChevronUp className="w-4 h-4" style={{ color: "var(--t3)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--t3)" }} />}
          </div>
        </div>

        {/* Collapsed subtitle */}
        {!expanded && assessment && assessment.applicable && (
          <div style={{ fontSize: 15, color: "var(--t3)", marginTop: 4, marginLeft: 28 }}>
            {assessment.canConcludeNegligibleRisk
              ? `✅ ${t("detail.canConcludeNegligible")}`
              : `❌ ${t("detail.cannotConcludeNegligible")}`}
            {assessment.assessedAt && (
              <span style={{ marginLeft: 8 }}>
                · {t("detail.lastAssessed", { date: new Date(assessment.assessedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) })}
              </span>
            )}
          </div>
        )}

        {/* Expanded content */}
        {expanded && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>

            {/* 1. Geolocation */}
            <FormSection title={t("detail.geolocation")} icon={MapPin}>
              <FormField label={t("detail.plotCoordinates")} value={plotCoords} onChange={setPlotCoords} placeholder='[{"lat": 6.5, "lng": -1.5}]' />
              <FormField label={t("detail.plotCountry")} value={plotCountry} onChange={setPlotCountry} placeholder="GH" />
              <Button size="sm" disabled={saving} onClick={() => saveEudrField({
                plotCoordinates: plotCoords ? JSON.parse(plotCoords) : null,
                plotCountryIso2: plotCountry || null,
              })} style={{ fontSize: 15, marginTop: 4 }}>
                {saving ? t("detail.saving") : t("detail.save")}
              </Button>
            </FormSection>

            {/* 2. Evidence */}
            <FormSection title={t("detail.evidenceTimeline")} icon={Calendar}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label>{t("detail.evidenceType")}</label>
                <select
                  value={evidenceType}
                  onChange={e => setEvidenceType(e.target.value)}
                >
                  <option value="">{t("detail.select")}</option>
                  <option value="satellite_imagery">{t("detail.evidenceTypeOptions.satellite")}</option>
                  <option value="field_audit">{t("detail.evidenceTypeOptions.fieldAudit")}</option>
                  <option value="certification">{t("detail.evidenceTypeOptions.certification")}</option>
                  <option value="government_permit">{t("detail.evidenceTypeOptions.governmentPermit")}</option>
                  <option value="other">{t("detail.evidenceTypeOptions.other")}</option>
                </select>
              </div>
              <FormField label={t("detail.evidenceReference")} value={evidenceRef} onChange={setEvidenceRef} placeholder="REF-12345" />
              <FormField label={t("detail.evidenceDate")} value={evidenceDate} onChange={setEvidenceDate} type="date" />
              <FormField label={t("detail.deforestationFree")} value={cutoffDate} onChange={setCutoffDate} type="date" />
              <Button size="sm" disabled={saving} onClick={() => saveEudrField({
                evidenceType: evidenceType || null,
                evidenceReference: evidenceRef || null,
                evidenceDate: evidenceDate || null,
                cutoffDate: cutoffDate || null,
              })} style={{ fontSize: 15, marginTop: 4 }}>
                {saving ? t("detail.saving") : t("detail.save")}
              </Button>
            </FormSection>

            {/* 3. Supplier */}
            <FormSection title={t("detail.supplier")} icon={Users}>
              <FormField label={t("detail.supplierName")} value={supplierName} onChange={setSupplierName} />
              <FormField label={t("detail.supplierAddress")} value={supplierAddr} onChange={setSupplierAddr} />
              <FormField label={t("detail.registrationNumber")} value={supplierReg} onChange={setSupplierReg} />
              <Button size="sm" disabled={saving} onClick={() => saveEudrField({
                supplierName: supplierName || null,
                supplierAddress: supplierAddr || null,
                supplierRegNumber: supplierReg || null,
              })} style={{ fontSize: 15, marginTop: 4 }}>
                {saving ? t("detail.saving") : t("detail.save")}
              </Button>
            </FormSection>

            {/* 4. Risk Level */}
            <FormSection title={t("detail.riskLevel")} icon={ShieldAlert}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label>{t("detail.riskClassification")}</label>
                <select
                  value={riskLevel}
                  onChange={e => setRiskLevel(e.target.value)}
                >
                  <option value="low">{t("detail.riskOptions.low")}</option>
                  <option value="standard">{t("detail.riskOptions.standard")}</option>
                  <option value="high">{t("detail.riskOptions.high")}</option>
                </select>
              </div>
              <Button size="sm" disabled={saving} onClick={() => saveEudrField({
                riskLevel,
              })} style={{ fontSize: 15, marginTop: 4 }}>
                {saving ? t("detail.saving") : t("detail.save")}
              </Button>
            </FormSection>

            {/* Assessment Section */}
            <div style={{ borderTop: "2px solid rgba(0,0,0,0.08)", paddingTop: 16, marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <Button size="sm" onClick={runAssessment} disabled={assessing} style={{ fontSize: 15 }}>
                  {assessing ? (
                    <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> {t("detail.assessing")}</>
                  ) : (
                    <><RefreshCw className="w-3 h-3 mr-1" /> {t("detail.runAssessment")}</>
                  )}
                </Button>
                {eudr && (
                  <Link href={`/eudr/${tradeId}`}>
                    <Button variant="outline" size="sm" style={{ fontSize: 15 }}>
                      {t("detail.generatePdfStatement")}
                    </Button>
                  </Link>
                )}
              </div>

              {assessment && assessment.applicable && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: bandC?.color || "var(--t3)" }}>
                      {t("detail.score", { score: assessment.score, band: assessment.band ? assessment.band.charAt(0).toUpperCase() + assessment.band.slice(1) : "" })}
                    </span>
                    <span style={{ fontSize: 15, color: "var(--t2)" }}>
                      {assessment.canConcludeNegligibleRisk ? `✅ ${t("detail.canConcludeNegligible")}` : `❌ ${t("detail.cannotConcludeNegligible")}`}
                    </span>
                  </div>
                  <ScoreBar score={assessment.score} band={assessment.band} />
                  <BreakdownRow breakdown={assessment.breakdown} />
                  <TopDrivers drivers={assessment.topDrivers as any[]} />
                  <ChecksList checks={assessment.checksRun as any[]} />
                </div>
              )}

              {assessment && assessment.applicable === false && (
                <div style={{ marginTop: 12, fontSize: 15, color: "var(--t3)", padding: "8px 12px", background: "rgba(0,0,0,0.03)", borderRadius: 8 }}>
                  {t("detail.eudrNotApplicable")}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Main Page Component ── */
export default function TradeDetail() {
  const { t, i18n } = useTranslation("trades");
  const lang = i18n.language;
  const [match, params] = useRoute("/trades/:id");
  const tradeId = params?.id;

  const queryClient = useQueryClient();
  const { toast } = useToast();
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

  // TwinLog PDF download state
  const [pdfLoading, setPdfLoading] = useState(false);

  // Inline supplier request creation (avoids redirect to /lookup)
  const createSupplierReq = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/supplier-requests/create-or-get", { lookupId: data?.lookup?.id });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] }),
  });

  // Nickname editing state
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState("");
  const saveNickname = async () => {
    setEditingNickname(false);
    const trimmed = nicknameValue.trim();
    if (!trimmed || trimmed === (data?.lookup?.nickname || "")) return;
    try {
      await apiRequest("PATCH", `/api/trades/${tradeId}`, { nickname: trimmed });
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    } catch { /* silent */ }
  };

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
      ? `${translateCommodity(data.lookup.commodityName, lang)} — ${t("detail.pageTitle")}`
      : t("detail.pageTitle"),
    "View full trade information, compliance results, and audit trail"
  );

  if (!match) return null;

  // ── Derived data ──
  const lookup = data?.lookup;
  const result = lookup?.resultJson;
  const spsFlagged = result?.triggers?.sps === true;
  const lcFlagged = data?.latestLcCheck?.verdict === "DISCREPANCIES_FOUND";
  const dailyRate = lookup?.demurrageDailyRate ? Number(lookup.demurrageDailyRate) : null;
  const eudrApplicable = result?.triggers?.eudr === true;
  const cbamApplicable = result?.triggers?.cbam === true;
  const tradeValueNum = lookup?.tradeValue ? Number(lookup.tradeValue) : 0;
  const risk = lookup ? calculateTradeRisk({ readinessScore: lookup.readinessScore, dailyRate, spsFlagged, lcFlagged, eudrApplicable, cbamApplicable, tradeValue: tradeValueNum }) : null;
  const destIso2 = lookup ? nameToIso2[lookup.destinationName] : undefined;
  const verdict = lookup?.readinessVerdict as "GREEN" | "AMBER" | "RED" | undefined;
  const demEstimate = destIso2 ? estimateDemurrageRange(destIso2, verdict || "AMBER") : null;
  const tradeVal = lookup?.tradeValue ? Number(lookup.tradeValue) : 0;
  const pctOfCargo = tradeVal > 0 && demEstimate ? ((demEstimate.maxCost / tradeVal) * 100).toFixed(1) : null;

  const LC_STEPS = ["active", "in_transit", "arrived", "cleared", "closed"];
  const LC_LABELS: Record<string, string> = { active: "Active", in_transit: "In Transit", arrived: "Arrived", cleared: "Cleared", closed: "Closed" };
  const lcIndex = data ? LC_STEPS.indexOf(data.tradeStatus) : 0;

  const eudr = data?.eudrRecord;
  const eudrAssessment = data?.eudrAssessment;
  const cbamAssessment = data?.cbamAssessment;

  const scoreColor = verdict === "RED" ? "#f08878" : verdict === "AMBER" ? "#f0bc6e" : "#8de0b8";
  const scoreClass = verdict === "RED" ? "red" : verdict === "AMBER" ? "amber" : "";

  return (
    <AppShell contentClassName="stp">
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8a9a8c" }}>
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error || !data ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
          <XCircle className="w-8 h-8" style={{ color: "#ef4444" }} />
          <p style={{ fontSize: 14, color: "#8a9a8c" }}>{t("detail.notFoundDescription")}</p>
          <Link href="/trades">
            <button className="stp-btn-outline-light" style={{ color: "#8a9a8c", borderColor: "#8a9a8c" }}>{t("detail.backToTrades")}</button>
          </Link>
        </div>
      ) : (
        <>
          {/* ── DARK HEADER ── */}
          <div className="stp-header">
            <div className="stp-bc">
              <Link href="/trades"><a>{t("detail.breadcrumb")}</a></Link>
              <span className="stp-bc-sep">›</span>
              <span className="stp-bc-cur">{translateCommodity(data.lookup.commodityName, lang)}</span>
              <div className="stp-bc-actions">
                <Link href={`/trades/${tradeId}/report`}>
                  <button className="stp-btn-outline-light">{t("report.tabReport")}</button>
                </Link>
                <button className="stp-btn-light-fill">{t("report.tabWorkspace")}</button>
              </div>
            </div>

            <div className="stp-title-row">
              <div>
                {editingNickname ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      autoFocus
                      value={nicknameValue}
                      onChange={e => setNicknameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") saveNickname();
                        if (e.key === "Escape") { setEditingNickname(false); setNicknameValue(data.lookup.nickname || ""); }
                      }}
                      onBlur={saveNickname}
                      style={{
                        fontFamily: "var(--fh)", fontSize: 20, fontWeight: 700, color: "var(--t1)",
                        background: "rgba(0,0,0,0.03)", border: "1px solid rgba(109,184,154,0.3)",
                        borderRadius: 6, padding: "4px 10px", width: "100%", maxWidth: 400,
                        outline: "none",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="stp-title"
                    onClick={() => { setNicknameValue(data.lookup.nickname || translateCommodity(data.lookup.commodityName, lang)); setEditingNickname(true); }}
                    style={{ cursor: "pointer" }}
                    title={t("detail.clickToRename")}
                  >
                    {data.lookup.nickname || translateCommodity(data.lookup.commodityName, lang)}
                    <Pencil size={13} style={{ marginLeft: 6, opacity: 0.3, verticalAlign: "middle" }} />
                  </div>
                )}
                <div className="stp-corridor">
                  {nameFlag(data.lookup.originName)} {data.lookup.originName} → {nameFlag(data.lookup.destinationName)} {data.lookup.destinationName}
                </div>
                <div className="stp-tags">
                  <span className="stp-tag stp-tag-active">{t(statusConfig[data.tradeStatus]?.labelKey || "detail.status.active")}</span>
                  {data.lookup.readinessScore != null && (
                    <span className="stp-tag stp-tag-score">Score: {data.lookup.readinessScore}/100</span>
                  )}
                  {data.lookup.hsCode && (
                    <span className="stp-tag stp-tag-hs">HS {data.lookup.hsCode}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Money strip */}
            <div className="stp-money">
              <div className="stp-ms">
                <div className="stp-ms-label">{t("detail.shipmentValue")}</div>
                {tradeVal > 0 ? (
                  <>
                    <div className="stp-ms-value">{data.lookup.tradeValueCurrency || "USD"} {tradeVal.toLocaleString()}</div>
                  </>
                ) : (
                  <>
                    <div className="stp-ms-value muted">{t("detail.noValueSet")}</div>
                    <div className="stp-ms-sub amber" style={{ cursor: "pointer" }} onClick={() => { setTradeValueInput(""); setTradeValueCurrencyInput("USD"); setEditingValue(true); }}>+ {t("detail.addValue")} →</div>
                  </>
                )}
              </div>
              <div className="stp-ms">
                <div className="stp-ms-label">Expected Exposure</div>
                {risk && risk.expectedLoss > 0 ? (
                  <>
                    <div className="stp-ms-value amber">${risk.expectedLoss.toLocaleString()}</div>
                    <div className="stp-ms-bar"><div className="stp-ms-fill" style={{ width: `${Math.min((risk.expectedLoss / Math.max(risk.worstCase, 1)) * 100, 100)}%`, background: "var(--stp-amber)" }} /></div>
                    <div className="stp-ms-sub">{[spsFlagged && "SPS", dailyRate && "Demurrage", eudrApplicable && "EUDR", cbamApplicable && "CBAM"].filter(Boolean).join(" · ") || "—"}</div>
                  </>
                ) : (
                  <div className="stp-ms-value muted">—</div>
                )}
              </div>
              <div className="stp-ms">
                <div className="stp-ms-label">Worst Case</div>
                {risk && risk.worstCase > 0 ? (
                  <>
                    <div className="stp-ms-value red">${risk.worstCase.toLocaleString()}</div>
                    <div className="stp-ms-bar"><div className="stp-ms-fill" style={{ width: `${Math.min((risk.worstCase / 15000) * 100, 100)}%`, background: "#c44e3a" }} /></div>
                    <div className="stp-ms-sub">All risk scenarios</div>
                  </>
                ) : (
                  <div className="stp-ms-value muted">—</div>
                )}
              </div>
              <div className="stp-ms">
                <div className="stp-ms-label">Corridor Risk</div>
                <div className={`stp-ms-value ${scoreClass}`}>{verdict || "—"}</div>
                {data.lookup.readinessScore != null && (
                  <>
                    <div className="stp-ms-bar"><div className="stp-ms-fill" style={{ width: `${data.lookup.readinessScore}%`, background: scoreColor }} /></div>
                    <div className="stp-ms-sub">{data.lookup.readinessScore} / 100</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── LIFECYCLE STEPPER ── */}
          <div className="stp-lc-wrap">
            <div className="stp-lc">
              {LC_STEPS.map((step, i) => {
                const state = i < lcIndex ? "done" : i === lcIndex ? "active" : "future";
                return (
                  <div key={step} className={`stp-lc-step stp-lc-step--${state}`}>
                    <div className="stp-lc-bar" />
                    <div className="stp-lc-body">
                      <div className="stp-lc-num">{state === "done" ? "✓" : i + 1}</div>
                      <span className="stp-lc-name">{LC_LABELS[step]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status advance dialog — reuse existing StatusStepper's confirm */}
          <StatusStepper
            current={data.tradeStatus}
            tradeId={tradeId!}
            onStatusAdvanced={() => queryClient.invalidateQueries({ queryKey: [`/api/trades/${tradeId}`] })}
          />

          {/* ── CONTENT GRID ── */}
          <div className="stp-content">

            {/* ── LEFT COLUMN ── */}
            <div className="stp-left">

              {/* Compliance Summary */}
              <div className="stp-card">
                <div className="stp-card-hdr">
                  <span className="stp-card-title">{t("detail.complianceSummary")}</span>
                  <Link href={`/trades/${data.lookup.id}/report`}>
                    <a className="stp-card-link">{t("detail.viewFullReport")}</a>
                  </Link>
                </div>
                {data.lookup.readinessScore != null && (
                  <div className="stp-score-block">
                    <div className="stp-score-num">{data.lookup.readinessScore}</div>
                    <div className="stp-score-right">
                      <div className="stp-sr-rating">{verdict || "—"} — Corridor Risk Rating</div>
                      <div className="stp-sr-desc">{data.lookup.readinessSummary || ""}</div>
                    </div>
                  </div>
                )}
                {risk && (risk.expectedLoss > 0 || risk.worstCase > 0) && (
                  <div className="stp-risk-cells">
                    <div className="stp-rc exp">
                      <div className="stp-rc-l">Expected exposure</div>
                      <div className="stp-rc-v">${risk.expectedLoss.toLocaleString()}</div>
                    </div>
                    <div className="stp-rc worst">
                      <div className="stp-rc-l">Worst case</div>
                      <div className="stp-rc-v">${risk.worstCase.toLocaleString()}</div>
                    </div>
                  </div>
                )}
                {(spsFlagged || (!dailyRate && risk?.expectedLoss === 0)) && (
                  <div className="stp-risk-flag">
                    ⚠️ {spsFlagged ? "SPS flag" : ""}{!dailyRate ? " · Demurrage inputs missing for full estimate" : ""}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="stp-card">
                <div className="stp-card-hdr">
                  <span className="stp-card-title">{t("detail.supplierDocs")}</span>
                </div>
                <div className="stp-doc-lanes">
                  <div className="stp-doc-lane mine">
                    <span className="stp-dl-label">Your documents</span>
                    <span className="stp-dl-desc">Upload your own certificates, phytosanitary docs, or LC copies.</span>
                    {data.supplierRequest ? (
                      <button className="stp-btn-sm stp-btn-sage" onClick={() => setShowBuyerUpload(!showBuyerUpload)}>
                        Upload Document
                      </button>
                    ) : (
                      <button className="stp-btn-sm stp-btn-sage" disabled={createSupplierReq.isPending} onClick={() => createSupplierReq.mutate()}>
                        {createSupplierReq.isPending ? <><Loader2 size={11} className="animate-spin" style={{ marginRight: 4 }} /> Setting up...</> : "Upload Document"}
                      </button>
                    )}
                  </div>
                  <div className="stp-doc-lane theirs">
                    <span className="stp-dl-label">From supplier</span>
                    <span className="stp-dl-desc">Send a secure link for your supplier to upload their documents.</span>
                    {!data.supplierRequest ? (
                      <button className="stp-btn-sm stp-btn-ghost" disabled={createSupplierReq.isPending} onClick={() => createSupplierReq.mutate()}>
                        {createSupplierReq.isPending ? <><Loader2 size={11} className="animate-spin" style={{ marginRight: 4 }} /> Setting up...</> : t("detail.sendUploadLink")}
                      </button>
                    ) : (
                      <button className="stp-btn-sm stp-btn-ghost" disabled>{t("detail.sendUploadLink")}</button>
                    )}
                  </div>
                </div>

                {/* Received docs detail */}
                {data.supplierUploads.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {data.supplierUploads.map((upload: any) => (
                      <div key={upload.id} style={{
                        padding: "8px 10px", marginBottom: 6, borderRadius: 8, fontSize: 11,
                        background: upload.verified === true ? "rgba(34,197,94,0.06)" : upload.verified === false && upload.finding ? "rgba(239,68,68,0.06)" : "rgba(0,0,0,0.02)",
                        border: `1px solid ${upload.verified === true ? "rgba(34,197,94,0.15)" : upload.verified === false && upload.finding ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.03)"}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {upload.verified === true ? <ShieldCheck size={11} style={{ color: "#16a34a" }} /> :
                             upload.verified === false && upload.finding ? <ShieldAlert size={11} style={{ color: "#ef4444" }} /> :
                             <FileText size={11} style={{ color: "#8a9a8c" }} />}
                            <span style={{ fontWeight: 500 }}>{upload.docType}</span>
                            {upload.verified === true && <span style={{ fontSize: 9, fontWeight: 600, color: "#16a34a", background: "rgba(34,197,94,0.1)", padding: "1px 5px", borderRadius: 3 }}>{t("detail.verified")}</span>}
                            {upload.verified === false && upload.finding && <span style={{ fontSize: 9, fontWeight: 600, color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "1px 5px", borderRadius: 3 }}>{t("detail.flagged")}</span>}
                          </div>
                          <div style={{ display: "flex", gap: 3 }}>
                            <button onClick={() => handleAiScan(upload.id)} style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 4, padding: "2px 5px", cursor: "pointer", fontSize: 10, color: "#8b5cf6", fontWeight: 500, display: "flex", alignItems: "center", gap: 2 }}>
                              {scanningId === upload.id ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />} Scan
                            </button>
                            {upload.verified !== true && (
                              <button onClick={() => handleVerify(upload.id)} style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 4, padding: "2px 5px", cursor: "pointer", fontSize: 10, color: "#16a34a", fontWeight: 500, display: "flex", alignItems: "center", gap: 2 }}>
                                <CheckCircle2 size={9} /> {t("detail.verify")}
                              </button>
                            )}
                            <button onClick={() => { flaggingUploadId === upload.id ? setFlaggingUploadId(null) : (setFlaggingUploadId(upload.id), setFlagFinding(upload.finding || ""), setFlagUcpRule(upload.ucpRule || "")); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, padding: "2px 5px", cursor: "pointer", fontSize: 10, color: "#ef4444", fontWeight: 500, display: "flex", alignItems: "center", gap: 2 }}>
                              <Flag size={9} /> {t("detail.flag")}
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: "#8a9a8c", marginTop: 3 }}>{upload.originalFilename}</div>
                        {upload.finding && <div style={{ marginTop: 4, padding: "4px 6px", borderRadius: 4, background: upload.verified === false ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)", fontSize: 10, color: upload.verified === false ? "#ef4444" : "#16a34a" }}>{upload.finding}</div>}
                        {scanResult?.uploadId === upload.id && <div style={{ marginTop: 4, padding: "4px 6px", borderRadius: 4, background: "rgba(139,92,246,0.06)", fontSize: 10, color: "#8b5cf6" }}><Sparkles size={9} /> {scanResult.details} ({scanResult.confidence})</div>}
                        {flaggingUploadId === upload.id && (
                          <div style={{ marginTop: 6, padding: 8, borderRadius: 6, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                            <input type="text" placeholder={t("detail.flagIssuePlaceholder")} value={flagFinding} onChange={e => setFlagFinding(e.target.value)} style={{ width: "100%", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, padding: "4px 6px", fontSize: 11, marginBottom: 4, color: "#2c3e2e" }} />
                            <input type="text" placeholder={t("detail.flagUcpPlaceholder")} value={flagUcpRule} onChange={e => setFlagUcpRule(e.target.value)} style={{ width: "100%", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, padding: "4px 6px", fontSize: 11, marginBottom: 6, color: "#2c3e2e" }} />
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => handleFlag(upload.id)} disabled={!flagFinding.trim()} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 500, cursor: flagFinding.trim() ? "pointer" : "not-allowed", opacity: flagFinding.trim() ? 1 : 0.5 }}>{t("detail.docActions.submitFlag")}</button>
                              <button onClick={() => { setFlaggingUploadId(null); setFlagFinding(""); setFlagUcpRule(""); }} style={{ background: "transparent", color: "#8a9a8c", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>{t("detail.docActions.cancelFlag")}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Buyer upload form */}
                {showBuyerUpload && data.supplierRequest && (
                  <div style={{ marginTop: 12, padding: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#5e7060", marginBottom: 8 }}>{t("detail.uploadOutside")}</div>
                    <select value={buyerDocType} onChange={e => setBuyerDocType(e.target.value)} style={{ width: "100%", background: "#fff", border: "1px solid #ddd8d1", borderRadius: 6, padding: "6px 8px", fontSize: 11, marginBottom: 6, color: "#2c3e2e" }}>
                      <option value="">{t("detail.selectDocType")}</option>
                      {(data.supplierRequest.docsRequired as string[] || []).map((doc: string) => <option key={doc} value={doc}>{doc}</option>)}
                    </select>
                    <input ref={buyerFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ width: "100%", fontSize: 11, color: "#5e7060", marginBottom: 6 }} />
                    <input type="text" placeholder={t("detail.notePlaceholder")} value={buyerNote} onChange={e => setBuyerNote(e.target.value)} style={{ width: "100%", background: "#fff", border: "1px solid #ddd8d1", borderRadius: 6, padding: "6px 8px", fontSize: 11, marginBottom: 8, color: "#2c3e2e" }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="stp-btn-sm stp-btn-sage" disabled={!buyerDocType || buyerUploading} onClick={handleBuyerUpload}>{buyerUploading ? t("detail.buyerUpload.uploading") : t("detail.buyerUpload.upload")}</button>
                      <button className="stp-btn-sm stp-btn-ghost" onClick={() => setShowBuyerUpload(false)}>{t("detail.buyerUpload.cancel")}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* EUDR Recap */}
              {result?.triggers?.eudr && (
                <div className="stp-card">
                  <div className="stp-card-hdr" style={{ marginBottom: 0 }}>
                    <span className="stp-card-title">🌿 {t("detail.eudrDueDiligence")}</span>
                  </div>
                  <div className="stp-eudr-status-row" style={{ marginTop: 8 }}>
                    {eudrAssessment && eudrAssessment.applicable && eudrAssessment.score != null ? (
                      <span className="stp-status-badge stp-status-done">
                        Score: {eudrAssessment.score} · {eudrAssessment.band ? eudrAssessment.band.charAt(0).toUpperCase() + eudrAssessment.band.slice(1) : ""}
                      </span>
                    ) : (
                      <span className="stp-status-badge stp-status-pending">{t("detail.notAssessed")}</span>
                    )}
                    <span style={{ fontSize: 10, color: "#b8c2ba" }}>EU Reg 2023/1115</span>
                  </div>
                  <div className="stp-eudr-facts">
                    <div className="stp-ef"><span className="stp-ef-l">Commodity</span><span className="stp-ef-v">{data.lookup.commodityName?.split(" ")[0]} / HS {(data.lookup.hsCode || "").substring(0, 2)}</span></div>
                    <div className="stp-ef"><span className="stp-ef-l">Geolocation</span><span className={`stp-ef-v ${eudr?.plotCoordinates ? "ok" : "warn"}`}>{eudr?.plotCoordinates ? "Set" : "Pending"}</span></div>
                    <div className="stp-ef"><span className="stp-ef-l">Evidence</span><span className={`stp-ef-v ${eudr?.evidenceType ? "ok" : "warn"}`}>{eudr?.evidenceType || "Pending"}</span></div>
                    <div className="stp-ef"><span className="stp-ef-l">Supplier</span><span className={`stp-ef-v ${eudr?.supplierName ? "ok" : "warn"}`}>{eudr?.supplierName ? "Set" : "Pending"}</span></div>
                    <div className="stp-ef"><span className="stp-ef-l">Risk verdict</span><span className={`stp-ef-v ${eudrAssessment?.band ? "ok" : "na"}`}>{eudrAssessment?.band ? eudrAssessment.band.charAt(0).toUpperCase() + eudrAssessment.band.slice(1) : "—"}</span></div>
                    <div className="stp-ef"><span className="stp-ef-l">Statement</span><span className={`stp-ef-v ${data.lookup.eudrComplete ? "ok" : "na"}`}>{data.lookup.eudrComplete ? "Generated" : "—"}</span></div>
                  </div>
                  <div className="stp-eudr-sep" />
                  <div className="stp-eudr-cta-row">
                    <p>Complete the 4-step due diligence to generate your EUDR statement for this shipment.</p>
                    <Link href={`/eudr/${tradeId}`}>
                      <button className="stp-btn-dark">Start EUDR Check →</button>
                    </Link>
                  </div>
                </div>
              )}

              {/* CBAM */}
              {result?.triggers?.cbam && (() => {
                const bd = cbamAssessment?.breakdown as any;
                const levy = bd?.levyBreakdown as { netLevy: number; emissionsSource: string; perTonLevy: number } | null;
                const deadlines = bd?.deadlines as { quarterlyReportDue: string; urgency: string; ukCbamNote: string | null } | null;
                const urgencyColor = deadlines?.urgency === "overdue" ? "#ef4444" : deadlines?.urgency === "urgent" ? "#eab308" : deadlines?.urgency === "upcoming" ? "#f97316" : "#4a7c5e";
                return (
                  <div className="stp-card">
                    <div className="stp-card-hdr">
                      <span className="stp-card-title">⚡ {t("detail.cbamAssessment")}</span>
                      {cbamAssessment && cbamAssessment.applicable && cbamAssessment.score != null ? (
                        <span style={{ fontSize: 11, color: "#4a7c5e", fontWeight: 600 }}>Score: {cbamAssessment.score}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#b8c2ba" }}>{t("detail.notAssessed")}</span>
                      )}
                    </div>
                    <div className="stp-cbam-row"><span className="stp-cbam-l">Carbon border adjustment</span><span className={`stp-cbam-v ${cbamAssessment?.applicable ? "ok" : "na"}`}>{cbamAssessment?.applicable ? "Applicable" : "Check required"}</span></div>
                    <div className="stp-cbam-row">
                      <span className="stp-cbam-l">{t("detail.estimatedLevy")}</span>
                      {levy ? (
                        <span className="stp-cbam-v ok" title={`${levy.emissionsSource === "default" ? "Default factor" : "Actual"} · €${levy.perTonLevy}/ton`}>€{levy.netLevy.toLocaleString()}</span>
                      ) : (
                        <span className="stp-cbam-v na">{cbamAssessment ? t("detail.runAssessmentForLevy") : "—"}</span>
                      )}
                    </div>
                    <div className="stp-cbam-row">
                      <span className="stp-cbam-l">{t("detail.reportingDeadline")}</span>
                      {deadlines ? (
                        <span className="stp-cbam-v" style={{ color: urgencyColor, fontWeight: 600 }}>
                          {new Date(deadlines.quarterlyReportDue).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      ) : (
                        <span className="stp-cbam-v na">{data.cbamRecord?.reportingPeriod ? "—" : t("detail.setReportingPeriod")}</span>
                      )}
                    </div>
                    {deadlines?.ukCbamNote && (
                      <div className="stp-cbam-row"><span className="stp-cbam-l" style={{ fontSize: 10, color: "#8a9a8c" }}>🇬🇧 {deadlines.ukCbamNote}</span></div>
                    )}
                    <div style={{ marginTop: 10 }}>
                      <Link href={`/cbam/${tradeId}`}>
                        <button className="stp-btn-dark">{t("detail.startCbamCheck")} →</button>
                      </Link>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="stp-right">

              {/* Shipment Value */}
              <div className="stp-card">
                <div className="stp-card-hdr" style={{ marginBottom: 6 }}>
                  <span className="stp-card-title">{t("detail.shipmentValue")}</span>
                  {!editingValue && (
                    <button className="stp-btn-sm stp-btn-ghost" style={{ fontSize: 10.5 }} onClick={() => {
                      setTradeValueInput(data.lookup.tradeValue || "");
                      setTradeValueCurrencyInput(data.lookup.tradeValueCurrency || "USD");
                      setEditingValue(true);
                    }}>
                      {data.lookup.tradeValue ? t("detail.edit") : t("detail.addValue")}
                    </button>
                  )}
                </div>
                {editingValue ? (
                  <div className="stp-val-form">
                    <div style={{ display: "flex", gap: 6 }}>
                      <select value={tradeValueCurrencyInput} onChange={e => setTradeValueCurrencyInput(e.target.value)} style={{ width: 68 }}>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CHF">CHF</option>
                      </select>
                      <input type="number" placeholder="e.g. 125000" value={tradeValueInput} onChange={e => setTradeValueInput(e.target.value)} style={{ flex: 1 }} autoFocus />
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="stp-btn-sm stp-btn-sage" style={{ flex: 1 }} disabled={savingValue || !tradeValueInput.trim()} onClick={handleSaveTradeValue}>{savingValue ? t("detail.saving") : t("detail.save")}</button>
                      <button className="stp-btn-sm stp-btn-ghost" onClick={() => setEditingValue(false)}>{t("detail.cancel")}</button>
                    </div>
                  </div>
                ) : tradeVal > 0 ? (
                  <div style={{ fontFamily: "var(--stp-fd)", fontWeight: 700, fontSize: 20, color: "#4a7c5e" }}>
                    {data.lookup.tradeValueCurrency || "USD"} {tradeVal.toLocaleString()}
                  </div>
                ) : (
                  <div className="stp-val-empty">
                    <p>No value set yet. Add the shipment value to see risk as a percentage of cargo worth.</p>
                    <div className="stp-hint">Risk % unlocked once value is set</div>
                  </div>
                )}
              </div>

              {/* Demurrage Estimate */}
              {demEstimate && (
                <div className="stp-card">
                  <div className="stp-card-hdr" style={{ marginBottom: 2 }}>
                    <span className="stp-card-title">{t("detail.demurrage")}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#8a9a8c", marginBottom: 10 }}>
                    {demEstimate.port.label}
                    {demEstimate.allPorts.length > 1 && ` (+${demEstimate.allPorts.length - 1} more)`}
                  </div>
                  <div className="stp-dem-row"><span className="stp-dem-l">Estimated delay</span><span className="stp-dem-v amber">{demEstimate.delayLabel}</span></div>
                  <div className="stp-dem-row"><span className="stp-dem-l">Based on</span><span className="stp-dem-v" style={{ fontSize: 11 }}>{verdict || "AMBER"} corridor risk</span></div>
                  <div className="stp-dem-row"><span className="stp-dem-l">Cost range (20ft)</span><span className="stp-dem-v">${demEstimate.minCost.toLocaleString()}–${demEstimate.maxCost.toLocaleString()}</span></div>
                  {pctOfCargo && <div className="stp-dem-row"><span className="stp-dem-l">% of cargo</span><span className={`stp-dem-v ${Number(pctOfCargo) > 5 ? "red" : ""}`}>{pctOfCargo}%</span></div>}
                  <div className="stp-dem-total">
                    <span className="stp-dem-tl">Worst case total</span>
                    <span className="stp-dem-tv">${demEstimate.maxCost.toLocaleString()}</span>
                  </div>
                  <div className="stp-dem-cta"><Link href="/demurrage"><a>Open full calculator ({demEstimate.allPorts.length} ports) →</a></Link></div>
                </div>
              )}

              {/* Audit Trail */}
              <div className="stp-card">
                <div className="stp-card-hdr">
                  <span className="stp-card-title">TwinLog Audit Trail</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#8a9a8c" }}>{data.auditTrail.length} events</span>
                    <button
                      className="stp-btn-sm stp-btn-sage"
                      disabled={pdfLoading}
                      onClick={async () => {
                        setPdfLoading(true);
                        try {
                          const res = await fetch("/api/twinlog/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ lookupId: data.lookup.id }),
                          });
                          if (!res.ok) throw new Error("PDF generation failed");
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `TwinLog-${data.lookup.twinlogRef || data.lookup.id}.pdf`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch {
                          toast({ title: "Error", description: "Could not generate TwinLog PDF", variant: "destructive" });
                        } finally {
                          setPdfLoading(false);
                        }
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, padding: "3px 8px" }}
                    >
                      {pdfLoading ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />} Download PDF
                    </button>
                  </div>
                </div>
                {data.auditTrail.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#8a9a8c", padding: "8px 0" }}>{t("detail.noAuditEvents")}</div>
                ) : (
                  data.auditTrail.slice(0, 8).map((event, i) => {
                    const cfg = eventConfig[event.eventType] || { icon: Clock, color: "#6b7280", labelKey: "" };
                    const eventLabel = cfg.labelKey ? t(cfg.labelKey) : event.eventType.replace(/_/g, " ");
                    const date = new Date(event.createdAt);
                    const isRecent = Date.now() - date.getTime() < 86400000 * 2;
                    return (
                      <div key={event.id} className="stp-audit-event">
                        <div className={`stp-ae-dot ${isRecent ? "new" : ""}`} />
                        <div>
                          <div className="stp-ae-title">{eventLabel}</div>
                          <div className="stp-ae-hash">{event.eventHash.slice(0, 8)}</div>
                          <div className="stp-ae-time">{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
