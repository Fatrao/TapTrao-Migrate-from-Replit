import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, FileCheck, ArrowRight, TrendingUp, Clock, ArrowDown, ArrowUp } from "lucide-react";
import type { Lookup, LcCheck, TokenTransaction, ComplianceResult } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { apiRequest } from "@/lib/queryClient";

function riskBadge(level: string) {
  const map: Record<string, { bg: string; bd: string; color: string }> = {
    STOP: { bg: "var(--rbg)", bd: "var(--rbd)", color: "var(--red)" },
    HIGH: { bg: "var(--rbg)", bd: "var(--rbd)", color: "var(--red)" },
    MEDIUM: { bg: "var(--abg)", bd: "var(--abd)", color: "var(--amber)" },
    LOW: { bg: "var(--gbg)", bd: "var(--gbd)", color: "var(--green)" },
  };
  const s = map[level] || map.MEDIUM;
  return (
    <span
      style={{
        fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500,
        padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em",
        textTransform: "uppercase", background: s.bg, border: `1px solid ${s.bd}`, color: s.color,
      }}
    >
      {level}
    </span>
  );
}

function readinessScoreBadge(score: number, verdict: string) {
  const map: Record<string, { bg: string; bd: string; color: string; label: string }> = {
    GREEN: { bg: "var(--gbg)", bd: "var(--gbd)", color: "var(--green)", label: "LOW RISK" },
    AMBER: { bg: "var(--abg)", bd: "var(--abd)", color: "var(--amber)", label: "MODERATE" },
    RED: { bg: "var(--rbg)", bd: "var(--rbd)", color: "var(--red)", label: "HIGH RISK" },
  };
  const s = map[verdict] || map.AMBER;
  return (
    <span
      style={{
        fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500,
        padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em",
        textTransform: "uppercase", background: s.bg, border: `1px solid ${s.bd}`, color: s.color,
      }}
      data-testid={`badge-score-${score}`}
    >
      {score} {s.label}
    </span>
  );
}

function verdictBadge(verdict: string) {
  const map: Record<string, { bg: string; bd: string; color: string }> = {
    COMPLIANT: { bg: "var(--gbg)", bd: "var(--gbd)", color: "var(--green)" },
    COMPLIANT_WITH_NOTES: { bg: "var(--abg)", bd: "var(--abd)", color: "var(--amber)" },
    DISCREPANCIES_FOUND: { bg: "var(--rbg)", bd: "var(--rbd)", color: "var(--red)" },
  };
  const s = map[verdict] || map.COMPLIANT_WITH_NOTES;
  const label = verdict.replace(/_/g, " ");
  return (
    <span
      style={{
        fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500,
        padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em",
        textTransform: "uppercase", background: s.bg, border: `1px solid ${s.bd}`, color: s.color,
      }}
    >
      {label}
    </span>
  );
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
};

