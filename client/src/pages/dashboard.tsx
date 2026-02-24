import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import type { Lookup } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";

/* Country name → emoji flag mapping */
const countryFlags: Record<string, string> = {
  "Ghana": "🇬🇭", "Côte d'Ivoire": "🇨🇮", "Cote d'Ivoire": "🇨🇮", "Ethiopia": "🇪🇹",
  "Kenya": "🇰🇪", "Tanzania": "🇹🇿", "Uganda": "🇺🇬", "Nigeria": "🇳🇬", "Cameroon": "🇨🇲",
  "EU": "🇪🇺", "European Union": "🇪🇺", "United Kingdom": "🇬🇧", "UK": "🇬🇧",
  "Germany": "🇩🇪", "France": "🇫🇷", "Italy": "🇮🇹", "Spain": "🇪🇸",
  "Switzerland": "🇨🇭", "Austria": "🇦🇹", "United States": "🇺🇸", "China": "🇨🇳",
  "UAE": "🇦🇪", "Turkey": "🇹🇷", "Türkiye": "🇹🇷",
};
function getFlag(name: string): string {
  return countryFlags[name] || "🏳";
}

export default function Dashboard() {
  const statsQuery = useQuery<{ totalLookups: number; totalLcChecks: number; topCorridor: string | null }>({
    queryKey: ["/api/dashboard/stats"],
  });
  const lookupsQuery = useQuery<Lookup[]>({ queryKey: ["/api/lookups/recent"] });
  const [, navigate] = useLocation();

  usePageTitle("Dashboard", "Overview of your trade compliance activity");

  const stats = statsQuery.data;
  const totalLookups = stats?.totalLookups ?? 0;
  const lookups = lookupsQuery.data ?? [];
  const latestLookup = lookups[0];

  /* Map risk level → status badge */
  function statusBadge(riskLevel: string) {
    switch (riskLevel) {
      case "LOW": return <span className="db-status db-status-compliant">Compliant</span>;
      case "MEDIUM": return <span className="db-status db-status-pending">Pending</span>;
      case "HIGH":
      case "STOP": return <span className="db-status db-status-review">Review</span>;
      default: return <span className="db-status db-status-pending">Pending</span>;
    }
  }

  function actionLabel(riskLevel: string) {
    switch (riskLevel) {
      case "LOW": return "View";
      case "MEDIUM": return "Review";
      case "HIGH":
      case "STOP": return "Fix";
      default: return "View";
    }
  }

  /* Pending compliance docs — derived from latest lookup or placeholder */
  const pendingDocs = [
    {
      icon: "📄",
      name: "Bill of Lading",
      detail: latestLookup
        ? `${latestLookup.commodityName} · ${getFlag(latestLookup.originName)} ${latestLookup.originCode || latestLookup.originName} → ${getFlag(latestLookup.destinationName)} ${latestLookup.destinationCode || latestLookup.destinationName}`
        : "Cocoa Beans · 🇬🇭 GH → 🇪🇺 EU",
    },
    {
      icon: "🌍",
      name: `${latestLookup ? getFlag(latestLookup.originName) : "🇬🇭"} Country of Origin`,
      detail: latestLookup ? `COCOBOD / ${latestLookup.originName} Customs` : "COCOBOD / Ghana Customs",
    },
    { icon: "🔬", name: "Inspection Certificate", detail: "Port Health · Felixstowe" },
    { icon: "🌿", name: "EUDR Due Diligence", detail: "Geolocation pending" },
    { icon: "📑", name: "Customs Declaration", detail: "CDS · UK Import" },
  ];

  /* Count items needing attention */
  const pendingCount = lookups.filter(
    (l) => l.riskLevel === "MEDIUM" || l.riskLevel === "HIGH" || l.riskLevel === "STOP"
  ).length;

  return (
    <AppShell
      topCenter={
        <div className="db-nav-links">
          <Link href="/dashboard"><span className="active">Dashboard</span></Link>
          <Link href="/lookup"><span>Commodities</span></Link>
          <Link href="/inbox"><span>Suppliers</span></Link>
          <Link href="/alerts"><span>Compliance</span></Link>
          <Link href="/inbox"><span>Messages</span></Link>
        </div>
      }
    >
      {/* ── GREEN HERO ── */}
      <div className="db-hero">
        <div className="db-hero-glow" />
        <div className="db-breadcrumb">
          {latestLookup
            ? `Commodity › ${latestLookup.commodityName} › ${getFlag(latestLookup.originName)} ${latestLookup.originName}`
            : "Dashboard › Overview"}
        </div>
        {pendingCount > 0 && latestLookup && (
          <div className="db-alert">
            <span className="db-alert-label">⚠️ Compliance: Pending</span>
            <span className="db-alert-text">
              {latestLookup.commodityName} · {getFlag(latestLookup.originName)} {latestLookup.originName} →{" "}
              {getFlag(latestLookup.destinationName)} {latestLookup.destinationName} · {pendingCount} item
              {pendingCount !== 1 ? "s" : ""} need attention
            </span>
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="db-tabs">
        <div className="db-tab active">Overview</div>
        <div className="db-tab">Documents</div>
        <div className="db-tab">Activity</div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="db-stat-cards">
        {/* Total Trade Value at Risk */}
        <div className="db-stat-card">
          <div className="db-stat-icon">🏛</div>
          <div className="db-stat-label">Total Trade Value at Risk</div>
          <div className="db-stat-value" data-testid="stat-token-balance">
            $2,345,678
          </div>
          <div className="db-stat-sub">
            <span className="up">↑ 12.5%</span> · 12 past shipments
          </div>
        </div>

        {/* Total Lookups */}
        <div className="db-stat-card">
          <div className="db-stat-icon">🔍</div>
          <div className="db-stat-label">Total Lookups</div>
          <div className="db-stat-value" data-testid="stat-compliance-lookups">
            {statsQuery.isLoading ? "..." : totalLookups}
            <span className="db-stat-unit">checks</span>
          </div>
          <div className="db-stat-sub">
            <span className="up">↑ 8%</span> vs prev. 28 days
          </div>
        </div>

        {/* Rejection Risk */}
        <div className="db-stat-card">
          <div className="db-stat-icon">⚠️</div>
          <div className="db-stat-label">Rejection Risk</div>
          <div className="db-stat-value" data-testid="stat-lc-checks">
            7.8% <span className="db-stat-unit" style={{ fontSize: 12, color: "#eab308" }}>Moderate</span>
          </div>
          <div className="db-stat-sub">
            <span className="down">↓ 1.7%</span> vs prev. 28 days
          </div>
        </div>

        {/* AI CTA card */}
        <div className="db-stat-card db-ai-card">
          <div className="db-ai-label">Recommended with</div>
          <div className="db-ai-badge">AI</div>
          <Link href="/lookup">
            <span className="db-ai-btn">Pre-Shipment<br />Check</span>
          </Link>
        </div>
      </div>

      {/* ── GRID: Recent Trades + Pending Docs ── */}
      <div className="db-grid">
        {/* Recent Trades */}
        <div className="db-card">
          <div className="db-card-header">
            <h3>
              Recent Trades{" "}
              <span className="db-count">{lookups.length}</span>
            </h3>
            <Link href="/trades">
              <span className="db-link" data-testid="link-view-all-lookups">View All ›</span>
            </Link>
          </div>
          <table className="db-trade-table">
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
              {lookupsQuery.isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#999" }}>
                    Loading...
                  </td>
                </tr>
              ) : lookups.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#999" }}>
                    No trades yet. Run your first compliance check.
                  </td>
                </tr>
              ) : (
                lookups.slice(0, 5).map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="db-trade-commodity">{l.commodityName}</div>
                      <div className="db-trade-hs">HS {l.hsCode}</div>
                    </td>
                    <td>
                      {getFlag(l.originName)} {l.originName} → {getFlag(l.destinationName)} {l.destinationName}
                      <br />
                      <span style={{ fontSize: 11, color: "#999" }}>
                        {new Date(l.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </td>
                    <td>
                      —
                    </td>
                    <td>{statusBadge(l.riskLevel)}</td>
                    <td>
                      <button
                        className="db-action-link"
                        onClick={() => navigate(`/lookup/${l.id}`)}
                      >
                        {actionLabel(l.riskLevel)}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pending Compliance Docs */}
        <div className="db-card">
          <div className="db-card-header">
            <h3>Pending Compliance Docs</h3>
          </div>
          {pendingDocs.map((doc, i) => (
            <div key={i} className="db-pending-item">
              <div className="db-pending-icon">{doc.icon}</div>
              <div className="db-pending-info">
                <div className="db-pending-name">{doc.name}</div>
                <div className="db-pending-detail">{doc.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
