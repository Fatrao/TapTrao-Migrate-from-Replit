import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, FileCheck, ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
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
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: s.bg, border: `1px solid ${s.bd}`, color: s.color, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {level}
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
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: s.bg, border: `1px solid ${s.bd}`, color: s.color, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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
    id: string; type: "lookup" | "lc-check"; label: string; detail: string;
    badge: JSX.Element | null; lcLinked: boolean | null; lookupData: Lookup | null; date: Date;
  }> = [];

  if (lookupsQuery.data) {
    for (const l of lookupsQuery.data.slice(0, 5)) {
      recentActivity.push({
        id: l.id, type: "lookup", label: l.commodityName,
        detail: `${l.originName} → ${l.destinationName} | HS ${l.hsCode}`,
        badge: riskBadge(l.riskLevel), lcLinked: !!lcLinkMap[l.id], lookupData: l,
        date: new Date(l.createdAt),
      });
    }
  }
  if (lcQuery.data) {
    for (const lc of lcQuery.data.slice(0, 5)) {
      recentActivity.push({
        id: lc.id, type: "lc-check",
        label: lc.integrityHash ? `LC ref: ${lc.integrityHash.substring(0, 20)}...` : "LC Check",
        detail: `Verdict: ${lc.verdict?.replace(/_/g, " ") ?? "—"}`,
        badge: lc.verdict ? verdictBadge(lc.verdict) : null,
        lcLinked: null, lookupData: null, date: new Date(lc.createdAt),
      });
    }
  }
  recentActivity.sort((a, b) => b.date.getTime() - a.date.getTime());

  const balance = tokenQuery.data?.balance ?? 0;
  const totalLookups = stats?.totalLookups ?? 0;
  const totalLcChecks = stats?.totalLcChecks ?? 0;

  return (
    <AppShell>
      {/* HERO — dark green gradient box */}
      <div style={{
        margin: "0 14px", borderRadius: 16, padding: "20px 24px 44px", position: "relative", overflow: "hidden",
        background: "linear-gradient(180deg, #0d2218 0%, #0f2a1e 30%, #143424 55%, #1a4030 75%, rgba(26,60,44,0.7) 88%, rgba(26,60,44,0) 100%)",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)",
            borderRadius: 24, padding: "4px 14px", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 12,
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          }}>
            Dashboard › Overview
          </div>
          <div style={{
            fontFamily: "var(--fh)", fontSize: 30, fontWeight: 700, color: "#fff",
            letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 7,
          }} data-testid="text-dashboard-title">
            {getGreeting()}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            Your trade activity at a glance.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 2, flexShrink: 0 }}>
          <Link href="/lookup">
            <span style={{
              background: "var(--green)", color: "#000", padding: "9px 18px", borderRadius: 9,
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--fb)",
              display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 18px rgba(74,140,111,0.35)",
              whiteSpace: "nowrap", transition: "all 0.15s",
            }}>
              New Lookup →
            </span>
          </Link>
        </div>
      </div>

      {/* STAT CARDS — overlap the hero */}
      <div style={{ padding: "0 14px 20px", marginTop: -28, position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 12 }}>
          {/* Trade Value card */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", borderRadius: 16, background: "radial-gradient(circle at 0% 0%, rgba(74,140,111,0.13) 0%, transparent 60%)" }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, position: "relative", zIndex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(74,140,111,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏦</div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--txt3)", marginBottom: 4, position: "relative", zIndex: 1 }}>Token Balance</div>
            <div style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "var(--txt)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 9, position: "relative", zIndex: 1 }} data-testid="stat-token-balance">
              {tokenQuery.isLoading ? "..." : balance}
              <span style={{ fontSize: 13, color: "var(--txt3)", fontWeight: 400, fontFamily: "var(--fb)", marginLeft: 4 }}>credits</span>
            </div>
            <div style={{ fontSize: 11.5, position: "relative", zIndex: 1 }}>
              {tokenQuery.data && !tokenQuery.data.freeLookupUsed ? (
                <span style={{ color: "var(--green)", fontWeight: 600 }}>+ 1 free lookup available</span>
              ) : (
                <span style={{ color: "var(--txt3)" }}>All free lookups used</span>
              )}
            </div>
          </div>

          {/* Total Lookups card */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", borderRadius: 16, background: "radial-gradient(circle at 0% 0%, rgba(46,134,98,0.12) 0%, transparent 60%)" }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, position: "relative", zIndex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(46,134,98,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔖</div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--txt3)", marginBottom: 4, position: "relative", zIndex: 1 }}>Total Lookups</div>
            <div style={{ fontFamily: "var(--fh)", fontSize: 24, fontWeight: 700, color: "var(--txt)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 9, position: "relative", zIndex: 1 }} data-testid="stat-compliance-lookups">
              {statsQuery.isLoading ? "..." : totalLookups}
              <span style={{ fontSize: 13, color: "var(--txt3)", fontWeight: 400, fontFamily: "var(--fb)", marginLeft: 4 }}>checks</span>
            </div>
            <div style={{ fontSize: 11.5, position: "relative", zIndex: 1, color: "var(--txt3)" }}>
              {stats?.topCorridor ? <><span style={{ color: "var(--green)", fontWeight: 600 }}>Top:</span> {stats.topCorridor}</> : "Run your first check"}
            </div>
          </div>

          {/* LC Checks card */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", borderRadius: 16, background: "radial-gradient(circle at 0% 0%, rgba(234,139,67,0.11) 0%, transparent 60%)" }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, position: "relative", zIndex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(234,139,67,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📄</div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--txt3)", marginBottom: 4, position: "relative", zIndex: 1 }}>LC Checks</div>
            <div style={{ fontFamily: "var(--fh)", fontSize: 24, fontWeight: 700, color: "var(--txt)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 9, position: "relative", zIndex: 1 }} data-testid="stat-lc-checks">
              {statsQuery.isLoading ? "..." : totalLcChecks}
              <span style={{ fontSize: 13, color: "var(--txt3)", fontWeight: 400, fontFamily: "var(--fb)", marginLeft: 4 }}>checks</span>
            </div>
            <div style={{ fontSize: 11.5, position: "relative", zIndex: 1, color: "var(--txt3)" }}>
              UCP 600 + ISBP 745
            </div>
          </div>

          {/* CTA card */}
          <div style={{
            background: "#0a0a0a", borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden", cursor: "pointer",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }} onClick={() => navigate("/lookup")}>
            <div style={{
              position: "absolute", bottom: -20, right: -20, width: 130, height: 130, borderRadius: "50%", pointerEvents: "none",
              background: "radial-gradient(circle, rgba(74,140,111,0.28) 0%, rgba(74,140,111,0.06) 50%, transparent 70%)",
              animation: "breathe 3.5s ease-in-out infinite",
            }} />
            <div style={{ fontFamily: "var(--fh)", fontSize: 32, fontWeight: 800, color: "var(--green)", letterSpacing: "-0.05em", lineHeight: 1, position: "relative", zIndex: 1 }}>
              $0
            </div>
            <div style={{ fontSize: 11.5, color: "#555", margin: "3px 0 14px", position: "relative", zIndex: 1 }}>
              Pre-Shipment Check with <span style={{ color: "var(--green)", fontWeight: 600 }}>AI</span>
            </div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green)", color: "#000",
              padding: "8px 14px", borderRadius: 22, fontSize: 12, fontWeight: 700, fontFamily: "var(--fb)",
              cursor: "pointer", position: "relative", zIndex: 1, boxShadow: "0 4px 16px rgba(74,140,111,0.4)",
            }}>
              Pre-Shipment Check →
            </span>
          </div>
        </div>
      </div>

      {/* WHITE CONTENT AREA */}
      <div style={{ padding: "4px 14px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 330px", gap: 12, alignItems: "start" }}>
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Quick Actions */}
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--fh)", fontSize: 13.5, fontWeight: 700, color: "var(--txt)", display: "flex", alignItems: "center", gap: 8 }}>
                  Quick Actions
                </div>
              </div>
              <div style={{ height: 1, background: "#f5f5f5" }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: "12px 20px" }}>
                {[
                  { icon: "🔍", label: "New Lookup", href: "/lookup" },
                  { icon: "📄", label: "LC Check", href: "/lc-check" },
                  { icon: "📋", label: "Templates", href: "/templates" },
                  { icon: "💰", label: "Buy Credits", href: "/pricing" },
                ].map((a) => (
                  <Link key={a.label} href={a.href}>
                    <div style={{
                      background: "#f7f7f7", borderRadius: 11, padding: "13px 8px", cursor: "pointer",
                      textAlign: "center", transition: "all 0.18s",
                    }}>
                      <span style={{ fontSize: 19, marginBottom: 6, display: "block" }}>{a.icon}</span>
                      <span style={{ fontSize: 11.5, color: "var(--txt2)", fontWeight: 500, lineHeight: 1.3 }}>{a.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity Table */}
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--fh)", fontSize: 13.5, fontWeight: 700, color: "var(--txt)", display: "flex", alignItems: "center", gap: 8 }}>
                  Recent Activity
                  <span style={{ background: "#f5f5f5", color: "var(--txt3)", fontSize: 11, padding: "1px 7px", borderRadius: 12, fontFamily: "var(--fb)" }}>{recentActivity.length}</span>
                </div>
                <Link href="/trades">
                  <span style={{ fontSize: 12, color: "var(--txt3)", cursor: "pointer" }} data-testid="link-view-all-lookups">View All ›</span>
                </Link>
              </div>
              <div style={{ height: 1, background: "#f5f5f5" }} />

              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 68px",
                padding: "7px 20px", fontSize: 10.5, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: "0.08em", background: "#fafafa",
              }}>
                <span>Item</span><span>Date</span><span>Status</span><span></span>
              </div>

              {/* Table rows */}
              {lookupsQuery.isLoading || lcQuery.isLoading ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--txt3)", fontSize: 13 }}>Loading...</div>
              ) : !recentActivity.length ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--txt3)", fontSize: 13 }}>No activity yet. Run your first compliance check.</div>
              ) : (
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {recentActivity.slice(0, 8).map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      style={{
                        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 68px",
                        padding: "11px 20px", alignItems: "center", cursor: "pointer", transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#fafafa"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
                          background: item.type === "lookup" ? "rgba(74,140,111,0.1)" : "rgba(234,139,67,0.1)",
                        }}>
                          {item.type === "lookup" ? "🔍" : "📄"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--txt)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            data-testid={item.type === "lookup" ? `lookup-name-${item.id}` : `lc-ref-${item.id}`}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.detail}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--txt3)" }}>
                        {item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <div>{item.badge}</div>
                      <div>
                        <span style={{
                          fontSize: 11.5, color: "var(--txt2)", cursor: "pointer", padding: "4px 10px",
                          borderRadius: 7, background: "#f5f5f5", fontFamily: "var(--fb)",
                        }}
                          onClick={() => {
                            if (item.type === "lookup") navigate(`/lookup/${item.id}`);
                            else navigate(`/lc-check/${item.id}`);
                          }}
                        >
                          View
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Token History */}
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--fh)", fontSize: 13.5, fontWeight: 700, color: "var(--txt)", display: "flex", alignItems: "center", gap: 8 }}>
                  Credits
                </div>
                <Link href="/pricing">
                  <span style={{ fontSize: 12, color: "var(--txt3)", cursor: "pointer" }} data-testid="link-buy-more">Buy more ›</span>
                </Link>
              </div>
              <div style={{ height: 1, background: "#f5f5f5" }} />
              <div style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 9 }}>
                  <span style={{ fontFamily: "var(--fh)", fontSize: 24, fontWeight: 700, color: "var(--txt)", letterSpacing: "-0.04em" }} data-testid="stat-token-balance-side">
                    {tokenQuery.isLoading ? "..." : balance}
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--txt3)" }}>credits remaining</span>
                </div>
                <div style={{ height: 6, background: "#f0f0f0", borderRadius: 20, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ height: "100%", borderRadius: 20, background: "linear-gradient(90deg, var(--green), var(--teal))", width: `${Math.min(100, balance * 4)}%` }} />
                </div>
              </div>
              <div style={{ height: 1, background: "#f5f5f5" }} />
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {txQuery.isLoading ? (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--txt3)", fontSize: 12 }}>Loading...</div>
                ) : !txQuery.data?.length ? (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--txt3)", fontSize: 12 }}>No transactions yet.</div>
                ) : (
                  txQuery.data.slice(0, 5).map((tx) => (
                    <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 20px", cursor: "pointer" }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, background: "#f5f5f5", flexShrink: 0,
                      }}>
                        {tx.type === "PURCHASE" ? <ArrowDown size={12} style={{ color: "var(--green)" }} /> : <ArrowUp size={12} style={{ color: "var(--txt3)" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--txt)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} data-testid={`tx-desc-${tx.id}`}>
                          {tx.description}
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 1 }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap",
                        color: tx.amount > 0 ? "var(--green)" : "var(--red)",
                      }}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Alerts / Notices */}
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--fh)", fontSize: 13.5, fontWeight: 700, color: "var(--txt)", display: "flex", alignItems: "center", gap: 8 }}>
                  Alerts
                </div>
                <Link href="/alerts">
                  <span style={{ fontSize: 12, color: "var(--txt3)", cursor: "pointer" }}>View All ›</span>
                </Link>
              </div>
              <div style={{ height: 1, background: "#f5f5f5" }} />
              {[
                { icon: "⚠️", iconBg: "rgba(234,139,67,0.1)", title: "EUDR deadline approaching", desc: "New deforestation-free requirements apply from Dec 2025", time: "2h ago" },
                { icon: "🔔", iconBg: "rgba(46,134,98,0.1)", title: "CBAM reporting period open", desc: "Q4 2025 CBAM reports due by Jan 31, 2026", time: "1d ago" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "11px 20px", cursor: "pointer" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 1, background: a.iconBg }}>
                    {a.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--txt)", marginBottom: 2 }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--txt3)", lineHeight: 1.45 }}>{a.desc}</div>
                    <div style={{ fontSize: 10.5, color: "#ccc", marginTop: 3 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
