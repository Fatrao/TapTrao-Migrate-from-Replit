import { useQuery } from "@tanstack/react-query";
import type { LcCase, LcCaseStatus, CorrectionRequestEntry, CheckHistoryEntry } from "@shared/schema";
import type { LcPrefillData } from "./constants";

function statusBadge(status: LcCaseStatus) {
  const map: Record<LcCaseStatus, { label: string; color: string; bg: string; border: string }> = {
    checking: { label: "Checking", color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
    all_clear: { label: "All Clear", color: "#15803d", bg: "#f0fdf4", border: "#86efac" },
    discrepancy: { label: "Discrepancy", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
    pending_correction: { label: "Pending Correction", color: "#b45309", bg: "#fefce8", border: "#fcd34d" },
    rechecking: { label: "Re-checking", color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
    resolved: { label: "Resolved", color: "#15803d", bg: "#f0fdf4", border: "#86efac" },
    closed: { label: "Closed", color: "#666", bg: "#f5f5f5", border: "#ddd" },
  };
  const s = map[status] ?? map.checking;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 6,
      fontSize: 11,
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
      <div style={{ padding: "80px 24px", textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
        Run an LC check first to track corrections here.
      </div>
    );
  }

  if (casesQuery.isLoading) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
        Loading case data...
      </div>
    );
  }

  if (!lcCase) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
        No LC case found for this trade. Run an LC check to create a case.
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
          <h2 style={{ fontWeight: 700, fontSize: 20, color: "#fff", margin: 0 }}>
            LC Case — {lcCase.lcReference || "No Reference"}
          </h2>
          {statusBadge(lcCase.status as LcCaseStatus)}
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0 }}>
          {lcCase.beneficiaryName || "Unknown beneficiary"} · {lcCase.recheckCount} re-check{lcCase.recheckCount !== 1 ? "s" : ""} · {Math.max(0, lcCase.maxFreeRechecks - lcCase.recheckCount)} free remaining
        </p>
      </div>

      {/* Check history timeline */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>
          Check History
        </div>
        {checkHistory.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>No checks recorded yet.</p>
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
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: verdictBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: verdictColor, flexShrink: 0 }}>
                    {entry.recheckNumber === 0 ? "1" : `R${entry.recheckNumber}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                      {entry.recheckNumber === 0 ? "Initial check" : `Re-check #${entry.recheckNumber}`}
                      <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.45)", marginLeft: 8 }}>
                        {relativeTime(entry.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                      {entry.summary}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: verdictBg, color: verdictColor, flexShrink: 0 }}>
                    {entry.verdict === "COMPLIANT" ? "✓ Clear" : entry.verdict === "COMPLIANT_WITH_NOTES" ? "⚠ Notes" : "✗ Discrepancy"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Correction request timeline */}
      {correctionRequests.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>
            Correction Requests Sent
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {correctionRequests.map((cr, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14 }}>{cr.channel === "email" ? "📧" : cr.channel === "whatsapp" ? "💬" : "🔗"}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                  Sent via {cr.channel} · {cr.discrepancyCount} discrepanc{cr.discrepancyCount > 1 ? "ies" : "y"}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>
                  {relativeTime(cr.sentAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check comparison table (initial vs latest) */}
      {comparison && comparison.initialCheck && comparison.latestCheck && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>
            Comparison — Initial vs Latest
          </div>
          <ComparisonTable
            initialResults={comparison.initialCheck.results as any[]}
            latestResults={comparison.latestCheck.results as any[]}
          />
        </div>
      )}

      {/* Re-check prompt */}
      {(lcCase.status === "discrepancy" || lcCase.status === "pending_correction") && (
        <div style={{ background: "rgba(107,144,128,0.08)", borderRadius: 14, border: "1px solid rgba(107,144,128,0.2)", padding: "20px 22px", textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#6b9080", marginBottom: 8 }}>
            Supplier sent corrected documents?
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>
            Upload the corrected supplier documents and run a free re-check to verify corrections.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button
              style={{ padding: "10px 20px", background: "#6b9080", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
              onClick={() => {
                // Navigate to the Check tab and go to step 2 (upload docs)
                window.dispatchEvent(new CustomEvent("lc-go-to-recheck"));
              }}
            >
              {lcCase.recheckCount < lcCase.maxFreeRechecks
                ? `Run Free Re-check (${lcCase.maxFreeRechecks - lcCase.recheckCount} remaining)`
                : "Run Re-check (1 credit)"
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonTable({ initialResults, latestResults }: { initialResults: any[]; latestResults: any[] }) {
  // Build a map of field → severity for latest check
  const latestMap = new Map<string, string>();
  for (const r of latestResults) {
    latestMap.set(`${r.fieldName}|${r.documentType}`, r.severity);
  }

  // Only show fields that were RED or AMBER in the initial check
  const issues = initialResults.filter(r => r.severity === "RED" || r.severity === "AMBER");

  if (issues.length === 0) {
    return <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>No discrepancies in the initial check.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", gap: 8, padding: "0 0 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Field</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", textAlign: "center" }}>Initial</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", textAlign: "center" }}>Latest</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", textAlign: "center" }}>Status</span>
      </div>
      {issues.map((r, i) => {
        const key = `${r.fieldName}|${r.documentType}`;
        const latestSeverity = latestMap.get(key) ?? "UNKNOWN";
        const fixed = latestSeverity === "GREEN";
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", gap: 8, alignItems: "center", padding: "6px 0" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{r.fieldName}</span>
            <span style={{ fontSize: 11, textAlign: "center" }}>
              <SeverityDot severity={r.severity} />
            </span>
            <span style={{ fontSize: 11, textAlign: "center" }}>
              <SeverityDot severity={latestSeverity} />
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", color: fixed ? "#15803d" : "#dc2626" }}>
              {fixed ? "✓ Fixed" : "✗ Open"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const color = severity === "GREEN" ? "#15803d" : severity === "AMBER" ? "#b45309" : severity === "RED" ? "#dc2626" : "#666";
  const bg = severity === "GREEN" ? "#f0fdf4" : severity === "AMBER" ? "#fefce8" : severity === "RED" ? "#fef2f2" : "#f5f5f5";
  const label = severity === "GREEN" ? "OK" : severity === "AMBER" ? "Warn" : severity === "RED" ? "Fail" : "?";
  return (
    <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: bg, color }}>
      {label}
    </span>
  );
}
