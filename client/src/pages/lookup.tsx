import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.08em",
            padding: "3px 8px",
            borderRadius: 4,
            background: status === "READY" ? "var(--gbg)" : status === "RISK_ACCEPTED" ? "var(--abg)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${status === "READY" ? "var(--gbd)" : status === "RISK_ACCEPTED" ? "var(--abd)" : "rgba(255,255,255,0.10)"}`,
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
  return "Required before shipment";
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
    <Card data-testid="section-next-actions">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>Next Actions</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground" data-testid="text-pending-count">
            {pendingCount} pending
          </span>
          <span className="flex items-center gap-0.5">
            {Array.from({ length: dotsTotal }).map((_, i) => (
              <Circle
                key={i}
                className="w-2.5 h-2.5"
                style={{ fill: i < dotsFilled ? "var(--amber)" : "none", color: i < dotsFilled ? "var(--amber)" : "var(--t3)" }}
              />
            ))}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {hasStop && (
          <div className="flex items-start gap-2 mb-3 p-2 rounded" style={{ background: "var(--rbg)" }}>
            <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--red)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--red)" }}>
              STOP flag active \u2014 resolve trade restrictions before proceeding
            </p>
          </div>
        )}

        {allComplete ? (
          <div className="text-center py-4 space-y-3" data-testid="section-all-complete">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: "var(--green)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--green)" }}>
                All actions complete for this trade.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              You can now download your compliance pack.
            </p>
            <Button variant="outline" size="sm" disabled data-testid="button-download-compliance-pack">
              <Download className="w-3 h-3 mr-1" /> Download Compliance Pack
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {showItems.map(({ doc, idx }) => (
              <div key={idx} className="flex items-start gap-2" data-testid={`next-action-${idx}`}>
                <Circle className="w-2.5 h-2.5 mt-1.5 shrink-0" style={{ fill: "var(--amber)", color: "var(--amber)" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{doc.title.length > 60 ? doc.title.substring(0, 60) + "..." : doc.title}</span>
                    <span className="text-xs text-muted-foreground">{ownerLabels[doc.owner]}</span>
                    <span className="text-xs text-muted-foreground">{dueByLabels[doc.due_by]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic mt-0.5">
                    {getActionHint(doc)}
                  </p>
                </div>
              </div>
            ))}
            {pendingCount > 5 && (
              <button
                className="text-sm text-primary flex items-center gap-1 hover:underline cursor-pointer"
                onClick={() => buyerDocsRef.current?.scrollIntoView({ behavior: "smooth" })}
                data-testid="button-see-all-pending"
              >
                See all {pendingCount} pending items <ArrowDown className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
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
    <Card>
      <CardContent className="p-4 space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowBrief(!showBrief)}
          data-testid="button-generate-supplier-brief"
        >
          <Mail className="w-4 h-4 mr-2" />
          {showBrief ? "Hide Supplier Brief" : `Generate Supplier Brief (${supplierDocs.length} documents)`}
        </Button>

        {showBrief && (
          <div className="space-y-3">
            <div className="flex gap-2">
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

            <div className="relative">
              <pre
                className="text-xs p-3 rounded-md whitespace-pre-wrap break-words font-mono max-h-80 overflow-y-auto"
                style={{ background: "var(--card2)", color: "var(--t2)" }}
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
      </CardContent>
    </Card>
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

function EvidenceHash({ result }: { result: ComplianceResult }) {
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
    <div style={{ background: "var(--card2)", borderRadius: 7, padding: "14px 18px" }}>
      <div className="flex items-start gap-3">
        <Hash className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--t3)" }} />
        <div className="space-y-1 min-w-0">
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t2)" }} data-testid="text-compliance-ref">
            Compliance check ref: <span style={{ color: "var(--blue)" }}>{shortRef}</span>
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--blue)", wordBreak: "break-all" }} data-testid="text-full-hash">
            SHA-256: {hash}
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)" }} data-testid="text-hash-timestamp">
            Generated: {new Date(timestamp).toLocaleString()}
          </p>
        </div>
      </div>
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
    GREEN: { bg: "rgba(34,197,94,.05)", border: "rgba(34,197,94,.2)", badgeBg: "var(--gbg)", badgeBorder: "var(--gbd)", badgeColor: "var(--green)", label: "LOW RISK" },
    AMBER: { bg: "rgba(245,158,11,.05)", border: "rgba(245,158,11,.2)", badgeBg: "var(--abg)", badgeBorder: "var(--abd)", badgeColor: "var(--amber)", label: "MODERATE RISK" },
    RED: { bg: "rgba(239,68,68,.05)", border: "rgba(239,68,68,.2)", badgeBg: "var(--rbg)", badgeBorder: "var(--rbd)", badgeColor: "var(--red)", label: "HIGH RISK" },
  };

  const v = verdictStyles[verdict];

  const barColors: Record<string, string> = {
    regulatory_complexity: "var(--blue)",
    hazard_exposure: "var(--amber)",
    document_volume: "var(--t3)",
    trade_restriction: "var(--red)",
  };

  const factorRows = [
    { key: "regulatory_complexity", label: "Regulatory complexity", penalty: factors.regulatory_complexity.penalty, max: factors.regulatory_complexity.max },
    { key: "hazard_exposure", label: "Hazard exposure", penalty: factors.hazard_exposure.penalty, max: factors.hazard_exposure.max },
    { key: "document_volume", label: "Document volume", penalty: factors.document_volume.penalty, max: factors.document_volume.max },
    { key: "trade_restriction", label: "Trade restriction", penalty: factors.trade_restriction.penalty, max: factors.trade_restriction.max },
  ];

  return (
    <div
      style={{
        borderRadius: 10,
        background: v.bg,
        padding: "22px 26px",
        marginBottom: 24,
      }}
      data-testid="section-readiness-score"
    >
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 900,
              fontSize: "clamp(48px, 6vw, 64px)",
              letterSpacing: -4,
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
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
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
                <span style={{ width: 120, fontSize: 11, color: "var(--t2)", textAlign: "right", flexShrink: 0 }}>
                  {f.label}
                </span>
                <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, position: "relative" }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 2,
                      background: barColors[f.key] || "var(--t3)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: isPrimary ? 9 : 10,
                    width: 48,
                    textAlign: "right",
                    color: isPrimary ? "var(--amber)" : "var(--t3)",
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
          <p>Included in trade pack — from $24.99</p>
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
              Check LC for this Trade
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-center">
          <p>Included in trade pack — from $24.99</p>
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
        Check LC for this Trade
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
      Supplier Brief
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
          <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
            Swiss Due Diligence Act — Prepare EUDR-Equivalent Documentation
          </div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
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
        <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
          {eudrComplete ? "EUDR Due Diligence Complete" : "EUDR Due Diligence Required"}
        </div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 }}>
          {eudrComplete
            ? "Your EUDR due diligence statement has been completed for this trade."
            : "This commodity requires an EU Deforestation Regulation (EUDR) due diligence statement before import."}
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
          Start EUDR Workflow →
        </button>
      )}
    </div>
  );
}

