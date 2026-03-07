/**
 * TradeReport — Full compliance report for an authenticated trade.
 *
 * Route: /trades/:tradeId/report
 * Fetches trade data via GET /api/trades/:id and renders a pixel-perfect
 * report view matching the trade-report-authenticated.html mockup.
 */
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useRoute, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { usePageTitle } from "@/hooks/use-page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown, Download, ArrowRight, Mail, AlertTriangle,
} from "lucide-react";
import { iso2ToFlag } from "@/components/CountryFlagBadge";
import { estimateDemurrageRange } from "@/lib/demurrage-utils";
import { translateCommodity } from "@/lib/commodity-i18n";
import { apiRequest } from "@/lib/queryClient";
import type {
  ComplianceResult, ReadinessFactors, RequirementDetail, DocumentStatus,
} from "@shared/schema";

/* ── Helpers ── */

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

const nameToIso2: Record<string, string> = {
  "European Union": "EU", "United Kingdom": "GB", "Germany": "DE", "France": "FR",
  "Italy": "IT", "Spain": "ES", "Switzerland": "CH", "Austria": "AT",
  "United States": "US", "China": "CN", "United Arab Emirates": "AE", "Turkey": "TR",
  "Côte d'Ivoire": "CI", "Ghana": "GH", "Ethiopia": "ET", "Kenya": "KE",
  "Tanzania": "TZ", "Uganda": "UG", "Nigeria": "NG", "Cameroon": "CM",
  "Rwanda": "RW", "Senegal": "SN", "Democratic Republic of the Congo": "CD",
  "Malawi": "MW", "Zambia": "ZM", "Zimbabwe": "ZW", "Madagascar": "MG",
  "Mozambique": "MZ", "Burundi": "BI", "South Africa": "ZA", "Niger": "NE",
};
function nameFlag(name: string | null | undefined): string {
  if (!name) return "";
  const iso2 = nameToIso2[name];
  return iso2 ? iso2ToFlag(iso2) : "";
}

const TRADE_STEPS = [
  { key: "active", label: "Active" },
  { key: "in_transit", label: "In Transit" },
  { key: "arrived", label: "Arrived" },
  { key: "cleared", label: "Cleared" },
  { key: "closed", label: "Closed" },
];

/* ── StatusDropdown ── */