export default function Dashboard() {
  const statsQuery = useQuery<{ totalLookups: number; totalLcChecks: number; topCorridor: string | null }>({
    queryKey: ["/api/dashboard/stats"],
  });
  const lookupsQuery = useQuery<Lookup[]>({ queryKey: ["/api/lookups/recent"] });
  const lcQuery = useQuery<LcCheck[]>({ queryKey: ["/api/lc-checks/recent"] });
  const tokenQuery = useTokenBalance();
  const txQuery = useQuery<TokenTransaction[]>({ queryKey: ["/api/tokens/transactions", "?limit=10"] });

  const stats = statsQuery.data;
  usePageTitle("Dashboard", "Overview of your trade compliance activity");

  const [, navigate] = useLocation();

  const lookupIds = lookupsQuery.data?.map(l => l.id) ?? [];
  const lcLinksQuery = useQuery<Record<string, string>>({
    queryKey: ["/api/lc-checks/linked-lookups", lookupIds],
    queryFn: async () => {
      if (!lookupIds.length) return {};
      const res = await apiRequest("POST", "/api/lc-checks/linked-lookups", { lookupIds });
      return res.json();
    },
    enabled: lookupIds.length > 0,
  });
  const lcLinkMap = lcLinksQuery.data ?? {};

  const recentActivity: Array<{
    id: string;
    type: "lookup" | "lc-check";
    label: string;
    detail: string;
    badge: JSX.Element | null;
    scoreBadge: JSX.Element | null;
    lcLinked: boolean | null;
    lookupData: Lookup | null;
    date: Date;
  }> = [];

  if (lookupsQuery.data) {
    for (const l of lookupsQuery.data.slice(0, 5)) {
      recentActivity.push({
        id: l.id,
        type: "lookup",
        label: l.commodityName,
        detail: `${l.originName} → ${l.destinationName} | HS ${l.hsCode}`,
        badge: riskBadge(l.riskLevel),
        scoreBadge: l.readinessScore != null ? readinessScoreBadge(l.readinessScore, l.readinessVerdict as string) : null,
        lcLinked: !!lcLinkMap[l.id],
        lookupData: l,
        date: new Date(l.createdAt),
      });
    }
  }

  if (lcQuery.data) {
    for (const lc of lcQuery.data.slice(0, 5)) {
      recentActivity.push({
        id: lc.id,
        type: "lc-check",
        label: lc.integrityHash ? `LC ref: ${lc.integrityHash.substring(0, 20)}...` : "LC Check",
        detail: `Verdict: ${lc.verdict?.replace(/_/g, " ") ?? "—"}`,
        badge: lc.verdict ? verdictBadge(lc.verdict) : null,
        scoreBadge: null,
        lcLinked: null,
        lookupData: null,
        date: new Date(lc.createdAt),
      });
    }
  }

  recentActivity.sort((a, b) => b.date.getTime() - a.date.getTime());

  const statCards = [
    { label: "Token Balance", value: tokenQuery.isLoading ? "..." : String(tokenQuery.data?.balance ?? 0), color: "var(--blue)", sub: tokenQuery.data && !tokenQuery.data.freeLookupUsed ? "+ 1 free lookup available" : undefined },
    { label: "Compliance Lookups", value: statsQuery.isLoading ? "..." : String(stats?.totalLookups ?? 0), color: "var(--t1)" },
    { label: "LC Checks", value: statsQuery.isLoading ? "..." : String(stats?.totalLcChecks ?? 0), color: "var(--t1)" },
    { label: "Top Corridor", value: statsQuery.isLoading ? "..." : stats?.topCorridor ?? "—", color: "var(--t1)", small: true },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 28, color: "var(--t1)", letterSpacing: "-0.5px", marginBottom: 4 }}
            data-testid="text-dashboard-title"
          >
            {getGreeting()}
          </h1>
          <p style={{ fontSize: 13, color: "var(--t2)" }}>Your trade activity at a glance.</p>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {statCards.map((c) => (
            <div
              key={c.label}
              style={{ background: "var(--card)", borderRadius: 14, padding: "20px 24px" }}
            >
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: "var(--t3)", textTransform: "uppercase", marginBottom: 8 }}>
                {c.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--fh)", fontWeight: 900,
                  fontSize: c.small ? 16 : 28, color: c.color, letterSpacing: -1, lineHeight: 1,
                }}
                data-testid={`stat-${c.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {c.value}
              </div>
              {c.sub && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 6 }}>{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
          <Link href="/lookup">
            <div
              style={{ background: "var(--card)", borderRadius: 14, padding: "20px 24px", cursor: "pointer", transition: "background .15s", position: "relative", overflow: "hidden" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--card)"; }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(74,195,41,0.3), transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--blue-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Search size={18} style={{ color: "var(--blue)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>Run Compliance Lookup</div>
                  <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 2 }}>Check tariffs, SPS, and regulatory triggers</div>
                </div>
                <ArrowRight size={16} style={{ color: "var(--t3)", flexShrink: 0 }} />
              </div>
            </div>
          </Link>
          <Link href="/lc-check">
            <div
              style={{ background: "var(--card)", borderRadius: 14, padding: "20px 24px", cursor: "pointer", transition: "background .15s", position: "relative", overflow: "hidden" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--card)"; }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(74,195,41,0.3), transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--gbg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileCheck size={18} style={{ color: "var(--green)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>LC Document Check</div>
                  <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 2 }}>Cross-check LC terms against documents</div>
                </div>
                <ArrowRight size={16} style={{ color: "var(--t3)", flexShrink: 0 }} />
              </div>
            </div>
          </Link>
        </div>

        {/* TWO COLUMNS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Recent Activity */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: "var(--t3)", textTransform: "uppercase" }}>
                Recent Activity
              </div>
              <Link href="/trades">
                <span style={{ fontSize: 11, color: "var(--blue)", cursor: "pointer", fontWeight: 600 }} data-testid="link-view-all-lookups">
                  View all →
                </span>
              </Link>
            </div>
            {lookupsQuery.isLoading || lcQuery.isLoading ? (
              <div style={{ background: "var(--card)", borderRadius: 14, padding: 24, textAlign: "center", color: "var(--t3)", fontSize: 13 }}>Loading...</div>
            ) : !recentActivity.length ? (
              <div style={{ background: "var(--card)", borderRadius: 14, padding: 24, textAlign: "center", color: "var(--t3)", fontSize: 13 }}>No activity yet. Run your first compliance check.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {recentActivity.slice(0, 8).map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    style={{ background: "var(--card)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500,
                          padding: "2px 6px", borderRadius: 3, background: "var(--card2)", color: "var(--t3)",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                          {item.type === "lookup" ? "Lookup" : "LC Check"}
                        </span>
                        <span
                          style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          data-testid={item.type === "lookup" ? `lookup-name-${item.id}` : `lc-ref-${item.id}`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.detail}
                      </div>
                    </div>
                    {item.scoreBadge}
                    {item.badge}
                    {item.type === "lookup" && item.lcLinked && (
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500,
                          padding: "3px 8px", borderRadius: 4, background: "var(--gbg)",
                          border: "1px solid var(--gbd)", color: "var(--green)",
                        }}
                        data-testid={`lc-linked-${item.id}`}
                      >
                        LC ✓
                      </span>
                    )}
                    {item.type === "lookup" && item.lcLinked === false && item.lookupData && (
                      <button
                        style={{ fontSize: 11, color: "var(--t3)", cursor: "pointer", background: "none", border: "none", whiteSpace: "nowrap" }}
                        data-testid={`lc-unlinked-${item.id}`}
                        onClick={() => {
                          const l = item.lookupData!;
                          const resultJson = l.resultJson as ComplianceResult;
                          const supplierDocs = resultJson?.requirementsDetailed
                            ?.filter((r: any) => r.isSupplierSide)
                            ?.map((r: any) => r.title) ?? [];
                          const prefillData = {
                            lookup_id: l.id,
                            commodity_name: l.commodityName,
                            hs_code: l.hsCode,
                            origin_iso2: resultJson?.origin?.iso2 ?? "",
                            origin_name: l.originName,
                            dest_iso2: resultJson?.destination?.iso2 ?? "",
                            dest_name: l.destinationName,
                            incoterms: "FOB",
                            required_docs: supplierDocs,
                          };
                          sessionStorage.setItem("lc_prefill", JSON.stringify(prefillData));
                          navigate("/lc-check");
                        }}
                      >
                        LC —
                      </button>
                    )}
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)", whiteSpace: "nowrap" }}>
                      {item.date.toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Token History */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: "var(--t3)", textTransform: "uppercase" }}>
                Token History
              </div>
              <Link href="/pricing">
                <span style={{ fontSize: 11, color: "var(--blue)", cursor: "pointer", fontWeight: 600 }} data-testid="link-buy-more">
                  Buy more →
                </span>
              </Link>
            </div>
            {txQuery.isLoading ? (
              <div style={{ background: "var(--card)", borderRadius: 14, padding: 24, textAlign: "center", color: "var(--t3)", fontSize: 13 }}>Loading...</div>
            ) : !txQuery.data?.length ? (
              <div style={{ background: "var(--card)", borderRadius: 14, padding: 24, textAlign: "center", color: "var(--t3)", fontSize: 13 }}>No token transactions yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {txQuery.data.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    style={{ background: "var(--card)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
                  >
                    {tx.type === "PURCHASE" ? (
                      <ArrowDown size={14} style={{ color: "var(--green)", flexShrink: 0 }} />
                    ) : (
                      <ArrowUp size={14} style={{ color: "var(--t3)", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} data-testid={`tx-desc-${tx.id}`}>
                        {tx.description}
                      </div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)", marginTop: 2 }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                        color: tx.amount > 0 ? "var(--green)" : "var(--t3)",
                      }}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
