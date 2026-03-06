import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { LcCase, LcCaseStatus, CorrectionRequestEntry, CheckHistoryEntry } from "@shared/schema";
import type { LcPrefillData } from "./constants";

function statusBadge(status: LcCaseStatus, t: (key: string) => string) {
  const map: Record<LcCaseStatus, { label: string; color: string; bg: string; border: string }> = {
    checking: { label: t("corrections.statusChecking"), color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
    all_clear: { label: t("corrections.statusAllClear"), color: "#15803d", bg: "#f0fdf4", border: "#86efac" },
    discrepancy: { label: t("corrections.statusDiscrepancy"), color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
    pending_correction: { label: t("corrections.statusPendingCorrection"), color: "#b45309", bg: "#fefce8", border: "#fcd34d" },
    rechecking: { label: t("corrections.statusRechecking"), color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
    resolved: { label: t("corrections.statusResolved"), color: "#15803d", bg: "#f0fdf4", border: "#86efac" },
    closed: { label: t("corrections.statusClosed"), color: "#666", bg: "#f5f5f5", border: "#ddd" },
  };
  const s = map[status] ?? map.checking;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 6,
      fontSize: 15,
      fontWeight: 700,
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
      letterSpacing: ".02em",
    }}>
      {s.label}
    </span>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function CorrectionsTab({ prefillData }: { prefillData: LcPrefillData | null }) {
  const { t } = useTranslation("lcCheck");
  const lookupId = prefillData?.lookup_id;

  // Fetch all cases for this session and find the one matching this lookup
  const casesQuery = useQuery<LcCase[]>({
    queryKey: ["/api/lc-cases"],
    enabled: true,
  });

  const lcCase = casesQuery.data?.find(c => c.sourceLookupId === lookupId) ?? null;

  // Fetch comparison data if case exists
  const comparisonQuery = useQuery<{
    caseId: string;
    status: string;
    recheckCount: number;
    initialCheck: { id: string; verdict: string; results: any; summary: any; createdAt: string } | null;
    latestCheck: { id: string; verdict: string; results: any; summary: any; createdAt: string } | null;
    checkHistory: CheckHistoryEntry[];
    correctionRequests: CorrectionRequestEntry[];
  }>({
    queryKey: [`/api/lc-cases/${lcCase?.id}/comparison`],
    enabled: !!lcCase?.id,
  });

  if (!lookupId) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--t3)", fontSize: 15 }}>
        {t("corrections.noLookup")}
      </div>
    );
  }

  if (casesQuery.isLoading) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--t3)", fontSize: 15 }}>
        {t("corrections.loading")}
      </div>
    );
  }

  if (!lcCase) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--t3)", fontSize: 15 }}>
        {t("corrections.noCase")}
      </div>
    );
  }

  const checkHistory = (lcCase.checkHistory as CheckHistoryEntry[]) || [];
  const correctionRequests = (lcCase.correctionRequests as CorrectionRequestEntry[]) || [];
  const comparison = comparisonQuery.data;

  return (
    <div style={{ padding: "24px 32px 60px" }}>

      {/* Case header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: "var(--t1)", margin: 0 }}>
            {t("corrections.caseTitle", { reference: lcCase.lcReference || t("corrections.noReference") })}
          </h2>
          {statusBadge(lcCase.status as LcCaseStatus, t)}
        </div>
        <p style={{ fontSize: 15, color: "var(--t3)", margin: 0 }}>
          {lcCase.beneficiaryName || t("corrections.unknownBeneficiary")} · {t("corrections.recheckCount", { count: lcCase.recheckCount })} · {t("corrections.freeRemaining", { count: Math.max(0, lcCase.maxFreeRechecks - lcCase.recheckCount) })}
        </p>
      </div>

      {/* Check history timeline */}
      <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>
          {t("corrections.checkHistory")}
        </div>
        {checkHistory.length === 0 ? (
          <p style={{ fontSize: 15, color: "var(--t4)" }}>{t("corrections.noChecks")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {checkHistory.map((entry, i) => {
              const verdictColor = entry.verdict === "COMPLIANT" ? "#15803d"
                : entry.verdict === "COMPLIANT_WITH_NOTES" ? "#b45309"
                : "#dc2626";
              const verdictBg = entry.verdict === "COMPLIANT" ? "#f0fdf4"
                : entry.verdict === "COMPLIANT_WITH_NOTES" ? "#fefce8"
                : "#fef2f2";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: verdictBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: verdictColor, flexShrink: 0 }}>
                    {entry.recheckNumber === 0 ? "1" : `R${entry.recheckNumber}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>
                      {entry.recheckNumber === 0 ? t("corrections.initialCheck") : t("corrections.recheckNumber", { number: entry.recheckNumber })}
                      <span style={{ fontSize: 15, fontWeight: 400, color: "var(--t4)", marginLeft: 8 }}>
                        {relativeTime(entry.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: 15, color: "var(--t3)" }}>
                      {entry.summary}
                    </div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: verdictBg, color: verdictColor, flexShrink: 0 }}>
                    {entry.verdict === "COMPLIANT" ? `✓ ${t("corrections.verdictClear")}` : entry.verdict === "COMPLIANT_WITH_NOTES" ? `⚠ ${t("corrections.verdictNotes")}` : `✗ ${t("corrections.verdictDiscrepancy")}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Correction request timeline */}
      {correctionRequests.length > 0 && (
        <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>
            {t("corrections.correctionsSent")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {correctionRequests.map((cr, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15 }}>{cr.channel === "email" ? "📧" : cr.channel === "whatsapp" ? "💬" : "🔗"}</span>
                <span style={{ fontSize: 15, color: "var(--t2)" }}>
                  {t("corrections.sentVia", { channel: cr.channel, count: cr.discrepancyCount, plural: cr.discrepancyCount > 1 ? "ies" : "y" })}
                </span>
                <span style={{ fontSize: 15, color: "var(--t4)", marginLeft: "auto" }}>
                  {relativeTime(cr.sentAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check comparison table (initial vs latest) */}
      {comparison && comparison.initialCheck && comparison.latestCheck && (
        <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>
            {t("corrections.comparisonTitle")}
          </div>
          <ComparisonTable
            initialResults={comparison.initialCheck.results as any[]}
            latestResults={comparison.latestCheck.results as any[]}
          />
        </div>
      )}

      {/* Re-check prompt */}
      {(lcCase.status === "discrepancy" || lcCase.status === "pending_correction") && (
        <div style={{ background: "rgba(14,78,69,0.08)", borderRadius: 14, border: "1px solid rgba(14,78,69,0.2)", padding: "20px 22px", textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#0e4e45", marginBottom: 8 }}>
            {t("corrections.supplierCorrected")}
          </p>
          <p style={{ fontSize: 15, color: "var(--t3)", marginBottom: 14 }}>
            {t("corrections.uploadAndRecheck")}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button
              style={{ padding: "10px 20px", background: "#0e4e45", color: "#fff", borderRadius: 8, fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer" }}
              onClick={() => {
                // Navigate to the Check tab and go to step 2 (upload docs)
                window.dispatchEvent(new CustomEvent("lc-go-to-recheck"));
              }}
            >
              {lcCase.recheckCount < lcCase.maxFreeRechecks
                ? t("corrections.runFreeRecheck", { remaining: lcCase.maxFreeRechecks - lcCase.recheckCount })
                : t("corrections.runRecheckCredit")
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonTable({ initialResults, latestResults }: { initialResults: any[]; latestResults: any[] }) {
  const { t } = useTranslation("lcCheck");
  // Build a map of field → severity for latest check
  const latestMap = new Map<string, string>();
  for (const r of latestResults) {
    latestMap.set(`${r.fieldName}|${r.documentType}`, r.severity);
  }

  // Only show fields that were RED or AMBER in the initial check
  const issues = initialResults.filter(r => r.severity === "RED" || r.severity === "AMBER");

  if (issues.length === 0) {
    return <p style={{ fontSize: 15, color: "var(--t3)" }}>{t("corrections.noDiscrepancies")}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", gap: 8, padding: "0 0 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase" }}>{t("corrections.fieldColumn")}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", textAlign: "center" }}>{t("corrections.initialColumn")}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", textAlign: "center" }}>{t("corrections.latestColumn")}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--t4)", textTransform: "uppercase", textAlign: "center" }}>{t("corrections.statusColumn")}</span>
      </div>
      {issues.map((r, i) => {
        const key = `${r.fieldName}|${r.documentType}`;
        const latestSeverity = latestMap.get(key) ?? "UNKNOWN";
        const fixed = latestSeverity === "GREEN";
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", gap: 8, alignItems: "center", padding: "6px 0" }}>
            <span style={{ fontSize: 15, color: "var(--t2)" }}>{r.fieldName}</span>
            <span style={{ fontSize: 15, textAlign: "center" }}>
              <SeverityDot severity={r.severity} />
            </span>
            <span style={{ fontSize: 15, textAlign: "center" }}>
              <SeverityDot severity={latestSeverity} />
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, textAlign: "center", color: fixed ? "#15803d" : "#dc2626" }}>
              {fixed ? `✓ ${t("corrections.fixed")}` : `✗ ${t("corrections.open")}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const { t } = useTranslation("lcCheck");
  const color = severity === "GREEN" ? "#15803d" : severity === "AMBER" ? "#b45309" : severity === "RED" ? "#dc2626" : "#666";
  const bg = severity === "GREEN" ? "#f0fdf4" : severity === "AMBER" ? "#fefce8" : severity === "RED" ? "#fef2f2" : "#f5f5f5";
  const label = severity === "GREEN" ? t("corrections.statusOk") : severity === "AMBER" ? t("corrections.statusWarn") : severity === "RED" ? t("corrections.statusFail") : "?";
  return (
    <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 15, fontWeight: 700, background: bg, color }}>
      {label}
    </span>
  );
}
