import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import type { Lookup, LcCheck, LcCase, TokenTransaction, ComplianceResult, OriginCountry, Destination } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { apiRequest } from "@/lib/queryClient";
import { iso2ToFlag } from "@/components/CountryFlagBadge";

export default function Dashboard() {
  const statsQuery = useQuery<{ totalLookups: number; totalLcChecks: number; topCorridor: string | null }>({
    queryKey: ["/api/dashboard/stats"],
  });
  const lookupsQuery = useQuery<Lookup[]>({ queryKey: ["/api/lookups/recent"] });
  const lcQuery = useQuery<LcCheck[]>({ queryKey: ["/api/lc-checks/recent"] });
  const tokenQuery = useTokenBalance();
  const txQuery = useQuery<TokenTransaction[]>({ queryKey: ["/api/tokens/transactions", "?limit=10"] });
  const lcCasesQuery = useQuery<LcCase[]>({ queryKey: ["/api/lc-cases"] });
  const originsQuery = useQuery<OriginCountry[]>({ queryKey: ["/api/origins"] });
  const destinationsQuery = useQuery<Destination[]>({ queryKey: ["/api/destinations"] });
  const stats = statsQuery.data;
  usePageTitle("Dashboard", "Overview of your trade compliance activity");
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "activity">("overview");

  /* Build name → iso2 maps for emoji flag display */
  const originNameToIso2 = useMemo(() => {
    const map: Record<string, string> = {};
    for (const o of originsQuery.data ?? []) map[o.countryName] = o.iso2;
    return map;
  }, [originsQuery.data]);
  const destNameToIso2 = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of destinationsQuery.data ?? []) map[d.countryName] = d.iso2;
    return map;
  }, [destinationsQuery.data]);

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

  const balance = tokenQuery.data?.balance ?? 0;
  const totalLookups = stats?.totalLookups ?? 0;

  /* Commodity icon + color lookup */
  const commodityIcons: Record<string, { icon: string; bg: string }> = {
    cocoa: { icon: "🍫", bg: "rgba(139,90,43,0.1)" },
    cashew: { icon: "🌰", bg: "rgba(255,215,0,0.1)" },
    coffee: { icon: "☕", bg: "rgba(46,204,113,0.1)" },
    sesame: { icon: "🌿", bg: "rgba(20,184,166,0.1)" },
    diamond: { icon: "💎", bg: "rgba(168,85,247,0.1)" },
    gold: { icon: "🥇", bg: "rgba(245,158,11,0.1)" },
    cotton: { icon: "🧶", bg: "rgba(156,163,175,0.1)" },
    tea: { icon: "🍵", bg: "rgba(34,197,94,0.1)" },
    tobacco: { icon: "🍂", bg: "rgba(180,83,9,0.1)" },
    rubber: { icon: "🌳", bg: "rgba(22,163,74,0.1)" },
    vanilla: { icon: "🌾", bg: "rgba(234,179,8,0.1)" },
    shea: { icon: "🥜", bg: "rgba(217,119,6,0.1)" },
    timber: { icon: "🪵", bg: "rgba(120,53,15,0.1)" },
    fish: { icon: "🐟", bg: "rgba(59,130,246,0.1)" },
    flower: { icon: "🌸", bg: "rgba(236,72,153,0.1)" },
    sugar: { icon: "🍬", bg: "rgba(244,114,182,0.1)" },
    oil: { icon: "🛢️", bg: "rgba(107,114,128,0.1)" },
    mineral: { icon: "⛏️", bg: "rgba(75,85,99,0.1)" },
  };
  function getCommodityIcon(name: string): { icon: string; bg: string } {
    const lower = name.toLowerCase();
    for (const [key, val] of Object.entries(commodityIcons)) {
      if (lower.includes(key)) return val;
    }
    return { icon: "📦", bg: "rgba(107,144,128,0.1)" };
  }

  /* Build recent trades from lookups */
  const recentTrades: Array<{
    id: string; name: string; hs: string; hsCode: string; corridor: string;
    date: string; value: string; status: "comp" | "pend" | "rev"; statusLabel: string;
    btnLabel: string; icon: string; iconBg: string;
    originIso2: string; originName: string; destIso2: string; destName: string;
    lcCheckId?: string;
  }> = [];

  if (lookupsQuery.data) {
    for (const l of lookupsQuery.data.slice(0, 5)) {
      const ci = getCommodityIcon(l.commodityName);
      const oIso2 = originNameToIso2[l.originName] ?? "";
      const dIso2 = destNameToIso2[l.destinationName] ?? "";
      recentTrades.push({
        id: l.id,
        name: l.commodityName,
        hs: `HS ${l.hsCode}`,
        hsCode: l.hsCode,
        corridor: `${iso2ToFlag(oIso2)} ${oIso2 || "?"} → ${iso2ToFlag(dIso2)} ${dIso2 || "?"}`,
        date: new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        value: "—",
        status: l.riskLevel === "LOW" ? "comp" : l.riskLevel === "MEDIUM" ? "pend" : "rev",
        statusLabel: l.riskLevel === "LOW" ? "Compliant" : l.riskLevel === "MEDIUM" ? "Pending" : "Review",
        btnLabel: l.riskLevel === "LOW" ? "View" : "Review",
        icon: ci.icon,
        iconBg: ci.bg,
        originIso2: oIso2,
        originName: l.originName,
        destIso2: dIso2,
        destName: l.destinationName,
        lcCheckId: lcLinkMap[l.id],
      });
    }
  }

  return (
    <AppShell contentClassName="dash-content">

      {/* ── GREEN HERO BOX ── */}
      <div className="green-hero-box">
        <div className="dash-breadcrumb">Commodity › Cocoa › Ghana</div>
        <div className="dash-alert">
          <span className="alert-label">⚠ Compliance: Pending</span>
          <span className="alert-text">
            {totalLookups} lookups · {stats?.totalLcChecks ?? 0} LC checks · {balance} credits remaining
          </span>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="dash-tabs">
        <div className={`dash-tab${activeTab === "overview" ? " active" : ""}`} onClick={() => setActiveTab("overview")} style={{ cursor: "pointer" }}>Overview</div>
        <div className={`dash-tab${activeTab === "documents" ? " active" : ""}`} onClick={() => setActiveTab("documents")} style={{ cursor: "pointer" }}>Documents</div>
        <div className={`dash-tab${activeTab === "activity" ? " active" : ""}`} onClick={() => setActiveTab("activity")} style={{ cursor: "pointer" }}>Activity</div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="stat-cards">
        <div className="stat-card stat-card-link" onClick={() => navigate("/trades?filter=attention")} style={{ cursor: "pointer" }}>
          <div className="stat-icon">🏛</div>
          <div className="stat-label">Total Trade Value at Risk</div>
          <div className="stat-value">$2,345,678</div>
          <div className="stat-sub">
            <span className="up">↑ 12.5%</span> · {totalLookups} past shipments
          </div>
        </div>

        <div className="stat-card stat-card-link" onClick={() => navigate("/trades")} style={{ cursor: "pointer" }}>
          <div className="stat-icon">🔍</div>
          <div className="stat-label">Total Lookups</div>
          <div className="stat-value" data-testid="stat-compliance-lookups">
            {totalLookups} <span style={{ fontSize: 13, color: "var(--app-regent)", fontWeight: 400, fontFamily: "var(--fb)" }}>checks</span>
          </div>
          <div className="stat-sub">
            <span className="up">↑ 8%</span> vs prev. 28 days
          </div>
        </div>

        <div className="stat-card stat-card-link" onClick={() => navigate("/trades?filter=attention")} style={{ cursor: "pointer" }}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">Rejection Risk</div>
          <div className="stat-value">
            7.8% <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 12, background: "#fef3c7", color: "#d97706", marginLeft: 4 }}>Moderate</span>
          </div>
          <div className="stat-sub">
            <span className="down">↓ 1.7%</span> vs prev. 28 days
          </div>
        </div>

        <div className="stat-card ai-card">
          <div className="ai-label">Recommended with</div>
          <div className="ai-badge">AI</div>
          <Link href="/lookup">
            <button className="ai-btn" data-testid="stat-token-balance">
              Pre-Shipment<br />Check
            </button>
          </Link>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}

      {activeTab === "overview" && (
      <div className="dash-grid">

        {/* LEFT: Recent Trades */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>Recent Trades <span className="count">{recentTrades.length}</span></h3>
            <Link href="/trades"><span className="link" data-testid="link-view-all-lookups">View All ›</span></Link>
          </div>

          <table className="trade-table">
            <thead>
              <tr>
                <th>Commodity</th>
                <th>Corridor</th>
                <th>Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "var(--app-regent)" }}>
                    No trades yet. Run your first compliance check.
                  </td>
                </tr>
              ) : recentTrades.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="trade-cell">
                      <div className="trade-icon" style={{ background: t.iconBg }}>{t.icon}</div>
                      <div>
                        <div className="trade-commodity" data-testid={`lookup-name-${t.id}`}>{t.name}</div>
                        <div className="trade-hs">{t.hs}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {t.corridor}<br />
                    <span style={{ fontSize: 11, color: "var(--app-regent)" }}>{t.date}</span>
                  </td>
                  <td>{t.value}</td>
                  <td>
                    <span className={`status-badge ${
                      t.status === "comp" ? "status-compliant" :
                      t.status === "pend" ? "status-pending" : "status-review"
                    }`}>
                      {t.statusLabel}
                    </span>
                  </td>
                  <td>
                    <button className="action-link" onClick={() => {
                      if (t.lcCheckId) {
                        navigate(`/lookup?lookupId=${t.id}`);
                      } else {
                        const prefill = {
                          lookup_id: t.id,
                          commodity_name: t.name,
                          hs_code: t.hsCode,
                          origin_iso2: t.originIso2,
                          origin_name: t.originName,
                          dest_iso2: t.destIso2,
                          dest_name: t.destName,
                          incoterms: "FOB",
                          required_docs: [],
                        };
                        sessionStorage.setItem("lc_prefill", JSON.stringify(prefill));
                        navigate("/lc-check");
                      }
                    }}>{t.btnLabel}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT COLUMN: stacked panels */}
        <div className="dash-right-col">

          {/* Pending Compliance Docs */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Pending Compliance Docs</h3>
              <Link href="/inbox"><span className="link">All ›</span></Link>
            </div>

            {[
              { ic: "📄", name: "Bill of Lading", detail: "Cocoa Beans · GH → EU", st: "warn", stLabel: "⚠ 3" },
              { ic: "🌍", name: "Country of Origin", detail: "COCOBOD / Ghana Customs", st: "partial", stLabel: "60%" },
              { ic: "🔬", name: "Inspection Certificate", detail: "Port Health · Felixstowe", st: "warn", stLabel: "⚠ 2" },
              { ic: "🌿", name: "EUDR Due Diligence", detail: "Geolocation pending", st: "warn", stLabel: "⚠ 3" },
              { ic: "📋", name: "Customs Declaration", detail: "CDS · UK Import", st: "ok", stLabel: "✓ Ready" },
            ].map((d) => (
              <div key={d.name} className="pending-item">
                <div className="pending-icon">{d.ic}</div>
                <div className="pending-info">
                  <div className="pending-name">{d.name}</div>
                  <div className="pending-detail">{d.detail}</div>
                </div>
                <div className={`pending-status pending-st-${d.st}`}>{d.stLabel}</div>
              </div>
            ))}
            <div className="pending-more">+ 2 more documents</div>
          </div>

          {/* Country Card */}
          <div className="dash-card country-card">
            <div className="country-card-top">
              <div>
                <div className="country-name"><span className="live-dot" /> 🇬🇭 Ghana</div>
                <div className="country-sub">Origin · ECOWAS / WAEMU</div>
              </div>
            </div>
            <div className="country-stats">
              <div className="cs-row"><span className="cs-label">📊 ESG Score</span><span className="cs-value cs-amber">65 / 100</span></div>
              <div className="cs-row"><span className="cs-label">⏱ Avg Customs Delay</span><span className="cs-value cs-amber">3.5 days</span></div>
              <div className="cs-row"><span className="cs-label">🏛 Phyto Authority</span><span className="cs-value cs-green">PPRSD</span></div>
              <div className="cs-row"><span className="cs-label">📜 CoO Issuing Body</span><span className="cs-value cs-muted">Ghana Nat. Chamber</span></div>
              <div className="cs-row"><span className="cs-label">🍫 Cocoa Council</span><span className="cs-value cs-green">COCOBOD</span></div>
            </div>
          </div>

          {/* My LC Cases */}
          {(lcCasesQuery.data ?? []).length > 0 && (
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>My LC Cases <span className="count">{(lcCasesQuery.data ?? []).filter(c => c.status !== "closed").length}</span></h3>
                <Link href="/lc-check"><span className="link">LC Check ›</span></Link>
              </div>
              {(lcCasesQuery.data ?? []).slice(0, 4).map((c) => {
                const statusColors: Record<string, { color: string; bg: string; label: string }> = {
                  checking: { color: "#2563eb", bg: "#eff6ff", label: "Checking" },
                  all_clear: { color: "#15803d", bg: "#f0fdf4", label: "All Clear" },
                  discrepancy: { color: "#dc2626", bg: "#fef2f2", label: "Discrepancy" },
                  pending_correction: { color: "#b45309", bg: "#fefce8", label: "Pending" },
                  rechecking: { color: "#2563eb", bg: "#eff6ff", label: "Re-checking" },
                  resolved: { color: "#15803d", bg: "#f0fdf4", label: "Resolved" },
                  closed: { color: "#666", bg: "#f5f5f5", label: "Closed" },
                };
                const st = statusColors[c.status] ?? statusColors.checking;
                const actionLabel = c.status === "discrepancy" || c.status === "pending_correction"
                  ? "Follow Up →"
                  : c.status === "all_clear" || c.status === "resolved"
                  ? "View →"
                  : "Continue →";
                return (
                  <div key={c.id} className="pending-item" style={{ cursor: "pointer" }} onClick={() => {
                    if (c.sourceLookupId) {
                      navigate(`/lookup?lookupId=${c.sourceLookupId}`);
                    }
                  }}>
                    <div className="pending-icon" style={{ fontSize: 16 }}>📋</div>
                    <div className="pending-info">
                      <div className="pending-name" style={{ fontSize: 12.5 }}>
                        {c.lcReference || "LC Case"}
                      </div>
                      <div className="pending-detail" style={{ fontSize: 11 }}>
                        {c.beneficiaryName || "Unknown"} · {c.recheckCount} re-check{c.recheckCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                      <span style={{ fontSize: 10.5, color: "var(--app-regent)" }}>
                        {actionLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compliance Status */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Compliance Status</h3>
              <Link href="/alerts"><span className="link">View All ›</span></Link>
            </div>
            <div className="comp-status-body">
              <div className="comp-row">
                <span className="comp-pct">78%</span>
                <span className="comp-sub">Verified · 8 of 10</span>
              </div>
              <div className="comp-progress"><div className="comp-fill" style={{ width: "78%" }} /></div>
              <div className="comp-tiles">
                <div className="comp-tile">
                  <div className="comp-tile-ic">📁</div>
                  <div className="comp-tile-lbl">Documents</div>
                  <div className="comp-tile-cnt comp-red">7 of 10</div>
                </div>
                <div className="comp-tile">
                  <div className="comp-tile-ic">🛡️</div>
                  <div className="comp-tile-lbl">Risks</div>
                  <div className="comp-tile-cnt comp-amber">3 flagged</div>
                </div>
                <div className="comp-tile">
                  <div className="comp-tile-ic">🚩</div>
                  <div className="comp-tile-lbl">Sanctions</div>
                  <div className="comp-tile-cnt comp-amber">Pending</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Recent Activity</h3>
              <Link href="/trades"><span className="link">View ›</span></Link>
            </div>
            <div className="activity-list">
              {(lookupsQuery.data ?? []).slice(0, 2).map((l, i) => (
                <div key={l.id} className="activity-item">
                  <div className="act-avatar" style={{ background: i === 0 ? "rgba(113,171,145,0.12)" : "rgba(234,179,8,0.12)", color: i === 0 ? "var(--app-acapulco)" : "#d97706" }}>F</div>
                  <div className="act-content">
                    <div className="act-text"><strong>You</strong> ran compliance lookup · {l.commodityName}</div>
                    <div className="act-time">{new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                  </div>
                </div>
              ))}
              {(lcQuery.data ?? []).slice(0, 1).map((lc) => (
                <div key={lc.id} className="activity-item">
                  <div className="act-avatar" style={{ background: "rgba(20,184,166,0.12)", color: "#0d9488" }}>F</div>
                  <div className="act-content">
                    <div className="act-text"><strong>You</strong> submitted LC check</div>
                    <div className="act-time">{new Date(lc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                  </div>
                </div>
              ))}
              {(lookupsQuery.data ?? []).length === 0 && (lcQuery.data ?? []).length === 0 && (
                <div style={{ textAlign: "center", padding: 16, color: "var(--app-regent)", fontSize: 13 }}>No recent activity</div>
              )}
            </div>
          </div>

        </div>

      </div>
      )}

      {activeTab === "documents" && (
      <div className="dash-grid" style={{ gridTemplateColumns: "1fr" }}>
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>Pending Compliance Documents</h3>
            <Link href="/inbox"><span className="link">Supplier Inbox ›</span></Link>
          </div>
          {recentTrades.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--app-regent)", fontSize: 13 }}>
              No trades yet. Run a compliance check to see document requirements.
            </div>
          ) : recentTrades.map((t) => (
            <div key={t.id} className="pending-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/lookup?lookupId=${t.id}`)}>
              <div className="pending-icon">{t.icon}</div>
              <div className="pending-info">
                <div className="pending-name">{t.name}</div>
                <div className="pending-detail">{t.corridor} · {t.hs}</div>
              </div>
              <div className={`pending-status pending-st-${t.status === "comp" ? "ok" : "warn"}`}>
                {t.status === "comp" ? "✓ Ready" : t.statusLabel}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {activeTab === "activity" && (
      <div className="dash-grid" style={{ gridTemplateColumns: "1fr" }}>
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>All Activity</h3>
            <Link href="/trades"><span className="link">Trades ›</span></Link>
          </div>
          <div className="activity-list">
            {(lookupsQuery.data ?? []).map((l) => (
              <div key={l.id} className="activity-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/lookup?lookupId=${l.id}`)}>
                <div className="act-avatar" style={{ background: "rgba(113,171,145,0.12)", color: "var(--app-acapulco)" }}>F</div>
                <div className="act-content">
                  <div className="act-text"><strong>You</strong> ran compliance lookup · {l.commodityName}</div>
                  <div className="act-time">{new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
            {(lcQuery.data ?? []).map((lc) => (
              <div key={lc.id} className="activity-item">
                <div className="act-avatar" style={{ background: "rgba(20,184,166,0.12)", color: "#0d9488" }}>F</div>
                <div className="act-content">
                  <div className="act-text"><strong>You</strong> submitted LC check</div>
                  <div className="act-time">{new Date(lc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
            {(lookupsQuery.data ?? []).length === 0 && (lcQuery.data ?? []).length === 0 && (
              <div style={{ textAlign: "center", padding: 32, color: "var(--app-regent)", fontSize: 13 }}>No activity yet. Start a compliance check.</div>
            )}
          </div>
        </div>
      </div>
      )}

    </AppShell>
  );
}
