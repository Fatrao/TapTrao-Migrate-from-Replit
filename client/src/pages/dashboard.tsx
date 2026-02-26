import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import type { Lookup, LcCheck, TokenTransaction, ComplianceResult } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { apiRequest } from "@/lib/queryClient";

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

  const balance = tokenQuery.data?.balance ?? 0;
  const totalLookups = stats?.totalLookups ?? 0;

  /* Build recent trades from lookups */
  const recentTrades: Array<{
    id: string; name: string; hs: string; corridor: string;
    date: string; value: string; status: "comp" | "pend" | "rev"; statusLabel: string;
    btnLabel: string;
  }> = [];

  if (lookupsQuery.data) {
    for (const l of lookupsQuery.data.slice(0, 5)) {
      recentTrades.push({
        id: l.id,
        name: l.commodityName,
        hs: `HS ${l.hsCode}`,
        corridor: `${l.originName?.substring(0, 2).toUpperCase() ?? "?"} → ${l.destinationName?.substring(0, 2).toUpperCase() ?? "?"}`,
        date: new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        value: "—",
        status: l.riskLevel === "LOW" ? "comp" : l.riskLevel === "MEDIUM" ? "pend" : "rev",
        statusLabel: l.riskLevel === "LOW" ? "Compliant" : l.riskLevel === "MEDIUM" ? "Pending" : "Review",
        btnLabel: l.riskLevel === "LOW" ? "View" : "Review",
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
        <div className="dash-tab active">Overview</div>
        <div className="dash-tab">Documents</div>
        <div className="dash-tab">Activity</div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon">🏛</div>
          <div className="stat-label">Total Trade Value at Risk</div>
          <div className="stat-value">$2,345,678</div>
          <div className="stat-sub">
            <span className="up">↑ 12.5%</span> · {totalLookups} past shipments
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-label">Total Lookups</div>
          <div className="stat-value" data-testid="stat-compliance-lookups">
            {totalLookups} <span style={{ fontSize: 13, color: "#888", fontWeight: 400, fontFamily: "var(--fb)" }}>checks</span>
          </div>
          <div className="stat-sub">
            <span className="up">↑ 8%</span> vs prev. 28 days
          </div>
        </div>

        <div className="stat-card">
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

      {/* ── DASH GRID (2 columns) ── */}
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
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "#999" }}>
                    No trades yet. Run your first compliance check.
                  </td>
                </tr>
              ) : recentTrades.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="trade-commodity" data-testid={`lookup-name-${t.id}`}>{t.name}</div>
                    <div className="trade-hs">{t.hs}</div>
                  </td>
                  <td>
                    {t.corridor}<br />
                    <span style={{ fontSize: 11, color: "#999" }}>{t.date}</span>
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
                    <button className="action-link">{t.btnLabel}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT: Pending Compliance Docs */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>Pending Compliance Docs</h3>
          </div>

          {[
            { ic: "📄", name: "Bill of Lading", detail: "Cocoa Beans · GH → EU" },
            { ic: "🌍", name: "Country of Origin", detail: "COCOBOD / Ghana Customs" },
            { ic: "🔬", name: "Inspection Certificate", detail: "Port Health · Felixstowe" },
            { ic: "🌿", name: "EUDR Due Diligence", detail: "Geolocation pending" },
            { ic: "📋", name: "Customs Declaration", detail: "CDS · UK Import" },
          ].map((d) => (
            <div key={d.name} className="pending-item">
              <div className="pending-icon">{d.ic}</div>
              <div className="pending-info">
                <div className="pending-name">{d.name}</div>
                <div className="pending-detail">{d.detail}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
