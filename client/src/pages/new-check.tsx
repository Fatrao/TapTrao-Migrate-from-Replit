/**
 * NewCheck — Authenticated compliance check flow.
 *
 * This is the in-app equivalent of the public /lookup page.
 * Authenticated users create trades here at /new-check.
 * Shows: form → stepper → full pre-shipment report with doc boxes,
 * readiness score, duty estimate, demurrage, actions, and trade-created banner.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { estimateDemurrageRange } from "@/lib/demurrage-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppShell } from "@/components/AppShell";
import { StepNav } from "@/components/StepNav";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import CountryFlagBadge, { iso2ToFlag } from "@/components/CountryFlagBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search, AlertTriangle, Shield, FileCheck, Leaf, AlertOctagon,
  CheckCircle2, XCircle, ChevronDown, Info, Scale, Download,
  Copy, Check, Hash, Hexagon, Bookmark, ArrowRight, Lock, Mail, MessageCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTokenBalance } from "@/hooks/use-tokens";
import { usePageTitle } from "@/hooks/use-page-title";
import { translateCommodity } from "@/lib/commodity-i18n";
import type {
  Commodity, OriginCountry, Destination, ComplianceResult,
  ReadinessFactors, RequirementDetail, DocumentStatus,
} from "@shared/schema";

/* ─── Helpers ─── */

async function computeSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateCustomsCSV(result: ComplianceResult, t: (k: string, o?: Record<string, string>) => string, lang: string): string {
  const rows: string[][] = [];
  rows.push([t("csv.field"), t("csv.value")]);
  rows.push([t("csv.commodity"), translateCommodity(result.commodity.name, lang)]);
  rows.push([t("csv.hsCode"), result.commodity.hsCode]);
  rows.push([t("csv.commodityType"), result.commodity.commodityType]);
  rows.push([t("csv.originCountry"), result.origin.countryName]);
  rows.push([t("csv.originISO"), result.origin.iso2]);
  rows.push([t("csv.destinationCountry"), result.destination.countryName]);
  rows.push([t("csv.destinationISO"), result.destination.iso2]);
  rows.push([t("csv.tariffSource"), result.destination.tariffSource]);
  rows.push([t("csv.vatGstRate"), String(result.destination.vatRate)]);
  rows.push([t("csv.spsRegime"), result.destination.spsRegime]);
  rows.push([t("csv.securityFiling"), result.destination.securityFiling]);
  rows.push([t("csv.afcftaEligible"), result.afcftaEligible ? t("csv.yes") : t("csv.no")]);
  rows.push([t("csv.chedReference"), "___________________"]);
  rows.push([]);
  rows.push([t("csv.regulatoryTriggers")]);
  Object.entries(result.triggers).forEach(([key, val]) => { if (val) rows.push([t("csv.trigger"), key.toUpperCase()]); });
  rows.push([]);
  rows.push([t("csv.documentCodeHeader"), t("csv.documentTitle"), t("csv.issuedByHeader"), t("csv.supplierSide")]);
  result.requirementsDetailed.forEach(r => {
    rows.push([r.documentCode || "—", r.title, r.issuedBy, r.isSupplierSide ? t("csv.yes") : t("csv.no")]);
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

/* ─── Small sub-components ─── */

function StatusDropdown({ status, onChange, index }: { status: DocumentStatus; onChange: (s: DocumentStatus) => void; index: number }) {
  const { t: tc } = useTranslation("common");
  const labels: Record<DocumentStatus, string> = { PENDING: tc("status.pending"), READY: tc("status.ready"), RISK_ACCEPTED: tc("status.riskAccepted") };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1 shrink-0 cursor-pointer"
          style={{
            fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em",
            padding: "3px 8px", borderRadius: 4,
            background: status === "READY" ? "var(--gbg)" : status === "RISK_ACCEPTED" ? "var(--abg)" : "rgba(0,0,0,0.05)",
            border: `1px solid ${status === "READY" ? "var(--gbd)" : status === "RISK_ACCEPTED" ? "var(--abd)" : "rgba(0,0,0,0.07)"}`,
            color: status === "READY" ? "var(--green)" : status === "RISK_ACCEPTED" ? "var(--amber)" : "var(--t2)",
          }}
          data-testid={`button-status-${index}`}
        >
          {labels[status]} <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(["PENDING", "READY", "RISK_ACCEPTED"] as DocumentStatus[]).map(s => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)}>{labels[s]}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EvidenceHashInline({ result }: { result: ComplianceResult }) {
  const [hash, setHash] = useState<string | null>(null);
  const [timestamp] = useState(() => new Date().toISOString());
  useEffect(() => {
    const obj = { commodity: result.commodity.id, origin: result.origin.id, destination: result.destination.id, triggers: result.triggers, requirements: result.requirements, afcftaEligible: result.afcftaEligible, timestamp };
    computeSHA256(JSON.stringify(obj)).then(setHash);
  }, [result, timestamp]);
  if (!hash) return null;
  const shortRef = `TT-${new Date().getFullYear()}-${hash.substring(0, 6).toUpperCase()}`;
  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "rgba(109,184,154,0.8)" }}>{shortRef}</p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "var(--t4)", wordBreak: "break-all", marginTop: 2 }}>sha256:{hash}</p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "var(--t4)", marginTop: 2 }}>{new Date(timestamp).toLocaleString()}</p>
    </div>
  );
}

