import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import type { Lookup } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";

/* Country name → emoji flag mapping */
const countryFlags: Record<string, string> = {
  "Ghana": "\uD83C\uDDEC\uD83C\uDDED", "C\u00F4te d'Ivoire": "\uD83C\uDDE8\uD83C\uDDEE", "Cote d'Ivoire": "\uD83C\uDDE8\uD83C\uDDEE", "Ethiopia": "\uD83C\uDDEA\uD83C\uDDF9",
  "Kenya": "\uD83C\uDDF0\uD83C\uDDEA", "Tanzania": "\uD83C\uDDF9\uD83C\uDDFF", "Uganda": "\uD83C\uDDFA\uD83C\uDDEC", "Nigeria": "\uD83C\uDDF3\uD83C\uDDEC", "Cameroon": "\uD83C\uDDE8\uD83C\uDDF2",
  "EU": "\uD83C\uDDEA\uD83C\uDDFA", "European Union": "\uD83C\uDDEA\uD83C\uDDFA", "United Kingdom": "\uD83C\uDDEC\uD83C\uDDE7", "UK": "\uD83C\uDDEC\uD83C\uDDE7",
  "Germany": "\uD83C\uDDE9\uD83C\uDDEA", "France": "\uD83C\uDDEB\uD83C\uDDF7", "Italy": "\uD83C\uDDEE\uD83C\uDDF9", "Spain": "\uD83C\uDDEA\uD83C\uDDF8",
  "Switzerland": "\uD83C\uDDE8\uD83C\uDDED", "Austria": "\uD83C\uDDE6\uD83C\uDDF9", "United States": "\uD83C\uDDFA\uD83C\uDDF8", "China": "\uD83C\uDDE8\uD83C\uDDF3",
  "UAE": "\uD83C\uDDE6\uD83C\uDDEA", "Turkey": "\uD83C\uDDF9\uD83C\uDDF7", "T\u00FCrkiye": "\uD83C\uDDF9\uD83C\uDDF7",
};
function getFlag(name: string): string {
  return countryFlags[name] || "\uD83C\uDFF3";
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
      case "LOW": return <span className="status-badge status-compliant">Compliant</span>;
      case "MEDIUM": return <span className="status-badge status-pending">Pending</span>;
      case "HIGH":
      case "STOP": return <span className="status-badge status-review">Review</span>;
      default: return <span className="status-badge status-pending">Pending</span>;
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
      icon: "\uD83D\uDCC4",
      name: "Bill of Lading",
      detail: latestLookup
        ? `${latestLookup.commodityName} \u00B7 ${getFlag(latestLookup.originName)} ${latestLookup.originCode || latestLookup.originName} \u2192 ${getFlag(latestLookup.destinationName)} ${latestLookup.destinationCode || latestLookup.destinationName}`
        : "Cocoa Beans \u00B7 \uD83C\uDDEC\uD83C\uDDED GH \u2192 \uD83C\uDDEA\uD83C\uDDFA EU",
    },
    {
      icon: "\uD83C\uDF0D",
      name: `${latestLookup ? getFlag(latestLookup.originName) : "\uD83C\uDDEC\uD83C\uDDED"} Country of Origin`,
      detail: latestLookup ? `COCOBOD / ${latestLookup.originName} Customs` : "COCOBOD / Ghana Customs",
    },
    { icon: "\uD83D\uDD2C", name: "Inspection Certificate", detail: "Port Health \u00B7 Felixstowe" },
    { icon: "\uD83C\uDF3F", name: "EUDR Due Diligence", detail: "Geolocation pending" },
    { icon: "\uD83D\uDCD1", name: "Customs Declaration", detail: "CDS \u00B7 UK Import" },
  ];

  /* Count items needing attention */
  const pendingCount = lookups.filter(
    (l) => l.riskLevel === "MEDIUM" || l.riskLevel === "HIGH" || l.riskLevel === "STOP"
  ).length;

  return (
    <AppShell contentClassName="dash-content">
      {/* ── GREEN HERO ── */}
      <div className="green-hero-box">
        <div className="dash-breadcrumb">
          {latestLookup
            ? `Commodity \u203A ${latestLookup.commodityName} \u203A ${getFlag(latestLookup.originName)} ${latestLookup.originName}`
            : "Dashboard \u203A Overview"}
        </div>
        {pendingCount > 0 && latestLookup && (
          <div className="dash-alert">
            <span className="alert-label">{"\u26A0"} Compliance: Pending</span>
            <span className="alert-text">
              {latestLookup.commodityName} {"\u00B7"} {getFlag(latestLookup.originName)} {latestLookup.originName} {"\u2192"}{" "}
              {getFlag(latestLookup.destinationName)} {latestLookup.destinationName} {"\u00B7"} {pendingCount} item
              {pendingCount !== 1 ? "s" : ""} need attention
            </span>
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="dash-tabs">
        <div className="dash-tab active">Overview</div>
        <div className="dash-tab">Documents</div>
        <div className="dash-tab">Activity</div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="stat-cards">
        {/* Total Trade Value at Risk */}
        <div className="stat-card">
          <div className="stat-icon">{"\uD83C\uDFDB"}</div>
          <div className="stat-label">Total Trade Value at Risk</div>
          <div className="stat-value" data-testid="stat-token-balance">$2,345,678</div>
          <div className="stat-sub"><span className="up">{"\u2191"} 12.5%</span> {"\u00B7"} 12 past shipments</div>
        </div>

        {/* Total Lookups */}
        <div className="stat-card">
          <div className="stat-icon">{"\uD83D\uDD0D"}</div>
          <div className="stat-label">Total Lookups</div>
          <div className="stat-value" data-testid="stat-compliance-lookups">
            {statsQuery.isLoading ? "..." : totalLookups}{" "}
            <span style={{ fontSize: 14, color: "#888" }}>checks</span>
          </div>
          <div className="stat-sub"><span className="up">{"\u2191"} 8%</span> vs prev. 28 days</div>
        </div>

        {/* Rejection Risk */}
        <div className="stat-card">
          <div className="stat-icon">{"\u26A0\uFE0F"}</div>
          <div className="stat-label">Rejection Risk</div>
          <div className="stat-value" data-testid="stat-lc-checks">
            7.8% <span style={{ fontSize: 12, color: "#eab308" }}>Moderate</span>
          </div>
          <div className="stat-sub"><span className="down">{"\u2193"} 1.7%</span> vs prev. 28 days</div>
        </div>

        {/* AI CTA card */}
        <div className="stat-card ai-card">
          <div className="ai-label">Recommended with</div>
          <div className="ai-badge">AI</div>
          <Link href="/lookup">
            <button className="ai-btn">Pre-Shipment<br />Check</button>
          </Link>
        </div>
      </div>

      {/* ── GRID: Recent Trades + Pending Docs ── */}
      <div className="dash-grid">
        {/* Recent Trades */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>Recent Trades <span className="count">{lookups.length}</span></h3>
            <Link href="/trades">
              <span className="link" data-testid="link-view-all-lookups">View All {"\u203A"}</span>
            </Link>
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
                      <div className="trade-commodity">{l.commodityName}</div>
                      <div className="trade-hs">HS {l.hsCode}</div>
                    </td>
                    <td>
                      {getFlag(l.originName)} {l.originName} {"\u2192"} {getFlag(l.destinationName)} {l.destinationName}
                      <br />
                      <span style={{ fontSize: 11, color: "#999" }}>
                        {new Date(l.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </td>
                    <td>{"\u2014"}</td>
                    <td>{statusBadge(l.riskLevel)}</td>
                    <td>
                      <button
                        className="action-link"
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
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>Pending Compliance Docs</h3>
          </div>
          {pendingDocs.map((doc, i) => (
            <div key={i} className="pending-item">
              <div className="pending-icon">{doc.icon}</div>
              <div className="pending-info">
                <div className="pending-name">{doc.name}</div>
                <div className="pending-detail">{doc.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
