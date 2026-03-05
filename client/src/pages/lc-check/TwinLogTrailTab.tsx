import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LcPrefillData, TwinlogData } from "./constants";
import { translateCommodity } from "@/lib/commodity-i18n";

function TwinLogReadinessBanner({ score, verdict, summary, factors, primaryRiskFactor }: {
  score: number;
  verdict: "GREEN" | "AMBER" | "RED";
  summary: string;
  factors: any;
  primaryRiskFactor: string;
}) {
  const { t } = useTranslation("lcCheck");
  const verdictStyles = {
    GREEN: { bg: "rgba(93,217,193,.05)", border: "rgba(93,217,193,.2)", badgeBg: "var(--gbg)", badgeBorder: "var(--gbd)", badgeColor: "var(--app-acapulco)", labelKey: "twinlog.riskLow" as const },
    AMBER: { bg: "rgba(234,139,67,.05)", border: "rgba(234,139,67,.2)", badgeBg: "var(--abg)", badgeBorder: "var(--abd)", badgeColor: "var(--amber)", labelKey: "twinlog.riskModerate" as const },
    RED: { bg: "rgba(218,60,61,.05)", border: "rgba(218,60,61,.2)", badgeBg: "var(--rbg)", badgeBorder: "var(--rbd)", badgeColor: "var(--red)", labelKey: "twinlog.riskHigh" as const },
  };
  const v = verdictStyles[verdict];
  const barColors: Record<string, string> = {
    regulatory_complexity: "var(--blue)",
    hazard_exposure: "var(--amber)",
    document_volume: "var(--t3)",
    trade_restriction: "var(--red)",
  };
  const factorRows = [
    { key: "regulatory_complexity", label: t("twinlog.regulatoryComplexity"), penalty: factors?.regulatory_complexity?.penalty ?? 0, max: factors?.regulatory_complexity?.max ?? 30 },
    { key: "hazard_exposure", label: t("twinlog.hazardExposure"), penalty: factors?.hazard_exposure?.penalty ?? 0, max: factors?.hazard_exposure?.max ?? 30 },
    { key: "document_volume", label: t("twinlog.documentVolume"), penalty: factors?.document_volume?.penalty ?? 0, max: factors?.document_volume?.max ?? 20 },
    { key: "trade_restriction", label: t("twinlog.tradeRestriction"), penalty: factors?.trade_restriction?.penalty ?? 0, max: factors?.trade_restriction?.max ?? 20 },
  ];
  return (
    <div style={{ borderRadius: 14, background: v.bg, padding: "22px 26px" }} data-testid="twinlog-readiness-banner">
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: "clamp(48px, 6vw, 64px)", letterSpacing: "-0.03em", color: "var(--t1)", lineHeight: 1 }}>
            {score}
          </div>
          <span style={{ display: "inline-block", fontFamily: "var(--fb)", fontSize: 15, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: v.badgeBg, border: `1px solid ${v.badgeBorder}`, color: v.badgeColor, width: "fit-content", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            {t(v.labelKey)}
          </span>
          <p style={{ fontSize: 15, color: "var(--t2)", lineHeight: 1.65, marginTop: 6, maxWidth: 260 }}>
            {summary}
          </p>
        </div>
        <div style={{ flex: 1, paddingLeft: 28 }}>
          {factorRows.map((f) => {
            const pct = f.max > 0 ? (f.penalty / f.max) * 100 : 0;
            const isPrimary = primaryRiskFactor === f.key && f.penalty > 10;
            return (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 120, fontSize: 15, color: "var(--t2)", textAlign: "right", flexShrink: 0 }}>{f.label}</span>
                <div style={{ flex: 1, height: 3, background: "var(--border)", borderRadius: 2, position: "relative" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: barColors[f.key] || "var(--t3)" }} />
                </div>
                <span style={{ fontFamily: "var(--fb)", fontSize: isPrimary ? 9 : 10, width: 48, textAlign: "right", color: isPrimary ? "var(--amber)" : "var(--t3)", flexShrink: 0 }}>
                  {isPrimary ? `▲ ${t("twinlog.primary")}` : `${f.penalty}/${f.max}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TwinLogTrailTab({ prefillData }: { prefillData: LcPrefillData | null }) {
  const { t, i18n } = useTranslation("lcCheck"); const lang = i18n.language;
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
      <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--t2)", fontSize: 15 }}>
        {t("twinlog.noLookup")}
      </div>
    );
  }

  if (trailQuery.isLoading) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--t3)", fontSize: 15 }}>
        {t("twinlog.loading")}
      </div>
    );
  }

  if (trailQuery.isError || !trailQuery.data) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--t2)", fontSize: 15 }}>
        {t("twinlog.loadError")}
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
        alert(t("twinlog.profileRequired"));
        return;
      }
      if (!res.ok) throw new Error(t("twinlog.pdfFailed"));
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
          {t("twinlog.title")}
        </h2>
        <p style={{ fontFamily: "var(--fb)", fontSize: 15, color: "var(--t3)", marginBottom: 24, lineHeight: 1.5 }}>
          {translateCommodity(lookup.commodityName, lang)} &middot; {lookup.originName} &rarr; {lookup.destinationName}
          {lookup.twinlogLockedAt && <> &middot; {t("twinlog.locked", { date: formatTimestamp(lookup.twinlogLockedAt) })}</>}
        </p>

        {/* Included Items */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: "var(--fb)", fontSize: 15, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1 }}>
              {t("twinlog.includedItems")}
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {[
            { label: t("twinlog.complianceLookup"), status: `\u2713 ${t("twinlog.statusLocked")}`, color: "var(--app-acapulco)" },
            {
              label: t("twinlog.lcCheckResults"),
              status: lcCheck ? `\u2713 ${t("twinlog.statusLocked")}` : "\u2014",
              color: lcCheck ? "var(--app-acapulco)" : "var(--t3)",
            },
            {
              label: t("twinlog.supplierDocuments"),
              status: supplierRequest ? t("twinlog.receivedCount", { received: srDocsReceived.length, total: srDocsRequired.length }) : "\u2014",
              color: supplierRequest ? "var(--t2)" : "var(--t3)",
            },
            {
              label: t("twinlog.readinessScore"),
              status: lookup.readinessScore != null ? t("twinlog.scoreValue", { score: lookup.readinessScore }) : "\u2014",
              color: lookup.readinessScore != null ? "var(--app-acapulco)" : "var(--t3)",
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
                <span style={{ fontSize: 15, color: "var(--t2)" }}>{item.label}</span>
              </div>
              <span style={{ fontFamily: "var(--fb)", fontSize: 15, color: item.color }}>
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
                <div style={{ color: "var(--blue)", fontFamily: "var(--fb)", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                  {lookup.twinlogRef}
                </div>
                <div style={{ fontFamily: "var(--fb)", fontSize: 15, color: "var(--t3)" }}>
                  {hashDisplay}
                </div>
              </div>
              <button
                onClick={copyHash}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--t3)",
                  fontFamily: "var(--fb)",
                  fontSize: 15,
                  cursor: "pointer",
                  padding: "4px 8px",
                  whiteSpace: "nowrap",
                }}
                data-testid="button-copy-hash"
              >
                {copiedHash ? `\u2713 ${t("twinlog.hashCopied")}` : `\u2197 ${t("twinlog.copyFullHash")}`}
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
          {t("twinlog.export")}
        </span>

        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          style={{
            width: "100%",
            background: "var(--blue)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            padding: "12px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            marginBottom: 16,
            minHeight: 44,
          }}
          data-testid="button-download-pdf"
        >
          {pdfLoading ? t("twinlog.generating") : `\u2193 ${t("twinlog.downloadPdf")}`}
        </button>

        {/* Save as Template */}
        {!templateSaved ? (
          !showSaveModal ? (
            <button
              onClick={() => {
                setTemplateName(`${translateCommodity(lookup.commodityName, lang)} ${prefillData?.origin_iso2 || ""}→${prefillData?.dest_iso2 || ""}`);
                setShowSaveModal(true);
              }}
              disabled={!lookup.commodityId || !lookup.resultJson}
              style={{
                width: "100%",
                background: "transparent",
                color: (!lookup.commodityId || !lookup.resultJson) ? "var(--t3)" : "var(--t2)",
                fontWeight: 600,
                fontSize: 15,
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                cursor: (!lookup.commodityId || !lookup.resultJson) ? "not-allowed" : "pointer",
                marginBottom: 16,
                opacity: (!lookup.commodityId || !lookup.resultJson) ? 0.5 : 1,
              }}
              data-testid="button-save-template"
            >
              {t("twinlog.saveAsTemplate")}
            </button>
          ) : (
            <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--card2)", borderRadius: 14 }}>
              <div style={{ fontFamily: "var(--fb)", fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--t3)", marginBottom: 8 }}>{t("twinlog.templateName")}</div>
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "var(--card)",
                  borderRadius: 8,
                  color: "var(--t1)",
                  fontSize: 15,
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
                        alert(t("twinlog.missingData"));
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
                      alert(msg.includes("409") ? t("twinlog.duplicateTemplate") : msg);
                    }
                  }}
                  disabled={!templateName.trim()}
                  style={{
                    flex: 1,
                    background: "var(--blue)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    opacity: templateName.trim() ? 1 : 0.5,
                  }}
                  data-testid="button-confirm-save-template"
                >
                  {t("twinlog.saveTemplate")}
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  style={{
                    padding: "8px 12px",
                    background: "transparent",
                    borderRadius: 8,
                    color: "var(--t3)",
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                  data-testid="button-cancel-save-template"
                >
                  {t("twinlog.cancelSave")}
                </button>
              </div>
            </div>
          )
        ) : (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--gbg)", borderRadius: 8 }} data-testid="text-template-saved-success">
            <span style={{ fontSize: 15, color: "var(--app-acapulco)", fontWeight: 600 }}>
              {t("twinlog.templateSaved")}
            </span>
          </div>
        )}

        {/* Activity Timeline */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--fb)", fontSize: 15, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1 }}>
            {t("twinlog.history")}
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
              <div style={{ fontSize: 15, color: "var(--t2)" }}>{entry.event}</div>
              <div style={{ fontFamily: "var(--fb)", fontSize: 15, color: "var(--t3)" }}>
                {formatFullDate(entry.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