function ReadinessBanner({ score, verdict, summary, factors, primaryRiskFactor }: {
  score: number; verdict: "GREEN" | "AMBER" | "RED"; summary: string; factors: ReadinessFactors; primaryRiskFactor: string;
}) {
  const { t } = useTranslation("lookup");
  const v = {
    GREEN: { bg: "rgba(109,184,154,0.2)", bd: "rgba(109,184,154,0.25)", color: "var(--sage)", label: t("readiness.lowRisk") },
    AMBER: { bg: "rgba(234,179,8,0.12)", bd: "rgba(234,179,8,0.25)", color: "#eab308", label: t("readiness.attentionNeeded") },
    RED: { bg: "rgba(239,68,68,0.12)", bd: "rgba(239,68,68,0.25)", color: "#ef4444", label: t("readiness.highRiskAction") },
  }[verdict];
  const bars: Record<string, string> = { regulatory_complexity: "#60a5fa", hazard_exposure: "#eab308", document_volume: "var(--t4)", trade_restriction: "#ef4444" };
  const rows = [
    { key: "regulatory_complexity", label: t("readiness.regulatoryRequirements"), ...factors.regulatory_complexity },
    { key: "hazard_exposure", label: t("readiness.productControls"), ...factors.hazard_exposure },
    { key: "document_volume", label: t("readiness.documentVolume"), ...factors.document_volume },
    { key: "trade_restriction", label: t("readiness.tradeRestrictions"), ...factors.trade_restriction },
  ];
  return (
    <div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 12 }}>{t("readiness.title")}</div>
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: "clamp(48px,6vw,64px)", color: "var(--t1)", lineHeight: 1 }}>{score}</div>
          <span style={{ display: "inline-block", fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, padding: "3px 10px", borderRadius: 4, background: v.bg, border: `1px solid ${v.bd}`, color: v.color, width: "fit-content" }}>{v.label}</span>
          <p style={{ fontSize: 15, color: "var(--t2)", lineHeight: 1.65, marginTop: 6, maxWidth: 260 }}>{summary}</p>
        </div>
        <div style={{ flex: 1, paddingLeft: 28 }}>
          {rows.map(f => {
            const pct = f.max > 0 ? (f.penalty / f.max) * 100 : 0;
            const isPrimary = primaryRiskFactor === f.key && f.penalty > 10;
            return (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 120, fontSize: 15, color: "var(--t2)", textAlign: "right", flexShrink: 0 }}>{f.label}</span>
                <div style={{ flex: 1, height: 3, background: "rgba(0,0,0,0.07)", borderRadius: 2, position: "relative" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: bars[f.key] || "var(--t4)" }} />
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: isPrimary ? 9 : 10, width: 48, textAlign: "right", color: isPrimary ? "#eab308" : "var(--t3)", flexShrink: 0 }}>
                  {isPrimary ? `▲ ${t("readiness.primary")}` : `${f.penalty}/${f.max}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Results Display ─── */

function TradeResultDisplay({ result }: { result: ComplianceResult }) {
  const { t, i18n } = useTranslation("lookup");
  const lang = i18n.language;
  const { t: tc } = useTranslation("common");

  const hasStopFlags = result.stopFlags && Object.keys(result.stopFlags).length > 0;
  const triggerCount = Object.values(result.triggers).filter(Boolean).length;
  const riskLevel = hasStopFlags ? "STOP" : triggerCount >= 3 ? "HIGH" : triggerCount >= 1 ? "MEDIUM" : "LOW";
  const riskStyles: Record<string, React.CSSProperties> = {
    STOP: { background: "var(--rbg)", border: "1px solid var(--rbd)", color: "var(--red)" },
    HIGH: { background: "var(--rbg)", border: "1px solid var(--rbd)", color: "var(--red)" },
    MEDIUM: { background: "var(--abg)", border: "1px solid var(--abd)", color: "var(--amber)" },
    LOW: { background: "var(--gbg)", border: "1px solid var(--gbd)", color: "var(--green)" },
  };
  const riskLabels: Record<string, string> = { STOP: t("risk.tradeRestricted"), HIGH: t("risk.highRisk"), MEDIUM: t("risk.moderateRisk"), LOW: t("risk.lowRisk") };

  const allDocs = result.requirementsDetailed;
  const [docStatuses, setDocStatuses] = useState<Record<number, DocumentStatus>>(() => {
    const init: Record<number, DocumentStatus> = {};
    allDocs.forEach((_, i) => { init[i] = "PENDING"; });
    return init;
  });
  const handleStatusChange = useCallback((idx: number, status: DocumentStatus) => {
    setDocStatuses(prev => ({ ...prev, [idx]: status }));
  }, []);

  const importerDocs = allDocs.map((r, i) => ({ r, i })).filter(x => !x.r.isSupplierSide);
  const supplierDocs = allDocs.map((r, i) => ({ r, i })).filter(x => x.r.isSupplierSide);
  const importerReady = importerDocs.filter(x => docStatuses[x.i] === "READY").length;
  const supplierReady = supplierDocs.filter(x => docStatuses[x.i] === "READY").length;

  const dkCard: React.CSSProperties = {
    background: "rgba(109,184,154,0.06)", borderRadius: 14,
    border: "1px solid rgba(109,184,154,0.2)", padding: "20px 24px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }} data-testid="section-compliance-result">

      {/* Report header */}
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 22, color: "var(--t1)", margin: "0 0 6px" }}>{t("result.preShipmentReport")}</h2>
        <p style={{ fontSize: 15, color: "var(--t2)", margin: "0 0 12px" }}>
          {"📦"} {translateCommodity(result.commodity.name, lang)} › {result.origin.countryName} › {result.destination.countryName}
        </p>
        <Badge className="text-base px-6 py-2 no-default-hover-elevate no-default-active-elevate" style={{ ...riskStyles[riskLevel], fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: 4 }} data-testid="badge-risk-level">
          {riskLabels[riskLevel]}
        </Badge>
      </div>

      {/* Buyer / Supplier doc boxes */}
      <div className="lookup-docs-grid" style={{ display: "grid", gridTemplateColumns: importerDocs.length > 0 && supplierDocs.length > 0 ? "1fr 1fr" : "1fr", gap: 16 }}>
        {importerDocs.length > 0 && (
          <div style={dkCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 15, color: "var(--t1)" }}>{t("docs.yourSideBuyer")}</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, background: "rgba(109,184,154,0.2)", color: "var(--sage)", padding: "2px 8px", borderRadius: 4 }}>{t("docs.docsCount", { count: importerDocs.length })}</span>
              <span style={{ marginLeft: "auto", fontSize: 15, color: "var(--t3)" }} data-testid="text-buyer-progress">{t("docs.readyCount", { ready: importerReady, total: importerDocs.length })}</span>
            </div>
            {importerDocs.map(({ r, i }) => {
              const st = docStatuses[i] || "PENDING";
              const dotColor = st === "READY" ? "var(--sage)" : st === "RISK_ACCEPTED" ? "#eab308" : "var(--t4)";
              return (
                <div key={i} style={{ marginBottom: 10 }} data-testid={`text-requirement-${i}`}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--t1)" }}>{r.title}</span>
                        <StatusDropdown status={st} onChange={s => handleStatusChange(i, s)} index={i} />
                      </div>
                      <span style={{ fontSize: 15, color: "var(--t3)", display: "block", marginTop: 1 }}>{r.issuedBy}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {supplierDocs.length > 0 && (
          <div style={dkCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 15, color: "var(--t1)" }}>{t("docs.theirSideSupplier")}</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, background: "rgba(109,184,154,0.2)", color: "var(--sage)", padding: "2px 8px", borderRadius: 4 }}>{t("docs.docsCount", { count: supplierDocs.length })}</span>
              <span style={{ marginLeft: "auto", fontSize: 15, color: "var(--t3)" }} data-testid="text-supplier-progress">{t("docs.readyCount", { ready: supplierReady, total: supplierDocs.length })}</span>
            </div>
            {supplierDocs.map(({ r, i }) => {
              const st = docStatuses[i] || "PENDING";
              const dotColor = st === "READY" ? "var(--sage)" : st === "RISK_ACCEPTED" ? "#eab308" : "var(--t4)";
              return (
                <div key={i} style={{ marginBottom: 10 }} data-testid={`text-requirement-${i}`}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--t1)" }}>{r.title}</span>
                        <StatusDropdown status={st} onChange={s => handleStatusChange(i, s)} index={i} />
                      </div>
                      <span style={{ fontSize: 15, color: "var(--t3)", display: "block", marginTop: 1 }}>{r.issuedBy}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Readiness Score + Duty Estimate */}
      <div className="lookup-score-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={dkCard}>
          {result.readinessScore ? (
            <ReadinessBanner score={result.readinessScore.score} verdict={result.readinessScore.verdict} summary={result.readinessScore.summary} factors={result.readinessScore.factors} primaryRiskFactor={result.readinessScore.factors.primary_risk_factor} />
          ) : (
            <p style={{ fontSize: 15, color: "var(--t3)" }}>{t("readiness.unavailable")}</p>
          )}
        </div>
        <div style={dkCard}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 12 }}>{t("duty.title")}</div>
          {Array.isArray(result.destination.preferenceSchemes) && (result.destination.preferenceSchemes as string[]).length > 0 && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em", background: "rgba(109,184,154,0.2)", color: "var(--sage)", padding: "3px 8px", borderRadius: 4, display: "inline-block", marginBottom: 12 }}>
              {(result.destination.preferenceSchemes as string[]).join(" · ")}
            </span>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: 15, color: "var(--t2)" }}>{t("duty.vatImport")}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>{result.destination.vatRate}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: 15, color: "var(--t2)" }}>{t("duty.tariffSource")}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>{result.destination.tariffSource}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span style={{ fontSize: 15, color: "var(--t2)" }}>{t("duty.spsRegime")}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>{result.destination.spsRegime || t("duty.standard")}</span>
          </div>
          {result.destination.iso2 === "CH" && (
            <p style={{ fontSize: 15, color: "#eab308", margin: "0 0 8px", lineHeight: 1.5 }}>{t("duty.swissTariffShort")}</p>
          )}
          <EvidenceHashInline result={result} />
        </div>
      </div>

      {/* Demurrage Estimate */}
      {(() => {
        const estimate = estimateDemurrageRange(result.destination.iso2, result.readinessScore?.verdict || "AMBER");
        if (!estimate) return (
          <div style={{ textAlign: "right", margin: "4px 0 8px" }}>
            <Link href="/demurrage"><span style={{ fontSize: 15, color: "var(--sage)", cursor: "pointer", fontWeight: 600 }}>{t("demurrage.calculatorLink")}</span></Link>
          </div>
        );
        const verdictColor = result.readinessScore?.verdict === "RED" ? "#ef4444" : result.readinessScore?.verdict === "AMBER" ? "#d97706" : "var(--sage)";
        return (
          <div data-testid="demurrage-estimate-card" style={{ ...dkCard, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 18, marginTop: 1 }}>⚓</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)", margin: 0 }}>{t("demurrage.estimatedPortDemurrage")}</p>
              <p style={{ fontSize: 15, color: "var(--t2)", margin: "4px 0 0", lineHeight: 1.6 }}>
                At <strong style={{ color: "var(--t1)" }}>{estimate.port.label}</strong>
                {estimate.allPorts.length > 1 && <span style={{ color: "var(--t3)", fontSize: 15 }}> ({t("demurrage.morePorts", { count: estimate.allPorts.length - 1 })})</span>}
                {t("demurrage.costExplanation")}
                <span style={{ color: verdictColor, fontWeight: 600 }}>{estimate.delayLabel}</span>
                {t("demurrage.basedOnReadiness")}
                <strong style={{ color: "var(--t1)" }}>${estimate.minCost.toLocaleString()} – ${estimate.maxCost.toLocaleString()}</strong>.
              </p>
              <Link href="/demurrage">
                <span style={{ fontSize: 15, color: "var(--sage)", cursor: "pointer", fontWeight: 600, marginTop: 4, display: "inline-block" }}>
                  {t("demurrage.openFullCalculator", { count: estimate.allPorts.length, plural: estimate.allPorts.length !== 1 ? "s" : "" })}
                </span>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Actions */}
      <div style={dkCard}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 14 }}>{t("actions.title")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="w-full" disabled style={{ opacity: 0.5 }} data-testid="button-download-twinlog">
                <Download className="w-4 h-4 mr-2" /> {t("actions.twinLogTrail")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("actions.twinLogTooltip")}</TooltipContent>
          </Tooltip>
          <Link href={`/lc-check?commodityId=${result.commodity.id}&originIso2=${result.origin.iso2}&destIso2=${result.destination.iso2}`}>
            <Button variant="outline" className="w-full" data-testid="button-check-lc">
              <ArrowRight className="w-4 h-4 mr-2" /> {t("actions.checkLc")}
            </Button>
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <Button variant="outline" className="w-full" onClick={() => {
            const csv = generateCustomsCSV(result, t, lang);
            downloadCSV(csv, `TapTrao_CustomsDataPack_${result.commodity.hsCode}_${result.origin.iso2}_${result.destination.iso2}.csv`);
          }} data-testid="button-download-customs-pack">
            <Download className="w-4 h-4 mr-2" /> {t("actions.customsDataPack")}
          </Button>
          <Button variant="outline" className="w-full" data-testid="button-supplier-brief">
            <Mail className="w-4 h-4 mr-2" /> {t("actions.supplierBrief")}
          </Button>
        </div>
        <p style={{ fontSize: 15, color: "var(--t3)", textAlign: "center", marginTop: 8, fontStyle: "italic" }}>{t("actions.brokerNote")}</p>
      </div>

      {/* Trade Created Banner */}
      {(result as any).lookupId && (
        <div style={{ ...dkCard, background: "linear-gradient(135deg, rgba(109,184,154,0.1), rgba(109,184,154,0.06))", border: "1px solid rgba(109,184,154,0.2)", textAlign: "center", padding: "20px 24px" }} data-testid="banner-open-trade-dashboard">
          <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: "var(--sage)", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)", margin: "0 0 6px", fontFamily: "'Clash Display', sans-serif" }}>{t("conversion.tradeCreated")}</p>
          <p style={{ fontSize: 15, color: "var(--t2)", margin: "0 0 16px", lineHeight: 1.5 }}>{t("conversion.tradeDescription")}</p>
          <Link href={`/trades/${(result as any).lookupId}`}>
            <Button size="sm" style={{ background: "var(--sage)", color: "#fff", borderRadius: 10, padding: "10px 28px", fontSize: 15, fontWeight: 700 }} data-testid="button-open-trade-dashboard">
              {t("conversion.openTradeDashboard")}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function NewCheck() {
  const { t, i18n } = useTranslation("lookup");
  const lang = i18n.language;
  const { t: tc } = useTranslation("common");
  usePageTitle("New Check", "Run a compliance check for your shipment");

  const [commodityId, setCommodityId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [, navigate] = useLocation();

  const { data: commoditiesData, isLoading: loadingCommodities } = useQuery<Commodity[]>({ queryKey: ["/api/commodities"] });
  const { data: originsData, isLoading: loadingOrigins } = useQuery<OriginCountry[]>({ queryKey: ["/api/origins"] });
  const { data: destinationsData, isLoading: loadingDestinations } = useQuery<Destination[]>({ queryKey: ["/api/destinations"] });

  const tokenQuery = useTokenBalance();
  const balance = tokenQuery.data?.balance ?? 0;
  const isLoading = loadingCommodities || loadingOrigins || loadingDestinations;
  const canSubmit = commodityId && originId && destinationId;

  const complianceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/compliance-check", { commodityId, originId, destinationId });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Check failed");
      }
      return res.json() as Promise<ComplianceResult>;
    },
    onError: (err: Error) => {
      if (err.message === "Insufficient tokens") setShowTokenModal(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lookups/recent"] });
    },
  });

  const result = complianceMutation.data;

  return (
    <AppShell>
      <div className="flex-1 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Green hero */}
          <div className="green-hero-box" style={{ margin: "4px 0 16px", padding: "28px 32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "5px 14px", fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 14, letterSpacing: "0.03em" }}>
              TAPTRAO / NEW CHECK
            </div>
            <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 32, color: "#fff", margin: "0 0 8px", lineHeight: 1.2 }}>
              New Check
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", margin: 0, maxWidth: 500 }}>
              Each check generates a hash-chained audit record for your shipment.
            </p>
          </div>

          {/* Form card */}
          <Card style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(109,184,154,0.3), transparent)" }} />
            <CardContent className="p-6">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }} className="new-check-form-grid">
                <div className="space-y-2" style={{ minWidth: 0 }}>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t1)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t("form.commodityLabel")}
                  </label>
                  {isLoading ? <Skeleton className="h-9 w-full" /> : (
                    <Select value={commodityId} onValueChange={setCommodityId}>
                      <SelectTrigger data-testid="select-commodity"><SelectValue placeholder={t("form.commodityPlaceholder")} /></SelectTrigger>
                      <SelectContent>
                        {commoditiesData?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{translateCommodity(c.name, lang)} (HS {c.hsCode})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2" style={{ minWidth: 0 }}>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t1)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Origin
                  </label>
                  {isLoading ? <Skeleton className="h-9 w-full" /> : (
                    <Select value={originId} onValueChange={setOriginId}>
                      <SelectTrigger data-testid="select-origin"><SelectValue placeholder={t("form.originPlaceholder")} /></SelectTrigger>
                      <SelectContent>
                        {originsData?.map((o: any) => (
                          <SelectItem key={o.id} value={o.id}>
                            <CountryFlagBadge iso2={o.iso2} countryName={o.countryName} status={o.status} flagReason={o.flagReason} flagDetails={o.flagDetails} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2" style={{ minWidth: 0 }}>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t1)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t("form.destinationLabel")}
                  </label>
                  {isLoading ? <Skeleton className="h-9 w-full" /> : (
                    <Select value={destinationId} onValueChange={setDestinationId}>
                      <SelectTrigger data-testid="select-destination"><SelectValue placeholder={t("form.destinationPlaceholder")} /></SelectTrigger>
                      <SelectContent>
                        {destinationsData?.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{iso2ToFlag(d.iso2)} {d.countryName} ({d.iso2})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p className="text-sm text-muted-foreground">
                  Uses <strong style={{ color: "var(--t1)" }}>1 credit</strong> · <Link href="/pricing" className="underline" style={{ color: "var(--sage)" }}>{t("form.topUp")}</Link>
                </p>
                <Button
                  size="lg"
                  disabled={!canSubmit || complianceMutation.isPending}
                  onClick={() => complianceMutation.mutate()}
                  style={{ backgroundColor: "var(--sage, #6b9080)", color: "white", borderRadius: 10, padding: "12px 32px" }}
                  data-testid="button-run-check"
                >
                  {complianceMutation.isPending ? (
                    <><Search className="w-4 h-4 mr-2 animate-spin" /> {t("form.checkButtonLoading")}</>
                  ) : (
                    <><Search className="w-4 h-4 mr-2" /> {t("form.checkButton")}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {complianceMutation.isError && complianceMutation.error.message !== "Insufficient tokens" && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <XCircle className="w-5 h-5 shrink-0" style={{ color: "#ef4444" }} />
              <p style={{ fontSize: 15, color: "#ef4444", margin: 0 }}>{complianceMutation.error.message}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              <StepNav steps={[t("steps.enterTrade"), t("steps.preShipReport"), `${t("steps.lcCheck")} 🔒`, `${t("steps.supplierBrief")} 🔒`]} currentIndex={1} completedUpTo={1} />
              <TradeResultDisplay result={result} />
            </>
          )}

          {/* Token modal */}
          <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("tokenModal.title")}</DialogTitle>
                <DialogDescription>{t("tokenModal.description", { balance })}</DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center gap-2 my-2">
                <Badge variant="secondary" className="gap-1"><Hexagon className="w-3 h-3" /> {t("tokenModal.shieldCheck", { count: balance })}</Badge>
              </div>
              <div className="flex gap-3 justify-end flex-wrap">
                <Button variant="outline" onClick={() => setShowTokenModal(false)} data-testid="button-modal-cancel">{tc("button.cancel")}</Button>
                <Button onClick={() => navigate("/pricing")} data-testid="button-modal-buy-tokens">{t("tokenModal.activateShield")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Responsive: collapse 3-col form to 1-col on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .new-check-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
