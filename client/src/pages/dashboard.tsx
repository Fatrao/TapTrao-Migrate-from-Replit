import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import type { Lookup, LcCheck, LcCase, TokenTransaction, ComplianceResult, OriginCountry, Destination } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { iso2ToFlag } from "@/components/CountryFlagBadge";

export default function Dashboard() {
  const { t } = useTranslation("dashboard");
  const { t: tc } = useTranslation("common");
  const { user } = useAuth();
  const statsQuery = useQuery<{ totalLookups: number; totalLcChecks: number; topCorridor: string | null; totalTradeValue: number }>({
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
    return { icon: "📦", bg: "rgba(14,78,69,0.1)" };
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
        value: l.tradeValue ? `$${Number(l.tradeValue).toLocaleString()}` : "—",
        status: l.riskLevel === "LOW" ? "comp" : l.riskLevel === "MEDIUM" ? "pend" : "rev",
        statusLabel: l.riskLevel === "LOW" ? t("status.compliant") : l.riskLevel === "MEDIUM" ? t("status.pending") : t("status.review"),
        btnLabel: l.riskLevel === "LOW" ? t("btn.view") : t("btn.review"),
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
        <div className="dash-breadcrumb">
          {user ? t("welcomeBack", { name: user.displayName || user.email.split("@")[0] }) : t("title")}
        </div>
        <div className="dash-alert">
          <span className="alert-label">
            {totalLookups > 0 ? t("lookups_other", { count: totalLookups }) : t("lookups_zero")}
          </span>
          <span className="alert-text">
            {t("lcChecksRemaining", { lcCount: stats?.totalLcChecks ?? 0, balance, checkWord: balance === 1 ? t("check") : t("checks") })}
            {stats?.topCorridor ? t("topCorridor", { corridor: stats.topCorridor }) : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Link href="/new-check">
            <button className="ai-btn" data-testid="stat-new-check" style={{ fontSize: 14, padding: "6px 16px" }}>
              {t("newCheck")}
            </button>
          </Link>
          <Link href="/inbox">
            <button className="ai-btn" data-testid="stat-supplier-link" style={{ fontSize: 14, padding: "6px 16px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
              {t("supplierInbox")}
            </button>
          </Link>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="dash-tabs">
        <div className={`dash-tab${activeTab === "overview" ? " active" : ""}`} onClick={() => setActiveTab("overview")} style={{ cursor: "pointer" }}>{t("tab.overview")}</div>
        <div className={`dash-tab${activeTab === "documents" ? " active" : ""}`} onClick={() => setActiveTab("documents")} style={{ cursor: "pointer" }}>{t("tab.documents")}</div>
        <div className={`dash-tab${activeTab === "activity" ? " active" : ""}`} onClick={() => setActiveTab("activity")} style={{ cursor: "pointer" }}>{t("tab.activity")}</div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="stat-cards">
        <div className="stat-card stat-card-link" onClick={() => navigate("/trades")} style={{ cursor: "pointer" }}>
          <div className="stat-icon">🔍</div>
          <div className="stat-label">{t("stat.complianceLookups")}</div>
          <div className="stat-value" data-testid="stat-compliance-lookups">
            {totalLookups} <span style={{ fontSize: 13, color: "var(--app-regent)", fontWeight: 400, fontFamily: "var(--fb)" }}>{t("stat.checks")}</span>
          </div>
          <div className="stat-sub">{t("stat.allTime")}</div>
        </div>

        <div className="stat-card stat-card-link" onClick={() => navigate("/trades")} style={{ cursor: "pointer" }}>
          <div className="stat-icon">📄</div>
          <div className="stat-label">{t("stat.lcChecks")}</div>
          <div className="stat-value">
            {stats?.totalLcChecks ?? 0} <span style={{ fontSize: 13, color: "var(--app-regent)", fontWeight: 400, fontFamily: "var(--fb)" }}>{t("stat.checks")}</span>
          </div>
          <div className="stat-sub">{t("stat.docValidations")}</div>
        </div>

        <div className="stat-card stat-card-link" onClick={() => navigate("/pricing")} style={{ cursor: "pointer" }}>
          <div className="stat-icon">🛡️</div>
          <div className="stat-label">{t("stat.shieldBalance")}</div>
          <div className="stat-value">
            {balance} <span style={{ fontSize: 13, color: "var(--app-regent)", fontWeight: 400, fontFamily: "var(--fb)" }}>{balance === 1 ? t("check") : t("checks")}</span>
          </div>
          <div className="stat-sub">{balance === 0 ? t("stat.buyChecks") : t("stat.availableForUse")}</div>
        </div>

        <div className="stat-card stat-card-link" onClick={() => navigate("/trades")} style={{ cursor: "pointer" }}>
          <div className="stat-icon">💰</div>
          <div className="stat-label">{t("stat.totalTradeValue")}</div>
          <div className="stat-value" data-testid="stat-total-trade-value">
            {(stats?.totalTradeValue ?? 0) > 0
              ? <>
                  ${(stats!.totalTradeValue).toLocaleString()} <span style={{ fontSize: 13, color: "var(--app-regent)", fontWeight: 400, fontFamily: "var(--fb)" }}>{t("stat.usd")}</span>
                </>
              : <>
                  — <span style={{ fontSize: 13, color: "var(--app-regent)", fontWeight: 400, fontFamily: "var(--fb)" }}>{t("stat.notSet")}</span>
                </>
            }
          </div>
          <div className="stat-sub">{(stats?.totalTradeValue ?? 0) > 0 ? t("stat.acrossAllTrades") : t("stat.addValues")}</div>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}

      {activeTab === "overview" && (
      <div className="dash-grid">

        {/* LEFT: Recent Trades */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>{t("recentTrades")} <span className="count">{recentTrades.length}</span></h3>
            <Link href="/trades"><span className="link" data-testid="link-view-all-lookups">{t("viewAll")}</span></Link>
          </div>

          <table className="trade-table">
            <thead>
              <tr>
                <th>{t("th.commodity")}</th>
                <th>{t("th.corridor")}</th>
                <th>{t("th.value")}</th>
                <th>{t("th.status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "var(--app-regent)" }}>
                    {t("emptyTrades")}
                  </td>
                </tr>
              ) : recentTrades.map((tr) => (
                <tr key={tr.id}>
                  <td>
                    <div className="trade-cell">
                      <div className="trade-icon" style={{ background: tr.iconBg }}>{tr.icon}</div>
                      <div>
                        <div className="trade-commodity" data-testid={`lookup-name-${tr.id}`}>{tr.name}</div>
                        <div className="trade-hs">{tr.hs}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {tr.corridor}<br />
                    <span style={{ fontSize: 13, color: "var(--app-regent)" }}>{tr.date}</span>
                  </td>
                  <td>{tr.value}</td>
                  <td>
                    <span className={`status-badge ${
                      tr.status === "comp" ? "status-compliant" :
                      tr.status === "pend" ? "status-pending" : "status-review"
                    }`}>
                      {tr.statusLabel}
                    </span>
                  </td>
                  <td>
                    <button className="action-link" onClick={() => {
                      navigate(`/trades/${tr.id}`);
                    }}>{tr.btnLabel}</button>
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
              <h3>{t("pendingDocs")}</h3>
              <Link href="/inbox"><span className="link">{t("allLink")}</span></Link>
            </div>

            {[
              { ic: "📄", name: t("doc.billOfLading"), detail: t("doc.billOfLadingDetail"), st: "warn", stLabel: "⚠ 3" },
              { ic: "🌍", name: t("doc.countryOfOrigin"), detail: t("doc.countryOfOriginDetail"), st: "partial", stLabel: "60%" },
              { ic: "🔬", name: t("doc.inspectionCert"), detail: t("doc.inspectionCertDetail"), st: "warn", stLabel: "⚠ 2" },
              { ic: "🌿", name: t("doc.eudrDueDiligence"), detail: t("doc.eudrDueDiligenceDetail"), st: "warn", stLabel: "⚠ 3" },
              { ic: "📋", name: t("doc.customsDeclaration"), detail: t("doc.customsDeclarationDetail"), st: "ok", stLabel: "✓ Ready" },
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
            <div className="pending-more">{t("doc.moreDocuments")}</div>
          </div>

          {/* Country Card */}
          <div className="dash-card country-card">
            <div className="country-card-top">
              <div>
                <div className="country-name"><span className="live-dot" /> 🇬🇭 Ghana</div>
                <div className="country-sub">{t("country.originLabel")}</div>
              </div>
            </div>
            <div className="country-stats">
              <div className="cs-row"><span className="cs-label">📊 {t("country.esgScore")}</span><span className="cs-value cs-amber">65 / 100</span></div>
              <div className="cs-row"><span className="cs-label">⏱ {t("country.avgCustomsDelay")}</span><span className="cs-value cs-amber">3.5 days</span></div>
              <div className="cs-row"><span className="cs-label">🏛 {t("country.phytoAuthority")}</span><span className="cs-value cs-green">PPRSD</span></div>
              <div className="cs-row"><span className="cs-label">📜 {t("country.cooIssuingBody")}</span><span className="cs-value cs-muted">Ghana Nat. Chamber</span></div>
              <div className="cs-row"><span className="cs-label">🍫 {t("country.cocoaCouncil")}</span><span className="cs-value cs-green">COCOBOD</span></div>
            </div>
          </div>

          {/* My LC Cases */}
          {(lcCasesQuery.data ?? []).length > 0 && (
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>{t("lcCases")} <span className="count">{(lcCasesQuery.data ?? []).filter(c => c.status !== "closed").length}</span></h3>
                <Link href="/trades"><span className="link">{t("viewAll")}</span></Link>
              </div>
              {(lcCasesQuery.data ?? []).slice(0, 4).map((c) => {
                const statusColors: Record<string, { color: string; bg: string; label: string }> = {
                  checking: { color: "#2563eb", bg: "#eff6ff", label: t("lcCase.status.checking") },
                  all_clear: { color: "#15803d", bg: "#f0fdf4", label: t("lcCase.status.allClear") },
                  discrepancy: { color: "#dc2626", bg: "#fef2f2", label: t("lcCase.status.discrepancy") },
                  pending_correction: { color: "#b45309", bg: "#fefce8", label: t("lcCase.status.pending") },
                  rechecking: { color: "#2563eb", bg: "#eff6ff", label: t("lcCase.status.rechecking") },
                  resolved: { color: "#15803d", bg: "#f0fdf4", label: t("lcCase.status.resolved") },
                  closed: { color: "#666", bg: "#f5f5f5", label: t("lcCase.status.closed") },
                };
                const st = statusColors[c.status] ?? statusColors.checking;
                const actionLabel = c.status === "discrepancy" || c.status === "pending_correction"
                  ? t("lcCase.action.followUp")
                  : c.status === "all_clear" || c.status === "resolved"
                  ? t("lcCase.action.view")
                  : t("lcCase.action.continue");
                return (
                  <div key={c.id} className="pending-item" style={{ cursor: "pointer" }} onClick={() => {
                    if (c.sourceLookupId) {
                      navigate(`/trades/${c.sourceLookupId}`);
                    }
                  }}>
                    <div className="pending-icon" style={{ fontSize: 16 }}>📋</div>
                    <div className="pending-info">
                      <div className="pending-name" style={{ fontSize: 12.5 }}>
                        {c.lcReference || t("lcCase.defaultName")}
                      </div>
                      <div className="pending-detail" style={{ fontSize: 11 }}>
                        {c.beneficiaryName || t("lcCase.unknown")} · {t("lcCase.recheckCount", { count: c.recheckCount })}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: st.bg, color: st.color }}>
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
              <h3>{t("complianceStatus")}</h3>
              <Link href="/alerts"><span className="link">{t("viewAll")}</span></Link>
            </div>
            <div className="comp-status-body">
              <div className="comp-row">
                <span className="comp-pct">78%</span>
                <span className="comp-sub">{t("compliance.verified", { count: 8, total: 10 })}</span>
              </div>
              <div className="comp-progress"><div className="comp-fill" style={{ width: "78%" }} /></div>
              <div className="comp-tiles">
                <div className="comp-tile">
                  <div className="comp-tile-ic">📁</div>
                  <div className="comp-tile-lbl">{t("compliance.documents")}</div>
                  <div className="comp-tile-cnt comp-red">{t("compliance.documentsCount", { count: 7, total: 10 })}</div>
                </div>
                <div className="comp-tile">
                  <div className="comp-tile-ic">🛡️</div>
                  <div className="comp-tile-lbl">{t("compliance.risks")}</div>
                  <div className="comp-tile-cnt comp-amber">{t("compliance.flagged", { count: 3 })}</div>
                </div>
                <div className="comp-tile">
                  <div className="comp-tile-ic">🚩</div>
                  <div className="comp-tile-lbl">{t("compliance.sanctions")}</div>
                  <div className="comp-tile-cnt comp-amber">{tc("status.pending")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>{t("recentActivity")}</h3>
              <Link href="/trades"><span className="link">{t("viewLink")}</span></Link>
            </div>
            <div className="activity-list">
              {(lookupsQuery.data ?? []).slice(0, 2).map((l, i) => (
                <div key={l.id} className="activity-item">
                  <div className="act-avatar" style={{ background: i === 0 ? "rgba(93,217,193,0.12)" : "rgba(234,179,8,0.12)", color: i === 0 ? "var(--app-acapulco)" : "#d97706" }}>F</div>
                  <div className="act-content">
                    <div className="act-text" dangerouslySetInnerHTML={{ __html: t("activity.complianceLookup", { commodity: l.commodityName }) }} />
                    <div className="act-time">{new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                  </div>
                </div>
              ))}
              {(lcQuery.data ?? []).slice(0, 1).map((lc) => (
                <div key={lc.id} className="activity-item">
                  <div className="act-avatar" style={{ background: "rgba(20,184,166,0.12)", color: "#0d9488" }}>F</div>
                  <div className="act-content">
                    <div className="act-text" dangerouslySetInnerHTML={{ __html: t("activity.lcCheck") }} />
                    <div className="act-time">{new Date(lc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                  </div>
                </div>
              ))}
              {(lookupsQuery.data ?? []).length === 0 && (lcQuery.data ?? []).length === 0 && (
                <div style={{ textAlign: "center", padding: 16, color: "var(--app-regent)", fontSize: 13 }}>{t("noRecentActivity")}</div>
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
            <h3>{t("documentsTab.title")}</h3>
            <Link href="/inbox"><span className="link">{t("documentsTab.supplierInbox")}</span></Link>
          </div>
          {recentTrades.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--app-regent)", fontSize: 13 }}>
              {t("documentsTab.empty")}
            </div>
          ) : recentTrades.map((tr) => (
            <div key={tr.id} className="pending-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/trades/${tr.id}`)}>
              <div className="pending-icon">{tr.icon}</div>
              <div className="pending-info">
                <div className="pending-name">{tr.name}</div>
                <div className="pending-detail">{tr.corridor} · {tr.hs}</div>
              </div>
              <div className={`pending-status pending-st-${tr.status === "comp" ? "ok" : "warn"}`}>
                {tr.status === "comp" ? t("documentsTab.ready") : tr.statusLabel}
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
            <h3>{t("activityTab.title")}</h3>
            <Link href="/trades"><span className="link">{t("activityTab.tradesLink")}</span></Link>
          </div>
          <div className="activity-list">
            {(lookupsQuery.data ?? []).map((l) => (
              <div key={l.id} className="activity-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/trades/${l.id}`)}>
                <div className="act-avatar" style={{ background: "rgba(93,217,193,0.12)", color: "var(--app-acapulco)" }}>F</div>
                <div className="act-content">
                  <div className="act-text" dangerouslySetInnerHTML={{ __html: t("activity.complianceLookup", { commodity: l.commodityName }) }} />
                  <div className="act-time">{new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
            {(lcQuery.data ?? []).map((lc) => (
              <div key={lc.id} className="activity-item">
                <div className="act-avatar" style={{ background: "rgba(20,184,166,0.12)", color: "#0d9488" }}>F</div>
                <div className="act-content">
                  <div className="act-text" dangerouslySetInnerHTML={{ __html: t("activity.lcCheck") }} />
                  <div className="act-time">{new Date(lc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
            {(lookupsQuery.data ?? []).length === 0 && (lcQuery.data ?? []).length === 0 && (
              <div style={{ textAlign: "center", padding: 32, color: "var(--app-regent)", fontSize: 13 }}>{t("activityTab.empty")}</div>
            )}
          </div>
        </div>
      </div>
      )}

    </AppShell>
  );
}
