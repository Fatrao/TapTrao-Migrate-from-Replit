import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { estimateDemurrageRange } from "@/lib/demurrage-utils";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/AppShell";
import { StepNav } from "@/components/StepNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import CountryFlagBadge, { iso2ToFlag } from "@/components/CountryFlagBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Globe,
  ArrowLeft,
  Search,
  AlertTriangle,
  Shield,
  FileCheck,
  Leaf,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  Info,
  Scale,
  Mail,
  MessageCircle,
  Download,
  Copy,
  Check,
  Hash,
  Hexagon,
  Bookmark,
  RefreshCw,
  ArrowRight,
  Circle,
  ArrowDown,
  Lock,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTokenBalance } from "@/hooks/use-tokens";
import { useAuth } from "@/hooks/use-auth";
import type {
  Commodity,
  OriginCountry,
  Destination,
  ComplianceResult,
  ComplianceReadiness,
  ReadinessScoreResult,
  ReadinessFactors,
  RequirementDetail,
  DocumentStatus,
  Template,
} from "@shared/schema";

function TriggerBadge({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  if (!active) return null;
  return (
    <Badge variant="destructive" className="text-xs" data-testid={`badge-trigger-${label.toLowerCase()}`}>
      {label}
    </Badge>
  );
}

const ruleLabels: Record<string, string> = {
  WHOLLY_OBTAINED: "Wholly Obtained",
  VALUE_ADD: "Value Addition",
  CTH: "Change of Tariff Heading",
  CTSH: "Change of Tariff Sub-Heading",
  SPECIFIC_PROCESS: "Specific Process",
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      data-testid={`button-copy-${label}`}
    >
      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

const statusColors: Record<DocumentStatus, string> = {
  PENDING: "",
  READY: "",
  RISK_ACCEPTED: "",
};

const statusLabels: Record<DocumentStatus, string> = {
  PENDING: "Pending",
  READY: "Ready",
  RISK_ACCEPTED: "Risk Accepted",
};

const ownerLabels: Record<string, string> = {
  IMPORTER: "You",
  SUPPLIER: "Supplier",
  BROKER: "Broker",
};

const dueByLabels: Record<string, string> = {
  BEFORE_LOADING: "Before loading",
  BEFORE_ARRIVAL: "Before arrival",
  POST_ARRIVAL: "On arrival",
};

function StatusDropdown({
  status,
  onChange,
  index,
}: {
  status: DocumentStatus;
  onChange: (s: DocumentStatus) => void;
  index: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1 shrink-0 cursor-pointer"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            letterSpacing: "0.08em",
            padding: "3px 8px",
            borderRadius: 4,
            background: status === "READY" ? "var(--gbg)" : status === "RISK_ACCEPTED" ? "var(--abg)" : "rgba(0,0,0,0.05)",
            border: `1px solid ${status === "READY" ? "var(--gbd)" : status === "RISK_ACCEPTED" ? "var(--abd)" : "rgba(0,0,0,0.07)"}`,
            color: status === "READY" ? "var(--green)" : status === "RISK_ACCEPTED" ? "var(--amber)" : "var(--t2)",
          }}
          data-testid={`button-status-${index}`}
        >
          {statusLabels[status]} <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(["PENDING", "READY", "RISK_ACCEPTED"] as DocumentStatus[]).map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => onChange(s)}
            data-testid={`menu-status-${s.toLowerCase()}-${index}`}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: s === "PENDING" ? "var(--t3)" : s === "READY" ? "var(--green)" : "var(--amber)" }} />
            {statusLabels[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InteractiveRequirement({
  req,
  index,
  status,
  onStatusChange,
}: {
  req: RequirementDetail;
  index: number;
  status: DocumentStatus;
  onStatusChange: (s: DocumentStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <li className="text-sm" data-testid={`text-requirement-${index}`}>
        <div className="flex items-start gap-2 w-full">
          <StatusDropdown status={status} onChange={onStatusChange} index={index} />
          <CollapsibleTrigger className="flex items-start gap-2 flex-1 text-left cursor-pointer group min-w-0">
            <span className="mt-0.5 shrink-0 transition-transform duration-200" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
              <ChevronRight className="w-4 h-4 text-primary" />
            </span>
            <div className="flex-1 min-w-0">
              <span className="block sm:inline">{req.title}</span>
              <span className="hidden sm:inline-flex items-center gap-2 ml-2">
                <span className="text-xs text-muted-foreground">{ownerLabels[req.owner]}</span>
                <span className="text-xs text-muted-foreground">&middot;</span>
                <span className="text-xs text-muted-foreground">{dueByLabels[req.due_by]}</span>
              </span>
              <div className="sm:hidden flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{ownerLabels[req.owner]}</span>
                <span className="text-xs text-muted-foreground">&middot;</span>
                <span className="text-xs text-muted-foreground">{dueByLabels[req.due_by]}</span>
              </div>
            </div>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="ml-6 mt-2 mb-3 space-y-2 p-3 rounded-md" style={{ background: "var(--card2)" }} data-testid={`detail-requirement-${index}`}>
            <div>
              <span className="text-xs font-medium text-muted-foreground">What it is</span>
              <p className="text-sm">{req.description}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Who provides it</span>
              <p className="text-sm">{req.issuedBy}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">When needed</span>
              <p className="text-sm">{req.whenNeeded}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Practical tip</span>
              <p className="text-sm italic">{req.tip}</p>
            </div>
            {req.portalGuide && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Portal / submission guide</span>
                <p className="text-sm">{req.portalGuide}</p>
              </div>
            )}
            {req.documentCode && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Document code</span>
                <p className="text-sm font-mono">{req.documentCode}</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}

function getActionHint(req: RequirementDetail): string {
  const t = req.title.toLowerCase();
  if (t.includes("certificate of origin")) return `Issued by: ${req.issuedBy}`;
  if (t.includes("phytosanitary") || t.includes("sps certificate")) return `Issued by: ${req.issuedBy}`;
  if (t.includes("ipaffs")) return "Submit at: ipaffs.co.uk \u2014 24hrs before goods arrive";
  if (t.includes("traces") || t.includes("ched")) return "Submit at: webgate.ec.europa.eu/tracesnt \u2014 before departure";
  if (t.includes("customs") && t.includes("declaration")) return "Provide HS code, origin, and CHED reference to your broker";
  if (t.includes("eudr") && t.includes("geolocation")) return "GPS coordinates of production plot required";
  if (t.includes("iuu") && t.includes("catch certificate")) return "Issued by flag state of fishing vessel \u2014 not the exporter";
  if (t.includes("flegt")) return "Only available from VPA partner countries";
  if (t.includes("kimberley")) return "Must be tamper-evident sealed";
  return "Required to avoid delays";
}

function NextActionsPanel({
  allDocs,
  statuses,
  hasStop,
  buyerDocsRef,
}: {
  allDocs: RequirementDetail[];
  statuses: Record<number, DocumentStatus>;
  hasStop: boolean;
  buyerDocsRef: React.RefObject<HTMLDivElement | null>;
}) {

  const pendingDocs = allDocs
    .map((doc, idx) => ({ doc, idx, status: statuses[idx] || "PENDING" }))
    .filter((d) => d.status === "PENDING");

  const duePriority = { BEFORE_LOADING: 0, BEFORE_ARRIVAL: 1, POST_ARRIVAL: 2 };
  const ownerPriority = { IMPORTER: 0, BROKER: 1, SUPPLIER: 2 };

  pendingDocs.sort((a, b) => {
    const dp = (duePriority[a.doc.due_by] ?? 3) - (duePriority[b.doc.due_by] ?? 3);
    if (dp !== 0) return dp;
    return (ownerPriority[a.doc.owner] ?? 3) - (ownerPriority[b.doc.owner] ?? 3);
  });

  const totalDocs = allDocs.length;
  const pendingCount = pendingDocs.length;
  const showItems = pendingDocs.slice(0, 5);
  const dotsTotal = Math.min(totalDocs, 5);
  const dotsFilled = Math.min(pendingCount, dotsTotal);

  const allComplete = pendingCount === 0;

  return (
    <div style={{ background: "rgba(109,184,154,0.06)", borderRadius: 14, border: "1px solid rgba(109,184,154,0.2)", padding: "20px 24px" }} data-testid="section-next-actions">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Next Actions</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--t3)" }} data-testid="text-pending-count">
            {pendingCount} pending
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {Array.from({ length: dotsTotal }).map((_, i) => (
              <Circle
                key={i}
                className="w-2.5 h-2.5"
                style={{ fill: i < dotsFilled ? "#eab308" : "none", color: i < dotsFilled ? "#eab308" : "var(--t4)" }}
              />
            ))}
          </span>
        </div>
      </div>

      {hasStop && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12, padding: 8, borderRadius: 8, background: "rgba(239,68,68,0.1)" }}>
          <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: "#ef4444", margin: 0 }}>
            STOP flag active {"\u2014"} resolve trade restrictions before proceeding
          </p>
        </div>
      )}

      {allComplete ? (
        <div style={{ textAlign: "center", padding: "16px 0" }} data-testid="section-all-complete">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: "var(--sage)" }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--sage)", margin: 0 }}>
              All actions complete for this trade.
            </p>
          </div>
          <p style={{ fontSize: 13, color: "var(--t3)", margin: "8px 0 12px" }}>
            You can now download your compliance pack.
          </p>
          <Button variant="outline" size="sm" disabled data-testid="button-download-compliance-pack">
            <Download className="w-3 h-3 mr-1" /> Download Compliance Pack
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {showItems.map(({ doc, idx }) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8 }} data-testid={`next-action-${idx}`}>
              <Circle className="w-2.5 h-2.5 mt-1.5 shrink-0" style={{ fill: "#eab308", color: "#eab308" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--t1)" }}>{doc.title.length > 60 ? doc.title.substring(0, 60) + "..." : doc.title}</span>
                  <span style={{ fontSize: 13, color: "var(--t3)" }}>{ownerLabels[doc.owner]}</span>
                  <span style={{ fontSize: 13, color: "var(--t3)" }}>{dueByLabels[doc.due_by]}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--t3)", fontStyle: "italic", margin: "2px 0 0" }}>
                  {getActionHint(doc)}
                </p>
              </div>
            </div>
          ))}
          {pendingCount > 5 && (
            <button
              onClick={() => buyerDocsRef.current?.scrollIntoView({ behavior: "smooth" })}
              style={{ fontSize: 13, color: "var(--sage)", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
              data-testid="button-see-all-pending"
            >
              See all {pendingCount} pending items <ArrowDown className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function generateSupplierBriefEmail(result: ComplianceResult): string {
  const supplierDocs = result.requirementsDetailed.filter(r => r.isSupplierSide);
  const lines: string[] = [];
  lines.push(`Subject: Required Export Documents — ${result.commodity.name} (HS ${result.commodity.hsCode}) from ${result.origin.countryName} to ${result.destination.countryName}`);
  lines.push("");
  lines.push("Dear Supplier,");
  lines.push("");
  lines.push(`We are preparing a shipment of ${result.commodity.name} (HS ${result.commodity.hsCode}) from ${result.origin.countryName} to ${result.destination.countryName}. Please prepare the following documents:`);
  lines.push("");
  supplierDocs.forEach((doc, i) => {
    lines.push(`${i + 1}. ${doc.title}`);
    lines.push(`   Issued by: ${doc.issuedBy}`);
    lines.push(`   When needed: ${doc.whenNeeded}`);
    if (doc.documentCode) {
      lines.push(`   Document code: ${doc.documentCode}`);
    }
    lines.push("");
  });
  lines.push("Please confirm availability and expected timeline for each document.");
  lines.push("");
  lines.push("Best regards");
  return lines.join("\n");
}

function generateSupplierBriefWhatsApp(result: ComplianceResult): string {
  const supplierDocs = result.requirementsDetailed.filter(r => r.isSupplierSide);
  const lines: string[] = [];
  lines.push(`*Required Documents* - ${result.commodity.name} (HS ${result.commodity.hsCode})`);
  lines.push(`${result.origin.countryName} -> ${result.destination.countryName}`);
  lines.push("");
  supplierDocs.forEach((doc, i) => {
    lines.push(`${i + 1}. ${doc.title}`);
    lines.push(`   _Issued by: ${doc.issuedBy}_`);
    if (doc.documentCode) {
      lines.push(`   Code: ${doc.documentCode}`);
    }
  });
  lines.push("");
  lines.push("Please confirm availability.");
  return lines.join("\n");
}

function SupplierBriefSection({ result }: { result: ComplianceResult }) {
  const [showBrief, setShowBrief] = useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp">("email");

  const supplierDocs = result.requirementsDetailed.filter(r => r.isSupplierSide);
  if (supplierDocs.length === 0) return null;

  const emailText = generateSupplierBriefEmail(result);
  const whatsappText = generateSupplierBriefWhatsApp(result);

  return (
    <div style={{ background: "rgba(109,184,154,0.06)", borderRadius: 14, border: "1px solid rgba(109,184,154,0.2)", padding: "20px 24px" }}>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowBrief(!showBrief)}
        data-testid="button-generate-supplier-brief"
      >
        <Mail className="w-4 h-4 mr-2" />
        {showBrief ? "Hide supplier instructions" : `Supplier instructions (${supplierDocs.length} documents)`}
      </Button>

      {showBrief && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant={activeTab === "email" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("email")}
              data-testid="button-tab-email"
            >
              <Mail className="w-3 h-3 mr-1" />
              Email Format
            </Button>
            <Button
              variant={activeTab === "whatsapp" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("whatsapp")}
              data-testid="button-tab-whatsapp"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              WhatsApp Format
            </Button>
          </div>

          <div style={{ position: "relative" }}>
            <pre
              style={{ fontSize: 13, padding: 12, borderRadius: 8, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace", maxHeight: 320, overflowY: "auto", background: "rgba(0,0,0,0.04)", color: "var(--t2)" }}
              data-testid={`text-brief-${activeTab}`}
            >
                {activeTab === "email" ? emailText : whatsappText}
              </pre>
              <div className="mt-2">
                <CopyButton
                  text={activeTab === "email" ? emailText : whatsappText}
                  label={activeTab === "email" ? "email-brief" : "whatsapp-brief"}
                />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function generateCustomsCSV(result: ComplianceResult): string {
  const rows: string[][] = [];
  rows.push(["Field", "Value"]);
  rows.push(["Commodity", result.commodity.name]);
  rows.push(["HS Code", result.commodity.hsCode]);
  rows.push(["Commodity Type", result.commodity.commodityType]);
  rows.push(["Origin Country", result.origin.countryName]);
  rows.push(["Origin ISO", result.origin.iso2]);
  rows.push(["Destination Country", result.destination.countryName]);
  rows.push(["Destination ISO", result.destination.iso2]);
  rows.push(["Tariff Source", result.destination.tariffSource]);
  rows.push(["VAT/GST Rate (%)", String(result.destination.vatRate)]);
  rows.push(["SPS Regime", result.destination.spsRegime]);
  rows.push(["Security Filing", result.destination.securityFiling]);
  rows.push(["AfCFTA Eligible", result.afcftaEligible ? "Yes" : "No"]);
  rows.push(["CHED Reference", "___________________"]);
  rows.push([]);
  rows.push(["Regulatory Triggers"]);
  Object.entries(result.triggers).forEach(([key, val]) => {
    if (val) rows.push(["Trigger", key.toUpperCase()]);
  });
  rows.push([]);
  rows.push(["Document Code", "Document Title", "Issued By", "Supplier Side"]);
  result.requirementsDetailed.forEach(r => {
    rows.push([
      r.documentCode || "—",
      r.title,
      r.issuedBy,
      r.isSupplierSide ? "Yes" : "No",
    ]);
  });

  return rows.map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function computeSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function EvidenceHashInline({ result }: { result: ComplianceResult }) {
  const [hash, setHash] = useState<string | null>(null);
  const [timestamp] = useState(() => new Date().toISOString());

  useEffect(() => {
    const stableObj = {
      commodity: result.commodity.id,
      origin: result.origin.id,
      destination: result.destination.id,
      triggers: result.triggers,
      requirements: result.requirements,
      afcftaEligible: result.afcftaEligible,
      timestamp,
    };
    computeSHA256(JSON.stringify(stableObj)).then(setHash);
  }, [result, timestamp]);

  if (!hash) return null;

  const year = new Date().getFullYear();
  const shortRef = `TT-${year}-${hash.substring(0, 6).toUpperCase()}`;

  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(109,184,154,0.8)" }} data-testid="text-compliance-ref">
        {shortRef}
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--t4)", wordBreak: "break-all", marginTop: 2 }} data-testid="text-full-hash">
        sha256:{hash}
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--t4)", marginTop: 2 }} data-testid="text-hash-timestamp">
        {new Date(timestamp).toLocaleString()}
      </p>
    </div>
  );
}

function ReadinessBanner({ score, verdict, summary, factors, primaryRiskFactor }: {
  score: number;
  verdict: "GREEN" | "AMBER" | "RED";
  summary: string;
  factors: ReadinessFactors;
  primaryRiskFactor: string;
}) {
  const verdictStyles = {
    GREEN: { badgeBg: "rgba(109,184,154,0.2)", badgeBorder: "rgba(109,184,154,0.25)", badgeColor: "var(--sage)", label: "LOW RISK" },
    AMBER: { badgeBg: "rgba(234,179,8,0.12)", badgeBorder: "rgba(234,179,8,0.25)", badgeColor: "#eab308", label: "ATTENTION NEEDED" },
    RED: { badgeBg: "rgba(239,68,68,0.12)", badgeBorder: "rgba(239,68,68,0.25)", badgeColor: "#ef4444", label: "HIGH RISK \u2014 ACTION REQUIRED" },
  };

  const v = verdictStyles[verdict];

  const barColors: Record<string, string> = {
    regulatory_complexity: "#60a5fa",
    hazard_exposure: "#eab308",
    document_volume: "var(--t4)",
    trade_restriction: "#ef4444",
  };

  const factorRows = [
    { key: "regulatory_complexity", label: "Regulatory requirements", penalty: factors.regulatory_complexity.penalty, max: factors.regulatory_complexity.max },
    { key: "hazard_exposure", label: "Product controls", penalty: factors.hazard_exposure.penalty, max: factors.hazard_exposure.max },
    { key: "document_volume", label: "Document volume", penalty: factors.document_volume.penalty, max: factors.document_volume.max },
    { key: "trade_restriction", label: "Trade restrictions", penalty: factors.trade_restriction.penalty, max: factors.trade_restriction.max },
  ];

  return (
    <div data-testid="section-readiness-score">
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 12 }}>
        Readiness Score
      </div>
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "var(--fh)",
              fontWeight: 900,
              fontSize: "clamp(48px, 6vw, 64px)",
              letterSpacing: 0,
              color: "var(--t1)",
              lineHeight: 1,
            }}
            data-testid="text-readiness-score"
          >
            {score}
          </div>
          <span
            style={{
              display: "inline-block",
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 4,
              background: v.badgeBg,
              border: `1px solid ${v.badgeBorder}`,
              color: v.badgeColor,
              width: "fit-content",
            }}
            data-testid="badge-readiness-verdict"
          >
            {v.label}
          </span>
          <p
            style={{
              fontSize: 13,
              color: "var(--t2)",
              lineHeight: 1.65,
              marginTop: 6,
              maxWidth: 260,
            }}
            data-testid="text-readiness-summary"
          >
            {summary}
          </p>
        </div>

        <div style={{ flex: 1, paddingLeft: 28 }}>
          {factorRows.map((f) => {
            const pct = f.max > 0 ? (f.penalty / f.max) * 100 : 0;
            const isPrimary = primaryRiskFactor === f.key && f.penalty > 10;
            return (
              <div
                key={f.key}
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}
                data-testid={`factor-${f.key}`}
              >
                <span style={{ width: 120, fontSize: 13, color: "var(--t2)", textAlign: "right", flexShrink: 0 }}>
                  {f.label}
                </span>
                <div style={{ flex: 1, height: 3, background: "rgba(0,0,0,0.07)", borderRadius: 2, position: "relative" }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 2,
                      background: barColors[f.key] || "var(--t4)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: isPrimary ? 9 : 10,
                    width: 48,
                    textAlign: "right",
                    color: isPrimary ? "#eab308" : "var(--t3)",
                    flexShrink: 0,
                  }}
                >
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

function TwinLogDownloadButton({
  result,
  docStatuses,
  locked = false,
}: {
  result: ComplianceResult & { lookupId?: string; integrityHash?: string };
  docStatuses: Record<number, DocumentStatus>;
  locked?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileQuery = useQuery<{ profileComplete: boolean } | null>({
    queryKey: ["/api/company-profile"],
  });

  const profileComplete = profileQuery.data?.profileComplete === true;

  if (locked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full opacity-60 cursor-not-allowed"
              disabled
              data-testid="button-download-twinlog-locked"
            >
              <Lock className="w-4 h-4 mr-2" />
              Download TwinLog Trail
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-center">
          <p>Included with TapTrao Shield — <a href="/pricing" style={{textDecoration:"underline"}}>see plans</a></p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        documentStatuses: docStatuses,
      };
      if (result.lookupId) {
        body.lookupId = result.lookupId;
      } else {
        body.complianceResult = result;
      }

      const res = await fetch("/api/twinlog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.status === 403) {
        const data = await res.json();
        setError(data.message);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to generate PDF");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      let filename = "TwinLog-Trail.pdf";
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || "Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  if (!profileComplete) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full opacity-50 cursor-not-allowed"
              disabled
              data-testid="button-download-twinlog-disabled"
            >
              <Download className="w-4 h-4 mr-2" />
              Download TwinLog Trail
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-center">
          <p>
            Complete your company profile to download TwinLog Trail records.{" "}
            <Link href="/settings/profile" className="text-primary underline font-medium" data-testid="link-settings-from-twinlog">
              Settings →
            </Link>
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <Button
        variant="default"
        className="w-full"
        onClick={handleDownload}
        disabled={loading}
        data-testid="button-download-twinlog"
      >
        <Download className="w-4 h-4 mr-2" />
        {loading ? "Generating TwinLog Trail..." : "Download TwinLog Trail"}
      </Button>
      {error && (
        <p className="text-sm mt-1 text-center" style={{ color: "var(--red)" }} data-testid="text-twinlog-error">{error}</p>
      )}
    </div>
  );
}

function CheckLcButton({ result, locked = false }: { result: ComplianceResult & { lookupId?: string }; locked?: boolean }) {
  const [, navigate] = useLocation();

  if (locked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full opacity-60 cursor-not-allowed"
              disabled
              data-testid="button-check-lc-locked"
            >
              <Lock className="w-4 h-4 mr-2" />
              Check LC before submission
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-center">
          <p>Included with TapTrao Shield — <a href="/pricing" style={{textDecoration:"underline"}}>see plans</a></p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const handleClick = () => {
    const supplierDocs = result.requirementsDetailed
      .filter(r => r.isSupplierSide)
      .map(r => r.title);

    const prefillData = {
      lookup_id: result.lookupId || "",
      commodity_name: result.commodity.name,
      hs_code: result.commodity.hsCode,
      origin_iso2: result.origin.iso2,
      origin_name: result.origin.countryName,
      dest_iso2: result.destination.iso2,
      dest_name: result.destination.countryName,
      incoterms: "FOB",
      required_docs: supplierDocs,
    };

    sessionStorage.setItem("lc_prefill", JSON.stringify(prefillData));
    navigate("/lc-check");
  };

  return (
    <div>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleClick}
        data-testid="button-check-lc-for-trade"
      >
        <ArrowRight className="w-4 h-4 mr-2" />
        Check LC before submission
      </Button>
      <p className="text-xs text-muted-foreground mt-1 text-center">
        Pre-fills commodity, HS code, origin, destination, and required documents from this lookup.
      </p>
    </div>
  );
}

function SupplierBriefButton({ result }: { result: ComplianceResult }) {
  const supplierDocs = result.requirementsDetailed.filter(r => r.isSupplierSide);
  if (supplierDocs.length === 0) return null;

  const scrollToSupplierBrief = () => {
    const el = document.querySelector('[data-testid="button-generate-supplier-brief"]');
    if (el) {
      (el as HTMLButtonElement).click();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={scrollToSupplierBrief}
      data-testid="button-supplier-brief-shortcut"
    >
      <Mail className="w-4 h-4 mr-2" />
      Supplier instructions
    </Button>
  );
}

function EudrAlertBlock({ lookupId, result }: { lookupId?: string; result: ComplianceResult }) {
  const [, navigate] = useLocation();
  const isCH = result.destination.iso2 === "CH";
  const eudrQuery = useQuery<any>({
    queryKey: ["/api/eudr", lookupId],
    enabled: !!lookupId && !isCH,
  });
  const eudrComplete = !isCH && eudrQuery.data?.status === "complete";

  if (isCH) {
    return (
      <div
        data-testid="eudr-alert-block"
        style={{
          background: "var(--amber)",
          borderRadius: ".75rem",
          padding: "16px 20px",
          margin: "12px 0",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 22, flexShrink: 0 }}>⚠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "var(--t1)", fontSize: 14 }}>
            Swiss Due Diligence Act — Prepare EUDR-Equivalent Documentation
          </div>
          <div style={{ color: "var(--t1)", fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>
            Switzerland has passed its own Due Diligence Act covering timber and minerals.
            Cocoa, coffee, and other EUDR commodities are expected to be added.
            Monitor FOEN/BAFU (<span style={{ fontWeight: 600 }}>bafu.admin.ch</span>) for confirmation of scope and timeline.
            Prepare EUDR-equivalent documentation now — requirements will likely mirror the EU.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="eudr-alert-block"
      style={{
        background: eudrComplete ? "var(--green)" : "var(--amber)",
        borderRadius: ".75rem",
        padding: "16px 20px",
        margin: "12px 0",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 22 }}>{eudrComplete ? "✓" : "⚠"}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: "var(--t1)", fontSize: 14 }}>
          {eudrComplete ? "EUDR Due Diligence Complete" : "EUDR due diligence required"}
        </div>
        <div style={{ color: "var(--t1)", fontSize: 14, marginTop: 2 }}>
          {eudrComplete
            ? "Your EUDR due diligence statement has been completed for this trade."
            : "Additional requirement to ship legally and avoid penalties."}
        </div>
      </div>
      {!eudrComplete && lookupId && (
        <button
          data-testid="eudr-start-button"
          onClick={() => navigate(`/eudr/${lookupId}`)}
          style={{
            background: "#fff",
            color: "var(--amber)",
            border: "none",
            borderRadius: ".5rem",
            padding: "8px 18px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Prepare EUDR documents →
        </button>
      )}
    </div>
  );
}

function LeadCaptureCard({ result }: { result: ComplianceResult }) {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await apiRequest("POST", "/api/leads", {
        email,
        companyName: companyName || undefined,
        source: "post_check",
        lookupId: (result as any).lookupId || undefined,
        commodityName: result.commodity.name,
        corridorDescription: `${result.commodity.name}: ${result.origin.iso2} → ${result.destination.iso2}`,
      });
      setSubmitted(true);
      trackEvent("lead_captured", {
        source: "post_check",
        corridor: `${result.origin.iso2}-${result.destination.iso2}`,
      });
    } catch {
      // silently fail — don't block user
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          background: "rgba(109,184,154,0.06)",
          border: "1px solid rgba(109,184,154,0.2)",
          borderRadius: 14,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
        data-testid="lead-capture-success"
      >
        <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "var(--sage)" }} />
        <p style={{ fontSize: 13, color: "var(--sage)", margin: 0 }}>
          Thanks! We'll send regulatory updates for this corridor.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(109,184,154,0.1), rgba(109,184,154,0.06))",
        border: "1px solid rgba(109,184,154,0.15)",
        borderRadius: 14,
        padding: "20px 24px",
      }}
      data-testid="lead-capture-card"
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", fontFamily: "'Clash Display', sans-serif", margin: "0 0 6px" }}>
        Save this compliance check
      </h3>
      <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6, margin: "0 0 14px" }}>
        Enter your email to get regulatory updates for this corridor.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Input
          type="email"
          placeholder="work@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ background: "rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--t1)", borderRadius: 8 }}
          data-testid="input-lead-email"
        />
        <Input
          type="text"
          placeholder="Company name (optional)"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={{ background: "rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--t1)", borderRadius: 8 }}
          data-testid="input-lead-company"
        />
        <Button
          type="submit"
          disabled={loading || !email}
          size="sm"
          style={{ background: "rgba(0,0,0,0.06)", color: "var(--t1)", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", alignSelf: "flex-start", marginTop: 4 }}
          data-testid="button-lead-submit"
        >
          {loading ? "Saving..." : "Save & Get Updates →"}
        </Button>
        <p style={{ fontSize: 13, color: "var(--t3)", margin: "6px 0 0" }}>
          By submitting, you agree to our{" "}
          <Link href="/privacy-policy" style={{ color: "var(--t2)", textDecoration: "underline" }}>Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}

// ── Phase 4: Document Readiness Section ──

type RequirementReadiness = {
  requirementIndex: number;
  requirementTitle: string;
  documentCode: string | null;
  status: "not_uploaded" | "pending" | "processing" | "valid" | "issues" | "wrong_doc" | "failed" | "overridden";
  validationId: string | null;
  verdict: string | null;
  confidence: string | null;
  issues: Array<{ field: string; expected: string; found: string; severity: string; explanation: string; source: string }>;
  evidence: Array<{ quote: string; page: number | null; field: string; reason: string }>;
  fieldStatus: Array<{ field: string; status: string; severity: string; expected: string; found: string }>;
  filename: string | null;
  uploadedAt: string | null;
};

function DocumentReadinessSection({ lookupId, result }: { lookupId: string; result: ComplianceResult }) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const { data: readinessData, isLoading, refetch } = useQuery<{ readiness: RequirementReadiness[] }>({
    queryKey: [`/api/lookups/${lookupId}/document-readiness`],
    queryFn: async () => {
      const res = await fetch(`/api/lookups/${lookupId}/document-readiness`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch readiness");
      return res.json();
    },
    refetchInterval: (query) => {
      // Poll while any validation is pending/processing
      const data = query.state.data;
      if (!data?.readiness) return false;
      const hasActive = data.readiness.some((r: RequirementReadiness) => r.status === "pending" || r.status === "processing");
      return hasActive ? 3000 : false;
    },
  });

  const readiness = readinessData?.readiness ?? [];

  const handleUpload = async (requirementIndex: number, file: File) => {
    setUploadingIdx(requirementIndex);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/lookups/${lookupId}/requirements/${requirementIndex}/validate`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      // Refetch readiness data
      refetch();
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(err.message || "Upload failed. Please try again.");
    } finally {
      setUploadingIdx(null);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    not_uploaded: { label: "Not uploaded", color: "var(--t3)", bg: "transparent", icon: "○" },
    pending: { label: "Queued", color: "#eab308", bg: "rgba(234,179,8,0.1)", icon: "⏳" },
    processing: { label: "Validating...", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: "⚙" },
    valid: { label: "Valid", color: "var(--sage)", bg: "rgba(109,184,154,0.1)", icon: "✓" },
    issues: { label: "Issues found", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "!" },
    wrong_doc: { label: "Wrong document", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "✗" },
    failed: { label: "Failed", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "✗" },
    overridden: { label: "Overridden", color: "#eab308", bg: "rgba(234,179,8,0.1)", icon: "↻" },
  };

  if (isLoading || readiness.length === 0) return null;

  const uploadedCount = readiness.filter(r => r.status !== "not_uploaded").length;
  const validCount = readiness.filter(r => r.status === "valid" || r.status === "overridden").length;

  return (
    <div style={{
      background: "rgba(109,184,154,0.06)",
      borderRadius: 14,
      border: "1px solid rgba(109,184,154,0.2)",
      padding: "20px 24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 15, color: "var(--t1)", margin: 0 }}>
            Document Readiness
          </h3>
          <p style={{ fontSize: 14, color: "var(--t3)", margin: "4px 0 0" }}>
            Upload documents to validate against requirements
          </p>
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: 14,
          background: validCount === readiness.length ? "rgba(109,184,154,0.15)" : "rgba(109,184,154,0.2)",
          color: validCount === readiness.length ? "var(--sage)" : "var(--sage)",
          padding: "3px 10px", borderRadius: 4,
        }}>
          {validCount}/{readiness.length} validated
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {readiness.map((req) => {
          const cfg = statusConfig[req.status] ?? statusConfig.not_uploaded;
          const isExpanded = expandedIdx === req.requirementIndex;
          const isUploading = uploadingIdx === req.requirementIndex;

          return (
            <div key={req.requirementIndex} style={{
              background: "rgba(0,0,0,0.02)",
              borderRadius: 10,
              border: `1px solid ${req.status === "valid" || req.status === "overridden" ? "rgba(109,184,154,0.2)" : "rgba(0,0,0,0.05)"}`,
              padding: "12px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Status indicator */}
                <span style={{
                  width: 22, height: 22, borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: cfg.bg, color: cfg.color,
                  fontSize: 14, fontWeight: 700, flexShrink: 0,
                  border: `1px solid ${cfg.color}33`,
                }}>{cfg.icon}</span>

                {/* Title + status */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {req.requirementTitle}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 13, color: cfg.color }}>{cfg.label}</span>
                    {req.filename && (
                      <span style={{ fontSize: 14, color: "var(--t4)" }}>
                        {req.filename}
                      </span>
                    )}
                  </div>
                </div>

                {/* Upload button */}
                <div style={{ flexShrink: 0 }}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.html,.txt"
                    style={{ display: "none" }}
                    ref={(el) => { fileInputRefs.current[req.requirementIndex] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(req.requirementIndex, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => fileInputRefs.current[req.requirementIndex]?.click()}
                    disabled={isUploading}
                    style={{
                      background: req.status === "not_uploaded" ? "var(--sage)" : "rgba(0,0,0,0.06)",
                      color: req.status === "not_uploaded" ? "#fff" : "var(--t2)",
                      border: "none", borderRadius: 6, padding: "6px 12px",
                      fontSize: 13, fontWeight: 500, cursor: isUploading ? "wait" : "pointer",
                      opacity: isUploading ? 0.5 : 1,
                    }}
                  >
                    {isUploading ? "Uploading..." : req.status === "not_uploaded" ? "Upload" : "Replace"}
                  </button>

                  {/* Expand button if there are details */}
                  {(req.fieldStatus.length > 0 || req.issues.length > 0) && (
                    <button
                      onClick={() => setExpandedIdx(isExpanded ? null : req.requirementIndex)}
                      style={{
                        background: "none", border: "none", color: "var(--t3)",
                        cursor: "pointer", padding: "6px 4px", fontSize: 14, marginLeft: 4,
                      }}
                    >
                      {isExpanded ? "▾" : "▸"}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  {/* Field status checklist */}
                  {req.fieldStatus.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--t4)", marginBottom: 6 }}>
                        Field Checklist
                      </div>
                      {req.fieldStatus.map((f, fi) => {
                        const statusIcon = f.status === "present" ? "✅" : f.status === "missing" ? "❌" : "⚠";
                        const sevColor = f.severity === "critical" ? "#ef4444" : f.severity === "warning" ? "#eab308" : "var(--t3)";
                        return (
                          <div key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, width: 18, flexShrink: 0 }}>{statusIcon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 14, color: f.status === "missing" ? sevColor : "var(--t1)" }}>
                                {f.expected || f.field}
                              </span>
                              <span style={{ fontSize: 14, color: "var(--t3)", marginLeft: 6 }}>
                                ({f.severity})
                              </span>
                              {f.status === "present" && f.found && f.found !== "Not found" && (
                                <span style={{ fontSize: 14, color: "var(--t3)", marginLeft: 6 }}>
                                  — {f.found.length > 60 ? f.found.slice(0, 60) + "..." : f.found}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Issues */}
                  {req.issues.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--t4)", marginBottom: 6 }}>
                        Issues
                      </div>
                      {req.issues.map((issue, ii) => (
                        <div key={ii} style={{
                          background: issue.severity === "critical" ? "rgba(239,68,68,0.08)" : issue.severity === "warning" ? "rgba(234,179,8,0.08)" : "rgba(0,0,0,0.02)",
                          borderRadius: 6, padding: "6px 10px", marginBottom: 4,
                          borderLeft: `3px solid ${issue.severity === "critical" ? "#ef4444" : issue.severity === "warning" ? "#eab308" : "rgba(0,0,0,0.1)"}`,
                        }}>
                          <div style={{ fontSize: 14, color: "var(--t1)" }}>{issue.explanation}</div>
                          {issue.found && (
                            <div style={{ fontSize: 14, color: "var(--t3)", marginTop: 2 }}>
                              Found: {issue.found}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Evidence snippets */}
                  {req.evidence.length > 0 && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--t4)", marginBottom: 6 }}>
                        Evidence
                      </div>
                      {req.evidence.map((ev, ei) => (
                        <div key={ei} style={{
                          background: "rgba(0,0,0,0.02)",
                          borderRadius: 6, padding: "6px 10px", marginBottom: 4,
                          borderLeft: "3px solid rgba(109,184,154,0.3)",
                        }}>
                          <div style={{ fontSize: 13, color: "var(--t2)", fontStyle: "italic" }}>
                            "{ev.quote}"
                          </div>
                          <div style={{ fontSize: 14, color: "var(--t3)", marginTop: 2 }}>
                            {ev.page !== null ? `Page ${ev.page}` : ""} {ev.field ? `— ${ev.field}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Validation summary */}
                  {req.verdict && (
                    <div style={{ marginTop: 8, fontSize: 13, color: "var(--t2)", fontStyle: "italic" }}>
                      Verdict: {req.verdict} (confidence: {req.confidence})
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComplianceResultDisplay({ result, freeLocked = false, isAuthenticated = false }: { result: ComplianceResult; freeLocked?: boolean; isAuthenticated?: boolean }) {
  const hasStopFlags = result.stopFlags && Object.keys(result.stopFlags).length > 0;
  const triggerCount = Object.values(result.triggers).filter(Boolean).length;

  const riskLevel = hasStopFlags ? "STOP" : triggerCount >= 3 ? "HIGH" : triggerCount >= 1 ? "MEDIUM" : "LOW";
  const riskColors: Record<string, string> = {
    STOP: "",
    HIGH: "",
    MEDIUM: "",
    LOW: "",
  };
  const riskInlineStyles: Record<string, React.CSSProperties> = {
    STOP: { background: "var(--rbg)", border: "1px solid var(--rbd)", color: "var(--red)" },
    HIGH: { background: "var(--rbg)", border: "1px solid var(--rbd)", color: "var(--red)" },
    MEDIUM: { background: "var(--abg)", border: "1px solid var(--abd)", color: "var(--amber)" },
    LOW: { background: "var(--gbg)", border: "1px solid var(--gbd)", color: "var(--green)" },
  };
  const riskLabels: Record<string, string> = {
    STOP: "Trade Restricted",
    HIGH: "High Risk",
    MEDIUM: "Moderate Risk",
    LOW: "Low Risk",
  };

  const [watchState, setWatchState] = useState<"idle" | "watching" | "limit">("idle");
  const [watchCount, setWatchCount] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    fetch("/api/alerts/subscriptions", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        const subs = data.subscriptions || [];
        setWatchCount(subs.length);
        const isWatching = subs.some((s: any) => s.commodityId === result.commodity.id && s.destIso2 === result.destination.iso2);
        if (isWatching) setWatchState("watching");
      })
      .catch(() => {});
  }, [result.commodity.id, result.destination.iso2]);

  const handleWatch = async () => {
    if (watchCount >= 3) {
      setShowLimitModal(true);
      return;
    }
    try {
      const res = await apiRequest("POST", "/api/alerts/subscribe", {
        commodityId: result.commodity.id,
        destIso2: result.destination.iso2,
      });
      const data = await res.json();
      if (data.count !== undefined) {
        setWatchCount(data.count);
        setWatchState("watching");
      }
    } catch (err: any) {
      if (err?.message?.includes("403")) {
        setShowLimitModal(true);
      }
    }
  };

  const allDocs = result.requirementsDetailed;
  const [docStatuses, setDocStatuses] = useState<Record<number, DocumentStatus>>(() => {
    const init: Record<number, DocumentStatus> = {};
    allDocs.forEach((_, i) => { init[i] = "PENDING"; });
    return init;
  });

  const handleStatusChange = useCallback((idx: number, status: DocumentStatus) => {
    setDocStatuses(prev => ({ ...prev, [idx]: status }));
  }, []);

  const importerIndices = allDocs.map((r, i) => ({ r, i })).filter(x => !x.r.isSupplierSide);
  const supplierIndices = allDocs.map((r, i) => ({ r, i })).filter(x => x.r.isSupplierSide);

  const importerReadyCount = importerIndices.filter(x => docStatuses[x.i] === "READY").length;
  const supplierReadyCount = supplierIndices.filter(x => docStatuses[x.i] === "READY").length;

  const buyerDocsRef = useRef<HTMLDivElement>(null);

  const dkCard: React.CSSProperties = {
    background: "rgba(109,184,154,0.06)",
    borderRadius: 14,
    border: "1px solid rgba(109,184,154,0.2)",
    padding: "20px 24px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }} data-testid="section-compliance-result">
      {/* ── Title: Pre-Shipment Report ── */}
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 22, color: "var(--t1)", margin: "0 0 6px" }}>Pre-Shipment Report</h2>
        <p style={{ fontSize: 13, color: "var(--t2)", margin: 0 }}>
          {"📦"} {result.commodity.name} › {result.origin.countryName} › {result.destination.countryName}
        </p>
      </div>

      {/* ── Risk Level Badge ── */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Badge className="text-base px-6 py-2 no-default-hover-elevate no-default-active-elevate" style={{ ...riskInlineStyles[riskLevel], fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" as const, borderRadius: 4 }} data-testid="badge-risk-level">
          {riskLabels[riskLevel]}
        </Badge>
      </div>

      {/* ── Two-Column Document Checklist ── */}
      <div style={{ display: "grid", gridTemplateColumns: importerIndices.length > 0 && supplierIndices.length > 0 ? "1fr 1fr" : "1fr", gap: 16 }}>
        {/* Your Side - Buyer */}
        {importerIndices.length > 0 && (
          <div style={dkCard} ref={buyerDocsRef}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 14, color: "var(--t1)" }}>
                Your Side - Buyer
              </span>
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 14,
                background: "rgba(109,184,154,0.2)", color: "var(--sage)",
                padding: "2px 8px", borderRadius: 4,
              }}>
                {importerIndices.length} docs
              </span>
              <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--t3)" }} data-testid="text-buyer-progress">
                {importerReadyCount}/{importerIndices.length} ready
              </span>
            </div>
            {importerIndices.map(({ r, i }) => {
              const st = docStatuses[i] || "PENDING";
              const dotColor = st === "READY" ? "var(--sage)" : st === "RISK_ACCEPTED" ? "#eab308" : "var(--t4)";
              return (
                <div key={i} style={{ marginBottom: 10 }} data-testid={`text-requirement-${i}`}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--t1)" }}>
                          {r.title}
                        </span>
                        <StatusDropdown status={st} onChange={(s) => handleStatusChange(i, s)} index={i} />
                      </div>
                      <span style={{ fontSize: 13, color: "var(--t3)", display: "block", marginTop: 1 }}>
                        {r.issuedBy}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Their Side - Supplier */}
        {supplierIndices.length > 0 && (
          <div style={dkCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 14, color: "var(--t1)" }}>
                Their Side - Supplier
              </span>
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 14,
                background: "rgba(109,184,154,0.2)", color: "var(--sage)",
                padding: "2px 8px", borderRadius: 4,
              }}>
                {supplierIndices.length} docs
              </span>
              <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--t3)" }} data-testid="text-supplier-progress">
                {supplierReadyCount}/{supplierIndices.length} ready
              </span>
            </div>
            {supplierIndices.map(({ r, i }) => {
              const st = docStatuses[i] || "PENDING";
              const dotColor = st === "READY" ? "var(--sage)" : st === "RISK_ACCEPTED" ? "#eab308" : "var(--t4)";
              return (
                <div key={i} style={{ marginBottom: 10 }} data-testid={`text-requirement-${i}`}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--t1)" }}>
                          {r.title}
                        </span>
                        <StatusDropdown status={st} onChange={(s) => handleStatusChange(i, s)} index={i} />
                      </div>
                      <span style={{ fontSize: 13, color: "var(--t3)", display: "block", marginTop: 1 }}>
                        {r.issuedBy}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Next Step → Check LC CTA ── */}
      <div style={{
        ...dkCard,
        background: "linear-gradient(135deg, rgba(109,184,154,0.1), rgba(109,184,154,0.06))",
        border: "1px solid rgba(109,184,154,0.25)",
        textAlign: "center",
        padding: "20px 32px",
      }}>
        <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 10, margin: "0 0 10px" }}>
          Documents look good? Check your Letter of Credit next.
        </p>
        <CheckLcButton result={result} locked={freeLocked} />
      </div>

      {/* ── Readiness Score + Duty Estimate (two-column) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Readiness Score */}
        <div style={dkCard}>
          {result.readinessScore ? (
            <ReadinessBanner
              score={result.readinessScore.score}
              verdict={result.readinessScore.verdict}
              summary={result.readinessScore.summary}
              factors={result.readinessScore.factors}
              primaryRiskFactor={result.readinessScore.factors.primary_risk_factor}
            />
          ) : (
            <p style={{ fontSize: 13, color: "var(--t3)" }}>Readiness score unavailable</p>
          )}
        </div>

        {/* Duty Estimate */}
        <div style={dkCard}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 12 }}>
            Duty Estimate
          </div>
          {Array.isArray(result.destination.preferenceSchemes) && (result.destination.preferenceSchemes as string[]).length > 0 && (
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em",
              background: "rgba(109,184,154,0.2)", color: "var(--sage)",
              padding: "3px 8px", borderRadius: 4, display: "inline-block", marginBottom: 12,
            }}>
              {(result.destination.preferenceSchemes as string[]).join(" · ")}
            </span>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: 13, color: "var(--t2)" }}>VAT (Import)</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{result.destination.vatRate}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: 13, color: "var(--t2)" }}>Tariff Source</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{result.destination.tariffSource}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: 13, color: "var(--t2)" }}>SPS Regime</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{result.destination.spsRegime || "Standard"}</span>
          </div>
          {result.destination.iso2 === "CH" && (
            <p style={{ fontSize: 13, color: "#eab308", margin: "0 0 8px", lineHeight: 1.5 }}>
              Swiss agricultural tariffs are often specific (CHF/kg). Verify at tares.admin.ch.
            </p>
          )}
          {/* Hash embedded at bottom of duty card */}
          <EvidenceHashInline result={result} />
        </div>
      </div>

      {/* ── Origin flag warning ── */}
      {result.originFlagged && (
        <div style={{
          ...dkCard,
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.25)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}>
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#d97706", margin: 0 }}>
              ⚠ Flagged Origin — {result.originFlagReason ?? "Sanctions / Elevated Risk"}
            </p>
            {result.originFlagDetails && (
              <p style={{ fontSize: 14, color: "#92400e", margin: "4px 0 0", lineHeight: 1.5 }}>
                {result.originFlagDetails}
              </p>
            )}
          </div>
        </div>
      )}

      {/* AGOA eligibility info */}
      {result.agoaEligible && (
        <div style={{
          background: "rgba(109,184,154,0.06)",
          border: "1px solid rgba(109,184,154,0.2)",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}>
          <Shield className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#16a34a", margin: 0 }}>
              AGOA Eligible — Preferential Tariff Access
            </p>
            <p style={{ fontSize: 14, color: "#166534", margin: "4px 0 0", lineHeight: 1.5 }}>
              This origin qualifies under the African Growth and Opportunity Act for duty-free or reduced-tariff access to the US market. Ensure AGOA Certificate of Origin is prepared.
            </p>
          </div>
        </div>
      )}

      {/* Demurrage Exposure Estimate */}
      {(() => {
        const estimate = estimateDemurrageRange(
          result.destination.iso2,
          result.readinessScore?.verdict || "AMBER",
        );
        if (!estimate) return (
          <div style={{ textAlign: "right", margin: "4px 0 8px" }}>
            <Link href="/demurrage" data-testid="link-demurrage-calculator">
              <span style={{ fontSize: 13, color: "var(--sage)", cursor: "pointer", fontWeight: 600 }}>
                Demurrage Calculator →
              </span>
            </Link>
          </div>
        );
        const verdictColor = result.readinessScore?.verdict === "RED" ? "#ef4444"
          : result.readinessScore?.verdict === "AMBER" ? "#d97706" : "var(--sage)";
        return (
          <div
            data-testid="demurrage-estimate-card"
            style={{
              ...dkCard,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18, marginTop: 1 }}>⚓</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", margin: 0 }}>
                Estimated Port Demurrage
              </p>
              <p style={{ fontSize: 14, color: "var(--t2)", margin: "4px 0 0", lineHeight: 1.6 }}>
                At <strong style={{ color: "var(--t1)" }}>{estimate.port.label}</strong>
                {estimate.allPorts.length > 1 && (
                  <span style={{ color: "var(--t3)", fontSize: 11 }}> (+ {estimate.allPorts.length - 1} more port{estimate.allPorts.length > 2 ? "s" : ""})</span>
                )}
                , if clearance is delayed by{" "}
                <span style={{ color: verdictColor, fontWeight: 600 }}>{estimate.delayLabel}</span>{" "}
                (based on your readiness score), a standard 20ft container could cost{" "}
                <strong style={{ color: "var(--t1)" }}>${estimate.minCost.toLocaleString()} – ${estimate.maxCost.toLocaleString()}</strong>.
              </p>
              <Link href="/demurrage">
                <span style={{ fontSize: 13, color: "var(--sage)", cursor: "pointer", fontWeight: 600, marginTop: 4, display: "inline-block" }}>
                  Open full calculator ({estimate.allPorts.length} port{estimate.allPorts.length !== 1 ? "s" : ""}) →
                </span>
              </Link>
            </div>
          </div>
        );
      })()}

      {result.triggers.eudr && ["EU", "GB", "CH"].includes(result.destination.iso2) && (
        <EudrAlertBlock lookupId={(result as any).lookupId} result={result} />
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, margin: "8px 0 4px" }}>
        <button
          onClick={watchState === "watching" ? undefined : handleWatch}
          disabled={watchState === "watching"}
          style={{
            background: "transparent",
            border: "none",
            cursor: watchState === "watching" ? "default" : "pointer",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: watchState === "watching" ? "var(--green)" : "var(--t2)",
            padding: "6px 12px",
            borderRadius: 6,
          }}
          data-testid="button-watch-corridor"
        >
          {watchState === "watching"
            ? `◉ Watching — ${watchCount}/3 corridors watched`
            : "◎ Watch this corridor"}
        </button>
        {watchState !== "watching" && (
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "var(--t3)" }}>
            Get notified when regulations change for {result.commodity.name} → {result.destination.iso2}
          </span>
        )}
      </div>

      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corridor watch limit reached</DialogTitle>
            <DialogDescription>
              You're watching 3 corridors (free limit). Upgrade to Pro to watch more.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowLimitModal(false)} data-testid="button-close-limit-modal">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <NextActionsPanel
        allDocs={allDocs}
        statuses={docStatuses}
        hasStop={!!hasStopFlags}
        buyerDocsRef={buyerDocsRef}
      />

      {hasStopFlags && (
        <div style={{ ...dkCard, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <AlertOctagon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
            <div>
              <p style={{ fontWeight: 600, color: "#ef4444", fontSize: 13, margin: "0 0 8px" }}>
                STOP FLAGS — Trade Restrictions Apply
              </p>
              {Object.entries(result.stopFlags!).map(([key, value]) => (
                <p key={key} style={{ fontSize: 13, color: "#ef4444", opacity: 0.8, margin: "0 0 4px" }}>
                  <span style={{ fontWeight: 600 }}>{key}:</span> {value as string}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={dkCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Leaf className="w-4 h-4" style={{ color: "var(--sage)" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Commodity</span>
          </div>
          <p style={{ fontWeight: 600, color: "var(--t1)", fontSize: 14, margin: "0 0 4px" }} data-testid="text-result-commodity">{result.commodity.name}</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em", color: "var(--t3)", textTransform: "uppercase" as const, margin: 0 }}>
            HS {result.commodity.hsCode} · {result.commodity.commodityType}
          </p>
        </div>

        <div style={dkCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Globe className="w-4 h-4" style={{ color: "var(--sage)" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Origin</span>
          </div>
          <p style={{ fontWeight: 600, color: "var(--t1)", fontSize: 14, margin: "0 0 4px" }} data-testid="text-result-origin">{result.origin.countryName}</p>
          <p style={{ fontSize: 14, color: "var(--t3)", margin: "0 0 4px" }}>
            {result.origin.customsAdmin}
          </p>
          {result.origin.framework && (
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              background: "rgba(109,184,154,0.2)", color: "var(--sage)",
              padding: "2px 8px", borderRadius: 4, display: "inline-block",
            }}>
              {result.origin.framework.name}
            </span>
          )}
        </div>

        <div style={dkCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <FileCheck className="w-4 h-4" style={{ color: "var(--sage)" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Destination</span>
          </div>
          <p style={{ fontWeight: 600, color: "var(--t1)", fontSize: 14, margin: "0 0 4px" }} data-testid="text-result-destination">{result.destination.countryName}</p>
          <p style={{ fontSize: 14, color: "var(--t3)", margin: 0 }}>
            VAT: {result.destination.vatRate}% · {result.destination.tariffSource}
          </p>
          {result.destination.iso2 === "CH" && (
            <div
              data-testid="swiss-tariff-note"
              style={{
                marginTop: 8,
                padding: "10px 12px",
                background: "rgba(234,179,8,0.08)",
                borderRadius: 8,
                fontSize: 14,
                color: "#eab308",
                lineHeight: 1.5,
              }}
            >
              Swiss agricultural tariffs are often specific (CHF/kg) not ad valorem.
              TARES API provides exact rates — estimate may be indicative for food commodities.
              Verify at <span style={{ fontWeight: 600 }}>tares.admin.ch</span> before quoting landed cost.
            </div>
          )}
        </div>
      </div>

      {triggerCount > 0 && (
        <div style={dkCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Shield className="w-4 h-4" style={{ color: "var(--sage)" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              Regulatory Triggers ({triggerCount})
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <TriggerBadge label="SPS" active={result.triggers.sps} />
            <TriggerBadge label="EUDR" active={result.triggers.eudr} />
            <TriggerBadge label="Kimberley" active={result.triggers.kimberley} />
            <TriggerBadge label="Conflict Minerals" active={result.triggers.conflict} />
            <TriggerBadge label="CBAM" active={result.triggers.cbam} />
            <TriggerBadge label="CSDDD" active={result.triggers.csddd} />
            <TriggerBadge label="IUU" active={result.triggers.iuu} />
            <TriggerBadge label="CITES" active={result.triggers.cites} />
            <TriggerBadge label="REACH" active={result.triggers.reach} />
            <TriggerBadge label="Section 232" active={result.triggers.section232} />
            <TriggerBadge label="FSIS" active={result.triggers.fsis} />
          </div>
        </div>
      )}

      {result.hazards.length > 0 &&
        !result.hazards.every((h) => h === "none_significant" || h === "none") && (
          <div style={dkCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <AlertTriangle className="w-4 h-4" style={{ color: "#eab308" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Known Hazards</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {result.hazards
                .filter((h) => h !== "none_significant" && h !== "none")
                .map((hazard) => (
                  <span
                    key={hazard}
                    style={{
                      fontSize: 13,
                      fontFamily: "'Inter', sans-serif",
                      background: "rgba(234,179,8,0.1)",
                      color: "#eab308",
                      padding: "3px 10px",
                      borderRadius: 4,
                      border: "1px solid rgba(234,179,8,0.2)",
                    }}
                    data-testid={`badge-hazard-${hazard}`}
                  >
                    {hazard.replace(/_/g, " ")}
                  </span>
                ))}
            </div>
          </div>
        )}

      {/* Old buyer/supplier doc sections removed — replaced by two-column layout above */}

      <div style={{ ...dkCard, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <Info className="w-5 h-5 shrink-0" style={{ color: "var(--sage)" }} />
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--t1)", margin: 0 }}>
          AfCFTA Eligibility:{" "}
          {result.afcftaEligible ? (
            <span style={{ color: "var(--sage)" }}>
              Both countries are AfCFTA members — preferential treatment may apply
            </span>
          ) : (
            <span style={{ color: "var(--t3)" }}>
              Not applicable — destination is not an AfCFTA member
            </span>
          )}
        </p>
      </div>

      {result.afcftaRoo && (
        <div style={dkCard} data-testid="card-afcfta-roo">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Scale className="w-4 h-4" style={{ color: "var(--sage)" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              AfCFTA Rules of Origin — HS {result.afcftaRoo.hsHeading}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <span
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 14,
                background: "rgba(109,184,154,0.2)", color: "var(--sage)",
                padding: "3px 10px", borderRadius: 4,
              }}
              data-testid="badge-roo-rule"
            >
              {ruleLabels[result.afcftaRoo.generalRule] || result.afcftaRoo.generalRule}
            </span>
            {result.afcftaRoo.minValueAddPct && (
              <span
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 14,
                  background: "rgba(0,0,0,0.05)", color: "var(--t2)",
                  padding: "3px 10px", borderRadius: 4, border: "1px solid rgba(0,0,0,0.07)",
                }}
                data-testid="badge-roo-value-add"
              >
                Min {result.afcftaRoo.minValueAddPct}% value addition
              </span>
            )}
          </div>
          {result.afcftaRoo.specificProcess && (
            <p style={{ fontSize: 13, color: "var(--t2)", margin: "0 0 8px", lineHeight: 1.5 }} data-testid="text-roo-specific-process">
              {result.afcftaRoo.specificProcess}
            </p>
          )}
          {result.afcftaRoo.notes && (
            <p style={{ fontSize: 13, color: "var(--t2)", margin: "0 0 8px", lineHeight: 1.5 }} data-testid="text-roo-notes">
              {String(result.afcftaRoo.notes)}
            </p>
          )}
          {result.afcftaRoo.alternativeCriteria != null && (
            <div style={{ fontSize: 13, marginBottom: 8 }} data-testid="text-roo-alt-criteria">
              <span style={{ fontWeight: 500, color: "var(--t1)" }}>Alternative: </span>
              <span style={{ color: "var(--t2)" }}>
                {(() => {
                  const criteria = result.afcftaRoo!.alternativeCriteria as Record<string, string>;
                  return Object.values(criteria).join("; ");
                })()}
              </span>
            </div>
          )}
          <p style={{ fontSize: 13, color: "var(--t4)", margin: 0 }}>
            Source: {String(result.afcftaRoo.sourceRef)}
          </p>
        </div>
      )}

      <div style={dkCard}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 14 }}>
          Actions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <TwinLogDownloadButton result={result} docStatuses={docStatuses} locked={freeLocked} />
          <CheckLcButton result={result} locked={freeLocked} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const csv = generateCustomsCSV(result);
              const filename = `TapTrao_CustomsDataPack_${result.commodity.hsCode}_${result.origin.iso2}_${result.destination.iso2}.csv`;
              downloadCSV(csv, filename);
            }}
            data-testid="button-download-customs-pack"
          >
            <Download className="w-4 h-4 mr-2" />
            Customs data pack (CSV)
          </Button>
          <SupplierBriefButton result={result} />
        </div>
        <p style={{ fontSize: 13, color: "var(--t3)", textAlign: "center", marginTop: 8, fontStyle: "italic" }}>Use directly or share with a broker if you have one</p>
      </div>

      <SupplierBriefSection result={result} />

      {/* ── Phase 4: Document Readiness ── */}
      {(result as any).lookupId && <DocumentReadinessSection lookupId={(result as any).lookupId} result={result} />}

      {/* Hash now embedded in Duty Estimate card above */}

      {/* Lead capture — show for unauthenticated users after seeing results */}
      {!isAuthenticated && <LeadCaptureCard result={result} />}

      {/* Auth-aware conversion banner */}
      {!isAuthenticated && (
        <div style={{
          ...dkCard,
          background: "linear-gradient(135deg, rgba(109,184,154,0.1), rgba(109,184,154,0.06))",
          border: "1px solid rgba(109,184,154,0.15)",
          textAlign: "center",
        }} data-testid="banner-signup-conversion">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", fontFamily: "'Clash Display', sans-serif", margin: "0 0 8px" }}>
            Activate Shield to manage this shipment
          </h3>
          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6, margin: "0 0 12px" }}>
            Create a free account to save your results, run LC document checks, track supplier documents, and manage your shipment from a single dashboard.
          </p>
          <Link href="/register">
            <Button
              size="sm"
              style={{ background: "var(--sage)", color: "#fff", borderRadius: 10, border: "none", padding: "10px 24px", fontSize: 13, fontWeight: 700 }}
              data-testid="button-conversion-register"
            >
              Create Account & Activate Shield →
            </Button>
          </Link>
        </div>
      )}

      {isAuthenticated && (result as any).lookupId && (
        <div style={{
          ...dkCard,
          background: "linear-gradient(135deg, rgba(109,184,154,0.1), rgba(109,184,154,0.06))",
          border: "1px solid rgba(109,184,154,0.2)",
          padding: "20px 24px",
          textAlign: "center",
        }} data-testid="banner-open-trade-dashboard">
          <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: "var(--sage)", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", margin: "0 0 6px", fontFamily: "'Clash Display', sans-serif" }}>
            Trade created — your shipment is live
          </p>
          <p style={{ fontSize: 14, color: "var(--t2)", margin: "0 0 16px", lineHeight: 1.5 }}>
            Manage documents, run LC checks, track suppliers, and monitor compliance — all from your trade dashboard.
          </p>
          <Link href={`/trades/${(result as any).lookupId}`}>
            <Button
              size="sm"
              style={{ background: "var(--sage)", color: "#fff", borderRadius: 10, padding: "10px 28px", fontSize: 14, fontWeight: 700 }}
              data-testid="button-open-trade-dashboard"
            >
              Open Trade Dashboard →
            </Button>
          </Link>
        </div>
      )}

      {freeLocked && (
        <div style={{
          ...dkCard,
          background: "rgba(234,179,8,0.06)",
          border: "1px solid rgba(234,179,8,0.15)",
        }} data-testid="banner-conversion">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", fontFamily: "'Clash Display', sans-serif", margin: "0 0 8px" }}>Want another corridor?</h3>
          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6, margin: "0 0 6px" }}>
            Activate TapTrao Shield for full shipment protection — LC checks, document tracking, and late-document alerts until docking.
          </p>
          <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--t3)", margin: "0 0 12px" }}>
            ~30% of LC submissions are rejected on first presentation.
          </p>
          <Link href="/pricing">
            <Button size="sm" data-testid="button-conversion-see-packs">
              View TapTrao Shield →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function SaveTemplatePrompt({
  result,
  commodityId,
  originIso2,
  destIso2,
  alreadySaved,
}: {
  result: ComplianceResult;
  commodityId: string;
  originIso2: string;
  destIso2: string;
  alreadySaved: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(`${result.commodity.name} ${originIso2} to ${destIso2}`);
  }, [result, originIso2, destIso2]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/templates", {
        name,
        commodityId,
        originIso2,
        destIso2,
        snapshotJson: result,
      });
      return res.json();
    },
    onSuccess: () => {
      setSaved(true);
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates/count"] });
    },
  });

  const dkCardLocal: React.CSSProperties = {
    background: "rgba(109,184,154,0.06)",
    borderRadius: 14,
    border: "1px solid rgba(109,184,154,0.2)",
    padding: "14px 20px",
  };

  if (alreadySaved || saved) {
    if (saved) {
      return (
        <div style={{ ...dkCardLocal, display: "flex", alignItems: "center", gap: 12 }}>
          <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "var(--sage)" }} />
          <p style={{ fontSize: 13, color: "var(--t1)", margin: 0 }}>Template saved. Find it in My Templates.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <div style={{ ...dkCardLocal, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, color: "var(--t2)", margin: 0 }}>
          Save this trade as a template for next time? It's free.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          data-testid="button-save-template-prompt"
        >
          <Bookmark className="w-3 h-3 mr-1" />
          Save as Template
        </Button>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name this template</DialogTitle>
            <DialogDescription>
              Give your template a name so you can find it later.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cashew CI to GB"
            className="text-gray-900"
            data-testid="input-template-name"
          />
          <div className="flex gap-3 justify-end flex-wrap">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!name.trim() || saveMutation.isPending}
              data-testid="button-confirm-save-template"
            >
              {saveMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Lookup() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const templateId = searchParams.get("templateId");
  const lookupId = searchParams.get("lookupId");

  const [commodityId, setCommodityId] = useState<string>("");
  const [originId, setOriginId] = useState<string>("");
  const [destinationId, setDestinationId] = useState<string>("");
  const [templateResult, setTemplateResult] = useState<ComplianceResult | null>(null);
  const [templateData, setTemplateData] = useState<Template | null>(null);
  const [templateStale, setTemplateStale] = useState<boolean | null>(null);
  const [lookupResult, setLookupResult] = useState<ComplianceResult | null>(null);

  const { data: commoditiesData, isLoading: loadingCommodities } = useQuery<
    Commodity[]
  >({
    queryKey: ["/api/commodities"],
  });

  const { data: originsData, isLoading: loadingOrigins } = useQuery<
    OriginCountry[]
  >({
    queryKey: ["/api/origins"],
  });

  const { data: destinationsData, isLoading: loadingDestinations } = useQuery<
    Destination[]
  >({
    queryKey: ["/api/destinations"],
  });

  const tokenQuery = useTokenBalance();
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!templateId || !commoditiesData || !originsData || !destinationsData) return;
    (async () => {
      try {
        const res = await fetch(`/api/templates/${templateId}`, { credentials: "include" });
        if (!res.ok) return;
        const tpl: Template = await res.json();
        setTemplateData(tpl);
        setTemplateResult(tpl.snapshotJson as ComplianceResult);

        const commodity = commoditiesData.find(c => c.id === tpl.commodityId);
        const origin = originsData.find(o => o.iso2 === tpl.originIso2);
        const dest = destinationsData.find(d => d.iso2 === tpl.destIso2);
        if (commodity) setCommodityId(commodity.id);
        if (origin) setOriginId(origin.id);
        if (dest) setDestinationId(dest.id);

        const staleRes = await fetch(`/api/templates/${templateId}/stale-check`, { credentials: "include" });
        if (staleRes.ok) {
          const staleData = await staleRes.json();
          setTemplateStale(staleData.stale);
        }
      } catch {}
    })();
  }, [templateId, commoditiesData, originsData, destinationsData]);

  // Load existing lookup by ID (from trades page)
  useEffect(() => {
    if (!lookupId || templateId || !commoditiesData || !originsData || !destinationsData) return;
    (async () => {
      try {
        const res = await fetch(`/api/lookups/${lookupId}`, { credentials: "include" });
        if (!res.ok) return;
        const lookup = await res.json();
        const result = lookup.resultJson as ComplianceResult;
        if (result) {
          // Attach lookupId so child components (LC check, TwinLog) can reference it
          (result as any).lookupId = lookup.id;
          (result as any).integrityHash = lookup.integrityHash;
          setLookupResult(result);

          // Pre-fill the selectors using resultJson data
          const commodity = commoditiesData.find(c => c.id === result.commodity?.id) || commoditiesData.find(c => c.name === lookup.commodityName);
          const origin = originsData.find(o => o.iso2 === result.origin?.iso2);
          const dest = destinationsData.find(d => d.iso2 === result.destination?.iso2);
          if (commodity) setCommodityId(commodity.id);
          if (origin) setOriginId(origin.id);
          if (dest) setDestinationId(dest.id);
        }
      } catch {}
    })();
  }, [lookupId, templateId, commoditiesData, originsData, destinationsData]);

  const complianceMutation = useMutation<ComplianceResult, Error, void>({
    mutationFn: async () => {
      const res = await fetch("/api/compliance-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ commodityId, originId, destinationId }),
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
      setTemplateResult(null);
      setTemplateData(null);
      setTemplateStale(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tokens/balance"] });
      // Track free check completion for attribution
      if (isFreeCheck) {
        trackEvent("free_check_completed", {
          commodity: commodityId,
          origin: originId,
          destination: destinationId,
        });
      }
    },
  });

  const refreshMutation = useMutation<{ result: ComplianceResult; regVersionHash: string }, Error, void>({
    mutationFn: async () => {
      if (!templateId) throw new Error("No template");
      const res = await fetch(`/api/templates/${templateId}/refresh`, {
        method: "POST",
        credentials: "include",
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
    onSuccess: (data) => {
      setTemplateResult(data.result);
      setTemplateStale(false);
      queryClient.invalidateQueries({ queryKey: ["/api/tokens/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
  });

  const corridorQuery = useQuery<{ exists: boolean; templateId: string | null }>({
    queryKey: ["/api/templates/check-corridor", commodityId, originsData?.find(o => o.id === originId)?.iso2, destinationsData?.find(d => d.id === destinationId)?.iso2],
    queryFn: async () => {
      const origin = originsData?.find(o => o.id === originId);
      const dest = destinationsData?.find(d => d.id === destinationId);
      if (!origin || !dest) return { exists: false, templateId: null };
      const res = await fetch(`/api/templates/check-corridor?commodityId=${commodityId}&originIso2=${origin.iso2}&destIso2=${dest.iso2}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!commodityId && !!originId && !!destinationId && !!originsData && !!destinationsData && !templateId,
  });

  const canSubmit = commodityId && originId && destinationId;
  const isLoading = loadingCommodities || loadingOrigins || loadingDestinations;
  const balance = tokenQuery.data?.balance ?? 0;
  const freeLookupUsed = tokenQuery.data?.freeLookupUsed ?? false;
  const isFreeCheck = !freeLookupUsed;
  const isTemplateMode = !!templateId && !!templateResult;
  const isLookupMode = !!lookupId && !!lookupResult;
  const displayResult = isTemplateMode ? templateResult : isLookupMode ? lookupResult : complianceMutation.data;

  return (
    <AppShell>
      <div className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-3">
            <Link href={isAuthenticated ? "/dashboard" : "/"}>
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--t2)",
                  padding: 0,
                  marginBottom: 4,
                }}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
              </button>
            </Link>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)" }}>TapTrao / Pre-shipment Compliance Check</p>
            <h1 style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 28, color: "var(--t1)" }} data-testid="text-lookup-title">
              Pre-shipment compliance check
            </h1>
            <p style={{ fontFamily: "var(--fb)", color: "var(--t2)", fontSize: 14 }}>
              See regulatory requirements, documents, and risk indicators before a shipment moves.
            </p>
          </div>

          {isTemplateMode && (
            <div
              style={{
                background: "var(--blue-dim)",
                borderRadius: 10,
                padding: "14px 18px",
              }}
              data-testid="text-template-current-banner"
            >
              <p style={{ fontSize: 13, color: "var(--blue)", fontWeight: 600, lineHeight: 1.5 }}>
                Loading from template: {templateData?.name} — check the fields below and click Check compliance risk.
              </p>
            </div>
          )}

          {isTemplateMode && templateStale === true && (
            <div
              style={{
                background: "var(--abg)",
                borderRadius: 10,
                padding: "14px 18px",
              }}
              data-testid="text-template-stale-banner"
            >
              <p style={{ fontSize: 13, color: "var(--amber)", fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>
                Showing saved results from {new Date(templateData!.createdAt).toLocaleDateString()}. Regulations may have changed.
              </p>
              <Button
                size="sm"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                data-testid="button-refresh-live"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {refreshMutation.isPending ? "Refreshing..." : "Refresh with live data"}
              </Button>
            </div>
          )}

          <Card style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(109,184,154,0.3), transparent)" }} />
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t1)" }} htmlFor="commodity">
                    What are you shipping?
                  </label>
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={commodityId}
                      onValueChange={setCommodityId}
                      disabled={isTemplateMode || isLookupMode}
                    >
                      <SelectTrigger data-testid="select-commodity">
                        <SelectValue placeholder="Select commodity..." />
                      </SelectTrigger>
                      <SelectContent>
                        {commoditiesData?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} (HS {c.hsCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t1)" }} htmlFor="origin">
                    Where are the goods coming from?
                  </label>
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select value={originId} onValueChange={setOriginId} disabled={isTemplateMode || isLookupMode}>
                      <SelectTrigger data-testid="select-origin">
                        <SelectValue placeholder="Select origin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {originsData?.map((o: any) => (
                          <SelectItem key={o.id} value={o.id}>
                            <CountryFlagBadge
                              iso2={o.iso2}
                              countryName={o.countryName}
                              status={o.status}
                              flagReason={o.flagReason}
                              flagDetails={o.flagDetails}
                            />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t1)" }} htmlFor="destination">
                    Where are the goods going?
                  </label>
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={destinationId}
                      onValueChange={setDestinationId}
                      disabled={isTemplateMode || isLookupMode}
                    >
                      <SelectTrigger data-testid="select-destination">
                        <SelectValue placeholder="Select destination..." />
                      </SelectTrigger>
                      <SelectContent>
                        {destinationsData?.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>
                            {iso2ToFlag(d.iso2)} {d.countryName} ({d.iso2})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {!isTemplateMode && (
                <Button
                  className="w-full rounded-full"
                  size="lg"
                  disabled={!canSubmit || complianceMutation.isPending}
                  onClick={() => complianceMutation.mutate()}
                  style={{ backgroundColor: 'var(--sage, #6b9080)', color: 'white' }}
                  data-testid="button-run-check"
                >
                  {complianceMutation.isPending ? (
                    <>
                      <Search className="w-4 h-4 mr-2 animate-spin" />
                      Checking compliance risk...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      {isFreeCheck ? "Check compliance risk — Free" : "Check compliance risk"}
                    </>
                  )}
                </Button>
              )}
              {!isTemplateMode && !isFreeCheck && (
                <p className="text-xs text-muted-foreground text-center mt-2" data-testid="text-token-balance-lookup">
                  Balance: {balance} tokens · <Link href="/pricing" className="underline">Top up</Link>
                </p>
              )}
            </CardContent>
          </Card>

          {complianceMutation.isError && complianceMutation.error.message !== "Insufficient tokens" && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <XCircle className="w-5 h-5 shrink-0" style={{ color: "#ef4444" }} />
              <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>
                {complianceMutation.error.message}
              </p>
            </div>
          )}

          {displayResult && (
            <>
              <StepNav steps={["Enter trade", "Pre-ship report", "LC check 🔒", "Supplier brief 🔒"]} currentIndex={1} completedUpTo={1} />
              <ComplianceResultDisplay result={displayResult} freeLocked={freeLookupUsed && balance === 0} isAuthenticated={isAuthenticated} />
              {!isTemplateMode && !isLookupMode && (
                <SaveTemplatePrompt
                  result={displayResult}
                  commodityId={commodityId}
                  originIso2={originsData?.find(o => o.id === originId)?.iso2 || ""}
                  destIso2={destinationsData?.find(d => d.id === destinationId)?.iso2 || ""}
                  alreadySaved={corridorQuery.data?.exists ?? false}
                />
              )}
            </>
          )}

          <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insufficient Tokens</DialogTitle>
                <DialogDescription>
                  You need 5 tokens to run a compliance lookup, but you have {balance}.
                  Purchase a token pack to continue.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center gap-2 my-2">
                <Badge variant="secondary" className="gap-1">
                  <Hexagon className="w-3 h-3" /> {balance} Shield {balance === 1 ? "check" : "checks"}
                </Badge>
              </div>
              <div className="flex gap-3 justify-end flex-wrap">
                <Button variant="outline" onClick={() => setShowTokenModal(false)} data-testid="button-modal-cancel">
                  Cancel
                </Button>
                <Button onClick={() => navigate("/pricing")} data-testid="button-modal-buy-tokens">
                  Activate TapTrao Shield
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppShell>
  );
}