function ComplianceResultDisplay({ result, freeLocked = false }: { result: ComplianceResult; freeLocked?: boolean }) {
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

  return (
    <div className="space-y-4 mt-6" data-testid="section-compliance-result">
      <div className="flex justify-center">
        <Badge className="text-base px-6 py-2 no-default-hover-elevate no-default-active-elevate" style={{ ...riskInlineStyles[riskLevel], fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" as const, borderRadius: 4 }} data-testid="badge-risk-level">
          {riskLabels[riskLevel]}
        </Badge>
      </div>

      {result.readinessScore && (
        <ReadinessBanner
          score={result.readinessScore.score}
          verdict={result.readinessScore.verdict}
          summary={result.readinessScore.summary}
          factors={result.readinessScore.factors}
          primaryRiskFactor={result.readinessScore.factors.primary_risk_factor}
        />
      )}

      <div style={{ textAlign: "right", margin: "4px 0 8px" }}>
        <Link href="/demurrage" data-testid="link-demurrage-calculator">
          <span style={{ fontSize: 11, color: "var(--blue)", cursor: "pointer", fontWeight: 600 }}>
            Demurrage Calculator →
          </span>
        </Link>
      </div>

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
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
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
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)" }}>
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

      {freeLocked && (
        <Card style={{ background: "var(--abg)" }} data-testid="banner-conversion">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-base font-heading">Ready to ship this trade?</h3>
            <p className="text-sm text-muted-foreground">
              Your free lookup shows the full compliance picture.
              To get your TwinLog Trail and run your LC check, upgrade to a trade pack.
            </p>
            <p className="text-sm italic text-muted-foreground">
              "Banks reject approximately 30% of LC presentations on first submission.
              One rejection costs more than a full year of trade packs."
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    const res = await apiRequest("POST", "/api/tokens/checkout", { pack: "single_trade" });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  } catch {
                    window.location.href = "/pricing";
                  }
                }}
                data-testid="button-conversion-buy-single"
              >
                Buy Single Trade — $24.99
              </Button>
              <Link href="/pricing">
                <Button variant="outline" size="sm" data-testid="button-conversion-see-packs">
                  See all packs →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <NextActionsPanel
        allDocs={allDocs}
        statuses={docStatuses}
        hasStop={!!hasStopFlags}
        buyerDocsRef={buyerDocsRef}
      />

      {hasStopFlags && (
        <Card style={{ background: "var(--rbg)" }}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--red)" }} />
              <div className="space-y-2">
                <p style={{ fontWeight: 600, color: "var(--red)", fontSize: 13 }}>
                  STOP FLAGS — Trade Restrictions Apply
                </p>
                {Object.entries(result.stopFlags!).map(([key, value]) => (
                  <p key={key} style={{ fontSize: 13, color: "var(--red)", opacity: 0.8 }}>
                    <span className="font-medium">{key}:</span> {value as string}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Leaf className="w-4 h-4" style={{ color: "var(--t3)" }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>Commodity</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <p style={{ fontWeight: 600, color: "var(--t1)" }} data-testid="text-result-commodity">{result.commodity.name}</p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: "var(--t3)", textTransform: "uppercase" as const }}>
              HS {result.commodity.hsCode} &middot;{" "}
              {result.commodity.commodityType}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Globe className="w-4 h-4" style={{ color: "var(--t3)" }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>Origin</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <p style={{ fontWeight: 600, color: "var(--t1)" }} data-testid="text-result-origin">{result.origin.countryName}</p>
            <p style={{ fontSize: 12, color: "var(--t3)" }}>
              {result.origin.customsAdmin}
            </p>
            {result.origin.framework && (
              <Badge variant="secondary" className="text-xs">
                {result.origin.framework.name}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <FileCheck className="w-4 h-4" style={{ color: "var(--t3)" }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>Destination</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <p style={{ fontWeight: 600, color: "var(--t1)" }} data-testid="text-result-destination">{result.destination.countryName}</p>
            <p style={{ fontSize: 12, color: "var(--t3)" }}>
              VAT: {result.destination.vatRate}% &middot;{" "}
              {result.destination.tariffSource}
            </p>
            {result.destination.iso2 === "CH" && (
              <div
                data-testid="swiss-tariff-note"
                style={{
                  marginTop: 8,
                  padding: "10px 12px",
                  background: "var(--abg, rgba(245,158,11,0.08))",
                  borderRadius: ".5rem",
                  fontSize: 12,
                  color: "var(--amber)",
                  lineHeight: 1.5,
                }}
              >
                Swiss agricultural tariffs are often specific (CHF/kg) not ad valorem.
                TARES API provides exact rates — estimate may be indicative for food commodities.
                Verify at <span style={{ fontWeight: 600 }}>tares.admin.ch</span> before quoting landed cost.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {triggerCount > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Shield className="w-4 h-4" style={{ color: "var(--t3)" }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>
              Regulatory Triggers ({triggerCount})
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <TriggerBadge label="SPS" active={result.triggers.sps} />
              <TriggerBadge label="EUDR" active={result.triggers.eudr} />
              <TriggerBadge label="Kimberley" active={result.triggers.kimberley} />
              <TriggerBadge label="Conflict Minerals" active={result.triggers.conflict} />
              <TriggerBadge label="CBAM" active={result.triggers.cbam} />
              <TriggerBadge label="CSDDD" active={result.triggers.csddd} />
              <TriggerBadge label="IUU" active={result.triggers.iuu} />
              <TriggerBadge label="CITES" active={result.triggers.cites} />
            </div>
          </CardContent>
        </Card>
      )}

      {result.hazards.length > 0 &&
        !result.hazards.every((h) => h === "none_significant" || h === "none") && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <AlertTriangle className="w-4 h-4" style={{ color: "var(--t3)" }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>Known Hazards</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {result.hazards
                  .filter((h) => h !== "none_significant" && h !== "none")
                  .map((hazard) => (
                    <Badge
                      key={hazard}
                      variant="outline"
                      className="text-xs"
                      data-testid={`badge-hazard-${hazard}`}
                    >
                      {hazard.replace(/_/g, " ")}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

      {importerIndices.length > 0 && (
        <div ref={buyerDocsRef}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--amber)" }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>
                  YOUR SIDE (Buyer Documents)
                </p>
              </div>
              <span className="text-xs text-muted-foreground" data-testid="text-buyer-progress">
                {importerReadyCount} of {importerIndices.length} ready
              </span>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-3">
                Click any document to expand details. Use the status badge to track progress.
              </p>
              <ul className="space-y-2">
                {importerIndices.map(({ r, i }) => (
                  <InteractiveRequirement
                    key={i}
                    req={r}
                    index={i}
                    status={docStatuses[i] || "PENDING"}
                    onStatusChange={(s) => handleStatusChange(i, s)}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {supplierIndices.length > 0 && (
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--green)" }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>
                  THEIR SIDE (Supplier Documents)
                </p>
              </div>
              <span className="text-xs text-muted-foreground" data-testid="text-supplier-progress">
                {supplierReadyCount} of {supplierIndices.length} ready
              </span>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-3">
                Click any document to expand details. Use the status badge to track progress.
              </p>
              <ul className="space-y-2">
                {supplierIndices.map(({ r, i }) => (
                  <InteractiveRequirement
                    key={i}
                    req={r}
                    index={i}
                    status={docStatuses[i] || "PENDING"}
                    onStatusChange={(s) => handleStatusChange(i, s)}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 shrink-0" style={{ color: "var(--t3)" }} />
            <div>
              <p className="text-sm font-medium">
                AfCFTA Eligibility:{" "}
                {result.afcftaEligible ? (
                  <span style={{ color: "var(--green)" }}>
                    Both countries are AfCFTA members — preferential treatment may apply
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Not applicable — destination is not an AfCFTA member
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {result.afcftaRoo && (
        <Card data-testid="card-afcfta-roo">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Scale className="w-4 h-4" style={{ color: "var(--t3)" }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", letterSpacing: "0.03em", textTransform: "uppercase" as const }}>
              AfCFTA Rules of Origin — HS {result.afcftaRoo.hsHeading}
            </p>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" data-testid="badge-roo-rule">
                {ruleLabels[result.afcftaRoo.generalRule] || result.afcftaRoo.generalRule}
              </Badge>
              {result.afcftaRoo.minValueAddPct && (
                <Badge variant="outline" data-testid="badge-roo-value-add">
                  Min {result.afcftaRoo.minValueAddPct}% value addition
                </Badge>
              )}
            </div>
            {result.afcftaRoo.specificProcess && (
              <p className="text-sm text-muted-foreground" data-testid="text-roo-specific-process">
                {result.afcftaRoo.specificProcess}
              </p>
            )}
            {result.afcftaRoo.notes && (
              <p className="text-sm text-muted-foreground" data-testid="text-roo-notes">
                {String(result.afcftaRoo.notes)}
              </p>
            )}
            {result.afcftaRoo.alternativeCriteria != null && (
              <div className="text-sm" data-testid="text-roo-alt-criteria">
                <span className="font-medium">Alternative: </span>
                <span className="text-muted-foreground">
                  {(() => {
                    const criteria = result.afcftaRoo!.alternativeCriteria as Record<string, string>;
                    return Object.values(criteria).join("; ");
                  })()}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Source: {String(result.afcftaRoo.sourceRef)}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TwinLogDownloadButton result={result} docStatuses={docStatuses} locked={freeLocked} />
            <CheckLcButton result={result} locked={freeLocked} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              Customs Data Pack
            </Button>
            <SupplierBriefButton result={result} />
          </div>
        </CardContent>
      </Card>

      <SupplierBriefSection result={result} />

      <EvidenceHash result={result} />
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

  if (alreadySaved || saved) {
    if (saved) {
      return (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "var(--green)" }} />
            <p className="text-sm">Template saved. Find it in My Templates.</p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return (
    <>
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
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
        </CardContent>
      </Card>

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

  const [commodityId, setCommodityId] = useState<string>("");
  const [originId, setOriginId] = useState<string>("");
  const [destinationId, setDestinationId] = useState<string>("");
  const [templateResult, setTemplateResult] = useState<ComplianceResult | null>(null);
  const [templateData, setTemplateData] = useState<Template | null>(null);
  const [templateStale, setTemplateStale] = useState<boolean | null>(null);

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
  const displayResult = isTemplateMode ? templateResult : complianceMutation.data;

  return (
    <AppShell>
      <div className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-3">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)" }}>TapTrao / Compliance Lookup</p>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 28, color: "var(--t1)" }} data-testid="text-lookup-title">
              Compliance Lookup
            </h1>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--t2)", fontSize: 14 }}>
              Enter your trade details to get the complete import requirements for your corridor.
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
                Loading from template: {templateData?.name} — check the fields below and click Run Compliance Check.
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
                {refreshMutation.isPending ? "Refreshing..." : "Refresh with live data — 1 credit"}
              </Button>
            </div>
          )}

          <Card style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(66,126,255,0.3), transparent)" }} />
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)" }} htmlFor="commodity">
                    Commodity
                  </label>
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={commodityId}
                      onValueChange={setCommodityId}
                      disabled={isTemplateMode}
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
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)" }} htmlFor="origin">
                    Origin Country
                  </label>
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select value={originId} onValueChange={setOriginId} disabled={isTemplateMode}>
                      <SelectTrigger data-testid="select-origin">
                        <SelectValue placeholder="Select origin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {originsData?.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.countryName} ({o.iso2})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)" }} htmlFor="destination">
                    Destination
                  </label>
                  {isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={destinationId}
                      onValueChange={setDestinationId}
                      disabled={isTemplateMode}
                    >
                      <SelectTrigger data-testid="select-destination">
                        <SelectValue placeholder="Select destination..." />
                      </SelectTrigger>
                      <SelectContent>
                        {destinationsData?.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.countryName} ({d.iso2})
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
                  style={{ backgroundColor: 'var(--blue, #427EFF)', color: 'white' }}
                  data-testid="button-run-check"
                >
                  {complianceMutation.isPending ? (
                    <>
                      <Search className="w-4 h-4 mr-2 animate-spin" />
                      Running Compliance Check...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      {isFreeCheck ? "Run Compliance Check \u2014 Free" : "Run Compliance Check \u2014 $4.99"}
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
            <Card style={{ background: "var(--rbg)" }}>
              <CardContent className="p-4 flex items-center gap-3">
                <XCircle className="w-5 h-5 shrink-0" style={{ color: "var(--red)" }} />
                <p style={{ fontSize: 13, color: "var(--red)" }}>
                  {complianceMutation.error.message}
                </p>
              </CardContent>
            </Card>
          )}

          {displayResult && (
            <>
              <StepNav steps={["Lookup", "LC Check", "TwinLog Trail", "Archive"]} currentIndex={0} completedUpTo={-1} />
              <ComplianceResultDisplay result={displayResult} freeLocked={freeLookupUsed && balance === 0} />
              {!isTemplateMode && (
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
                  <Hexagon className="w-3 h-3" /> {balance} tokens
                </Badge>
              </div>
              <div className="flex gap-3 justify-end flex-wrap">
                <Button variant="outline" onClick={() => setShowTokenModal(false)} data-testid="button-modal-cancel">
                  Cancel
                </Button>
                <Button onClick={() => navigate("/pricing")} data-testid="button-modal-buy-tokens">
                  Buy Tokens
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppShell>
  );
}