function StatusDropdown({ status, onChange, index }: { status: DocumentStatus; onChange: (s: DocumentStatus) => void; index: number }) {
  const { t: tc } = useTranslation("common");
  const labels: Record<DocumentStatus, string> = { PENDING: tc("status.pending"), READY: tc("status.ready"), RISK_ACCEPTED: tc("status.riskAccepted") };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1 shrink-0 cursor-pointer"
          style={{
            fontFamily: "var(--fb)", fontSize: 11, fontWeight: 500,
            padding: "3px 10px", borderRadius: 6,
            background: status === "READY" ? "var(--sage-pale)" : status === "RISK_ACCEPTED" ? "var(--amber-pale)" : "var(--bg)",
            border: "none",
            color: status === "READY" ? "var(--sage)" : status === "RISK_ACCEPTED" ? "var(--amber)" : "var(--t3)",
          }}
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

/* ── Main Page ── */

export default function TradeReport() {
  const { t, i18n } = useTranslation("lookup");
  const lang = i18n.language;
  const { t: tc } = useTranslation("common");
  const [, params] = useRoute("/trades/:tradeId/report");
  const tradeId = params?.tradeId;
  usePageTitle("Trade Report", "Full compliance report for your trade");

  /* Fetch trade detail */
  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/trades/${tradeId}`],
    enabled: !!tradeId,
  });

  const lookup = data?.lookup;
  const result: ComplianceResult | null = lookup?.resultJson ? (lookup.resultJson as ComplianceResult) : null;
  const auditTrail = data?.auditTrail || [];
  const twinlog = data?.twinlog;
  const tradeStatus = data?.tradeStatus || "active";

  /* Document statuses (local state) */
  const allDocs = result?.requirementsDetailed || [];
  const [docStatuses, setDocStatuses] = useState<Record<number, DocumentStatus>>({});
  useEffect(() => {
    if (allDocs.length > 0 && Object.keys(docStatuses).length === 0) {
      const init: Record<number, DocumentStatus> = {};
      allDocs.forEach((_, i) => { init[i] = "PENDING"; });
      setDocStatuses(init);
    }
  }, [allDocs]);
  const handleStatusChange = useCallback((idx: number, status: DocumentStatus) => {
    setDocStatuses(prev => ({ ...prev, [idx]: status }));
  }, []);

  /* Collapsed states for secondary cards */
  const [demurrageOpen, setDemurrageOpen] = useState(true);
  const [triggersOpen, setTriggersOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  /* Loading state */
  if (isLoading) {
    return (
      <AppShell>
        <div style={{ padding: "28px 40px", maxWidth: 1100 }}>
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-10 w-80 mb-6" />
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  if (error || !data || !result) {
    return (
      <AppShell>
        <div style={{ padding: "28px 40px", maxWidth: 1100 }}>
          <p style={{ color: "var(--red)", fontSize: 15 }}>
            {error ? "Failed to load trade data." : "Trade not found."}
          </p>
          <Link href="/trades">
            <Button variant="outline" className="mt-4">← Back to trades</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  /* Derived data */
  const commodityName = translateCommodity(result.commodity.name, lang);
  const originName = result.origin.countryName;
  const destName = result.destination.countryName;
  const originFlag = nameFlag(originName);
  const destFlag = nameFlag(destName);
  const hsCode = result.commodity.hsCode;
  const hasStopFlags = result.stopFlags && Object.keys(result.stopFlags).length > 0;
  const triggerCount = Object.values(result.triggers).filter(Boolean).length;
  const riskLevel = hasStopFlags ? "STOP" : triggerCount >= 3 ? "HIGH" : triggerCount >= 1 ? "MEDIUM" : "LOW";

  const importerDocs = allDocs.map((r, i) => ({ r, i })).filter(x => !x.r.isSupplierSide);
  const supplierDocs = allDocs.map((r, i) => ({ r, i })).filter(x => x.r.isSupplierSide);
  const importerReady = importerDocs.filter(x => docStatuses[x.i] === "READY").length;
  const supplierReady = supplierDocs.filter(x => docStatuses[x.i] === "READY").length;
  const totalReady = importerReady + supplierReady;
  const totalDocs = allDocs.length;

  /* Readiness score */
  const score = result.readinessScore?.score ?? lookup?.readinessScore ?? null;
  const verdict = result.readinessScore?.verdict ?? lookup?.readinessVerdict ?? "AMBER";
  const factors = result.readinessScore?.factors ?? lookup?.readinessFactors ?? null;
  const summary = result.readinessScore?.summary ?? lookup?.readinessSummary ?? "";
  const primaryRiskFactor = factors?.primary_risk_factor || "";

  const verdictStyle = {
    GREEN: { bg: "var(--sage-pale)", color: "var(--sage)", label: "Low Risk" },
    AMBER: { bg: "var(--amber-pale)", color: "var(--amber)", label: "Attention Needed" },
    RED: { bg: "var(--red-pale)", color: "var(--red)", label: "High Risk — Action Required" },
  }[verdict as string] || { bg: "var(--amber-pale)", color: "var(--amber)", label: "Attention Needed" };

  /* Demurrage estimate */
  const demurrage = estimateDemurrageRange(result.destination.iso2, (verdict as "GREEN" | "AMBER" | "RED") || "AMBER");

  /* Twinlog ref */
  const twinlogRef = twinlog?.ref || lookup?.twinlogRef || null;
  const twinlogHash = twinlog?.hash || lookup?.twinlogHash || null;

  /* Step index */
  const currentStepIdx = TRADE_STEPS.findIndex(s => s.key === tradeStatus);

  /* ── CSS tokens for the mockup's cream theme ── */
  const S = {
    cream: "var(--bg)",
    white: "#ffffff",
    darkSage: "var(--dark)",
    mutedSage: "var(--sage)",
    lightSage: "var(--sage-l)",
    sageTint: "var(--sage-pale)",
    gold: "var(--gold)",
    red: "var(--red)",
    redLight: "var(--red-pale)",
    amber: "var(--amber)",
    amberLight: "var(--amber-pale)",
    textDark: "var(--t1)",
    textMid: "var(--t3)",
    textMuted: "var(--t4)",
    shadowCard: "0 2px 16px rgba(27,42,34,0.06)",
    shadowSoft: "0 4px 24px rgba(27,42,34,0.10)",
    radius: 16,
    radiusSm: 10,
  };

  return (
    <AppShell>
      <div style={{ padding: "28px 40px 60px", maxWidth: 1100 }}>

        {/* ── BREADCRUMB ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: S.textMuted, marginBottom: 20 }}>
          <Link href="/trades"><span style={{ color: S.mutedSage, fontWeight: 500, cursor: "pointer" }}>My Trades</span></Link>
          <span>›</span>
          <span>{commodityName} — {originFlag} {originName} → {destFlag} {destName}</span>
        </div>

        {/* ── TRADE HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 600, color: S.darkSage, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
              {commodityName}
              <span style={{ fontSize: 11, fontWeight: 600, background: S.sageTint, color: S.mutedSage, padding: "3px 10px", borderRadius: 20 }}>
                {tradeStatus === "active" ? "Active" : tradeStatus === "in_transit" ? "In Transit" : tradeStatus === "arrived" ? "Arrived" : tradeStatus === "cleared" ? "Cleared" : tradeStatus === "closed" ? "Closed" : "Active"}
              </span>
            </h1>
            <div style={{ fontSize: 13, color: S.textMuted, display: "flex", alignItems: "center", gap: 10 }}>
              {originFlag} {originName} → {destFlag} {destName}
              <span style={{ fontFamily: "monospace", fontSize: 12, background: S.cream, padding: "2px 8px", borderRadius: 4, color: S.textMid }}>
                HS {hsCode}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline" size="sm" style={{ fontSize: 12, fontWeight: 500, borderRadius: 8, background: S.white, boxShadow: S.shadowCard, border: "none" }}
              onClick={() => {
                const csv = generateCustomsCSV(result, t, lang);
                downloadCSV(csv, `TapTrao_CustomsDataPack_${hsCode}_${result.origin.iso2}_${result.destination.iso2}.csv`);
              }}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Customs CSV
            </Button>
            <Button variant="outline" size="sm" style={{ fontSize: 12, fontWeight: 500, borderRadius: 8, background: S.white, boxShadow: S.shadowCard, border: "none" }}>
              <Mail className="w-3.5 h-3.5 mr-1.5" /> Supplier brief
            </Button>
            <Link href={`/lc-check?commodityId=${result.commodity.id}&originIso2=${result.origin.iso2}&destIso2=${result.destination.iso2}`}>
              <Button size="sm" style={{ fontSize: 12, fontWeight: 500, borderRadius: 8, background: S.darkSage, color: "white" }}>
                <ArrowRight className="w-3.5 h-3.5 mr-1.5" /> Run LC Check
              </Button>
            </Link>
          </div>
        </div>

        {/* ── STEPPER ── */}
        <div style={{ display: "flex", alignItems: "center", background: S.white, borderRadius: S.radius, padding: "16px 24px", boxShadow: S.shadowCard, marginBottom: 24 }}>
          {TRADE_STEPS.map((step, idx) => (
            <div key={step.key} style={{ display: "contents" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                  background: idx < currentStepIdx ? S.mutedSage : idx === currentStepIdx ? S.darkSage : "#e5e5e5",
                  color: idx <= currentStepIdx ? "white" : "#bbb",
                }}>
                  {idx < currentStepIdx ? "✓" : idx + 1}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: idx === currentStepIdx ? 600 : 500,
                  color: idx < currentStepIdx ? S.mutedSage : idx === currentStepIdx ? S.darkSage : "#bbb",
                }}>
                  {step.label}
                </span>
              </div>
              {idx < TRADE_STEPS.length - 1 && (
                <div style={{ flex: "0 0 28px", height: 1, background: idx < currentStepIdx ? S.mutedSage : "#e0e0e0" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── ALERT BANNERS ── */}
        {result.originFlagged && result.originFlagReason && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            background: S.redLight, borderLeft: `3px solid ${S.red}`, borderRadius: S.radiusSm,
            padding: "14px 18px", marginBottom: 20,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: S.textDark, marginBottom: 3 }}>
                Flagged Origin — {result.originFlagReason}
              </h4>
              {result.originFlagDetails && (
                <p style={{ fontSize: 12, color: S.textMid, lineHeight: 1.5 }}>{result.originFlagDetails}</p>
              )}
            </div>
          </div>
        )}

        {hasStopFlags && Object.entries(result.stopFlags!).map(([key, msg]) => (
          <div key={key} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            background: S.redLight, borderLeft: `3px solid ${S.red}`, borderRadius: S.radiusSm,
            padding: "14px 18px", marginBottom: 20,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🛑</span>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: S.textDark, marginBottom: 3 }}>{key}</h4>
              <p style={{ fontSize: 12, color: S.textMid, lineHeight: 1.5 }}>{msg}</p>
            </div>
          </div>
        ))}

        {result.triggers.cbam && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            background: S.amberLight, borderLeft: `3px solid ${S.amber}`, borderRadius: S.radiusSm,
            padding: "14px 18px", marginBottom: 20,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>📋</span>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: S.textDark, marginBottom: 3 }}>CBAM applies to this shipment</h4>
              <p style={{ fontSize: 12, color: S.textMid, lineHeight: 1.5 }}>
                {commodityName} (HS {hsCode}) is subject to EU Carbon Border Adjustment Mechanism. CBAM embedded-emissions declaration required from your supplier before import.
              </p>
            </div>
          </div>
        )}

        {result.triggers.eudr && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            background: S.amberLight, borderLeft: `3px solid ${S.amber}`, borderRadius: S.radiusSm,
            padding: "14px 18px", marginBottom: 20,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🌿</span>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: S.textDark, marginBottom: 3 }}>EUDR applies to this shipment</h4>
              <p style={{ fontSize: 12, color: S.textMid, lineHeight: 1.5 }}>
                {commodityName} (HS {hsCode}) is subject to EU Deforestation Regulation. Geolocation and due diligence data required.
              </p>
            </div>
          </div>
        )}

        {/* ── SCORE HERO ── */}
        {score !== null && factors && (
          <div style={{
            background: S.white, borderRadius: S.radius, padding: 28, boxShadow: S.shadowCard, marginBottom: 16,
            display: "grid", gridTemplateColumns: "auto 1px 1fr auto", gap: 28, alignItems: "center",
          }}>
            {/* Big score */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--fh)", fontSize: 64, fontWeight: 700, color: S.darkSage, lineHeight: 1, marginBottom: 6 }}>{score}</div>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "4px 12px", borderRadius: 6, display: "inline-block",
                background: verdictStyle.bg, color: verdictStyle.color,
              }}>
                {verdictStyle.label}
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 60, background: "#eee" }} />

            {/* Score breakdown */}
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px" }}>
                {[
                  { key: "regulatory_complexity", label: "Regulatory requirements" },
                  { key: "hazard_exposure", label: "Product controls" },
                  { key: "document_volume", label: "Document volume" },
                  { key: "trade_restriction", label: "Trade restrictions" },
                ].map(item => {
                  const f = (factors as any)[item.key];
                  if (!f) return null;
                  const isPrimary = primaryRiskFactor === item.key && f.penalty > 10;
                  return (
                    <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: S.textMuted }}>{item.label}</span>
                      <span style={{ fontWeight: 600, color: isPrimary ? S.amber : f.penalty > 15 ? S.amber : S.mutedSage }}>
                        {isPrimary ? `⚠ ${item.key === "document_volume" ? "primary" : `${f.penalty}/${f.max}`}` : `${f.penalty}/${f.max}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              {summary && (
                <div style={{
                  fontSize: 12, color: S.textMuted, lineHeight: 1.6, padding: "12px 16px",
                  background: S.cream, borderRadius: S.radiusSm, marginTop: 12,
                }}>
                  {summary}
                </div>
              )}
            </div>

            {/* Duty mini */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
              <div style={{ background: S.cream, borderRadius: S.radiusSm, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.textMuted, marginBottom: 8 }}>Duty Estimate</div>
                {Array.isArray(result.destination.preferenceSchemes) && (result.destination.preferenceSchemes as string[]).length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                    {(result.destination.preferenceSchemes as string[]).map(s => (
                      <span key={s} style={{ background: S.sageTint, color: S.mutedSage, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>{s}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: S.textMuted }}>VAT</span>
                  <span style={{ fontWeight: 600, color: S.textDark }}>{result.destination.vatRate}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: S.textMuted }}>Tariff</span>
                  <span style={{ fontWeight: 600, color: S.textDark }}>{result.destination.tariffSource}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: S.textMuted }}>SPS</span>
                  <span style={{ fontWeight: 600, color: S.textDark }}>{result.destination.spsRegime || "Standard"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENT READINESS ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontFamily: "var(--fh)", fontSize: 18, fontWeight: 600, color: S.darkSage }}>Document Readiness</h2>
          <span style={{ fontSize: 12, color: S.textMuted, background: S.white, padding: "4px 12px", borderRadius: 20, boxShadow: S.shadowCard }}>
            {totalReady} / {totalDocs} validated
          </span>
        </div>

        <div className="trade-report-doc-boxes" style={{ display: "grid", gridTemplateColumns: importerDocs.length > 0 && supplierDocs.length > 0 ? "1fr 1fr" : "1fr", gap: 14, marginBottom: 20 }}>
          {/* BUYER */}
          {importerDocs.length > 0 && (
            <div style={{ background: S.white, borderRadius: S.radius, padding: 22, boxShadow: S.shadowCard }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${S.cream}` }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: S.darkSage }}>Your Side — Buyer</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: S.darkSage, color: "white", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>{importerDocs.length} docs</span>
                  <span style={{ fontSize: 11, color: S.textMuted }}>{importerReady}/{importerDocs.length} ready</span>
                </div>
              </div>
              {importerDocs.map(({ r, i }) => {
                const st = docStatuses[i] || "PENDING";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    marginBottom: 12, paddingBottom: 12,
                    borderBottom: i < importerDocs.length - 1 ? "1px solid #f5f5f5" : "none",
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                      background: st === "READY" ? S.mutedSage : st === "RISK_ACCEPTED" ? S.amber : "#ddd",
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: S.textDark, marginBottom: 5, lineHeight: 1.4 }}>{r.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusDropdown status={st} onChange={s => handleStatusChange(i, s)} index={i} />
                        <span style={{ fontSize: 11, color: S.textMuted }}>{r.issuedBy}</span>
                      </div>
                    </div>
                    <button style={{
                      background: S.mutedSage, color: "white", border: "none", padding: "5px 12px",
                      borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer",
                      fontFamily: "var(--fb)", flexShrink: 0, whiteSpace: "nowrap",
                    }}>
                      Upload
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* SUPPLIER */}
          {supplierDocs.length > 0 && (
            <div style={{ background: S.white, borderRadius: S.radius, padding: 22, boxShadow: S.shadowCard }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${S.cream}` }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: S.darkSage }}>Their Side — Supplier</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: S.darkSage, color: "white", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>{supplierDocs.length} docs</span>
                  <span style={{ fontSize: 11, color: S.textMuted }}>{supplierReady}/{supplierDocs.length} ready</span>
                </div>
              </div>
              {supplierDocs.map(({ r, i }) => {
                const st = docStatuses[i] || "PENDING";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    marginBottom: 12, paddingBottom: 12,
                    borderBottom: i < supplierDocs.length - 1 ? "1px solid #f5f5f5" : "none",
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                      background: st === "READY" ? S.mutedSage : st === "RISK_ACCEPTED" ? S.amber : "#ddd",
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: S.textDark, marginBottom: 5, lineHeight: 1.4 }}>{r.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusDropdown status={st} onChange={s => handleStatusChange(i, s)} index={i} />
                        <span style={{ fontSize: 11, color: S.textMuted }}>{r.issuedBy}</span>
                      </div>
                    </div>
                    <button style={{
                      background: "none", border: `1.5px solid ${S.mutedSage}`, color: S.mutedSage,
                      padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                      cursor: "pointer", fontFamily: "var(--fb)", flexShrink: 0, whiteSpace: "nowrap",
                    }}>
                      ✉ Send link
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SECONDARY GRID — Demurrage / Regulatory Triggers / Shipment Value ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }} className="trade-report-secondary-grid">

          {/* Demurrage Estimate */}
          <div
            style={{ background: S.white, borderRadius: S.radius, padding: 18, boxShadow: S.shadowCard, cursor: "pointer" }}
            onClick={() => setDemurrageOpen(v => !v)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: S.textMuted }}>Demurrage Estimate</span>
              <span style={{ fontSize: 11, color: S.textMuted, transform: demurrageOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▾</span>
            </div>
            {demurrage ? (
              <>
                <div style={{ fontFamily: "var(--fh)", fontSize: 20, fontWeight: 600, color: S.darkSage, marginBottom: 2 }}>
                  ${demurrage.minCost.toLocaleString()}–${demurrage.maxCost.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: S.textMuted }}>
                  {demurrage.port.label.split(",")[0]} · {demurrage.delayLabel}
                </div>
                {demurrageOpen && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${S.cream}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: S.textMuted }}>Port</span>
                      <span style={{ fontWeight: 500, color: S.textDark }}>{demurrage.port.label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: S.textMuted }}>Delay estimate</span>
                      <span style={{ fontWeight: 500, color: S.textDark }}>{demurrage.delayLabel} ({verdict})</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: S.textMuted }}>20ft container</span>
                      <span style={{ fontWeight: 500, color: S.textDark }}>${demurrage.minCost.toLocaleString()} – ${demurrage.maxCost.toLocaleString()}</span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Link href="/demurrage">
                        <span style={{ fontSize: 12, color: S.mutedSage, fontWeight: 500, cursor: "pointer" }}>
                          Open full calculator ({demurrage.allPorts.length} ports) →
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 14, color: S.textMuted, paddingTop: 4 }}>Not available</div>
            )}
          </div>

          {/* Regulatory Triggers */}
          <div
            style={{ background: S.white, borderRadius: S.radius, padding: 18, boxShadow: S.shadowCard, cursor: "pointer" }}
            onClick={() => setTriggersOpen(v => !v)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: S.textMuted }}>Regulatory Triggers</span>
              <span style={{ fontSize: 11, color: S.textMuted, transform: triggersOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▾</span>
            </div>
            <div style={{ fontFamily: "var(--fh)", fontSize: 20, fontWeight: 600, color: S.darkSage, marginBottom: 2 }}>
              {triggerCount} active
            </div>
            <div style={{ fontSize: 11, color: S.textMuted }}>
              {Object.entries(result.triggers).filter(([, v]) => v).map(([k]) => k.toUpperCase()).join(", ") || "None"}
            </div>
            {triggersOpen && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${S.cream}` }}>
                {[
                  { key: "cbam", label: "CBAM" },
                  { key: "eudr", label: "EUDR" },
                  { key: "sps", label: "SPS" },
                  { key: "cites", label: "CITES" },
                  { key: "conflict", label: "Conflict Minerals" },
                  { key: "kimberley", label: "Kimberley Process" },
                  { key: "csddd", label: "CSDDD" },
                  { key: "iuu", label: "IUU Fishing" },
                  { key: "laceyAct", label: "Lacey Act" },
                  { key: "reach", label: "REACH" },
                  { key: "section232", label: "Section 232" },
                  { key: "fdaPriorNotice", label: "FDA Prior Notice" },
                  { key: "fsis", label: "FSIS" },
                ].map(item => {
                  const active = (result.triggers as any)[item.key];
                  return (
                    <div key={item.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: S.textMuted }}>{item.label}</span>
                      <span style={{ fontWeight: 500, color: active ? S.red : S.mutedSage }}>
                        {active ? "Required" : "Not applicable"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shipment Value */}
          <div
            style={{ background: S.white, borderRadius: S.radius, padding: 18, boxShadow: S.shadowCard, cursor: "pointer" }}
            onClick={() => setValueOpen(v => !v)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: S.textMuted }}>Shipment Value</span>
              <span style={{ fontSize: 11, color: S.textMuted, transform: valueOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▾</span>
            </div>
            <div style={{
              color: lookup?.tradeValue ? S.darkSage : S.textMuted,
              fontFamily: lookup?.tradeValue ? "var(--fh)" : "var(--fb)",
              fontSize: lookup?.tradeValue ? 20 : 14,
              fontWeight: lookup?.tradeValue ? 600 : 400,
              marginBottom: 2,
              paddingTop: lookup?.tradeValue ? 0 : 4,
            }}>
              {lookup?.tradeValue ? `${lookup.tradeValueCurrency || "USD"} ${Number(lookup.tradeValue).toLocaleString()}` : "Not set"}
            </div>
            <div style={{ fontSize: 11, color: S.textMuted }}>
              {lookup?.tradeValue ? "FOB declared value" : "Add value for risk exposure calc"}
            </div>
            {valueOpen && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${S.cream}` }}>
                <input
                  type="text"
                  placeholder="Enter FOB value (USD)"
                  defaultValue={lookup?.tradeValue || ""}
                  style={{
                    width: "100%", padding: "8px 12px", background: S.cream, border: "none",
                    borderRadius: 6, fontFamily: "var(--fb)", fontSize: 13, marginBottom: 8,
                  }}
                />
                <button style={{
                  width: "100%", background: S.darkSage, color: "white", border: "none",
                  padding: 8, borderRadius: 6, fontFamily: "var(--fb)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}>
                  Save value
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── ACTIONS ── */}
        <div style={{ background: S.white, borderRadius: S.radius, padding: 22, boxShadow: S.shadowCard, marginBottom: 16 }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.textMuted, marginBottom: 14 }}>Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: S.radiusSm,
              cursor: "default", background: S.cream, opacity: 0.6,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⬇</span>
              <div>
                <h5 style={{ fontSize: 13, fontWeight: 600, color: "#aaa", marginBottom: 1 }}>Download TwinLog Trail</h5>
                <p style={{ fontSize: 11, color: S.textMuted, margin: 0 }}>Available after first document upload</p>
              </div>
            </div>
            <Link href={`/lc-check?commodityId=${result.commodity.id}&originIso2=${result.origin.iso2}&destIso2=${result.destination.iso2}`}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: S.radiusSm,
                cursor: "pointer", background: S.cream, transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = S.sageTint)}
                onMouseLeave={e => (e.currentTarget.style.background = S.cream as string)}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>→</span>
                <div>
                  <h5 style={{ fontSize: 13, fontWeight: 600, color: S.darkSage, marginBottom: 1 }}>Run LC Check</h5>
                  <p style={{ fontSize: 11, color: S.textMuted, margin: 0 }}>Pre-filled with this trade's data</p>
                </div>
              </div>
            </Link>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: S.radiusSm,
              cursor: "pointer", background: S.cream, transition: "background 0.15s",
            }}
              onClick={() => {
                const csv = generateCustomsCSV(result, t, lang);
                downloadCSV(csv, `TapTrao_CustomsDataPack_${hsCode}_${result.origin.iso2}_${result.destination.iso2}.csv`);
              }}
              onMouseEnter={e => (e.currentTarget.style.background = S.sageTint)}
              onMouseLeave={e => (e.currentTarget.style.background = S.cream as string)}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>⬇</span>
              <div>
                <h5 style={{ fontSize: 13, fontWeight: 600, color: S.darkSage, marginBottom: 1 }}>Customs data pack (CSV)</h5>
                <p style={{ fontSize: 11, color: S.textMuted, margin: 0 }}>Share with your broker</p>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: S.radiusSm,
              cursor: "pointer", background: S.cream, transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = S.sageTint)}
              onMouseLeave={e => (e.currentTarget.style.background = S.cream as string)}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>✉</span>
              <div>
                <h5 style={{ fontSize: 13, fontWeight: 600, color: S.darkSage, marginBottom: 1 }}>Send supplier brief</h5>
                <p style={{ fontSize: 11, color: S.textMuted, margin: 0 }}>Email document checklist to supplier</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── AUDIT ROW ── */}
        {twinlogRef && (
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: S.white, borderRadius: S.radius, padding: "14px 20px",
              boxShadow: S.shadowCard, cursor: "pointer", marginBottom: 16, position: "relative",
            }}
            onClick={() => setAuditOpen(v => !v)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: S.textMid }}>
              <span>🔗</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: S.mutedSage }}>{twinlogRef}</span>
              <span style={{ color: S.textMuted, fontSize: 12 }}>· TwinLog Audit Trail · {auditTrail.length} events</span>
            </div>
            <span style={{ fontSize: 12, color: S.textMuted }}>▾</span>
            {auditOpen && twinlogHash && (
              <div style={{
                position: "absolute", top: "100%", left: 20, right: 20,
                background: "white", padding: "12px 16px", borderRadius: 8,
                boxShadow: S.shadowSoft, marginTop: 8, zIndex: 10,
              }}>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: S.textMuted, wordBreak: "break-all", lineHeight: 1.6 }}>
                  sha256:{twinlogHash}
                </div>
                <div style={{ fontSize: 11, color: S.textMuted, marginTop: 4 }}>
                  {lookup?.createdAt ? new Date(lookup.createdAt).toLocaleString() : ""}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── WATCH CORRIDOR ── */}
        <div style={{ textAlign: "center", padding: 16, fontSize: 13, color: S.textMuted }}>
          <Link href="/alerts">
            <span style={{ color: S.mutedSage, fontWeight: 500, cursor: "pointer" }}>⊙ Watch this corridor</span>
          </Link>
          {" — get notified when regulations change for "}
          {commodityName} → {destName}
        </div>

      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .trade-report-doc-boxes { grid-template-columns: 1fr !important; }
          .trade-report-secondary-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppShell>
  );
}
